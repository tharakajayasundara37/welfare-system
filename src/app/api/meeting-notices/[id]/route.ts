import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import MeetingNotice from "@/models/MeetingNotice";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Meeting notice ID is required.",
        },
        { status: 400 }
      );
    }

    const notice = await MeetingNotice.findOne({
      _id: id,
      status: "active",
      isDeleted: { $ne: true },
    })
      .populate("createdBy", "fullName email role employeeId")
      .lean();

    if (!notice) {
      return NextResponse.json(
        {
          success: false,
          message: "Meeting notice not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        notice,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_MEETING_NOTICE_DETAIL_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load meeting notice details.",
      },
      { status: 500 }
    );
  }
}