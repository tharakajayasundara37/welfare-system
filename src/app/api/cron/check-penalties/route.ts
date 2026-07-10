import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Installment from "@/models/Installment";
import Loan from "@/models/Loan";
import LoanSetting from "@/models/LoanSettings"; // Admin settings ganna aluth import eka

import {
  sendSms,
  buildPreDueDateSms,
  buildPenaltyWarningSms,
} from "@/lib/sms/sendSms";

export async function GET() {
  try {
    await dbConnect();

    // 1. Admin dapu settings database eken gannawa
    const settings = await LoanSetting.findOne({ isActive: true });
    
    // Database eke setting ekak thama hadala nathnam default 2% gannawa 
    const PENALTY_RATE_PERCENTAGE = settings?.latePaymentPenaltyRate || 2; 

    // Dawas wala time calculate kireema (Start of the day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(tomorrow.getDate() + 1);

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    let remindersSent = 0;
    let penaltiesApplied = 0;

    // =========================================================================
    // STEP 1: DAWASATA KALIN (TOMORROW) THIYENA INSTALLMENTS WALATA REMINDER EKA
    // =========================================================================
    const upcomingInstallments = await Installment.find({
      status: "pending",
      reminderSent: false,
      dueDate: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow, // Heta dawasa athulatha thiyena ewa
      },
    }).populate("userId", "phone");

    for (const inst of upcomingInstallments) {
      const memberPhone = inst.userId && typeof inst.userId === "object" 
        ? (inst.userId as { phone?: string }).phone 
        : null;

      if (memberPhone) {
        const smsMsg = buildPreDueDateSms({
          amount: inst.amount,
          dueDate: inst.dueDate,
        });

        await sendSms({ to: memberPhone, message: smsMsg });

        // Database eke reminderSent true karanawa
        inst.reminderSent = true;
        inst.reminderSentAt = new Date();
        await inst.save();

        remindersSent++;
      }
    }

    // =========================================================================
    // STEP 2: DAWAS 3K PARAKKU (3 DAYS OVERDUE) EWATA ADMIN GE PENALTY EKA SAHA SMS EKA
    // =========================================================================
    const overdueInstallments = await Installment.find({
      status: { $in: ["pending", "overdue"] },
      penaltyApplied: false,
      dueDate: {
        $lte: threeDaysAgo, // Dawas 3kata kalin hari eeta kalin hari due wechcha ewa
      },
    }).populate("userId", "phone");

    for (const inst of overdueInstallments) {
      // Admin ge dynamic penalty amount eka hadanawa
      const penaltyAmount = (inst.amount * PENALTY_RATE_PERCENTAGE) / 100;

      // 1. Installment eka update karanawa
      inst.status = "overdue";
      inst.penaltyApplied = true;
      inst.penaltyAppliedAt = new Date();
      inst.penaltyAmount = penaltyAmount;
      inst.penaltyRate = PENALTY_RATE_PERCENTAGE; // Ewele database eke thibba rate eka save karanawa
      await inst.save();

      // 2. Main Loan eka update karanawa
      await Loan.findByIdAndUpdate(inst.loanId, {
        $inc: {
          penaltyAmount: penaltyAmount,
          remainingBalance: penaltyAmount, 
          penaltyAppliedCount: 1,
        },
        $set: {
          lastPenaltyAppliedAt: new Date(),
        },
      });

      // 3. Penalty SMS eka yawanawa
      const memberPhone = inst.userId && typeof inst.userId === "object"
        ? (inst.userId as { phone?: string }).phone
        : null;

      if (memberPhone) {
        const warningMsg = buildPenaltyWarningSms({
          penaltyRate: PENALTY_RATE_PERCENTAGE,
          penaltyAmount: penaltyAmount,
        });

        await sendSms({ to: memberPhone, message: warningMsg });
      }

      penaltiesApplied++;
    }

    return NextResponse.json(
      {
        success: true,
        cron: true,
        message: "Penalties and Reminders processed using dynamic Admin settings.",
        data: {
          appliedPenaltyRate: `${PENALTY_RATE_PERCENTAGE}%`,
          remindersSent,
          penaltiesApplied,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CRON_PENALTIES_ERROR", error);
    return NextResponse.json(
      {
        success: false,
        cron: true,
        message: "Failed to process penalties.",
      },
      { status: 500 }
    );
  }
}