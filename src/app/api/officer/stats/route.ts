import { NextResponse } from "next/server";

import connectDB from "@/lib/dbConnect";
import Loan from "@/models/Loan";

type StatusColor = "approved" | "rejected" | "pending";

type PopulatedUser = {
  fullName?: string;
  email?: string;
  employeeId?: string;
};

type RawLoan = {
  _id: {
    toString: () => string;
  };

  userId?: PopulatedUser | string | null;

  memberName?: string;
  fullName?: string;
  userName?: string;

  requestedAmount?: number;
  amount?: number;
  loanAmount?: number;

  status?: string;

  referenceId?: string;
  loanReference?: string;

  loanType?: string;
  type?: string;

  createdAt?: string | Date;
};

function getStatusColor(status: string): StatusColor {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("approved") ||
    normalized === "officer_approved" ||
    normalized === "pending_admin"
  ) {
    return "approved";
  }

  if (
    normalized.includes("reject") ||
    normalized === "officer_rejected" ||
    normalized === "rejected"
  ) {
    return "rejected";
  }

  return "pending";
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getMemberName(userId: RawLoan["userId"], loan: RawLoan) {
  if (userId && typeof userId === "object" && "fullName" in userId) {
    return userId.fullName || userId.email || "Unknown Member";
  }

  return (
    loan.memberName ||
    loan.fullName ||
    loan.userName ||
    "Unknown Member"
  );
}

export async function GET() {
  try {
    await connectDB();

    const [
      pendingReviews,
      verifiedDocuments,
      approvedLoans,
      rejectedLoans,
      recentLoans,
    ] = await Promise.all([
      Loan.countDocuments({
        status: {
          $in: [
            "pending_officer",
            "pending officer",
            "pending_review",
            "Pending Review",
            "pending",
          ],
        },
      }),

      Loan.countDocuments({
        $or: [
          { "documents.status": "verified" },
          { documentStatus: "verified" },
          { isDocumentVerified: true },
        ],
      }),

      Loan.countDocuments({
        status: {
          $in: [
            "officer_approved",
            "pending_admin",
            "approved",
            "Admin Approved",
            "Officer Approved",
          ],
        },
      }),

      Loan.countDocuments({
        status: {
          $in: [
            "officer_rejected",
            "rejected",
            "Officer Rejected",
            "Admin Rejected",
          ],
        },
      }),

      Loan.find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("userId", "fullName email employeeId")
        .lean<RawLoan[]>(),
    ]);

    const recentReviews = recentLoans.map((loan: RawLoan) => {
      const memberName = getMemberName(loan.userId, loan);

      const amount =
        loan.requestedAmount || loan.amount || loan.loanAmount || 0;

      const status = String(loan.status || "pending_officer");

      const loanId = loan._id.toString();

      return {
        id: loanId,
        reference:
          loan.referenceId ||
          loan.loanReference ||
          `LN-${loanId.slice(-6).toUpperCase()}`,
        member: memberName,
        loanType: loan.loanType || loan.type || "Welfare Loan",
        amount,
        status,
        statusLabel: formatStatus(status),
        statusColor: getStatusColor(status),
        date: loan.createdAt || new Date(),
      };
    });

    return NextResponse.json(
      {
        success: true,
        stats: {
          pendingReviews,
          verifiedDocuments,
          approvedLoans,
          rejectedLoans,
        },
        recentReviews,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OFFICER_STATS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load officer dashboard data",
      },
      { status: 500 }
    );
  }
}