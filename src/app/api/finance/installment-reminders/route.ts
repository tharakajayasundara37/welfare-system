import { NextResponse } from "next/server";
import { Types } from "mongoose";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { buildInstallmentReminderSms, sendSms } from "@/lib/sms/sendSms";
import { createNotification } from "@/lib/notifications/createNotification";

import Installment from "@/models/Installment";
import Loan from "@/models/Loan";

const PENALTY_RATE = 0.02;

type PopulatedUser = {
  _id: Types.ObjectId;
  fullName?: string;
  phone?: string;
};

type PopulatedLoan = {
  _id: Types.ObjectId;
  loanType?: string;
  remainingBalance?: number;
};

type ReminderInstallment = {
  _id: Types.ObjectId;
  userId: PopulatedUser;
  loanId: PopulatedLoan;
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  status: "pending" | "paid" | "overdue";
  reminderSent?: boolean;
  overdueReminderSentCount?: number;
  finalWarningSent?: boolean;
  penaltyApplied?: boolean;
};

function startOfDay(dateValue = new Date()) {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getTomorrowEnd() {
  const tomorrow = startOfDay();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);
  return tomorrow;
}

function getDaysLeft(dueDate: Date) {
  const today = startOfDay();
  const due = startOfDay(dueDate);

  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getSmsMessage({
  loanType,
  amount,
  dueDate,
  daysLeft,
}: {
  loanType: string;
  amount: number;
  dueDate: Date;
  daysLeft: number;
}) {
  const formattedAmount = Number(amount || 0).toLocaleString("en-LK");
  const formattedDate = dueDate.toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (daysLeft === 1) {
    return buildInstallmentReminderSms({
      loanType,
      amount,
      dueDate,
    });
  }

  if (daysLeft < 0 && Math.abs(daysLeft) === 7) {
    return `Final Warning: Your ${loanType} installment of Rs. ${formattedAmount} is overdue by 7 days. Please pay immediately to avoid penalties.`;
  }

  if (daysLeft < 0) {
    return `Overdue Notice: Your ${loanType} installment of Rs. ${formattedAmount} is overdue by ${Math.abs(
      daysLeft
    )} day(s). Due date: ${formattedDate}. Please make the payment immediately.`;
  }

  return `Reminder: Your ${loanType} installment of Rs. ${formattedAmount} is due on ${formattedDate}.`;
}

async function addPaymentNotification({
  installment,
  user,
  loan,
  title,
  message,
  priority,
  currentUserId,
  smsSent,
  smsResultMessage,
}: {
  installment: ReminderInstallment;
  user: PopulatedUser;
  loan: PopulatedLoan;
  title: string;
  message: string;
  priority: "low" | "normal" | "high";
  currentUserId: string;
  smsSent: boolean;
  smsResultMessage: string;
}) {
  await createNotification({
    userId: user._id,
    type: "payment",
    title,
    message,
    priority,
    link: "/dashboard/installments",
    metadata: {
      installmentId: installment._id.toString(),
      loanId: loan._id.toString(),
      dueDate: installment.dueDate,
      smsSent,
      smsMessage: smsResultMessage,
      triggeredBy: currentUserId,
    },
  });
}

export async function GET() {
  try {
    await dbConnect();

    const installments = await Installment.find({
      status: { $in: ["pending", "overdue"] },
      isDeleted: { $ne: true },
    })
      .populate("userId", "fullName phone")
      .populate("loanId", "loanType remainingBalance")
      .sort({ dueDate: 1 })
      .lean<ReminderInstallment[]>();

    return NextResponse.json({
      success: true,
      message: "Reminder API is working. Use POST to process reminders.",
      count: installments.length,
      installments: installments.map((item) => ({
        installmentId: item._id.toString(),
        memberName: item.userId?.fullName || "",
        phone: item.userId?.phone || "",
        loanType: item.loanId?.loanType || "",
        amount: item.amount || 0,
        dueDate: item.dueDate,
        status: item.status,
        daysLeft: getDaysLeft(new Date(item.dueDate)),
        reminderSent: item.reminderSent || false,
        overdueReminderSentCount: item.overdueReminderSentCount || 0,
        finalWarningSent: item.finalWarningSent || false,
        penaltyApplied: item.penaltyApplied || false,
      })),
    });
  } catch (error) {
    console.error("GET_INSTALLMENT_REMINDER_CHECK_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to check reminder API.",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
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
      status: { $in: ["pending", "overdue"] },
      isDeleted: { $ne: true },
      dueDate: { $lte: getTomorrowEnd() },
    })
      .populate("userId", "fullName phone")
      .populate("loanId", "loanType remainingBalance")
      .sort({ dueDate: 1 })
      .lean<ReminderInstallment[]>();

    const results = await Promise.all(
      installments.map(async (installment) => {
        const user = installment.userId;
        const loan = installment.loanId;
        const daysLeft = getDaysLeft(new Date(installment.dueDate));
        const overdueDays = daysLeft < 0 ? Math.abs(daysLeft) : 0;

        const loanType = loan?.loanType || "Loan";
        const phone = user?.phone || "";

        if (!user?._id || !loan?._id) {
          return {
            installmentId: installment._id.toString(),
            memberName: "",
            phone,
            action: "skipped",
            smsSent: false,
            penaltyApplied: false,
            message: "Missing user or loan details.",
          };
        }

        if (daysLeft < 0 && installment.status !== "overdue") {
          await Installment.findByIdAndUpdate(installment._id, {
            $set: { status: "overdue" },
          });
        }

        if (overdueDays >= 8 && !installment.penaltyApplied) {
          const penaltyAmount = Math.round(
            Number(installment.amount || 0) * PENALTY_RATE
          );

          await Installment.findByIdAndUpdate(installment._id, {
            $set: {
              status: "overdue",
              penaltyApplied: true,
              penaltyAppliedAt: new Date(),
              penaltyAmount,
              penaltyRate: PENALTY_RATE,
            },
          });

          await Loan.findByIdAndUpdate(loan._id, {
            $inc: {
              remainingBalance: penaltyAmount,
              penaltyAmount,
              penaltyAppliedCount: 1,
            },
            $set: {
              lastPenaltyAppliedAt: new Date(),
            },
          });

          await createNotification({
            userId: user._id,
            type: "payment",
            title: "Penalty Applied",
            message: `A penalty of Rs. ${penaltyAmount.toLocaleString(
              "en-LK"
            )} has been applied to your overdue ${loanType} installment.`,
            priority: "high",
            link: "/dashboard/installments",
            metadata: {
              installmentId: installment._id.toString(),
              loanId: loan._id.toString(),
              penaltyAmount,
              penaltyRate: PENALTY_RATE,
              triggeredBy: currentUser._id,
            },
          });

          return {
            installmentId: installment._id.toString(),
            userId: user._id.toString(),
            memberName: user.fullName || "",
            phone,
            action: "penalty_applied",
            smsSent: false,
            penaltyApplied: true,
            penaltyAmount,
            message: "Penalty applied after 8 overdue days.",
          };
        }

        const shouldSendOneDayReminder =
          daysLeft === 1 && !installment.reminderSent;

        const shouldSendOverdueReminder = overdueDays >= 1 && overdueDays <= 6;

        const shouldSendFinalWarning =
          overdueDays === 7 && !installment.finalWarningSent;

        if (
          !shouldSendOneDayReminder &&
          !shouldSendOverdueReminder &&
          !shouldSendFinalWarning
        ) {
          return {
            installmentId: installment._id.toString(),
            userId: user._id.toString(),
            memberName: user.fullName || "",
            phone,
            action: "skipped",
            smsSent: false,
            penaltyApplied: false,
            message: "No reminder action required today.",
          };
        }

        if (!phone) {
          return {
            installmentId: installment._id.toString(),
            userId: user._id.toString(),
            memberName: user.fullName || "",
            phone,
            action: "failed",
            smsSent: false,
            penaltyApplied: false,
            message: "Member phone number not found.",
          };
        }

        const smsMessage = getSmsMessage({
          loanType,
          amount: installment.amount,
          dueDate: new Date(installment.dueDate),
          daysLeft,
        });

        const smsResult = await sendSms({
          to: phone,
          message: smsMessage,
        });

        const updateData: Record<string, unknown> = {
          status: daysLeft < 0 ? "overdue" : installment.status,
        };

        if (shouldSendOneDayReminder && smsResult.success) {
          updateData.reminderSent = true;
          updateData.reminderSentAt = new Date();
        }

        if (shouldSendOverdueReminder && smsResult.success) {
          updateData.lastOverdueReminderSentAt = new Date();
          updateData.overdueReminderSentCount =
            Number(installment.overdueReminderSentCount || 0) + 1;
        }

        if (shouldSendFinalWarning && smsResult.success) {
          updateData.finalWarningSent = true;
          updateData.finalWarningSentAt = new Date();
        }

        await Installment.findByIdAndUpdate(installment._id, {
          $set: updateData,
        });

        await addPaymentNotification({
          installment,
          user,
          loan,
          title: shouldSendFinalWarning
            ? "Final Installment Warning"
            : daysLeft < 0
              ? "Overdue Installment Reminder"
              : "Installment Reminder",
          message: smsMessage,
          priority: daysLeft < 0 ? "high" : "normal",
          currentUserId: currentUser._id,
          smsSent: smsResult.success,
          smsResultMessage: smsResult.message,
        });

        return {
          installmentId: installment._id.toString(),
          userId: user._id.toString(),
          memberName: user.fullName || "",
          phone,
          action: shouldSendFinalWarning
            ? "final_warning"
            : daysLeft < 0
              ? "overdue_reminder"
              : "one_day_reminder",
          smsSent: smsResult.success,
          penaltyApplied: false,
          message: smsResult.message,
        };
      })
    );

    return NextResponse.json({
      success: true,
      message: "Installment reminder automation processed.",
      totalFound: installments.length,
      sentCount: results.filter((item) => item.smsSent).length,
      failedCount: results.filter(
        (item) =>
          item.action === "failed" ||
          (!item.smsSent &&
            item.action !== "skipped" &&
            item.action !== "penalty_applied")
      ).length,
      penaltyCount: results.filter((item) => item.penaltyApplied).length,
      results,
    });
  } catch (error) {
    console.error("FINANCE_RUN_INSTALLMENT_REMINDERS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to process installment reminders.",
      },
      { status: 500 }
    );
  }
}