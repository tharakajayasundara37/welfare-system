import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import User from "@/models/User";
import Loan from "@/models/Loan";

const loanBaseFilter = {
  isDeleted: { $ne: true },
};

const pendingStatuses = [
  "submitted",
  "under_welfare_review",
  "pending_admin_approval",
];

const approvedOrProcessingStatuses = [
  "admin_approved",
  "user_offer_pending",
  "user_accepted",
  "pending_finance_processing",
  "finance_approved",
  "disbursed",
  "active",
  "completed",
];

const disbursedStatuses = ["disbursed", "active", "completed"];

const rejectedStatuses = [
  "admin_rejected",
  "user_rejected",
  "welfare_rejected",
  "finance_rejected",
  "cancelled",
];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatMonthLabel(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
  });
}

function getLast12Months() {
  const now = new Date();
  const months: {
    key: string;
    label: string;
    year: number;
    month: number;
    amount: number;
    count: number;
  }[] = [];

  for (let index = 11; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    months.push({
      key: `${year}-${String(month).padStart(2, "0")}`,
      label: formatMonthLabel(date),
      year,
      month,
      amount: 0,
      count: 0,
    });
  }

  return months;
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

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Admin only.",
        },
        { status: 403 }
      );
    }

    const now = new Date();
    const twelveMonthsAgo = startOfMonth(
      new Date(now.getFullYear(), now.getMonth() - 11, 1)
    );

    const [
      totalMembers,
      activeMembers,
      pendingMembers,
      totalLoans,
      pendingLoans,
      offerSentLoans,
      financeProcessingLoans,
      approvedLoans,
      rejectedLoans,
      completedLoans,
      disbursedAmountResult,
      outstandingAmountResult,
      overdueAmountResult,
      repaymentResult,
      monthlyLoanResult,
      recentLoans,
    ] = await Promise.all([
      User.countDocuments({
        role: "member",
        isDeleted: { $ne: true },
      }),

      User.countDocuments({
        role: "member",
        accountStatus: "active",
        isDeleted: { $ne: true },
      }),

      User.countDocuments({
        role: "member",
        accountStatus: {
          $in: ["pending", "pending_admin_approval"],
        },
        isDeleted: { $ne: true },
      }),

      Loan.countDocuments(loanBaseFilter),

      Loan.countDocuments({
        ...loanBaseFilter,
        status: { $in: pendingStatuses },
      }),

      Loan.countDocuments({
        ...loanBaseFilter,
        status: "user_offer_pending",
      }),

      Loan.countDocuments({
        ...loanBaseFilter,
        status: {
          $in: ["user_accepted", "pending_finance_processing"],
        },
      }),

      Loan.countDocuments({
        ...loanBaseFilter,
        status: { $in: approvedOrProcessingStatuses },
      }),

      Loan.countDocuments({
        ...loanBaseFilter,
        status: { $in: rejectedStatuses },
      }),

      Loan.countDocuments({
        ...loanBaseFilter,
        status: "completed",
      }),

      Loan.aggregate([
        {
          $match: {
            ...loanBaseFilter,
            status: { $in: disbursedStatuses },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$approvedAmount", 0] } },
          },
        },
      ]),

      Loan.aggregate([
        {
          $match: {
            ...loanBaseFilter,
            status: {
              $in: ["pending_finance_processing", "disbursed", "active", "overdue"],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$remainingBalance", 0] } },
          },
        },
      ]),

      Loan.aggregate([
        {
          $match: {
            ...loanBaseFilter,
            $or: [{ status: "overdue" }, { missedInstallments: { $gt: 0 } }],
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $add: [
                  { $ifNull: ["$remainingBalance", 0] },
                  { $ifNull: ["$lateFeeAmount", 0] },
                ],
              },
            },
          },
        },
      ]),

      Loan.aggregate([
        {
          $match: {
            ...loanBaseFilter,
            status: {
              $in: ["pending_finance_processing", "disbursed", "active", "completed"],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalPaid: { $sum: { $ifNull: ["$paidAmount", 0] } },
            totalRepayment: { $sum: { $ifNull: ["$totalRepayment", 0] } },
          },
        },
      ]),

      Loan.aggregate([
        {
          $match: {
            ...loanBaseFilter,
            createdAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            amount: { $sum: { $ifNull: ["$approvedAmount", "$requestedAmount"] } },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),

      Loan.find(loanBaseFilter)
        .populate("userId", "fullName email employeeId")
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const disbursedAmount = Number(disbursedAmountResult?.[0]?.total || 0);
    const outstandingAmount = Number(outstandingAmountResult?.[0]?.total || 0);
    const overdueAmount = Number(overdueAmountResult?.[0]?.total || 0);

    const totalPaid = Number(repaymentResult?.[0]?.totalPaid || 0);
    const totalRepayment = Number(repaymentResult?.[0]?.totalRepayment || 0);

    const collectionRate =
      totalRepayment > 0 ? Math.round((totalPaid / totalRepayment) * 100) : 0;

    const last12Months = getLast12Months();

    for (const item of monthlyLoanResult) {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
      const foundMonth = last12Months.find((month) => month.key === key);

      if (foundMonth) {
        foundMonth.amount = Number(item.amount || 0);
        foundMonth.count = Number(item.count || 0);
      }
    }

    const statusSummary = {
      total: totalLoans,
      pending: pendingLoans,
      offerSent: offerSentLoans,
      financeProcessing: financeProcessingLoans,
      approved: approvedLoans,
      rejected: rejectedLoans,
      completed: completedLoans,
    };

    const reports = {
      totalMembers,
      activeMembers,
      pendingMembers,

      totalLoans,
      pendingLoans,
      offerSentLoans,
      financeProcessingLoans,
      approvedLoans,
      rejectedLoans,
      completedLoans,

      disbursedAmount,
      outstandingAmount,
      overdueAmount,

      totalPaid,
      totalRepayment,
      collectionRate,

      monthlyLoanActivity: last12Months,
      statusSummary,

      recentActivity: recentLoans.map((loan) => ({
        id: String(loan._id),
        type: loan.loanType || "Loan",
        member:
          typeof loan.userId === "object" && loan.userId
            ? loan.userId.fullName || "Unknown Member"
            : "Unknown Member",
        amount: Number(loan.approvedAmount || loan.requestedAmount || 0),
        status: loan.status || "unknown",
        date: loan.updatedAt || loan.createdAt,
      })),
    };

    return NextResponse.json(
      {
        success: true,
        reports,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_ADMIN_REPORTS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load admin reports.",
      },
      { status: 500 }
    );
  }
}