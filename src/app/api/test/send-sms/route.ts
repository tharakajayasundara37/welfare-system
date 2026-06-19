import { NextRequest, NextResponse } from "next/server";

import { sendSms } from "@/lib/sms/sendSms";

export async function POST(request: NextRequest) {
  try {
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