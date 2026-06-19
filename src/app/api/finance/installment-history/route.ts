import { NextResponse } from "next/server";
import { Types } from "mongoose";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import Installment from "@/models/Installment";

type PopulatedUser = {
  _id: Types.ObjectId;
  fullName?: string;
  email?: string;
  phone?: string;
  employeeId?: string;
};

type PopulatedLoan = {
  _id: Types.ObjectId;
  loanType?: string;
  approvedAmount?: number;
  totalRepayment?: number;
  remainingBalance?: number;
  totalInstallments?: number;
  totalPaidInstallments?: number;
  status?: string;
};

type LeanInstallment = {
  _id: Types.ObjectId;
  loanId: PopulatedLoan;
  userId: PopulatedUser;
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  status: "pending" | "paid" | "overdue";
  paidAt?: Date | null;
  paidAmount?: number;
  paymentReference?: string;
};

export async function GET() {
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

    const installments = await Installment.find({
      status: "paid",
      isDeleted: { $ne: true },
    })
      .populate("userId", "fullName email phone employeeId")
      .populate(
        "loanId",
        "loanType approvedAmount totalRepayment remainingBalance totalInstallments totalPaidInstallments status"
      )
      .sort({ paidAt: -1, updatedAt: -1 })
      .lean<LeanInstallment[]>();

    const history = installments.map((item) => ({
      _id: item._id.toString(),

      loanId: item.loanId?._id?.toString() || "",
      loanReference: item.loanId?._id
        ? `LN-${item.loanId._id.toString().slice(-6).toUpperCase()}`
        : "LN-UNKNOWN",

      userId: item.userId?._id?.toString() || "",
      memberName: item.userId?.fullName || "Unknown Member",
      memberEmail: item.userId?.email || "",
      memberPhone: item.userId?.phone || "",
      employeeId: item.userId?.employeeId || "",

      loanType: item.loanId?.loanType || "Loan",
      loanStatus: item.loanId?.status || "",

      installmentNumber: item.installmentNumber || 0,
      totalInstallments: item.loanId?.totalInstallments || 0,

      amount: item.amount || 0,
      paidAmount: item.paidAmount || 0,
      paymentReference: item.paymentReference || "",

      approvedAmount: item.loanId?.approvedAmount || 0,
      totalRepayment: item.loanId?.totalRepayment || 0,
      remainingBalance: item.loanId?.remainingBalance || 0,
      totalPaidInstallments: item.loanId?.totalPaidInstallments || 0,

      dueDate: item.dueDate,
      paidAt: item.paidAt || null,
    }));

    const totalCollected = history.reduce(
      (sum, item) => sum + Number(item.paidAmount || item.amount || 0),
      0
    );

    const uniqueMembers = new Set(history.map((item) => item.userId)).size;
    const uniqueLoans = new Set(history.map((item) => item.loanId)).size;

    return NextResponse.json({
      success: true,
      history,
      summary: {
        totalPayments: history.length,
        totalCollected,
        uniqueMembers,
        uniqueLoans,
      },
    });
  } catch (error) {
    console.error("GET_FINANCE_INSTALLMENT_HISTORY_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load installment history.",
      },
      { status: 500 }
    );
  }
}