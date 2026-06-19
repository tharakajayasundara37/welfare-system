import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { createNotification } from "@/lib/notifications/createNotification";

import Loan from "@/models/Loan";
import Installment from "@/models/Installment";

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    if (currentUser.role !== "finance_officer" && currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied. Finance officer only." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Loan ID is required." },
        { status: 400 }
      );
    }

    const disbursementMethod =
      typeof body.disbursementMethod === "string" &&
      body.disbursementMethod.trim()
        ? body.disbursementMethod.trim()
        : "bank_transfer";

    const disbursementReference =
      typeof body.disbursementReference === "string"
        ? body.disbursementReference.trim()
        : "";

    const financeRemark =
      typeof body.financeRemark === "string" && body.financeRemark.trim()
        ? body.financeRemark.trim()
        : "Loan disbursed by finance officer.";

    const loan = await Loan.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!loan) {
      return NextResponse.json(
        { success: false, message: "Loan not found." },
        { status: 404 }
      );
    }

    if (loan.userAcceptanceStatus !== "accepted") {
      return NextResponse.json(
        {
          success: false,
          message: "Member has not accepted this loan offer yet.",
        },
        { status: 400 }
      );
    }

    const allowedStatuses = [
      "user_accepted",
      "pending_finance_processing",
      "pending_finance",
      "under_finance_review",
      "approved",
      "disbursed",
    ];

    if (!allowedStatuses.includes(String(loan.status))) {
      return NextResponse.json(
        {
          success: false,
          message: `This loan cannot be disbursed from current status: ${loan.status}`,
        },
        { status: 400 }
      );
    }

    const approvedAmount = Number(
      loan.approvedAmount || loan.requestedAmount || 0
    );

    const totalRepayment = Number(loan.totalRepayment || approvedAmount);

    const monthlyInstallment = Number(
      loan.monthlyInstallment ||
        (loan.approvedPeriodMonths
          ? Math.ceil(totalRepayment / Number(loan.approvedPeriodMonths))
          : 0)
    );

    const totalInstallments = Number(
      loan.totalInstallments || loan.approvedPeriodMonths || 0
    );

    if (approvedAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Approved amount is invalid.",
          debug: {
            approvedAmount,
            requestedAmount: loan.requestedAmount,
            loanApprovedAmount: loan.approvedAmount,
          },
        },
        { status: 400 }
      );
    }

    if (monthlyInstallment <= 0 || totalInstallments <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Monthly installment or installment period is invalid. Please check loan calculation.",
          debug: {
            monthlyInstallment,
            totalInstallments,
            approvedPeriodMonths: loan.approvedPeriodMonths,
            totalRepayment,
          },
        },
        { status: 400 }
      );
    }

    const alreadyDisbursed = loan.status === "disbursed";

    const disbursementDate = loan.disbursementDate
      ? new Date(loan.disbursementDate)
      : new Date();

    const firstDueDate = loan.nextEMIDueDate
      ? new Date(loan.nextEMIDueDate)
      : addMonths(disbursementDate, 1);

    if (!alreadyDisbursed) {
      loan.status = "disbursed";
      loan.financeOfficerId = currentUser._id;
      loan.financeApprovedAt = new Date();
      loan.financeRemark = financeRemark;
      loan.approvedAt = loan.approvedAt || new Date();
      loan.disbursementDate = disbursementDate;
      loan.disbursementMethod = disbursementMethod;
      loan.disbursementReference = disbursementReference;
      loan.remainingBalance = Number(loan.remainingBalance || totalRepayment);
      loan.totalInstallments = totalInstallments;
      loan.nextEMIDueDate = firstDueDate;

      await loan.save();
    } else {
      loan.totalInstallments = Number(loan.totalInstallments || totalInstallments);
      loan.remainingBalance = Number(loan.remainingBalance || totalRepayment);
      loan.nextEMIDueDate = loan.nextEMIDueDate || firstDueDate;

      await loan.save();
    }

    const existingInstallments = await Installment.countDocuments({
      loanId: loan._id,
      isDeleted: { $ne: true },
    });

    let installmentsGenerated = 0;

    if (existingInstallments === 0) {
      const installments = Array.from({ length: totalInstallments }).map(
        (_, index) => ({
          loanId: loan._id,
          userId: loan.userId,
          installmentNumber: index + 1,
          amount: monthlyInstallment,
          dueDate: addMonths(firstDueDate, index),
          status: "pending",
          paidAt: null,
          paidAmount: 0,
          paymentReference: "",
          reminderSent: false,
          reminderSentAt: null,
          isDeleted: false,
        })
      );

      const createdInstallments = await Installment.insertMany(installments);
      installmentsGenerated = createdInstallments.length;
    }

    if (!alreadyDisbursed) {
      await createNotification({
        userId: loan.userId,
        type: "payment",
        title: "Loan Disbursed",
        message: `Your loan amount of Rs. ${approvedAmount.toLocaleString()} has been disbursed. Your first installment is due on ${firstDueDate.toLocaleDateString()}.`,
        priority: "high",
        link: "/dashboard/installments",
        metadata: {
          loanId: loan._id.toString(),
          amount: approvedAmount,
          totalRepayment,
          monthlyInstallment,
          totalInstallments,
          firstDueDate,
          disbursementMethod,
          disbursementReference,
        },
      });
    }

    const finalInstallmentsCount = await Installment.countDocuments({
      loanId: loan._id,
      isDeleted: { $ne: true },
    });

    return NextResponse.json({
      success: true,
      message: alreadyDisbursed
        ? "Loan was already disbursed. Installments checked/generated."
        : "Loan disbursed successfully and installments generated.",
      loanId: loan._id.toString(),
      alreadyDisbursed,
      installmentsGenerated,
      finalInstallmentsCount,
      debug: {
        status: loan.status,
        userAcceptanceStatus: loan.userAcceptanceStatus,
        approvedAmount,
        totalRepayment,
        monthlyInstallment,
        totalInstallments,
        disbursementDate,
        firstDueDate,
      },
    });
  } catch (error) {
    console.error("PATCH_FINANCE_DISBURSEMENT_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to disburse loan.",
      },
      { status: 500 }
    );
  }
}