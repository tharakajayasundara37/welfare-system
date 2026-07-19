import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import Loan from "@/models/Loan";
import Installment from "@/models/Installment";
import Notification from "@/models/Notification"; 
import { sendSms, buildLoanIssuedSms } from "@/lib/sms/sendSms"; 

type Params = {
  id: string;
};

function getNextEmiDueDate(disbursementDate: Date) {
  const nextDueDate = new Date(disbursementDate);
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);
  return nextDueDate;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login first.",
        },
        { status: 401 }
      );
    }

    if (
      currentUser.role !== "finance_officer" &&
      currentUser.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Finance officer only.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan ID is required.",
        },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const financeRemark =
      typeof body.financeRemark === "string" && body.financeRemark.trim()
        ? body.financeRemark.trim()
        : "Loan approved and disbursed by finance officer.";

    const disbursementDateInput =
      typeof body.disbursementDate === "string"
        ? body.disbursementDate.trim()
        : "";

    const disbursementDate = disbursementDateInput
      ? new Date(disbursementDateInput)
      : new Date();

    if (Number.isNaN(disbursementDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid disbursement date.",
        },
        { status: 400 }
      );
    }

    const loan = await Loan.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!loan) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan not found.",
        },
        { status: 404 }
      );
    }

    const allowedStatuses = [
      "pending_finance_processing",
      "pending_finance",
      "user_accepted",
      "approved",
    ];

    if (!allowedStatuses.includes(loan.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `This loan cannot be approved from current status: ${loan.status}`,
        },
        { status: 400 }
      );
    }

    const approvedAmount =
      Number(loan.approvedAmount) || Number(loan.requestedAmount) || 0;

    const totalRepayment =
      Number(loan.totalRepayment) > 0
        ? Number(loan.totalRepayment)
        : approvedAmount;

    const nextEMIDueDate = getNextEmiDueDate(disbursementDate);

    loan.status = "disbursed";
    loan.financeOfficerId = currentUser._id;
    loan.financeApprovedAt = new Date();
    loan.financeRejectedAt = null;
    loan.financeRemark = financeRemark;

    loan.disbursementDate = disbursementDate;
    loan.nextEMIDueDate = nextEMIDueDate;

    loan.remainingBalance = totalRepayment;

    await loan.save();

    const totalMonths = loan.totalInstallments || loan.approvedPeriodMonths || 0;
    const emiAmount = loan.monthlyInstallment || 0;

    if (totalMonths > 0) {
      const existingInstallmentsCount = await Installment.countDocuments({ loanId: loan._id });

      if (existingInstallmentsCount === 0) {
        const installmentsToCreate = [];

        for (let i = 1; i <= totalMonths; i++) {
          const dueDate = new Date(disbursementDate);
          dueDate.setMonth(dueDate.getMonth() + i);

          installmentsToCreate.push({
            loanId: loan._id,
            userId: loan.userId,
            installmentNumber: i,
            amount: emiAmount,
            dueDate: dueDate,
            status: "pending",
          });
        }

        if (installmentsToCreate.length > 0) {
          await Installment.insertMany(installmentsToCreate); 
        }
      }
    }

    const updatedLoan = await Loan.findById(loan._id)
      .populate(
        "userId",
        "fullName email phone nic employeeId department jobRole"
      )
      .populate("financeOfficerId", "fullName email role employeeId")
      .lean();

    if (updatedLoan && updatedLoan.userId) {
      const memberData = updatedLoan.userId as { _id?: unknown; phone?: string };
      const memberId = memberData._id?.toString();
      const memberPhone = memberData.phone;
      const loanTypeStr = updatedLoan.loanType || "Welfare Loan";

      if (memberId) {
        try {
          await Notification.create({
            userId: memberId,
            type: "loan",
            title: "Loan Disbursed",
            message: `Your ${loanTypeStr} application has been approved and funds have been released by Finance.`,
            isRead: false,
          });
        } catch (notiError) {
          console.error("NOTIFICATION_SAVE_ERROR:", notiError);
        }
      }

      if (memberPhone) {
        try {
          const smsMessage = buildLoanIssuedSms({
            loanType: loanTypeStr,
            amount: approvedAmount,
          });

          const smsResult = await sendSms({
            to: memberPhone,
            message: smsMessage,
          });

          if (!smsResult.success) {
            console.error("REALTIME_SMS_SENDING_FAILED:", smsResult.message);
          } else {
            console.log("REALTIME_SMS_SENT_SUCCESSFULLY_TO:", smsResult.to);
          }
        } catch (smsError) {
          console.error("REALTIME_SMS_SYSTEM_ERROR:", smsError);
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Loan approved and disbursed successfully. Installments created.",
        loan: updatedLoan,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("FINANCE_APPROVE_LOAN_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to approve and disburse loan.",
      },
      { status: 500 }
    );
  }
}