import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import MeetingNotice from "@/models/MeetingNotice";

export async function GET() {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login first.",
        },
        { status: 401 }
      );
    }

    const now = new Date();

    const audienceFilter =
      currentUser.role === "member"
        ? {
            targetAudience: {
              $in: ["all_members", "active_members"],
            },
          }
        : currentUser.role === "welfare_officer"
          ? {
              targetAudience: {
                $in: ["all_members", "officers"],
              },
            }
          : currentUser.role === "finance_officer"
            ? {
                targetAudience: {
                  $in: ["all_members", "officers"],
                },
              }
            : {};

    const notices = await MeetingNotice.find({
      status: "active",
      isDeleted: { $ne: true },
      meetingAt: { $gte: now },
      ...audienceFilter,
    })
      .populate("createdBy", "fullName email role employeeId")
      .sort({ meetingAt: 1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        notices,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_ACTIVE_MEETING_NOTICES_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load active meeting notices.",
      },
      { status: 500 }
    );
  }
}