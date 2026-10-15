"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadUnreadCount() {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        const data = await res.json();

        if (data.success) {
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("LOAD_UNREAD_COUNT_ERROR", error);
      }
    }

    loadUnreadCount();

    const interval = setInterval(loadUnreadCount, 10000);

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void loadUnreadCount();
      }
    };

    window.addEventListener("focus", loadUnreadCount);
    window.addEventListener("notifications-updated", loadUnreadCount);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", loadUnreadCount);
      window.removeEventListener("notifications-updated", loadUnreadCount);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  return (
    <Link
      href="/dashboard/notifications"
      className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-white/70 text-[#9b6f45] shadow-sm transition hover:bg-white"
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : "Notifications"
      }
    >
      <Bell size={20} />

      {unreadCount > 0 && (
        <span
          aria-live="polite"
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
