import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Loan from "@/models/Loan";

type PopulatedUser = {
  _id?: { toString: () => string };
  fullName?: string;
  email?: string;
  phone?: string;
  employeeId?: string;
};

type LeanLoan = {
  _id: { toString: () => string };
  userId?: PopulatedUser;
  loanType?: string;
  approvedAmount?: number;
  requestedAmount?: number;
  approvedPeriodMonths?: number;
  monthlyInstallment?: number;
  totalRepayment?: number;
  remainingBalance?: number;
  status?: string;
  userAcceptanceStatus?: string;
  adminApprovedAt?: Date;
  userAcceptedAt?: Date;
  disbursementDate?: Date;
  disbursementMethod?: string;
  disbursementReference?: string;
  createdAt?: Date;
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

    const loans = await Loan.find({
      isDeleted: { $ne: true },
      status: { $in: ["user_accepted", "pending_finance_processing", "pending_finance", "under_finance_review", "approved", "disbursed"] },
      userAcceptanceStatus: "accepted",
    })
      .populate("userId", "fullName email phone employeeId")
      .sort({ userAcceptedAt: -1, adminApprovedAt: -1, createdAt: -1 })
      .lean<LeanLoan[]>();

    const disbursements = loans.map((loan) => ({
      _id: loan._id.toString(),
      memberName: loan.userId?.fullName || "Unknown Member",
      memberEmail: loan.userId?.email || "",
      memberPhone: loan.userId?.phone || "",
      employeeId: loan.userId?.employeeId || "",
      loanType: loan.loanType || "Loan",
      approvedAmount: loan.approvedAmount || loan.requestedAmount || 0,
      approvedPeriodMonths: loan.approvedPeriodMonths || 0,
      monthlyInstallment: loan.monthlyInstallment || 0,
      totalRepayment: loan.totalRepayment || 0,
      remainingBalance: loan.remainingBalance || 0,
      status: loan.status,
      disbursementStatus:
        loan.status === "disbursed" ? "disbursed" : "pending_disbursement",
      approvedAt: loan.adminApprovedAt || loan.createdAt,
      acceptedAt: loan.userAcceptedAt,
      disbursedAt: loan.disbursementDate,
      disbursementMethod: loan.disbursementMethod || "",
      disbursementReference: loan.disbursementReference || "",
    }));

    return NextResponse.json({
      success: true,
      disbursements,
    });
  } catch (error) {
    console.error("GET_FINANCE_DISBURSEMENTS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load disbursements.",
      },
      { status: 500 }
    );
  }
}