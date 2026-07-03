import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import MonthlyPayment from "@/models/MonthlyPayment";
import User from "@/models/User";
import { sendSms } from "@/lib/sms/sendSms";

void User;

function normalizePhone(phone?: string) {
  const clean = String(phone || "").replace(/\D/g, "");

  if (clean.startsWith("94")) return clean;
  if (clean.startsWith("0")) return `94${clean.slice(1)}`;

  return clean;
}

function canSendReminder(lastReminderSentAt?: Date | string | null) {
  if (!lastReminderSentAt) return true;

  const last = new Date(lastReminderSentAt).getTime();
  const now = Date.now();

  return now - last >= 24 * 60 * 60 * 1000;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const secret = process.env.MEETING_REMINDER_SECRET;

    if (
      process.env.NODE_ENV === "production" &&
      secret &&
      authHeader !== `Bearer ${secret}`
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await dbConnect();

    const now = new Date();

    const payments = await MonthlyPayment.find({
      isDeleted: { $ne: true },
      status: { $in: ["pending", "overdue"] },
      dueDate: { $lt: now },
    })
      .populate("userId", "fullName phone")
      .limit(100)
      .lean();

    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const payment of payments) {
      if (!canSendReminder(payment.lastReminderSentAt)) {
        skippedCount += 1;
        continue;
      }

      const user = payment.userId as {
        _id?: string;
        fullName?: string;
        phone?: string;
      };

      const phone = normalizePhone(user?.phone);

      if (!phone) {
        failedCount += 1;
        continue;
      }

      const message = `Welfare System: Dear ${
        user.fullName || "Member"
      }, your monthly welfare fee is overdue. Please make the payment soon. Thank you.`;

      const smsResult = await sendSms({
        to: phone,
        message,
      });

      console.log("MONTHLY_FEE_SMS_RESULT", {
        phone,
        success: smsResult.success,
        message: smsResult.message,
      });

      if (smsResult.success) {
        sentCount += 1;

        await MonthlyPayment.findByIdAndUpdate(payment._id, {
          $set: {
            status: "overdue",
            overdueAt: payment.overdueAt || payment.dueDate || now,
            lastReminderSentAt: now,
          },
          $inc: {
            reminderCount: 1,
          },
        });
      } else {
        failedCount += 1;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Monthly fee reminders processed.",
      totalChecked: payments.length,
      sentCount,
      skippedCount,
      failedCount,
    });
  } catch (error) {
    console.error("MONTHLY_FEE_REMINDER_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to process monthly fee reminders.",
      },
      { status: 500 }
    );
  }
}