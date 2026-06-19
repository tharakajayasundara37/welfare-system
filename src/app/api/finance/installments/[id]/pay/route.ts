import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import Installment from "@/models/Installment";
import Loan from "@/models/Loan";
import Notification from "@/models/Notification";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
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
          message: "Access denied",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    const body = await request.json().catch(() => ({}));

    const paymentReference =
      body.paymentReference ||
      `PAY-${Date.now()}`;

    const installment = await Installment.findById(id);

    if (!installment) {
      return NextResponse.json(
        {
          success: false,
          message: "Installment not found",
        },
        { status: 404 }
      );
    }

    if (installment.status === "paid") {
      return NextResponse.json(
        {
          success: false,
          message: "Installment already paid",
        },
        { status: 400 }
      );
    }

    installment.status = "paid";
    installment.paidAt = new Date();
    installment.paidAmount = installment.amount;
    installment.paymentReference = paymentReference;

    await installment.save();

    const loan = await Loan.findById(installment.loanId);

    if (loan) {
      loan.paidAmount =
        Number(loan.paidAmount || 0) +
        Number(installment.amount);

      loan.remainingBalance =
        Number(loan.remainingBalance || 0) -
        Number(installment.amount);

      loan.totalPaidInstallments =
        Number(loan.totalPaidInstallments || 0) + 1;

      if (
        loan.totalPaidInstallments >=
        loan.totalInstallments
      ) {
        loan.status = "completed";
        loan.loanCompletedAt = new Date();
        loan.remainingBalance = 0;
      }

      await loan.save();

      await Notification.create({
        userId: loan.userId,
        type: "payment",
        title: "Installment Payment Recorded",
        message: `Your installment payment of Rs. ${Number(
          installment.amount
        ).toLocaleString()} has been recorded successfully.`,
        priority: "normal",
        link: "/dashboard/installments",
        metadata: {
          installmentId: installment._id.toString(),
          loanId: loan._id.toString(),
          paymentReference,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Installment marked as paid",
      installment,
    });
  } catch (error) {
    console.error("PAY_INSTALLMENT_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark installment as paid",
      },
      { status: 500 }
    );
  }
}