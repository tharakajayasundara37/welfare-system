import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { processInstallmentReminders } from "@/lib/installments/processInstallmentReminders";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized request" },
        { status: 401 }
      );
    }

    await dbConnect();

    const result = await processInstallmentReminders();

    return NextResponse.json({
      ...result,
      cron: true,
    });
  } catch (error) {
    console.error("CRON_INSTALLMENT_REMINDERS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        cron: true,
        message:
          error instanceof Error
            ? error.message
            : "Cron installment reminders failed.",
      },
      { status: 500 }
    );
  }
}