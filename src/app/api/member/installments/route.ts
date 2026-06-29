import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import Installment from "@/models/Installment";
import Loan from "@/models/Loan";

void Loan;

export async function GET() {
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

    const installments = await Installment.find({
      userId: currentUser._id,
      isDeleted: { $ne: true },
    })
      .populate(
        "loanId",
        "loanType approvedAmount totalRepayment remainingBalance status"
      )
      .sort({ dueDate: 1 })
      .lean();

    const pendingCount = installments.filter(
      (item) => item.status === "pending"
    ).length;

    const paidCount = installments.filter(
      (item) => item.status === "paid"
    ).length;

    const overdueCount = installments.filter(
      (item) => item.status === "overdue"
    ).length;

    const totalPendingAmount = installments
      .filter((item) => item.status !== "paid")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return NextResponse.json({
      success: true,
      installments,
      summary: {
        total: installments.length,
        pendingCount,
        paidCount,
        overdueCount,
        totalPendingAmount,
      },
    });
  } catch (error) {
    console.error("GET_MEMBER_INSTALLMENTS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load installments",
      },
      { status: 500 }
    );
  }
}