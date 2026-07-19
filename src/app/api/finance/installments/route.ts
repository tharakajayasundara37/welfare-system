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
  reminderSent?: boolean;
  reminderSentAt?: Date | null;
};

type GroupedInstallment = {
  _id: string;
  installmentNumber: number;
  amount: number;
  paidAmount: number;
  paymentReference: string;
  dueDate: Date;
  daysLeft: number;
  status: string;
  dueStatus: string;
  paidAt: Date | null;
  reminderSent: boolean;
  reminderSentAt: Date | null;
};

type GroupedLoan = {
  loanId: string;
  loanType: string;
  loanStatus: string;
  approvedAmount: number;
  totalRepayment: number;
  remainingBalance: number;
  totalInstallments: number;
  totalPaidInstallments: number;
  installments: GroupedInstallment[];
};

type GroupedUser = {
  userId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  employeeId: string;
  loans: GroupedLoan[];
};

function getDaysLeft(dueDate: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getDueStatus(status: string, dueDate: Date) {
  if (status === "paid") return "paid";

  const daysLeft = getDaysLeft(dueDate);

  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 3) return "due_soon";

  return "upcoming";
}

function getSafeId(
  field: PopulatedUser | PopulatedLoan | Types.ObjectId | string | null | undefined,
  defaultId: string
): string {
  if (!field) return defaultId;
  if (typeof field === "object" && "_id" in field && field._id) {
    return field._id.toString();
  }
  if (typeof field === "string") return field;
  if (field.toString) return field.toString();
  return defaultId;
}

export async function GET() {
  try {
    await dbConnect();

    await import("@/models/Loan");
    await import("@/models/User");

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
      isDeleted: { $ne: true },
    })
      .populate("userId", "fullName email phone employeeId")
      .populate(
        "loanId",
        "loanType approvedAmount totalRepayment remainingBalance totalInstallments totalPaidInstallments status"
      )
      .sort({ dueDate: 1, createdAt: -1 })
      .lean<LeanInstallment[]>();

    const groupedData = installments.reduce<GroupedUser[]>((acc, item) => {
      const userId = getSafeId(item.userId, "unknown_user");
      const loanId = getSafeId(item.loanId, "unknown_loan");

      let userGroup = acc.find((u) => u.userId === userId);

      if (!userGroup) {
        userGroup = {
          userId,
          memberName: item.userId?.fullName || "Unknown Member",
          memberEmail: item.userId?.email || "",
          memberPhone: item.userId?.phone || "",
          employeeId: item.userId?.employeeId || "",
          loans: [],
        };
        acc.push(userGroup);
      }

      let loanGroup = userGroup.loans.find((l) => l.loanId === loanId);

      if (!loanGroup) {
        loanGroup = {
          loanId,
          loanType: item.loanId?.loanType || "Loan",
          loanStatus: item.loanId?.status || "",
          approvedAmount: item.loanId?.approvedAmount || 0,
          totalRepayment: item.loanId?.totalRepayment || 0,
          remainingBalance: item.loanId?.remainingBalance || 0,
          totalInstallments: item.loanId?.totalInstallments || 0,
          totalPaidInstallments: item.loanId?.totalPaidInstallments || 0,
          installments: [],
        };
        userGroup.loans.push(loanGroup);
      }

      const daysLeft = getDaysLeft(new Date(item.dueDate));
      const dueStatus = getDueStatus(item.status, new Date(item.dueDate));

      loanGroup.installments.push({
        _id: item._id.toString(),
        installmentNumber: item.installmentNumber || 0,
        amount: item.amount || 0,
        paidAmount: item.paidAmount || 0,
        paymentReference: item.paymentReference || "",
        dueDate: item.dueDate,
        daysLeft,
        status: item.status,
        dueStatus,
        paidAt: item.paidAt || null,
        reminderSent: item.reminderSent || false,
        reminderSentAt: item.reminderSentAt || null,
      });

      return acc;
    }, []);

    return NextResponse.json({
      success: true,
      data: groupedData,
    });
  } catch (error) {
    console.error("GET_FINANCE_INSTALLMENTS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load installments.",
      },
      { status: 500 }
    );
  }
}