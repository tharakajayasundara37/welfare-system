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
  AlertCircle,
  ExternalLink,
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
  notifications?: Notification[];
  total?: number;
  unreadCount?: number;
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
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [error, setError] = useState("");
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);

  const limit = 20;
  const pageRef = useRef(1);

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
      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load notifications.");
      }

      return data;
    },
    [selectedType, showUnreadOnly]
  );

  // ================= LOAD =================

  const loadNotifications = useCallback(
    async (reset = true) => {
      setLoading(true);
      setError("");

      try {
        const currentPage = reset ? 1 : pageRef.current + 1;

        const data = await fetchNotifications(currentPage);
        const nextNotifications = data.notifications || [];

        if (reset) {
          setNotifications(nextNotifications);
          pageRef.current = 1;
        } else {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((item) => item._id));
            return [
              ...prev,
              ...nextNotifications.filter((item) => !existingIds.has(item._id)),
            ];
          });
          pageRef.current = currentPage;
        }

        setTotal(data.total || 0);
        setUnreadCount(data.unreadCount || 0);
      } catch (loadError) {
        console.error("LOAD_NOTIFICATIONS_ERROR", loadError);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load notifications."
        );
      } finally {
        setLoading(false);
      }
    },
    [fetchNotifications]
  );

  // ================= MARK AS READ =================

  const markAsRead = useCallback(
    async (ids?: string[]) => {
      const idsToUpdate = ids || [];
      setUpdatingIds(idsToUpdate.length ? idsToUpdate : ["all"]);
      setError("");

      try {
        const response = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notificationIds: ids,
            markAll: !ids?.length,
          }),
        });
        const data = (await response.json()) as ApiResponse;

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to update notification.");
        }

        setNotifications((prev) => {
          const updated = prev.map((notification) =>
            !ids || ids.includes(notification._id)
              ? { ...notification, isRead: true }
              : notification
          );

          return showUnreadOnly
            ? updated.filter((notification) => !notification.isRead)
            : updated;
        });
        setUnreadCount(data.unreadCount || 0);
        window.dispatchEvent(new Event("notifications-updated"));
      } catch (updateError) {
        console.error("MARK_NOTIFICATION_READ_ERROR", updateError);
        setError(
          updateError instanceof Error
            ? updateError.message
            : "Failed to update notification."
        );
      } finally {
        setUpdatingIds([]);
      }
    },
    [showUnreadOnly]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadNotifications(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadNotifications]);

  // ================= UI =================

  return (
    <div className="min-h-screen bg-[#eee6da] p-6 text-[#2b241f]">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => loadNotifications(true)}
            variant="outline"
            disabled={loading}
          >
            <RefreshCcw
              size={16}
              className={`mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {unreadCount > 0 && (
            <Button
              onClick={() => markAsRead()}
              disabled={updatingIds.length > 0}
            >
              <MailOpen size={16} className="mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          "all",
          "loan",
          "grant",
          "payment",
          "meeting",
          "offer",
          "document",
          "approval",
          "system",
        ].map((t) => (
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

        <label className="flex items-center gap-2 text-sm sm:ml-auto">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
          />
          Unread only
        </label>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* LIST */}
      {loading && notifications.length === 0 ? (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-3xl border border-[#d9c8b8] bg-white/65 p-10 text-center shadow-sm">
          <Bell className="mx-auto mb-3 text-[#9b6f45]" size={32} />
          <h2 className="font-bold">No notifications found</h2>
          <p className="mt-1 text-sm text-gray-600">
            Try another filter or refresh to check for new updates.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, index) => (
            <Card
              key={`${n._id}-${index}`}
              className={
                !n.isRead
                  ? "border-l-4 border-[#9b6f45] bg-white shadow-sm"
                  : "bg-white/70"
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{n.title}</h3>
                      <span className="rounded-full bg-[#eee6da] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7d5b3d]">
                        {n.type}
                      </span>
                      {n.priority !== "normal" && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                          {n.priority}
                        </span>
                      )}
                    </div>
                    <p className="break-words text-sm leading-6 text-gray-600">
                      {n.message}
                    </p>
                    <span className="mt-2 block text-xs text-gray-400">
                      {formatDate(n.createdAt)}
                    </span>
                    {n.link && n.link !== "/dashboard/notifications" && (
                      <Link
                        href={n.link}
                        onClick={() => {
                          if (!n.isRead) void markAsRead([n._id]);
                        }}
                        className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#8a5f38] hover:underline"
                      >
                        View details <ExternalLink size={14} />
                      </Link>
                    )}
                  </div>

                  {!n.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead([n._id])}
                      disabled={updatingIds.includes(n._id)}
                      aria-label={`Mark ${n.title} as read`}
                    >
                      {updatingIds.includes(n._id) ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
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
