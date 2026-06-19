"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  CalendarDays,
  Clock3,
  Loader2,
  MapPin,
  Megaphone,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type CreatedBy = {
  _id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  employeeId?: string;
};

type MeetingNotice = {
  _id: string;
  title: string;
  reason: string;
  description: string;
  venue: string;
  meetingDate: string;
  meetingTime: string;
  meetingAt: string;
  priority: string;
  targetAudience: string;
  createdBy?: CreatedBy;
  status: string;
};

type ActiveMeetingNoticesResponse = {
  success: boolean;
  message?: string;
  notices?: MeetingNotice[];
};

function formatDayName(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "MEETING";
  }

  return date
    .toLocaleDateString("en-US", {
      weekday: "long",
    })
    .toUpperCase();
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPriorityBadge(priority: string) {
  if (priority === "urgent") {
    return "Urgent Meeting";
  }

  if (priority === "important") {
    return "Important Meeting";
  }

  return "Meeting Notice";
}

function getPriorityClass(priority: string) {
  if (priority === "urgent") {
    return "border-red-500/20 bg-red-500/10 text-red-700";
  }

  if (priority === "important") {
    return "border-orange-500/20 bg-orange-500/10 text-orange-700";
  }

  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();
    console.error("NON_JSON_RESPONSE:", text.slice(0, 500));

    throw new Error(
      "API returned HTML instead of JSON. Check /api/meeting-notices/active route path."
    );
  }

  return response.json();
}

export default function MeetingNoticeCard() {
  const [notices, setNotices] = useState<MeetingNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadMeetingNotices() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/meeting-notices/active", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await readJsonResponse(
        response
      )) as ActiveMeetingNoticesResponse;

      if (!result.success) {
        setNotices([]);
        setMessage(result.message || "Failed to load meeting notices.");
        return;
      }

      setNotices(Array.isArray(result.notices) ? result.notices : []);
    } catch (error) {
      console.error("LOAD_ACTIVE_MEETING_NOTICES_ERROR", error);
      setNotices([]);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load meeting notices."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMeetingNotices();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-6 text-[#2b241f] shadow-[0_20px_70px_rgba(44,36,31,0.12)]">
        <div className="flex items-center justify-center py-8 text-sm font-bold text-[#6b5e54]">
          <Loader2 className="mr-2 animate-spin text-[#9b6f45]" size={18} />
          Loading meeting notices...
        </div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="rounded-[30px] border border-red-500/20 bg-red-500/10 p-5 text-sm font-bold text-red-700">
        {message}
      </div>
    );
  }

  if (notices.length === 0) {
    return null;
  }

  const notice = notices[0];

  return (
    <section className="relative overflow-hidden rounded-[34px] border border-[#d9c8b8] bg-[#fbf7ef]/95 shadow-[0_28px_90px_rgba(44,36,31,0.16)]">
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#d8ad80]/25 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-[#9b6f45]/15 blur-3xl" />

      <div className="relative grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-7 md:p-9">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-extrabold ${getPriorityClass(
                notice.priority
              )}`}
            >
              {getPriorityBadge(notice.priority)}
            </span>

            <span className="rounded-full border border-[#d9c8b8] bg-[#f8f1e8] px-3 py-1 text-xs font-bold text-[#9b6f45]">
              {notice.targetAudience.replaceAll("_", " ")}
            </span>
          </div>

          <div className="mt-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
              Company Notice
            </p>

            <h2 className="mt-3 text-5xl font-black uppercase tracking-tight text-[#2b241f] md:text-6xl">
              Staff
              <br />
              Meeting
            </h2>

            <div className="mt-5 inline-flex rounded-2xl bg-[#9b6f45] px-5 py-3 text-2xl font-black uppercase tracking-wide text-white shadow-lg shadow-[#9b6f45]/25">
              {formatDayName(notice.meetingAt)}
            </div>

            <p className="mt-5 text-2xl font-black uppercase tracking-wide text-[#9b6f45]">
              Time: {formatTime(notice.meetingAt)}
            </p>
          </div>
        </div>

        <div className="relative flex flex-col justify-center border-t border-[#d9c8b8] bg-[#f1e5d8]/70 p-7 md:p-9 lg:border-l lg:border-t-0">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2c241f] text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20">
            <Megaphone size={25} />
          </div>

          <h3 className="text-2xl font-extrabold text-[#2b241f]">
            {notice.title || "Staff Meeting"}
          </h3>

          <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#6b5e54]">
            {notice.reason}
          </p>

          <div className="mt-6 space-y-3 text-sm font-semibold text-[#6b5e54]">
            <div className="flex items-center gap-3">
              <CalendarDays size={17} className="text-[#9b6f45]" />
              {formatDate(notice.meetingAt)}
            </div>

            <div className="flex items-center gap-3">
              <Clock3 size={17} className="text-[#9b6f45]" />
              {formatTime(notice.meetingAt)}
            </div>

            <div className="flex items-center gap-3">
              <MapPin size={17} className="text-[#9b6f45]" />
              {notice.venue || "Main Hall"}
            </div>

            <div className="flex items-center gap-3">
              <Users size={17} className="text-[#9b6f45]" />
              {notice.targetAudience.replaceAll("_", " ")}
            </div>
          </div>

          <Link href={`/dashboard/meeting-notices/${notice._id}`}>
            <Button className="mt-7 h-12 w-full rounded-2xl bg-[#2c241f] font-extrabold text-white hover:bg-[#9b6f45]">
              View Full Details
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}