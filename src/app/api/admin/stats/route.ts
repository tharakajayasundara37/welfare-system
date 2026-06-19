import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Loan from "@/models/Loan";
import Installment from "@/models/Installment";
import MeetingNotice from "@/models/MeetingNotice";

const JWT_SECRET =
  process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || "";

interface JwtPayload {
  userId: string;
  role?: string;
}

type MonthlyAggregate = {
  _id: {
    year: number;
    month: number;
  };
  amount?: number;
  count?: number;
  total?: number;
  active?: number;
};

type StatusAggregate = {
  _id: string;
  count: number;
};

type AmountAggregate = {
  _id: string;
  totalAmount?: number;
  totalPaidAmount?: number;
};

type RecentNoticeLean = {
  _id: {
    toString: () => string;
  };
  title?: string;
  reason?: string;
  description?: string;
  meetingAt?: Date;
  createdAt?: Date;
};

type RecentApprovalLean = {
  _id: {
    toString: () => string;
  };
  userId?:
    | {
        fullName?: string;
        employeeId?: string;
      }
    | string;
  loanType?: string;
  requestedAmount?: number;
  approvedAmount?: number;
  loanAmount?: number;
  status?: string;
  updatedAt?: Date;
};

async function getAdminUser(request: NextRequest) {
  try {
    if (!JWT_SECRET) return null;

    const token = request.cookies.get("token")?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || user.role !== "admin") return null;

    return user;
  } catch {
    return null;
  }
}

function getMonthLabel(monthIndex: number) {
  return new Date(2026, monthIndex, 1).toLocaleString("en-US", {
    month: "short",
  });
}

function getLastSixMonthsRange() {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  end.setHours(0, 0, 0, 0);

  return { start, end };
}

function getStatusCount(items: StatusAggregate[], statuses: string[]) {
  return items
    .filter((item) => statuses.includes(item._id))
    .reduce((sum, item) => sum + Number(item.count || 0), 0);
}

function normalizeUserName(user: RecentApprovalLean["userId"]) {
  if (!user || typeof user === "string") {
    return "Unknown";
  }

  return user.fullName || "Unknown";
}

