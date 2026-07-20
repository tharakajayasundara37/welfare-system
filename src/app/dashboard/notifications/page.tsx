"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCircle2,
  Loader2,
  MailOpen,
  RefreshCcw,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ================= TYPES =================

type NotificationType =
  | "loan"
  | "grant"
  | "payment"
  | "meeting"
  | "system"
  | "offer"
  | "document"
  | "approval";

type NotificationPriority = "low" | "normal" | "high" | "urgent";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  priority: NotificationPriority;
  link?: string;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  notifications: Notification[];
  total: number;
  unreadCount: number;
  message?: string;
}

// ================= HELPERS =================

function formatDate(date: string) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "Unknown";
  }
}

// ================= PAGE =================

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const limit = 20;

  // prevent duplicate initial call
  const initialized = useRef(false);

  // ================= FETCH API =================

  const fetchNotifications = useCallback(
    async (pageNumber: number) => {
      const url = new URL("/api/notifications", window.location.origin);

      url.searchParams.set("page", String(pageNumber));
      url.searchParams.set("limit", String(limit));

      if (selectedType !== "all") {
        url.searchParams.set("type", selectedType);
      }

      if (showUnreadOnly) {
        url.searchParams.set("unreadOnly", "true");
      }

      const res = await fetch(url.toString(), { cache: "no-store" });
      return (await res.json()) as ApiResponse;
    },
    [selectedType, showUnreadOnly]
  );

  // ================= LOAD =================

  const loadNotifications = useCallback(
    async (reset = true) => {
      setLoading(true);

      try {
        const currentPage = reset ? 1 : page;

        const data = await fetchNotifications(currentPage);

        if (!data.success) return;

        if (reset) {
          setNotifications(data.notifications);
          setPage(1);
        } else {
          setNotifications((prev) => [...prev, ...data.notifications]);
          setPage((prev) => prev + 1);
        }

        setTotal(data.total);
        setUnreadCount(data.unreadCount);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [page, fetchNotifications]
  );

  // ================= MARK AS READ =================

  const markAsRead = useCallback(async (ids?: string[]) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notificationIds: ids,
        markAll: !ids?.length,
      }),
    });

    setNotifications((prev) =>
      prev.map((n) =>
        !ids || ids.includes(n._id) ? { ...n, isRead: true } : n
      )
    );

    setUnreadCount(0);
  }, []);

  // ================= INITIAL LOAD (FIXED) =================

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    loadNotifications(true);
  }, [loadNotifications]);

  // reload when filters change
  useEffect(() => {
    if (!initialized.current) return;
    loadNotifications(true);
  }, [selectedType, showUnreadOnly]);

  // ================= UI =================

  return (
    <div className="min-h-screen bg-[#eee6da] p-6 text-[#2b241f]">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <ArrowLeft />
          </Link>

          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Bell /> Notifications
          </h1>

          {unreadCount > 0 && (
            <span className="rounded-full bg-[#9b6f45] px-3 py-1 text-sm text-white">
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={() => loadNotifications(true)} variant="outline">
            <RefreshCcw size={16} className="mr-1" />
            Refresh
          </Button>

          {unreadCount > 0 && (
            <Button onClick={() => markAsRead()}>
              <MailOpen size={16} className="mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <div className="mb-4 flex gap-3">
        {["all", "loan", "payment", "grant", "system"].map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`rounded-full border px-4 py-1 text-sm ${
              selectedType === t ? "bg-black text-white" : ""
            }`}
          >
            {t}
          </button>
        ))}

        <label className="ml-auto flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
          />
          Unread only
        </label>
      </div>

      {/* LIST */}
      {loading && notifications.length === 0 ? (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, index) => (
            <Card
              key={`${n._id}-${index}`} // <--- මෙතන තමයි Fix එක කළේ!
              className={!n.isRead ? "border-l-4 border-blue-500" : ""}
            >
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold">{n.title}</h3>
                    <p className="text-sm text-gray-600">{n.message}</p>
                    <span className="text-xs text-gray-400">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>

                  {!n.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead([n._id])}
                    >
                      <CheckCircle2 size={16} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* LOAD MORE */}
      {notifications.length < total && (
        <div className="mt-4 flex justify-center">
          <Button onClick={() => loadNotifications(false)} disabled={loading}>
            {loading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}