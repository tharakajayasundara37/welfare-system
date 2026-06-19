"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";

type AccountMenuUser = {
  fullName: string;
  email: string;
  role: string;
  accountStatus: string;
};

function formatRole(role?: string) {
  const normalized = String(role || "member")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (normalized === "admin") return "Admin";
  if (normalized === "welfare_officer") return "Welfare Officer";
  if (normalized === "finance_officer") return "Finance Officer";

  return "Member";
}

function getInitials(nameOrEmail: string) {
  const value = nameOrEmail.trim();

  if (!value) return "U";

  const namePart = value.includes("@") ? value.split("@")[0] : value;

  const parts = namePart
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]);

  if (parts.length === 0) return "U";

  return parts.join("").slice(0, 2).toUpperCase();
}

export default function AccountMenu({ user }: { user: AccountMenuUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = user.fullName || user.email || "User";
  const roleText = formatRole(user.role);
  const initials = getInitials(displayName);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("LOGOUT_ERROR", error);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-4 rounded-[24px] border border-[#d9c8b8] bg-[#fbf7ef]/90 px-4 py-3 text-[#2b241f] shadow-[0_18px_55px_rgba(44,36,31,0.14)] backdrop-blur-2xl transition hover:border-[#9b6f45]/40 hover:bg-[#fffaf3]"
      >
        <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-[#d8ad80]/45 bg-gradient-to-br from-[#d8ad80] to-[#9b6f45] text-sm font-extrabold text-white shadow-[0_14px_35px_rgba(155,111,69,0.28)]">
          {initials}
        </div>

        <div className="hidden min-w-[140px] text-left sm:block">
          <p className="max-w-[160px] truncate text-sm font-extrabold text-[#2b241f]">
            {displayName}
          </p>

          <p className="mt-1 text-xs font-bold text-[#9b6f45]">
            {roleText}
          </p>
        </div>

        <ChevronDown
          size={17}
          className={`text-[#9b6f45] transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-72 overflow-hidden rounded-[24px] border border-[#d9c8b8] bg-[#fbf7ef] text-[#2b241f] shadow-[0_25px_90px_rgba(44,36,31,0.22)]">
          <div className="border-b border-[#d9c8b8] bg-[#f8f1e8] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8ad80]/45 bg-gradient-to-br from-[#d8ad80] to-[#9b6f45] text-sm font-extrabold text-white">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-[#2b241f]">
                  {displayName}
                </p>

                <p className="truncate text-xs font-semibold text-[#6b5e54]">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="mt-3 inline-flex rounded-full border border-[#d8ad80]/35 bg-[#d8ad80]/15 px-3 py-1 text-xs font-bold text-[#9b6f45]">
              {roleText}
            </div>
          </div>

          <div className="p-2">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-[#2b241f] transition hover:bg-[#f1e5d8]"
            >
              <User size={17} className="text-[#9b6f45]" />
              Profile
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-[#2b241f] transition hover:bg-[#f1e5d8]"
            >
              <Settings size={17} className="text-[#9b6f45]" />
              Account Settings
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-red-700 transition hover:bg-red-500/10 disabled:opacity-60"
            >
              <LogOut size={17} />
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}