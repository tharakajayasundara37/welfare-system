"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Loader2,
  MapPin,
  Megaphone,
  ShieldAlert,
  UserRound,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  status: string;
  createdBy?: CreatedBy;
  createdAt: string;
  updatedAt: string;
};

type MeetingNoticeResponse = {
  success: boolean;
  message?: string;
  notice?: MeetingNotice;
};

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleTimeString("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(value?: string) {
  if (!value) return "MEETING";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "MEETING";

  return date
    .toLocaleDateString("en-US", {
      weekday: "long",
    })
    .toUpperCase();
}

function getPriorityClass(priority?: string) {
  if (priority === "urgent") {
    return "border-red-500/20 bg-red-500/10 text-red-700";
  }

  if (priority === "important") {
    return "border-orange-500/20 bg-orange-500/10 text-orange-700";
  }

  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
}

function getPriorityLabel(priority?: string) {
  if (priority === "urgent") return "Urgent Meeting";
  if (priority === "important") return "Important Meeting";
  return "Meeting Notice";
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();
    console.error("NON_JSON_RESPONSE:", text.slice(0, 500));

    throw new Error(
      "API returned HTML instead of JSON. Check /api/meeting-notices/[id] route path."
    );
  }

  return response.json();
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#d9c8b8] bg-[#fffaf3] p-5 shadow-[0_14px_45px_rgba(44,36,31,0.08)]">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f1e5d8] text-[#8a5f3c]">
        <Icon size={21} />
      </div>

      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#9b6f45]">
        {label}
      </p>

      <p className="mt-2 text-base font-extrabold text-[#2b241f]">{value}</p>
    </div>
  );
}

export default function MeetingNoticeDetailPage() {
  const params = useParams<{ id?: string }>();

  const noticeId = useMemo(() => {
    return String(params.id || "").trim();
  }, [params.id]);

  const [notice, setNotice] = useState<MeetingNotice | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadNotice() {
    try {
      setLoading(true);
      setMessage("");

      if (!noticeId) {
        setNotice(null);
        setMessage("Meeting notice ID is missing.");
        return;
      }

      const response = await fetch(`/api/meeting-notices/${noticeId}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = (await readJsonResponse(
        response
      )) as MeetingNoticeResponse;

      if (!result.success || !result.notice) {
        setNotice(null);
        setMessage(result.message || "Failed to load meeting notice details.");
        return;
      }

      setNotice(result.notice);
    } catch (error) {
      console.error("LOAD_MEETING_NOTICE_DETAIL_ERROR", error);
      setNotice(null);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load meeting notice details."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNotice();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [noticeId]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#eee6da] text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading meeting details...
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="min-h-screen rounded-[34px] bg-[#eee6da] p-6 text-[#2b241f]">
        <div className="rounded-[28px] border border-red-500/25 bg-red-500/10 p-5 text-sm font-bold text-red-700">
          {message || "Meeting notice not found."}
        </div>

        <Link href="/dashboard">
          <Button className="mt-5 rounded-2xl bg-[#9b6f45] text-white hover:bg-[#835c38]">
            <ArrowLeft className="mr-2" size={17} />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard-no-scrollbar min-h-screen overflow-hidden rounded-[34px] bg-[#eee6da] text-[#2b241f]">
      <div className="relative min-h-screen space-y-7 overflow-hidden p-1">
        <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-[#c99b69]/25 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-[480px] w-[480px] rounded-full bg-[#2c241f]/10 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-[360px] w-[360px] rounded-full bg-[#d8ad80]/25 blur-[130px]" />

        <section className="relative overflow-hidden rounded-[34px] border border-[#d9c8b8] bg-[#fbf7ef]/95 shadow-[0_30px_100px_rgba(44,36,31,0.16)]">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#d8ad80]/25 blur-3xl" />

          <div className="relative grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-8 md:p-10">
              <Link
                href="/dashboard"
                className="mb-7 inline-flex items-center text-sm font-extrabold text-[#9b6f45] hover:text-[#835c38]"
              >
                <ArrowLeft className="mr-2" size={17} />
                Back to Dashboard
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-4 py-2 text-xs font-extrabold ${getPriorityClass(
                    notice.priority
                  )}`}
                >
                  {getPriorityLabel(notice.priority)}
                </span>

                <span className="rounded-full border border-[#d9c8b8] bg-[#f8f1e8] px-4 py-2 text-xs font-bold text-[#9b6f45]">
                  {notice.targetAudience.replaceAll("_", " ")}
                </span>
              </div>

              <div className="mt-10">
                <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
                  Company Notice
                </p>

                <h1 className="mt-4 text-5xl font-black uppercase tracking-tight text-[#2b241f] md:text-7xl">
                  Staff
                  <br />
                  Meeting
                </h1>

                <div className="mt-6 inline-flex rounded-2xl bg-[#9b6f45] px-5 py-3 text-2xl font-black uppercase tracking-wide text-white shadow-lg shadow-[#9b6f45]/25">
                  {formatDay(notice.meetingAt)}
                </div>

                <p className="mt-6 text-3xl font-black uppercase tracking-wide text-[#9b6f45]">
                  Time: {formatTime(notice.meetingAt)}
                </p>
              </div>
            </div>

            <div className="relative border-t border-[#d9c8b8] bg-[#f1e5d8]/70 p-8 md:p-10 lg:border-l lg:border-t-0">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#2c241f] text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20">
                <Megaphone size={30} />
              </div>

              <h2 className="text-3xl font-extrabold text-[#2b241f]">
                {notice.title || "Staff Meeting"}
              </h2>

              <p className="mt-4 text-base leading-8 text-[#6b5e54]">
                {notice.reason}
              </p>

              {notice.description ? (
                <div className="mt-6 rounded-[26px] border border-[#d9c8b8] bg-[#fffaf3] p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#9b6f45]">
                    Description
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#6b5e54]">
                    {notice.description}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem
            icon={CalendarDays}
            label="Meeting Date"
            value={formatDate(notice.meetingAt)}
          />

          <DetailItem
            icon={Clock3}
            label="Meeting Time"
            value={formatTime(notice.meetingAt)}
          />

          <DetailItem
            icon={MapPin}
            label="Venue"
            value={notice.venue || "Main Hall"}
          />

          <DetailItem
            icon={Users}
            label="Audience"
            value={notice.targetAudience.replaceAll("_", " ")}
          />
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <Card className="rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_24px_80px_rgba(44,36,31,0.12)]">
            <CardContent className="p-6">
              <UserRound className="text-[#8a5f3c]" size={28} />
              <h3 className="mt-5 text-xl font-extrabold">Created By</h3>
              <p className="mt-3 text-sm leading-7 text-[#6b5e54]">
                {notice.createdBy?.fullName || "System Admin"}
                <br />
                {notice.createdBy?.email || "-"}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border border-[#d9c8b8] bg-[#2c241f] text-white shadow-[0_24px_80px_rgba(44,36,31,0.18)]">
            <CardContent className="p-6">
              <ShieldAlert className="text-[#d8ad80]" size={28} />
              <h3 className="mt-5 text-xl font-extrabold">
                Important Notice
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#ead9c8]/80">
                Please attend the meeting on time. This notice will automatically
                disappear from your dashboard after the meeting date and time
                has passed.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}