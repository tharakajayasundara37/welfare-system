import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Installment from "@/models/Installment";
import Loan from "@/models/Loan";
import LoanSetting from "@/models/LoanSettings";

import {
  sendSms,
  buildPreDueDateSms,
  buildPenaltyWarningSms,
} from "@/lib/sms/sendSms";

// ================== HELPER FUNCTION ==================
function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function GET() {
  try {
    await dbConnect();

    // Get penalty rate from admin settings (default 2%)
    const settings = await LoanSetting.findOne({ isActive: true });
    const PENALTY_RATE_PERCENTAGE = settings?.latePaymentPenaltyRate || 2;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(tomorrow.getDate() + 1);

    // 4 days grace period
    const fourDaysAgo = new Date(today);
    fourDaysAgo.setDate(today.getDate() - 4);

    let remindersSent = 0;
    let penaltiesAppliedToday = 0;

    // STEP 1: Send reminder 1 day before due date
    const upcomingInstallments = await Installment.find({
      status: "pending",
      reminderSent: false,
      dueDate: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow,
      },
    }).populate("userId", "phone");

    for (const installment of upcomingInstallments) {
      const memberPhone =
        installment.userId && typeof installment.userId === "object"
          ? (installment.userId as { phone?: string }).phone
          : null;

      if (memberPhone) {
        const smsMessage = buildPreDueDateSms({
          amount: installment.amount,
          dueDate: installment.dueDate,
        });

        await sendSms({ to: memberPhone, message: smsMessage });

        installment.reminderSent = true;
        installment.reminderSentAt = new Date();
        await installment.save();

        remindersSent++;
      }
    }

    // STEP 2: Daily penalty after 4 days grace period (WITH PROPER ROUNDING)
    const overdueInstallments = await Installment.find({
      status: { $in: ["pending", "overdue"] },
      dueDate: { $lte: fourDaysAgo },
    }).populate("userId", "phone");

    for (const installment of overdueInstallments) {
      // ========== PROPER DAILY PENALTY CALCULATION ==========
      const dailyPenaltyAmount = roundToTwo(
        (installment.amount * PENALTY_RATE_PERCENTAGE) / 100
      );

      // Total penalty එකත් හරියටම update කරනවා
      installment.penaltyAmount = roundToTwo(
        (installment.penaltyAmount || 0) + dailyPenaltyAmount
      );

      installment.status = "overdue";
      installment.lastPenaltyAppliedAt = new Date();
      installment.penaltyRate = PENALTY_RATE_PERCENTAGE;

      await installment.save();

      // Loan එකටත් penalty එක add කරනවා
      await Loan.findByIdAndUpdate(installment.loanId, {
        $inc: {
          penaltyAmount: dailyPenaltyAmount,
          remainingBalance: dailyPenaltyAmount,
          penaltyAppliedCount: 1,
        },
        $set: {
          lastPenaltyAppliedAt: new Date(),
        },
      });

      // Send warning SMS
      const memberPhone =
        installment.userId && typeof installment.userId === "object"
          ? (installment.userId as { phone?: string }).phone
          : null;

      if (memberPhone) {
        const warningMessage = buildPenaltyWarningSms({
          penaltyRate: PENALTY_RATE_PERCENTAGE,
          penaltyAmount: dailyPenaltyAmount,
        });

        await sendSms({ to: memberPhone, message: warningMessage });
      }

      penaltiesAppliedToday++;
    }

    return NextResponse.json(
      {
        success: true,
        cron: true,
        message: "4-day grace period + Daily penalty system executed successfully (with proper rounding).",
        data: {
          appliedPenaltyRate: `${PENALTY_RATE_PERCENTAGE}%`,
          remindersSent,
          penaltiesAppliedToday,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CRON_PENALTIES_ERROR:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        cron: true,
        message: "Failed to process daily penalties and reminders.",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}