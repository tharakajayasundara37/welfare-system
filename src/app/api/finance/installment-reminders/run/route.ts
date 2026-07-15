import { NextResponse } from "next/server";
import { Types } from "mongoose";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { sendSms } from "@/lib/sms/sendSms";
import { createNotification } from "@/lib/notifications/createNotification";

import Installment from "@/models/Installment";
import Loan from "@/models/Loan";
import LoanSetting from "@/models/LoanSettings";

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

interface PaymentNotificationProps {
  installment: ReminderInstallment;
  user: PopulatedUser;
  loan: PopulatedLoan;
  title: string;
  message: string;
  priority: "low" | "normal" | "high";
  currentUserId: Types.ObjectId | string;
  smsSent: boolean;
  smsResultMessage: string;
}

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
  isPenaltyWarning = false,
  penaltyAmount = 0
}: {
  loanType: string;
  amount: number;
  dueDate: Date;
  daysLeft: number;
  isPenaltyWarning?: boolean;
  penaltyAmount?: number;
}) {
  const formattedAmount = Number(amount || 0).toLocaleString("en-LK");
  const formattedPenalty = Number(penaltyAmount || 0).toLocaleString("en-LK");
  const formattedDate = dueDate.toLocaleDateString("en-LK", {
    day: "2-digit", month: "short", year: "numeric",
  });

  if (daysLeft === 1) {
    return `Reminder: Your ${loanType} installment of Rs. ${formattedAmount} is due on ${formattedDate}. Please pay on time.`;
  }

  if (isPenaltyWarning) {
    return `CRITICAL WARNING: Penalty Applied! Your ${loanType} installment is overdue by 4 days. A penalty of Rs. ${formattedPenalty} has been added. New payable total: Rs. ${formattedAmount}. Please settle immediately to avoid further actions.`;
  }

  if (daysLeft < 0) {
    return `Overdue Notice: Your ${loanType} installment of Rs. ${formattedAmount} is overdue by ${Math.abs(daysLeft)} day(s). Due date was ${formattedDate}.`;
  }

  return `Reminder: Your ${loanType} installment is due soon.`;
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
}: PaymentNotificationProps) {
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
      triggeredBy: currentUserId.toString(),
    },
  });
}

export async function POST() {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();
    let currentUserId: string | Types.ObjectId = "system_cron";
    
    if (currentUser) {
      if (currentUser.role !== "finance_officer" && currentUser.role !== "admin") {
        return NextResponse.json(
          { success: false, message: "Access denied. Finance officer only." },
          { status: 403 }
        );
      }
      currentUserId = currentUser._id;
    }

    const settings = await LoanSetting.findOne({ isActive: true });
    const penaltyRatePercentage = settings?.latePaymentPenaltyRate || 2;
    const PENALTY_RATE = penaltyRatePercentage / 100;

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

        if (!user?._id || !loan?._id) return { action: "skipped" };

        if (daysLeft < 0 && installment.status !== "overdue") {
          await Installment.findByIdAndUpdate(installment._id, { $set: { status: "overdue" } });
        }

        // Penalty Logic (4th Day Overdue)
        if (overdueDays >= 4 && !installment.penaltyApplied) {
          const penaltyAmount = Math.round(Number(installment.amount || 0) * PENALTY_RATE);
          const newTotalAmount = Number(installment.amount) + penaltyAmount; 

          await Installment.findByIdAndUpdate(installment._id, {
            $set: {
              status: "overdue",
              penaltyApplied: true,
              penaltyAppliedAt: new Date(),
              penaltyAmount,
              penaltyRate: penaltyRatePercentage,
              amount: newTotalAmount, 
            },
          });

          await Loan.findByIdAndUpdate(loan._id, {
            $inc: { remainingBalance: penaltyAmount, penaltyAmount, penaltyAppliedCount: 1 },
            $set: { lastPenaltyAppliedAt: new Date() },
          });

          const smsMessage = getSmsMessage({ 
            loanType, 
            amount: newTotalAmount, 
            dueDate: new Date(installment.dueDate), 
            daysLeft, 
            isPenaltyWarning: true, 
            penaltyAmount 
          });
          
          const smsResult = phone ? await sendSms({ to: phone, message: smsMessage }) : { success: false, message: "No phone" };

          await addPaymentNotification({
            installment, user, loan,
            title: "CRITICAL: Penalty Applied",
            message: `Your installment is 4 days overdue. A ${penaltyRatePercentage}% penalty of Rs. ${penaltyAmount.toLocaleString("en-LK")} has been added. New payable amount: Rs. ${newTotalAmount.toLocaleString("en-LK")}.`,
            priority: "high",
            currentUserId: currentUserId,
            smsSent: smsResult.success,
            smsResultMessage: smsResult.message,
          });

          return { installmentId: installment._id, action: "penalty_applied", smsSent: smsResult.success };
        }

        // Reminder Logic
        const shouldSendOneDayReminder = daysLeft === 1 && !installment.reminderSent;
        const shouldSendOverdueReminder = overdueDays > 0 && overdueDays < 4; 

        if (!shouldSendOneDayReminder && !shouldSendOverdueReminder) {
          return { action: "skipped" };
        }

        const smsMessage = getSmsMessage({ loanType, amount: installment.amount, dueDate: new Date(installment.dueDate), daysLeft });
        const smsResult = phone ? await sendSms({ to: phone, message: smsMessage }) : { success: false, message: "No phone" };

        const updateData: {
          reminderSent?: boolean;
          reminderSentAt?: Date;
          overdueReminderSentCount?: number;
          lastOverdueReminderSentAt?: Date;
        } = {};
        
        if (shouldSendOneDayReminder && smsResult.success) {
          updateData.reminderSent = true;
          updateData.reminderSentAt = new Date();
        }
        
        if (shouldSendOverdueReminder && smsResult.success) {
          updateData.overdueReminderSentCount = Number(installment.overdueReminderSentCount || 0) + 1;
          updateData.lastOverdueReminderSentAt = new Date();
        }

        if (Object.keys(updateData).length > 0) {
          await Installment.findByIdAndUpdate(installment._id, { $set: updateData });
        }

        return { installmentId: installment._id, action: daysLeft < 0 ? "overdue_reminder" : "one_day_reminder", smsSent: smsResult.success };
      })
    );

    return NextResponse.json({
      success: true,
      message: "Installment automation processed successfully.",
      appliedPenaltyRate: `${penaltyRatePercentage}%`,
      totalFound: installments.length,
      processed: results.length
    });
    
  } catch (error) {
    console.error("FINANCE_RUN_INSTALLMENT_REMINDERS_ERROR", error);
    return NextResponse.json({ success: false, message: "Failed to process automation" }, { status: 500 });
  }
}