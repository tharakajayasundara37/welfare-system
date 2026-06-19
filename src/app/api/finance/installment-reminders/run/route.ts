import { NextResponse } from "next/server";
import { Types } from "mongoose";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { buildInstallmentReminderSms, sendSms } from "@/lib/sms/sendSms";
import { createNotification } from "@/lib/notifications/createNotification";

import Installment from "@/models/Installment";

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
  userId: PopulatedUser;
  loanId: PopulatedLoan;
  installmentNumber: number;
  amount: number;
  dueDate: Date;
};

function getTomorrowRange() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
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

    const { start, end } = getTomorrowRange();

    const installments = await Installment.find({
      status: "pending",
      isDeleted: { $ne: true },
      reminderSent: false,
      dueDate: {
        $gte: start,
        $lte: end,
      },
    })
      .populate("userId", "fullName phone")
      .populate("loanId", "loanType")
      .lean<ReminderInstallment[]>();

    const results = await Promise.all(
      installments.map(async (installment) => {
        const user = installment.userId;
        const loan = installment.loanId;

        const loanType = loan?.loanType || "Loan";
        const phone = user?.phone || "";

        const smsMessage = buildInstallmentReminderSms({
          loanType,
          amount: installment.amount,
          dueDate: new Date(installment.dueDate),
        });

        const smsResult = await sendSms({
          to: phone,
          message: smsMessage,
        });

        await createNotification({
          userId: user._id,
          type: "payment",
          title: "Installment Reminder",
          message: `Your ${loanType} installment of Rs. ${Number(
            installment.amount
          ).toLocaleString()} is due tomorrow.`,
          priority: "high",
          link: "/dashboard/installments",
          metadata: {
            installmentId: installment._id.toString(),
            loanId: loan?._id?.toString(),
            dueDate: installment.dueDate,
            smsSent: smsResult.success,
            smsMessage: smsResult.message,
            triggeredBy: currentUser._id,
          },
        });

        await Installment.findByIdAndUpdate(installment._id, {
          $set: {
            reminderSent: smsResult.success,
            reminderSentAt: smsResult.success ? new Date() : null,
          },
        });

        return {
          installmentId: installment._id.toString(),
          userId: user._id.toString(),
          memberName: user.fullName || "",
          phone,
          smsSent: smsResult.success,
          message: smsResult.message,
        };
      })
    );

    return NextResponse.json({
      success: true,
      message: "Installment reminders processed.",
      totalFound: installments.length,
      sentCount: results.filter((item) => item.smsSent).length,
      failedCount: results.filter((item) => !item.smsSent).length,
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
            : "Failed to send installment reminders.",
      },
      { status: 500 }
    );
  }
}