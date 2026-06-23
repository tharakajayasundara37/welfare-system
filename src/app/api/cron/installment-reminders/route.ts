import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { processInstallmentReminders } from "@/lib/installments/processInstallmentReminders";

export async function GET() {
  try {
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