function normalizeEmployeeId(user: RecentApprovalLean["userId"]) {
  if (!user || typeof user === "string") {
    return "-";
  }

  return user.employeeId || "-";
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const admin = await getAdminUser(request);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        { status: 403 }
      );
    }

    const { start, end } = getLastSixMonthsRange();

    const [
      totalMembers,
      activeMembers,
      pendingApprovals,
      totalLoans,
      loanStatusCounts,
      installmentCounts,
      installmentAmounts,
      totalDisbursedAmountResult,
      monthlyDisbursementAgg,
      memberGrowthAgg,
      recentAnnouncements,
      recentApprovals,
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
        accountStatus: "pending_admin_approval",
        isDeleted: { $ne: true },
      }),

      Loan.countDocuments({
        isDeleted: { $ne: true },
      }),

      Loan.aggregate<StatusAggregate>([
        {
          $match: {
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      Installment.aggregate<StatusAggregate>([
        {
          $match: {
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      Installment.aggregate<AmountAggregate>([
        {
          $match: {
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: "$status",
            totalAmount: { $sum: "$amount" },
            totalPaidAmount: { $sum: "$paidAmount" },
          },
        },
      ]),

      Loan.aggregate<{ _id: null; amount: number }>([
        {
          $match: {
            status: "disbursed",
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            amount: {
              $sum: {
                $ifNull: [
                  "$approvedAmount",
                  {
                    $ifNull: ["$requestedAmount", "$loanAmount"],
                  },
                ],
              },
            },
          },
        },
      ]),

      Loan.aggregate<MonthlyAggregate>([
        {
          $match: {
            status: "disbursed",
            isDeleted: { $ne: true },
            disbursementDate: {
              $gte: start,
              $lt: end,
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$disbursementDate" },
              month: { $month: "$disbursementDate" },
            },
            amount: {
              $sum: {
                $ifNull: [
                  "$approvedAmount",
                  {
                    $ifNull: ["$requestedAmount", "$loanAmount"],
                  },
                ],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      User.aggregate<MonthlyAggregate>([
        {
          $match: {
            role: "member",
            isDeleted: { $ne: true },
            createdAt: {
              $gte: start,
              $lt: end,
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            total: { $sum: 1 },
            active: {
              $sum: {
                $cond: [{ $eq: ["$accountStatus", "active"] }, 1, 0],
              },
            },
          },
        },
      ]),

      MeetingNotice.find({
        status: "active",
        isDeleted: { $ne: true },
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean<RecentNoticeLean[]>(),

      Loan.find({
        isDeleted: { $ne: true },
      })
        .populate("userId", "fullName employeeId")
        .sort({ updatedAt: -1 })
        .limit(8)
        .lean<RecentApprovalLean[]>(),
    ]);

    const disbursedLoans = getStatusCount(loanStatusCounts, ["disbursed"]);

    const approvedLoans = getStatusCount(loanStatusCounts, [
      "approved",
      "disbursed",
      "completed",
      "user_accepted",
      "pending_finance",
      "pending_finance_processing",
      "under_finance_review",
    ]);

    const pendingLoans = getStatusCount(loanStatusCounts, [
      "under_welfare_review",
      "pending_officer",
      "pending_admin_approval",
      "pending_admin",
      "under_admin_review",
      "user_offer_pending",
    ]);

    const rejectedLoans = getStatusCount(loanStatusCounts, [
      "rejected",
      "welfare_rejected",
      "admin_rejected",
      "finance_rejected",
      "user_rejected",
    ]);

    const pendingInstallments =
      installmentCounts.find((item) => item._id === "pending")?.count || 0;

    const paidInstallments =
      installmentCounts.find((item) => item._id === "paid")?.count || 0;

    const overdueInstallments =
      installmentCounts.find((item) => item._id === "overdue")?.count || 0;

    const pendingInstallmentAmount =
      installmentAmounts.find((item) => item._id === "pending")?.totalAmount ||
      0;

    const paidInstallmentAmount =
      installmentAmounts.find((item) => item._id === "paid")
        ?.totalPaidAmount || 0;

    const overdueInstallmentAmount =
      installmentAmounts.find((item) => item._id === "overdue")?.totalAmount ||
      0;

    const monthlyDisbursements = Array.from({ length: 12 }).map((_, index) => {
      const found = monthlyDisbursementAgg.find(
        (item) => item._id.month === index + 1
      );

      return {
        month: getMonthLabel(index),
        amount: Number(found?.amount || 0),
        count: Number(found?.count || 0),
      };
    });

    const memberGrowth = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth() + index, 1);

      const found = memberGrowthAgg.find(
        (item) =>
          item._id.year === date.getFullYear() &&
          item._id.month === date.getMonth() + 1
      );

      return {
        month: getMonthLabel(date.getMonth()),
        total: Number(found?.total || 0),
        active: Number(found?.active || 0),
      };
    });

    const activeAnnouncements = await MeetingNotice.countDocuments({
      status: "active",
      isDeleted: { $ne: true },
    });

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalMembers,
          activeMembers,
          pendingApprovals,
          totalLoans,

          totalDisbursedAmount: Number(
            totalDisbursedAmountResult[0]?.amount || 0
          ),

          pendingInstallments,
          paidInstallments,
          overdueInstallments,

          pendingInstallmentAmount,
          paidInstallmentAmount,
          overdueInstallmentAmount,

          approvedLoans,
          pendingLoans,
          rejectedLoans,
          disbursedLoans,

          activeAnnouncements,

          monthlyDisbursements,
          memberGrowth,

          recentAnnouncements: recentAnnouncements.map((notice) => ({
            _id: notice._id.toString(),
            title: notice.title || "Announcement",
            desc:
              notice.description ||
              notice.reason ||
              "Latest welfare notice update.",
          })),

          recentApprovals: recentApprovals.map((loan) => ({
            id: loan._id.toString(),
            memberName: normalizeUserName(loan.userId),
            employeeId: normalizeEmployeeId(loan.userId),
            loanType: loan.loanType || "-",
            amount:
              loan.approvedAmount ||
              loan.requestedAmount ||
              loan.loanAmount ||
              0,
            status: loan.status || "-",
            updatedAt: loan.updatedAt || null,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_ADMIN_STATS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load admin stats",
      },
      { status: 500 }
    );
  }
}