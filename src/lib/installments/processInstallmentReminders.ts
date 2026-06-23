import { Types } from "mongoose";


import Installment from "@/models/Installment";
import Loan from "@/models/Loan";
import "@/models/User";

import { createNotification } from "@/lib/notifications/createNotification";
import { buildInstallmentReminderSms, sendSms } from "@/lib/sms/sendSms";

type PopulatedUser = {
  _id: Types.ObjectId;
  fullName?: string;
  phone?: string;
};

type PopulatedLoan = {
  _id: Types.ObjectId;
  loanType?: string;
};

type ReminderInstallment = {
  _id: Types.ObjectId;
  userId?: PopulatedUser;
  loanId?: PopulatedLoan;
  amount: number;
  dueDate: Date;
  status: "pending" | "paid" | "overdue";
  reminderSent?: boolean;
  overdueReminderSentCount?: number;
  finalWarningSent?: boolean;
  penaltyApplied?: boolean;
};

const PENALTY_RATE = 5;

function dayStart(date = new Date()) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function getDaysLeft(dueDate: Date) {
  return Math.ceil(
    (dayStart(dueDate).getTime() - dayStart().getTime()) / 86400000
  );
}

function formatMoney(amount: number) {
  return Number(amount || 0).toLocaleString("en-LK");
}

async function notify(userId: Types.ObjectId, title: string, message: string) {
  await createNotification({
    userId,
    type: "payment",
    title,
    message,
    priority: "high",
    link: "/dashboard/installments",
  });
}

export async function processInstallmentReminders() {
  const installments = await Installment.find({
    status: { $in: ["pending", "overdue"] },
    isDeleted: { $ne: true },
  })
    .populate("userId", "fullName phone")
    .populate("loanId", "loanType")
    .lean<ReminderInstallment[]>();

  const results: Array<{
    installmentId: string;
    memberName: string;
    phone: string;
    action: string;
    smsSent: boolean;
    penaltyApplied: boolean;
    penaltyAmount?: number;
    message: string;
  }> = [];

  for (const item of installments) {
    const user = item.userId;
    const loan = item.loanId;
    const installmentId = item._id.toString();

    if (!user?._id || !loan?._id) {
      results.push({
        installmentId,
        memberName: "",
        phone: "",
        action: "skipped",
        smsSent: false,
        penaltyApplied: false,
        message: "Missing user or loan.",
      });
      continue;
    }

    const phone = user.phone || "";
    const memberName = user.fullName || "";
    const loanType = loan.loanType || "Loan";
    const daysLeft = getDaysLeft(new Date(item.dueDate));
    const overdueDays = daysLeft < 0 ? Math.abs(daysLeft) : 0;

    if (daysLeft < 0 && item.status !== "overdue") {
      await Installment.findByIdAndUpdate(item._id, {
        $set: { status: "overdue" },
      });
    }

    if (!phone) {
      results.push({
        installmentId,
        memberName,
        phone,
        action: "skipped",
        smsSent: false,
        penaltyApplied: false,
        message: "Phone number not found.",
      });
      continue;
    }

    if (daysLeft === 1 && !item.reminderSent) {
      const sms = buildInstallmentReminderSms({
        loanType,
        amount: item.amount,
        dueDate: new Date(item.dueDate),
      });

      const smsResult = await sendSms({ to: phone, message: sms });

      if (smsResult.success) {
        await Installment.findByIdAndUpdate(item._id, {
          $set: { reminderSent: true, reminderSentAt: new Date() },
        });

        await notify(
          user._id,
          "Installment Reminder",
          `Your ${loanType} installment is due tomorrow.`
        );
      }

      results.push({
        installmentId,
        memberName,
        phone,
        action: "one_day_reminder",
        smsSent: smsResult.success,
        penaltyApplied: false,
        message: smsResult.message,
      });

      continue;
    }

    if (overdueDays >= 1 && overdueDays <= 6) {
      const sentCount = Number(item.overdueReminderSentCount || 0);

      if (sentCount < overdueDays) {
        const smsResult = await sendSms({
          to: phone,
          message: `OVERDUE NOTICE: Your ${loanType} installment of Rs. ${formatMoney(
            item.amount
          )} is overdue by ${overdueDays} day(s). Please pay immediately.`,
        });

        if (smsResult.success) {
          await Installment.findByIdAndUpdate(item._id, {
            $set: {
              status: "overdue",
              lastOverdueReminderSentAt: new Date(),
            },
            $inc: { overdueReminderSentCount: 1 },
          });

          await notify(
            user._id,
            "Overdue Installment Reminder",
            `Your ${loanType} installment is overdue by ${overdueDays} day(s).`
          );
        }

        results.push({
          installmentId,
          memberName,
          phone,
          action: "overdue_reminder",
          smsSent: smsResult.success,
          penaltyApplied: false,
          message: smsResult.message,
        });
      }

      continue;
    }

    if (overdueDays >= 7 && !item.finalWarningSent) {
      const smsResult = await sendSms({
        to: phone,
        message: `FINAL WARNING: Your ${loanType} installment is overdue by 7 days. Penalty will be applied tomorrow.`,
      });

      if (smsResult.success) {
        await Installment.findByIdAndUpdate(item._id, {
          $set: {
            status: "overdue",
            finalWarningSent: true,
            finalWarningSentAt: new Date(),
          },
        });

        await notify(
          user._id,
          "Final Installment Warning",
          `Final warning: Your ${loanType} installment is overdue by 7 days.`
        );
      }

      results.push({
        installmentId,
        memberName,
        phone,
        action: "final_warning",
        smsSent: smsResult.success,
        penaltyApplied: false,
        message: smsResult.message,
      });

      continue;
    }

    if (overdueDays >= 8 && !item.penaltyApplied) {
      const penaltyAmount = Math.round(
        (Number(item.amount || 0) * PENALTY_RATE) / 100
      );

      await Installment.findByIdAndUpdate(item._id, {
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
        $set: { lastPenaltyAppliedAt: new Date() },
      });

      const smsResult = await sendSms({
        to: phone,
        message: `PENALTY APPLIED: Rs. ${formatMoney(
          penaltyAmount
        )} penalty added for overdue ${loanType} installment.`,
      });

      await notify(
        user._id,
        "Penalty Applied",
        `A penalty of Rs. ${formatMoney(
          penaltyAmount
        )} has been applied to your overdue ${loanType} installment.`
      );

      results.push({
        installmentId,
        memberName,
        phone,
        action: "penalty_applied",
        smsSent: smsResult.success,
        penaltyApplied: true,
        penaltyAmount,
        message: smsResult.message,
      });
    }
  }

  return {
    success: true,
    message: "Installment reminder automation completed.",
    totalFound: installments.length,
    sentCount: results.filter((item) => item.smsSent).length,
    failedCount: results.filter(
      (item) =>
        !item.smsSent &&
        item.action !== "skipped" &&
        item.action !== "penalty_applied"
    ).length,
    penaltyCount: results.filter((item) => item.penaltyApplied).length,
    results,
  };
}