import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Loan from "@/models/Loan";

type LoanUser = {
  _id?: {
    toString: () => string;
  };
  fullName?: string;
  email?: string;
  employeeId?: string;
};

type LeanLoan = {
  _id: {
    toString: () => string;
  };
  userId?: LoanUser | string;
  referenceId?: string;
  loanReference?: string;
  loanType?: string;
  requestedAmount?: number;
  amount?: number;
  loanAmount?: number;
  approvedAmount?: number;
  purpose?: string;
  status?: string;
  emiAmount?: number;
  monthlyInstallment?: number;
  nextEMIDueDate?: Date | string | null;
  createdAt?: Date | string | null;
};

type StatusColor = "approved" | "rejected" | "pending" | "completed";

const activeStatuses = [
  "user_accepted",
  "pending_finance_processing",
  "pending_finance",
  "under_finance_review",
  "approved",
  "disbursed",
];

const rejectedStatuses = [
  "rejected",
  "welfare_rejected",
  "admin_rejected",
  "finance_rejected",
  "user_rejected",
];

function getStatusColor(status?: string): StatusColor {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "completed") return "completed";
  if (activeStatuses.includes(normalized)) return "approved";
  if (rejectedStatuses.includes(normalized)) return "rejected";

  return "pending";
}

function formatStatus(status?: string) {
  return String(status || "pending")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function makeReference(loanId: string) {
  return `LN-${loanId.slice(-6).toUpperCase()}`;
}

export async function GET() {
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

    if (currentUser.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Member only.",
        },
        { status: 403 }
      );
    }

    const loans = await Loan.find({
      userId: currentUser._id,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .lean<LeanLoan[]>();

    const formattedLoans = loans.map((loan) => {
      const loanId = loan._id.toString();

      const amount =
        loan.requestedAmount || loan.amount || loan.loanAmount || 0;

      const status = String(loan.status || "pending_officer");

      return {
        id: loanId,
        reference:
          loan.referenceId || loan.loanReference || makeReference(loanId),
        loanType: loan.loanType || "Welfare Loan",
        amount,
        approvedAmount: loan.approvedAmount || 0,
        purpose: loan.purpose || "-",
        status,
        statusLabel: formatStatus(status),
        statusColor: getStatusColor(status),
        emiAmount: loan.emiAmount || loan.monthlyInstallment || 0,
        nextEMIDueDate: loan.nextEMIDueDate || null,
        createdAt: loan.createdAt || null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        loans: formattedLoans,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_MEMBER_LOANS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to load loans.",
      },
      { status: 500 }
    );
  }
}