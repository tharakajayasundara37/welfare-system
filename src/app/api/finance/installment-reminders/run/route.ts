import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { processInstallmentReminders } from "@/lib/installments/processInstallmentReminders";

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

    const result = await processInstallmentReminders();

    return NextResponse.json(result);
  } catch (error) {
    console.error("MANUAL_INSTALLMENT_REMINDER_RUN_ERROR", error);

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