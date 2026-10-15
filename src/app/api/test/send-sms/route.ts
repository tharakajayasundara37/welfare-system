import { NextRequest, NextResponse } from "next/server";

import { sendSms } from "@/lib/sms/sendSms";
import { getCurrentUser } from "@/lib/getCurrentUser";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const to = typeof body.to === "string" ? body.to.trim() : "";
    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "WelfareX test SMS from meeting notice system.";

    if (!to) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone number is required.",
        },
        { status: 400 }
      );
    }

    const result = await sendSms({
      to,
      message,
    });

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        result,
      },
      {
        status: result.success ? 200 : 400,
      }
    );
  } catch (error) {
    console.error("TEST_SEND_SMS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to send test SMS.",
      },
      { status: 500 }
    );
  }
}
