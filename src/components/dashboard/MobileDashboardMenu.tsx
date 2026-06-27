"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  Bell,
  ClipboardCheck,
  CreditCard,
  FileText,
  HandHeart,
  Landmark,
  LayoutDashboard,
  Megaphone,
  Menu,
  ReceiptText,
  Settings,
  UploadCloud,
  UserCog,
  Users,
  WalletCards,
  X,
} from "lucide-react";

type MobileIconKey =
  | "dashboard"
  | "users"
  | "staff"
  | "loan"
  | "settings"
  | "reports"
  | "announcement"
  | "grant"
  | "document"
  | "payment"
  | "installment"
  | "notification"
  | "review"
  | "disbursement"
  | "history";

interface MobileMenuItem {
  title: string;
  href: string;
  iconKey: MobileIconKey;
  iconColor: string;
  iconBg: string;
  hoverBg: string;
}

const iconMap = {
  dashboard: LayoutDashboard,
  users: Users,
  staff: UserCog,
  loan: Landmark,
  settings: Settings,
  reports: BarChart3,
  announcement: Megaphone,
  grant: HandHeart,
  document: UploadCloud,
  payment: CreditCard,
  installment: CreditCard,
  notification: Bell,
  review: ClipboardCheck,
  disbursement: WalletCards,
  history: ReceiptText,
};

export default function MobileDashboardMenu({
  menuItems,
  roleHeaderLabel,
  dashboardTitle,
  controlTitle,
  controlDescription,
  userName,
  userRole,
}: {
  menuItems: MobileMenuItem[];
  roleHeaderLabel: string;
  dashboardTitle: string;
  controlTitle: string;
  controlDescription: string;
  userName: string;
  userRole: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#fbf7ef] text-[#9b6f45] shadow-sm lg:hidden"
        aria-label="Open dashboard menu"
        title="Open dashboard menu"
      >
        <Menu size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            aria-label="Close dashboard menu overlay"
            title="Close dashboard menu overlay"
          />

          <aside className="dashboard-no-scrollbar relative z-10 h-full w-[86%] max-w-[340px] overflow-y-auto overflow-x-hidden border-r border-[#d8ad80]/18 bg-[#211b17] p-5 text-white shadow-[25px_0_100px_rgba(0,0,0,0.55)]">
            <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#c99b69]/25 blur-[100px]" />
            <div className="pointer-events-none absolute -right-28 top-40 h-80 w-80 rounded-full bg-[#d8ad80]/14 blur-[120px]" />

            <div className="relative z-10">
              <div className="mb-7 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8ad80]/25 bg-gradient-to-br from-[#d8ad80]/20 to-[#9b6f45]/18">
                    <HandHeart size={24} className="text-[#d8ad80]" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold text-white">
                      Welfare
                    </h2>

                    <p className="text-sm font-medium text-[#ead9c8]/70">
                      {dashboardTitle}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 text-[#ead9c8]"
                  aria-label="Close dashboard menu"
                  title="Close dashboard menu"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-7 rounded-[26px] border border-[#d8ad80]/25 bg-[#fbf7ef]/10 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#d8ad80]">
                  {roleHeaderLabel}
                </p>

                <h3 className="mt-2 text-lg font-bold text-white">
                  {controlTitle}
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#ead9c8]/65">
                  {controlDescription}
                </p>

                <div className="mt-4 rounded-2xl border border-[#d8ad80]/18 bg-[#2c241f]/55 p-3">
                  <p className="text-xs font-semibold text-[#ead9c8]/60">
                    Logged in as
                  </p>

                  <p className="mt-1 truncate text-sm font-bold text-white">
                    {userName}
                  </p>

                  <p className="mt-1 text-xs capitalize text-[#d8ad80]">
                    {userRole}
                  </p>
                </div>
              </div>

              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = iconMap[item.iconKey] || FileText;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`group flex items-center gap-4 rounded-[20px] border border-transparent px-4 py-3 text-base font-semibold text-[#ead9c8]/82 transition hover:border-[#d8ad80]/22 hover:text-white hover:shadow-[0_15px_45px_rgba(216,173,128,0.14)] ${item.hoverBg}`}
                    >
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d8ad80]/18 ${item.iconBg} ${item.iconColor} shadow-sm backdrop-blur-xl transition group-hover:border-[#d8ad80]/25 group-hover:bg-[#fbf7ef]/12 group-hover:text-white`}
                      >
                        <Icon size={18} />
                      </span>

                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
