import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import dbConnect from "@/lib/dbConnect";

import { getCurrentUser } from "@/lib/getCurrentUser";
import { createNotification } from "@/lib/notifications/createNotification";
import { buildMeetingReminderSms, sendSms } from "@/lib/sms/sendSms";

import MeetingNotice from "@/models/MeetingNotice";
import User from "@/models/User";

type NoticeUser = {
  _id: Types.ObjectId;
  fullName?: string;
  phone?: string;
};

function buildMeetingDateTime(meetingDate: string, meetingTime: string) {
  const date = String(meetingDate || "").trim();
  const time = String(meetingTime || "").trim();

  if (!date || !time) return null;

  const meetingAt = new Date(`${date}T${time}:00`);

  if (Number.isNaN(meetingAt.getTime())) return null;

  return meetingAt;
}

function buildUserQuery(targetAudience: string) {
  if (targetAudience === "active_members") {
    return {
      role: "member",
      accountStatus: "active",
      isDeleted: { $ne: true },
    };
  }

  if (targetAudience === "officers") {
    return {
      role: {
        $in: ["welfare_officer", "finance_officer"],
      },
      accountStatus: "active",
      isDeleted: { $ne: true },
    };
  }

  return {
    role: "member",
    isDeleted: { $ne: true },
  };
}

export async function GET() {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    const notices = await MeetingNotice.find({
      isDeleted: { $ne: true },
    })
      .populate("createdBy", "fullName email role employeeId")
      .sort({ meetingAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      notices,
    });
  } catch (error) {
    console.error("GET_ADMIN_MEETING_NOTICES_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load meeting notices.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : "Staff Meeting";

    const reason =
      typeof body.reason === "string" && body.reason.trim()
        ? body.reason.trim()
        : "";

    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    const venue =
      typeof body.venue === "string" && body.venue.trim()
        ? body.venue.trim()
        : "Main Hall";

    const meetingDate =
      typeof body.meetingDate === "string" ? body.meetingDate.trim() : "";

    const meetingTime =
      typeof body.meetingTime === "string" ? body.meetingTime.trim() : "";

    const priority =
      body.priority === "important" || body.priority === "urgent"
        ? body.priority
        : "normal";

    const targetAudience =
      body.targetAudience === "active_members" ||
      body.targetAudience === "officers"
        ? body.targetAudience
        : "all_members";

    const smsReminderEnabled = body.smsReminderEnabled === true;

    if (!reason) {
      return NextResponse.json(
        { success: false, message: "Meeting reason is required." },
        { status: 400 }
      );
    }

    const meetingAt = buildMeetingDateTime(meetingDate, meetingTime);

    if (!meetingAt) {
      return NextResponse.json(
        { success: false, message: "Valid meeting date and time are required." },
        { status: 400 }
      );
    }

    if (meetingAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { success: false, message: "Meeting date and time must be in the future." },
        { status: 400 }
      );
    }

    const notice = await MeetingNotice.create({
      title,
      reason,
      description,
      venue,
      meetingDate,
      meetingTime,
      meetingAt,
      priority,
      targetAudience,
      cardTheme: "welfare_brown",
      smsReminderEnabled,
      smsReminderSent: false,
      smsReminderSentAt: null,
      createdBy: currentUser._id,
      status: "active",
      isDeleted: false,
    });

    const users = await User.find(buildUserQuery(targetAudience))
      .select("_id fullName phone")
      .lean<NoticeUser[]>();

    await Promise.all(
      users.map((user) =>
        createNotification({
          userId: user._id,
          type: "meeting",
          title: "New Meeting Notice",
          message: `${title} - ${reason}`,
          priority: priority === "urgent" ? "urgent" : "normal",
          link: "/dashboard/notifications",
          metadata: {
            noticeId: notice._id.toString(),
            meetingAt,
            venue,
            targetAudience,
          },
        })
      )
    );

    let smsSentCount = 0;
    let smsFailedCount = 0;

    if (smsReminderEnabled) {
      const smsMessage = buildMeetingReminderSms({
        title,
        meetingAt,
        venue,
        reason,
      });

      const smsResults = await Promise.all(
        users.map(async (user) => {
          if (!user.phone) return false;

          const result = await sendSms({
            to: user.phone,
            message: smsMessage,
          });

          return result.success;
        })
      );

      smsSentCount = smsResults.filter(Boolean).length;
      smsFailedCount = smsResults.length - smsSentCount;

      if (smsSentCount > 0) {
        const sentAt = new Date();

        await MeetingNotice.findByIdAndUpdate(notice._id, {
          $set: {
            smsReminderSent: true,
            smsReminderSentAt: sentAt,
          },
        });

        notice.smsReminderSent = true;
        notice.smsReminderSentAt = sentAt;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: smsReminderEnabled
          ? `Meeting notice created. Notifications sent to ${users.length} users. SMS sent to ${smsSentCount} users.`
          : `Meeting notice created. Notifications sent to ${users.length} users.`,
        notice,
        notifiedUsers: users.length,
        smsSentCount,
        smsFailedCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE_MEETING_NOTICE_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create meeting notice.",
      },
      { status: 500 }
    );
  }
}