import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import MeetingNotice from "@/models/MeetingNotice";
import User from "@/models/User";

import { buildMeetingReminderSms, sendSms } from "@/lib/sms/sendSms";

type LeanMeetingNotice = {
  _id: {
    toString: () => string;
  };
  title?: string;
  reason?: string;
  venue?: string;
  meetingAt?: Date;
  targetAudience?: string;
};

type LeanUser = {
  _id: {
    toString: () => string;
  };
  fullName?: string;
  phone?: string;
  role?: string;
  accountStatus?: string;
};

function getTomorrowRange() {
  const now = new Date();

  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function buildUserQuery(targetAudience?: string) {
  if (targetAudience === "officers") {
    return {
      role: {
        $in: ["welfare_officer", "finance_officer"],
      },
      isDeleted: { $ne: true },
    };
  }

  if (targetAudience === "active_members") {
    return {
      role: "member",
      accountStatus: "active",
      isDeleted: { $ne: true },
    };
  }

  return {
    role: "member",
    isDeleted: { $ne: true },
  };
}

function normalizeSriLankanPhoneForDuplicateCheck(phone: string) {
  let value = String(phone || "").trim();

  value = value.replaceAll(" ", "");
  value = value.replaceAll("-", "");
  value = value.replaceAll("(", "");
  value = value.replaceAll(")", "");

  if (value.startsWith("+")) {
    value = value.slice(1);
  }

  if (value.startsWith("0") && value.length === 10) {
    value = `94${value.slice(1)}`;
  }

  if (value.startsWith("7") && value.length === 9) {
    value = `94${value}`;
  }

  return value;
}

function isValidSriLankanMobile(phone: string) {
  return /^947\d{8}$/.test(phone);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== process.env.MEETING_REMINDER_SECRET) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid reminder secret.",
        },
        { status: 401 }
      );
    }

    await dbConnect();

    const { start, end } = getTomorrowRange();

    const meetings = await MeetingNotice.find({
      status: "active",
      isDeleted: { $ne: true },
      smsReminderEnabled: true,
      smsReminderSent: false,
      meetingAt: {
        $gte: start,
        $lte: end,
      },
    }).lean<LeanMeetingNotice[]>();

    if (meetings.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "No meeting reminders to send.",
          meetingsChecked: 0,
          smsSent: 0,
          failed: 0,
          skippedDuplicates: 0,
          invalidNumbers: 0,
          range: {
            start,
            end,
          },
        },
        { status: 200 }
      );
    }

    let totalSmsSent = 0;
    let totalFailed = 0;
    let totalSkippedDuplicates = 0;
    let totalInvalidNumbers = 0;

    const meetingResults = [];

    for (const meeting of meetings) {
      const meetingAt = meeting.meetingAt ? new Date(meeting.meetingAt) : null;

      if (!meetingAt || Number.isNaN(meetingAt.getTime())) {
        totalFailed += 1;

        meetingResults.push({
          meetingId: meeting._id.toString(),
          success: false,
          message: "Invalid meeting date.",
        });

        continue;
      }

      const users = await User.find(buildUserQuery(meeting.targetAudience))
        .select("fullName phone role accountStatus")
        .lean<LeanUser[]>();

      const smsMessage = buildMeetingReminderSms({
        title: meeting.title || "Staff Meeting",
        meetingAt,
        venue: meeting.venue || "Main Hall",
        reason: meeting.reason || "Meeting notice",
      });

      let sentForMeeting = 0;
      let failedForMeeting = 0;
      let skippedDuplicatesForMeeting = 0;
      let invalidNumbersForMeeting = 0;

      const recipients = [];
      const sentPhoneSet = new Set<string>();

      for (const user of users) {
        const rawPhone = String(user.phone || "").trim();

        if (!rawPhone) {
          failedForMeeting += 1;
          totalFailed += 1;

          recipients.push({
            userId: user._id.toString(),
            name: user.fullName || "",
            phone: "",
            normalizedTo: "",
            success: false,
            skipped: false,
            message: "User phone number missing.",
          });

          continue;
        }

        const normalizedPhone = normalizeSriLankanPhoneForDuplicateCheck(rawPhone);

        if (!isValidSriLankanMobile(normalizedPhone)) {
          failedForMeeting += 1;
          totalFailed += 1;
          invalidNumbersForMeeting += 1;
          totalInvalidNumbers += 1;

          recipients.push({
            userId: user._id.toString(),
            name: user.fullName || "",
            phone: rawPhone,
            normalizedTo: normalizedPhone,
            success: false,
            skipped: false,
            message: "Invalid Sri Lankan mobile number.",
          });

          continue;
        }

        if (sentPhoneSet.has(normalizedPhone)) {
          skippedDuplicatesForMeeting += 1;
          totalSkippedDuplicates += 1;

          recipients.push({
            userId: user._id.toString(),
            name: user.fullName || "",
            phone: rawPhone,
            normalizedTo: normalizedPhone,
            success: true,
            skipped: true,
            message:
              "Skipped duplicate phone number. SMS already sent to this number.",
          });

          continue;
        }

        sentPhoneSet.add(normalizedPhone);

        const result = await sendSms({
          to: rawPhone,
          message: smsMessage,
        });

        if (result.success) {
          sentForMeeting += 1;
          totalSmsSent += 1;
        } else {
          failedForMeeting += 1;
          totalFailed += 1;
        }

        recipients.push({
          userId: user._id.toString(),
          name: user.fullName || "",
          phone: rawPhone,
          normalizedTo: result.normalizedTo || normalizedPhone,
          success: result.success,
          skipped: false,
          message: result.message,
        });
      }

      if (sentForMeeting > 0) {
        await MeetingNotice.findByIdAndUpdate(meeting._id, {
          $set: {
            smsReminderSent: true,
            smsReminderSentAt: new Date(),
          },
        });
      }

      meetingResults.push({
        meetingId: meeting._id.toString(),
        title: meeting.title || "Staff Meeting",
        meetingAt,
        targetAudience: meeting.targetAudience || "all_members",
        usersFound: users.length,
        uniquePhonesProcessed: sentPhoneSet.size,
        sent: sentForMeeting,
        failed: failedForMeeting,
        skippedDuplicates: skippedDuplicatesForMeeting,
        invalidNumbers: invalidNumbersForMeeting,
        recipients,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Meeting reminder job completed.",
        meetingsChecked: meetings.length,
        smsSent: totalSmsSent,
        failed: totalFailed,
        skippedDuplicates: totalSkippedDuplicates,
        invalidNumbers: totalInvalidNumbers,
        results: meetingResults,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("MEETING_REMINDER_CRON_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to run meeting reminder job.",
      },
      { status: 500 }
    );
  }
}