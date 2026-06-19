import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import Loan from "@/models/Loan";

type LoanStatusColor = "pending" | "approved" | "rejected" | "completed";

function getStatusLabel(status?: string) {
  if (status === "pending_finance_processing") return "Pending Finance Processing";
  if (status === "pending_finance") return "Pending Finance Review";
  if (status === "user_accepted") return "Member Accepted";
  if (status === "approved") return "Approved";
  if (status === "disbursed") return "Disbursed";
  if (status === "finance_rejected") return "Finance Rejected";
  if (status === "completed") return "Completed";

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

  if (value.length <= 8) {
    return value || "-";
  }

  return `LN-${value.slice(-6).toUpperCase()}`;
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

    if (currentUser.role !== "finance_officer" && currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Finance officer only.",
        },
        { status: 403 }
      );
    }

    const pendingFinanceStatuses = [
      "pending_finance_processing",
      "pending_finance",
      "user_accepted",
    ];

    const completedFinanceStatuses = ["approved", "disbursed", "completed"];

    const rejectedFinanceStatuses = ["finance_rejected"];

    const [
      totalFinanceLoans,
      pendingFinanceLoans,
      disbursedLoans,
      completedLoans,
      rejectedLoans,
      recentFinanceLoans,
    ] = await Promise.all([
      Loan.countDocuments({
        status: {
          $in: [
            ...pendingFinanceStatuses,
            ...completedFinanceStatuses,
            ...rejectedFinanceStatuses,
          ],
        },
        isDeleted: { $ne: true },
      }),

      Loan.countDocuments({
        status: { $in: pendingFinanceStatuses },
        isDeleted: { $ne: true },
      }),

      Loan.countDocuments({
        status: "disbursed",
        isDeleted: { $ne: true },
      }),

      Loan.countDocuments({
        status: "completed",
        isDeleted: { $ne: true },
      }),

      Loan.countDocuments({
        status: { $in: rejectedFinanceStatuses },
        isDeleted: { $ne: true },
      }),

      Loan.find({
        status: {
          $in: [
            ...pendingFinanceStatuses,
            ...completedFinanceStatuses,
            ...rejectedFinanceStatuses,
          ],
        },
        isDeleted: { $ne: true },
      })
        .populate(
          "userId",
          "fullName email phone nic employeeId department jobRole"
        )
        .populate("adminId", "fullName email role employeeId")
        .populate("financeOfficerId", "fullName email role employeeId")
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const totalDisbursedAmountResult = await Loan.aggregate([
      {
        $match: {
          status: { $in: ["approved", "disbursed", "completed"] },
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $ifNull: ["$approvedAmount", 0],
            },
          },
        },
      },
    ]);

    const totalDisbursedAmount = totalDisbursedAmountResult[0]?.total || 0;

    const mappedRecentLoans = recentFinanceLoans.map((loan) => {
      const member =
        typeof loan.userId === "object" && loan.userId ? loan.userId : null;

      return {
        id: loan._id.toString(),
        reference: getShortReference(loan._id),
        memberName: member?.fullName || "Member",
        memberEmail: member?.email || "",
        memberPhone: member?.phone || "",
        employeeId: member?.employeeId || "",
        loanType: loan.loanType || "Welfare Loan",
        approvedAmount: loan.approvedAmount || loan.requestedAmount || 0,
        monthlyInstallment: loan.monthlyInstallment || 0,
        approvedPeriodMonths:
          loan.approvedPeriodMonths || loan.preferredPeriodMonths || 0,
        totalRepayment: loan.totalRepayment || 0,
        status: loan.status || "",
        statusLabel: getStatusLabel(loan.status),
        statusColor: getStatusColor(loan.status),
        adminApprovedAt: loan.adminApprovedAt || null,
        disbursementDate: loan.disbursementDate || null,
        updatedAt: loan.updatedAt || null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalFinanceLoans,
          pendingFinanceLoans,
          disbursedLoans,
          completedLoans,
          rejectedLoans,
          totalDisbursedAmount,
        },
        recentLoans: mappedRecentLoans,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_FINANCE_DASHBOARD_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load finance dashboard.",
      },
      { status: 500 }
    );
  }
}