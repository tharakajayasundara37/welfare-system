import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Loan from "@/models/Loan";
import MeetingNotice from "@/models/MeetingNotice";
import Installment from "@/models/Installment";

type RawLoan = {
  _id: {
    toString: () => string;
  };
  loanType?: string;
  type?: string;
  requestedAmount?: number;
  amount?: number;
  loanAmount?: number;
  status?: string;
  purpose?: string;
  emiAmount?: number;
  monthlyInstallment?: number;
  nextEMIDueDate?: string | Date;
  createdAt?: string | Date;
};

type RawMeeting = {
  _id: {
    toString: () => string;
  };
  title?: string;
  reason?: string;
  description?: string;
  venue?: string;
  meetingDate?: string;
  meetingTime?: string;
  meetingAt?: string | Date;
  priority?: string;
  targetAudience?: string;
};

type RawInstallment = {
  _id: { toString: () => string };
  loanId?: { loanType?: string };
  installmentNumber?: number;
  amount?: number;
  penaltyAmount?: number;
  dueDate?: Date | string;
};

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusColor(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("approved") ||
    normalized.includes("disbursed") ||
    normalized === "pending_admin" ||
    normalized === "pending_finance"
  ) {
    return "approved";
  }

  if (normalized.includes("reject")) {
    return "rejected";
  }

  if (normalized.includes("completed") || normalized.includes("paid")) {
    return "completed";
  }

  return "pending";
}

export async function GET() {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login again.",
        },
        { status: 401 }
      );
    }

    const userId = currentUser._id;

    const [
      totalLoans,
      pendingLoans,
      approvedLoans,
      rejectedLoans,
      recentLoans,
      upcomingMeeting,
      overdueInst,
    ] = await Promise.all([
      Loan.countDocuments({ userId }),

      Loan.countDocuments({
        userId,
        status: {
          $in: [
            "pending",
            "pending_officer",
            "pending_admin",
            "pending_finance",
            "pending_review",
          ],
        },
      }),

      Loan.countDocuments({
        userId,
        status: {
          $in: [
            "approved",
            "officer_approved",
            "admin_approved",
            "pending_admin",
            "pending_finance",
            "disbursed",
          ],
        },
      }),

      Loan.countDocuments({
        userId,
        status: {
          $in: ["rejected", "officer_rejected", "admin_rejected"],
        },
      }),

      Loan.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean<RawLoan[]>(),

      MeetingNotice.findOne({
        status: "active",
        isDeleted: { $ne: true },
        meetingAt: { $gte: new Date() },
        $or: [
          { targetAudience: "all_members" },
          { targetAudience: "active_members" },
        ],
      })
        .sort({ meetingAt: 1 })
        .lean<RawMeeting | null>(),

      // Fetch the oldest overdue installment
      Installment.findOne({
        userId,
        status: "overdue",
        isDeleted: { $ne: true },
      })
        .populate("loanId", "loanType")
        .sort({ dueDate: 1 })
        .lean<RawInstallment | null>(),
    ]);

    const activeLoans = await Loan.countDocuments({
      userId,
      status: {
        $in: ["approved", "disbursed", "active"],
      },
    });

    const recentApplications = recentLoans.map((loan) => {
      const loanId = loan._id.toString();
      const amount = loan.requestedAmount || loan.amount || loan.loanAmount || 0;
      const status = String(loan.status || "pending");

      return {
        id: loanId,
        reference: `LN-${loanId.slice(-6).toUpperCase()}`,
        loanType: loan.loanType || loan.type || "Welfare Loan",
        amount,
        status,
        statusLabel: formatStatus(status),
        statusColor: getStatusColor(status),
        purpose: loan.purpose || "-",
        emiAmount: loan.emiAmount || loan.monthlyInstallment || 0,
        nextEMIDueDate: loan.nextEMIDueDate || null,
        createdAt: loan.createdAt || null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        member: {
          fullName: currentUser.fullName,
          email: currentUser.email,
          role: currentUser.role,
          accountStatus: currentUser.accountStatus,
          employeeId: currentUser.employeeId,
          department: currentUser.department,
          jobRole: currentUser.jobRole,
        },
        stats: {
          totalLoans,
          activeLoans,
          pendingLoans,
          approvedLoans,
          rejectedLoans,
        },
        recentApplications,
        meeting: upcomingMeeting
          ? {
              id: upcomingMeeting._id.toString(),
              title: upcomingMeeting.title || "Meeting Notice",
              reason: upcomingMeeting.reason || "",
              description: upcomingMeeting.description || "",
              venue: upcomingMeeting.venue || "Main Hall",
              meetingDate: upcomingMeeting.meetingDate || "",
              meetingTime: upcomingMeeting.meetingTime || "",
              meetingAt: upcomingMeeting.meetingAt || null,
              priority: upcomingMeeting.priority || "normal",
              targetAudience: upcomingMeeting.targetAudience || "all_members",
            }
          : null,
        
        overdueInstallment: overdueInst
          ? {
              id: overdueInst._id.toString(),
              loanType: overdueInst.loanId?.loanType || "Loan",
              installmentNumber: overdueInst.installmentNumber || 1,
              amount: overdueInst.amount || 0,
              penaltyAmount: overdueInst.penaltyAmount || 0,
              dueDate: overdueInst.dueDate || null,
            }
          : null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("MEMBER_DASHBOARD_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load member dashboard data.",
      },
      { status: 500 }
    );
  }
}