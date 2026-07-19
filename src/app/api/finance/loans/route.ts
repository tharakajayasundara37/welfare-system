import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import Loan from "@/models/Loan";

type PopulatedUser = {
  _id: { toString: () => string };
  fullName?: string;
  email?: string;
  phone?: string;
  nic?: string;
  employeeId?: string;
  department?: string;
  jobRole?: string;
  companyName?: string;
  salaryRange?: string;
  accountStatus?: string;
};

type PopulatedOfficer = {
  _id: { toString: () => string };
  fullName?: string;
  email?: string;
  role?: string;
  employeeId?: string;
};

type LeanLoan = {
  _id: { toString: () => string };
  userId?: PopulatedUser | null;
  welfareOfficerId?: PopulatedOfficer | null;
  adminId?: PopulatedOfficer | null;
  financeOfficerId?: PopulatedOfficer | null;
  loanType?: string;
  purpose?: string;
  requestedAmount?: number;
  approvedAmount?: number;
  monthlyInstallment?: number;
  approvedPeriodMonths?: number;
  preferredPeriodMonths?: number;
  totalRepayment?: number;
  remainingBalance?: number;
  systemInterestRate?: number;
  status?: string;
  officerRemark?: string;
  adminRemark?: string;
  financeRemark?: string;
  adminApprovedAt?: Date | null;
  financeApprovedAt?: Date | null;
  financeRejectedAt?: Date | null;
  disbursementDate?: Date | null;
  nextEMIDueDate?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

type LoanStatusColor = "pending" | "approved" | "rejected" | "completed";

function getStatusLabel(status?: string) {
  if (status === "pending_finance_processing") {
    return "Pending Finance Processing";
  }

  if (status === "pending_finance") {
    return "Pending Finance Review";
  }

  if (status === "user_accepted") {
    return "Member Accepted";
  }

  if (status === "approved") {
    return "Finance Approved";
  }

  if (status === "disbursed") {
    return "Disbursed";
  }

  if (status === "finance_rejected") {
    return "Finance Rejected";
  }

  if (status === "completed") {
    return "Completed";
  }

  return status?.replaceAll("_", " ") || "Unknown";
}

function getStatusColor(status?: string): LoanStatusColor {
  if (
    status === "pending_finance_processing" ||
    status === "pending_finance" ||
    status === "user_accepted"
  ) {
    return "pending";
  }

  if (status === "approved" || status === "disbursed") {
    return "approved";
  }

  if (status === "finance_rejected") {
    return "rejected";
  }

  if (status === "completed") {
    return "completed";
  }

  return "pending";
}

function getShortReference(id: unknown) {
  const value = String(id || "");

  if (!value) return "-";

  if (value.length <= 8) {
    return `LN-${value.toUpperCase()}`;
  }

  return `LN-${value.slice(-6).toUpperCase()}`;
}

function buildStatusFilter(status: string | null) {
  const pendingStatuses = [
    "pending_finance_processing",
    "pending_finance",
    "user_accepted",
  ];

  const approvedStatuses = ["approved", "disbursed"];
  const completedStatuses = ["completed"];
  const rejectedStatuses = ["finance_rejected"];

  if (status === "pending") {
    return pendingStatuses;
  }

  if (status === "approved") {
    return approvedStatuses;
  }

  if (status === "completed") {
    return completedStatuses;
  }

  if (status === "rejected") {
    return rejectedStatuses;
  }

  return [
    ...pendingStatuses,
    ...approvedStatuses,
    ...completedStatuses,
    ...rejectedStatuses,
  ];
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim() || "";

    const statusList = buildStatusFilter(status);

    const query: Record<string, unknown> = {
      status: {
        $in: statusList,
      },
      isDeleted: { $ne: true },
    };

    const loans = await Loan.find(query)
      .populate(
        "userId",
        "fullName email phone nic employeeId department jobRole companyName salaryRange accountStatus"
      )
      .populate("welfareOfficerId", "fullName email role employeeId")
      .populate("adminId", "fullName email role employeeId")
      .populate("financeOfficerId", "fullName email role employeeId")
      .sort({ updatedAt: -1 })
      .lean<LeanLoan[]>();

    const mappedLoans = loans
      .map((loan) => {
        const member = loan.userId;
        const officer = loan.welfareOfficerId;
        const admin = loan.adminId;
        const financeOfficer = loan.financeOfficerId;

        return {
          id: loan._id.toString(),
          reference: getShortReference(loan._id),

          memberName: member?.fullName || "Member",
          memberEmail: member?.email || "",
          memberPhone: member?.phone || "",
          memberNic: member?.nic || "",
          employeeId: member?.employeeId || "",
          department: member?.department || "",
          jobRole: member?.jobRole || "",

          welfareOfficerName: officer?.fullName || "",
          adminName: admin?.fullName || "",
          financeOfficerName: financeOfficer?.fullName || "",

          loanType: loan.loanType || "Welfare Loan",
          purpose: loan.purpose || "",

          requestedAmount: loan.requestedAmount || 0,
          approvedAmount: loan.approvedAmount || loan.requestedAmount || 0,
          monthlyInstallment: loan.monthlyInstallment || 0,
          approvedPeriodMonths:
            loan.approvedPeriodMonths || loan.preferredPeriodMonths || 0,
          totalRepayment: loan.totalRepayment || 0,
          remainingBalance: loan.remainingBalance || 0,

          systemInterestRate: loan.systemInterestRate || 0,

          status: loan.status || "",
          statusLabel: getStatusLabel(loan.status),
          statusColor: getStatusColor(loan.status),

          officerRemark: loan.officerRemark || "",
          adminRemark: loan.adminRemark || "",
          financeRemark: loan.financeRemark || "",

          adminApprovedAt: loan.adminApprovedAt || null,
          financeApprovedAt: loan.financeApprovedAt || null,
          financeRejectedAt: loan.financeRejectedAt || null,
          disbursementDate: loan.disbursementDate || null,
          nextEMIDueDate: loan.nextEMIDueDate || null,

          createdAt: loan.createdAt || null,
          updatedAt: loan.updatedAt || null,
        };
      })
      .filter((loan) => {
        if (!search) return true;

        const keyword = search.toLowerCase();

        const searchableText = [
          loan.reference,
          loan.memberName,
          loan.memberEmail,
          loan.memberPhone,
          loan.memberNic,
          loan.employeeId,
          loan.department,
          loan.jobRole,
          loan.loanType,
          loan.purpose,
          loan.status,
          loan.statusLabel,
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");

        return searchableText.includes(keyword);
      });

    return NextResponse.json(
      {
        success: true,
        loans: mappedLoans,
        total: mappedLoans.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_FINANCE_LOANS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load finance loans.",
      },
      { status: 500 }
    );
  }
}