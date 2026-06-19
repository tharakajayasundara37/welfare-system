"use client";

import { useEffect, useState } from "react";

import {
  BellRing,
  CalendarDays,
  Loader2,
  MapPin,
  Megaphone,
  PlusCircle,
  RefreshCcw,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
  smsReminderEnabled: boolean;
  smsReminderSent: boolean;
  smsReminderSentAt: string | null;
  status: string;
  createdAt: string;
};

type MeetingNoticeResponse = {
  success: boolean;
  message?: string;
  notices?: MeetingNotice[];
  notice?: MeetingNotice;
  smsSent?: number;
  failed?: number;
  skippedDuplicates?: number;
  invalidNumbers?: number;
};

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
      "API returned HTML instead of JSON. Check API route path."
    );
  }

  return response.json();
}

export default function AdminMeetingNoticesPage() {
  const [notices, setNotices] = useState<MeetingNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [runningReminder, setRunningReminder] = useState(false);

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [title, setTitle] = useState("Staff Meeting");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("Main Hall");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [priority, setPriority] = useState("important");
  const [targetAudience, setTargetAudience] = useState("all_members");
  const [smsReminderEnabled, setSmsReminderEnabled] = useState(true);

  async function loadNotices(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setMessage("");
      setIsSuccess(false);

      const response = await fetch("/api/admin/meeting-notices", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await readJsonResponse(
        response
      )) as MeetingNoticeResponse;

      if (!result.success) {
        setNotices([]);
        setMessage(result.message || "Failed to load meeting notices.");
        setIsSuccess(false);
        return;
      }

      setNotices(Array.isArray(result.notices) ? result.notices : []);
    } catch (error) {
      console.error("LOAD_MEETING_NOTICES_ERROR", error);

      setNotices([]);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load meeting notices."
      );
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNotices(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function handleCreateNotice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setCreating(true);
      setMessage("");
      setIsSuccess(false);

      const response = await fetch("/api/admin/meeting-notices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          reason,
          description,
          venue,
          meetingDate,
          meetingTime,
          priority,
          targetAudience,
          smsReminderEnabled,
        }),
      });

      const result = (await readJsonResponse(
        response
      )) as MeetingNoticeResponse;

      if (!result.success) {
        setMessage(result.message || "Failed to create meeting notice.");
        setIsSuccess(false);
        return;
      }

      setMessage(result.message || "Meeting notice created successfully.");
      setIsSuccess(true);

      setTitle("Staff Meeting");
      setReason("");
      setDescription("");
      setVenue("Main Hall");
      setMeetingDate("");
      setMeetingTime("");
      setPriority("important");
      setTargetAudience("all_members");
      setSmsReminderEnabled(true);

      await loadNotices(false);
    } catch (error) {
      console.error("CREATE_MEETING_NOTICE_ERROR", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to create meeting notice."
      );
      setIsSuccess(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleRunSmsReminderNow() {
    try {
      const confirmed = window.confirm(
        "Run meeting SMS reminder job now? This will send SMS for tomorrow's meetings."
      );

      if (!confirmed) return;

      setRunningReminder(true);
      setMessage("");
      setIsSuccess(false);

      const response = await fetch(
        "/api/cron/meeting-reminders?secret=welfarex_meeting_secret_123",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = (await readJsonResponse(
        response
      )) as MeetingNoticeResponse;

      if (!result.success) {
        setMessage(result.message || "Failed to run SMS reminder job.");
        setIsSuccess(false);
        return;
      }

      setMessage(
        `${result.message || "SMS reminder job completed."} Sent: ${
          result.smsSent ?? 0
        }, Failed: ${result.failed ?? 0}, Duplicates skipped: ${
          result.skippedDuplicates ?? 0
        }, Invalid numbers: ${result.invalidNumbers ?? 0}`
      );

      setIsSuccess(true);

      await loadNotices(false);
    } catch (error) {
      console.error("RUN_SMS_REMINDER_NOW_ERROR", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to run SMS reminder job."
      );
      setIsSuccess(false);
    } finally {
      setRunningReminder(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#eee6da] text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading meeting notices...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen space-y-7 overflow-hidden rounded-[34px] bg-[#eee6da] p-1 text-[#2b241f]">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-[#c99b69]/25 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-20 h-[480px] w-[480px] rounded-full bg-[#2c241f]/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[360px] w-[360px] rounded-full bg-[#d8ad80]/25 blur-[130px]" />

      <section className="relative overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d8ad80]/25 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
              Admin Meetings
            </p>

            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
              Meeting Notices
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
              Create staff or member meeting notices and run SMS reminders for
              tomorrow meetings.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => void handleRunSmsReminderNow()}
              disabled={runningReminder}
              className="rounded-2xl bg-emerald-700 px-5 text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningReminder ? (
                <Loader2 className="mr-2 animate-spin" size={17} />
              ) : (
                <BellRing className="mr-2" size={17} />
              )}
              Run SMS Reminder Now
            </Button>

            <Button
              type="button"
              onClick={() => void loadNotices(true)}
              className="rounded-2xl bg-[#2c241f] px-5 text-[#fbf7ef] hover:bg-[#9b6f45]"
            >
              <RefreshCcw className="mr-2" size={17} />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      {message && (
        <div
          className={`relative rounded-2xl border p-4 text-sm font-semibold ${
            isSuccess
              ? "border-emerald-600/25 bg-emerald-100 text-emerald-700"
              : "border-red-500/20 bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <section className="relative grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c]">
                <PlusCircle size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold">Create Notice</h2>
                <p className="text-sm text-[#6b5e54]">
                  Add meeting date, time, reason and SMS reminder.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-[#2b241f]">
                  Meeting Title
                </label>

                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]"
                  placeholder="Staff Meeting"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#2b241f]">
                  Meeting Reason
                </label>

                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="mt-2 min-h-[110px] w-full rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8] p-4 text-sm outline-none focus:border-[#9b6f45] focus:ring-2 focus:ring-[#9b6f45]/20"
                  placeholder="Type meeting reason..."
                  required
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#2b241f]">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-2 min-h-[90px] w-full rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8] p-4 text-sm outline-none focus:border-[#9b6f45] focus:ring-2 focus:ring-[#9b6f45]/20"
                  placeholder="Additional meeting details..."
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#2b241f]">
                  Venue
                </label>

                <Input
                  value={venue}
                  onChange={(event) => setVenue(event.target.value)}
                  className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]"
                  placeholder="Main Hall"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-[#2b241f]">
                    Meeting Date
                  </label>

                  <Input
                    type="date"
                    value={meetingDate}
                    onChange={(event) => setMeetingDate(event.target.value)}
                    className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-[#2b241f]">
                    Meeting Time
                  </label>

                  <Input
                    type="time"
                    value={meetingTime}
                    onChange={(event) => setMeetingTime(event.target.value)}
                    className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-[#2b241f]">
                    Priority
                  </label>

                  <select
                    title="Select meeting priority"
                    aria-label="Select meeting priority"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8] px-4 text-sm font-bold outline-none focus:border-[#9b6f45]"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-[#2b241f]">
                    Target Audience
                  </label>

                  <select
                    title="Select target audience"
                    aria-label="Select target audience"
                    value={targetAudience}
                    onChange={(event) =>
                      setTargetAudience(event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8] px-4 text-sm font-bold outline-none focus:border-[#9b6f45]"
                  >
                    <option value="all_members">All Members</option>
                    <option value="active_members">Active Members</option>
                    <option value="officers">Officers</option>
                  </select>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8] p-4">
                <input
                  type="checkbox"
                  checked={smsReminderEnabled}
                  onChange={(event) =>
                    setSmsReminderEnabled(event.target.checked)
                  }
                  className="mt-1 h-4 w-4 accent-[#9b6f45]"
                />

                <span>
                  <span className="block text-sm font-extrabold text-[#2b241f]">
                    Send SMS reminder one day before meeting
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-[#6b5e54]">
                    System will automatically send meeting reminder SMS to the
                    selected audience one day before the meeting date.
                  </span>
                </span>
              </label>

              <Button
                type="submit"
                disabled={creating}
                className="h-12 w-full rounded-2xl bg-[#9b6f45] font-extrabold text-white hover:bg-[#835c38]"
              >
                {creating ? (
                  <Loader2 className="mr-2 animate-spin" size={18} />
                ) : (
                  <Megaphone className="mr-2" size={18} />
                )}
                Create Meeting Notice
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c]">
                <Megaphone size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold">Created Notices</h2>
                <p className="text-sm text-[#6b5e54]">
                  Latest meeting notices created by admin.
                </p>
              </div>
            </div>

            {notices.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#d9c8b8] bg-[#f8f1e8] p-10 text-center text-sm font-bold text-[#6b5e54]">
                No meeting notices created yet.
              </div>
            ) : (
              <div className="space-y-4">
                {notices.map((notice) => (
                  <div
                    key={notice._id}
                    className="rounded-[28px] border border-[#d9c8b8] bg-[#fffaf3] p-5 shadow-[0_16px_50px_rgba(44,36,31,0.08)]"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <p className="text-xl font-extrabold text-[#2b241f]">
                          {notice.title}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-[#6b5e54]">
                          {notice.reason}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full border px-3 py-1 text-xs font-extrabold ${getPriorityClass(
                          notice.priority
                        )}`}
                      >
                        {notice.priority.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 text-sm text-[#6b5e54] md:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-[#9b6f45]" />
                        {formatDateTime(notice.meetingAt)}
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-[#9b6f45]" />
                        {notice.venue}
                      </div>

                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-[#9b6f45]" />
                        {notice.targetAudience.replaceAll("_", " ")}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${
                          notice.smsReminderEnabled
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                            : "border-[#d9c8b8] bg-[#f8f1e8] text-[#6b5e54]"
                        }`}
                      >
                        <BellRing size={13} className="mr-1" />
                        SMS Reminder{" "}
                        {notice.smsReminderEnabled ? "Enabled" : "Disabled"}
                      </span>

                      {notice.smsReminderSent ? (
                        <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700">
                          SMS Sent: {formatDateOnly(notice.smsReminderSentAt)}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-700">
                          SMS Not Sent
                        </span>
                      )}

                      <span className="inline-flex rounded-full border border-[#d9c8b8] bg-[#f8f1e8] px-3 py-1 text-xs font-bold text-[#6b5e54]">
                        Status: {notice.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}