import Link from "next/link";
import { Roboto } from "next/font/google";
import MobileDashboardMenu from "@/components/dashboard/MobileDashboardMenu";

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
  ReceiptText,
  Settings,
  UploadCloud,
  UserCog,
  Users,
  WalletCards,
} from "lucide-react";

import { getCurrentUser } from "@/lib/getCurrentUser";
import AccountMenu from "@/components/dashboard/AccountMenu";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { DashboardThemeProvider } from "@/components/theme/DashboardThemeProvider";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

type UserRole = "admin" | "member" | "welfare_officer" | "finance_officer";

type CurrentUserExtra = {
  profileImage?: string;
  themeMode?: "light" | "dark";
  themeColor?: string;
};

interface MenuItem {
  title: string;
  href: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  hoverBg: string;
}

const adminMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Members",
    href: "/dashboard/admin/users",
    icon: Users,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Staff Management",
    href: "/dashboard/admin/staff",
    icon: UserCog,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Loan Approvals",
    href: "/dashboard/admin/loan-approvals",
    icon: Landmark,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Loan Settings",
    href: "/dashboard/admin/loan-settings",
    icon: Settings,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Reports",
    href: "/dashboard/admin/reports",
    icon: BarChart3,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Announcements",
    href: "/dashboard/admin/meeting-notices",
    icon: Megaphone,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
];

const memberMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Apply Loan",
    href: "/dashboard/loans/apply",
    icon: Landmark,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Apply Grant",
    href: "/dashboard/grants/apply",
    icon: HandHeart,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Loan Offers",
    href: "/dashboard/loans/offers",
    icon: FileText,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "My Loans",
    href: "/dashboard/loans",
    icon: WalletCards,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Documents",
    href: "/dashboard/documents",
    icon: UploadCloud,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Installments",
    href: "/dashboard/installments",
    icon: CreditCard,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
];

const officerMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard/officer",
    icon: LayoutDashboard,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Loan Reviews",
    href: "/dashboard/officer/loans",
    icon: ClipboardCheck,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Document Checks",
    href: "/dashboard/officer/documents",
    icon: FileText,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
];

const financeMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard/finance",
    icon: LayoutDashboard,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Finance Loans",
    href: "/dashboard/finance/loans",
    icon: Landmark,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Disbursements",
    href: "/dashboard/finance/disbursements",
    icon: WalletCards,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Installments",
    href: "/dashboard/finance/installments",
    icon: CreditCard,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "Payment History",
    href: "/dashboard/finance/installment-history",
    icon: ReceiptText,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
  {
    title: "SMS Reminders",
    href: "/dashboard/finance/installment-reminders",
    icon: Bell,
    iconColor: "text-[#d8ad80]",
    iconBg: "bg-[#d8ad80]/15",
    hoverBg: "hover:bg-[#d8ad80]/15",
  },
];

function normalizeRole(role?: string): UserRole {
  const normalizedRole = String(role || "member")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_")
    .replaceAll("-", "_");

  if (normalizedRole === "admin") return "admin";
  if (normalizedRole === "welfare_officer") return "welfare_officer";
  if (normalizedRole === "finance_officer") return "finance_officer";

  return "member";
}

function getMenuByRole(role?: string) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "admin") return adminMenuItems;
  if (normalizedRole === "welfare_officer") return officerMenuItems;
  if (normalizedRole === "finance_officer") return financeMenuItems;

  return memberMenuItems;
}

function getDashboardTitle(role?: string) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "admin") return "Admin Dashboard";
  if (normalizedRole === "welfare_officer") return "Officer Dashboard";
  if (normalizedRole === "finance_officer") return "Finance Dashboard";

  return "Member Dashboard";
}

function getRoleHeaderLabel(role?: string) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "admin") return "Admin Panel";
  if (normalizedRole === "welfare_officer") return "Officer Review";
  if (normalizedRole === "finance_officer") return "Finance Panel";

  return "Member Portal";
}

function getControlTitle(role?: string) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "admin") return "Admin Control";
  if (normalizedRole === "welfare_officer") return "Officer Review";
  if (normalizedRole === "finance_officer") return "Finance Control";

  return "Member Portal";
}

function getControlDescription(role?: string) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "admin") {
    return "Manage members, staff, loan approvals and welfare operations.";
  }

  if (normalizedRole === "welfare_officer") {
    return "Review loan applications, verify documents and forward to admin.";
  }

  if (normalizedRole === "finance_officer") {
    return "Process approved loans, disbursements and installment tracking.";
  }

  return "Apply loans, apply grants, view offers and track payments.";
}

function formatDisplayRole(role?: string) {
  return normalizeRole(role).replaceAll("_", " ");
}

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

function getMobileIconKey(href: string, title: string): MobileIconKey {
  const text = `${href} ${title}`.toLowerCase();

  if (text.includes("users") || text.includes("member")) return "users";
  if (text.includes("staff")) return "staff";
  if (text.includes("setting")) return "settings";
  if (text.includes("report")) return "reports";
  if (text.includes("meeting") || text.includes("announcement")) return "announcement";
  if (text.includes("grant")) return "grant";
  if (text.includes("document")) return "document";
  if (text.includes("payment")) return "payment";
  if (text.includes("installment")) return "installment";
  if (text.includes("notification") || text.includes("sms")) return "notification";
  if (text.includes("review")) return "review";
  if (text.includes("disbursement")) return "disbursement";
  if (text.includes("history")) return "history";
  if (text.includes("loan")) return "loan";

  return "dashboard";
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();
  const userExtra = currentUser as typeof currentUser & CurrentUserExtra;

  const role = normalizeRole(currentUser?.role);
  const menuItems = getMenuByRole(role);

  const mobileMenuItems = menuItems.map((item) => ({
    title: item.title,
    href: item.href,
    iconKey: getMobileIconKey(item.href, item.title),
    iconColor: item.iconColor,
    iconBg: item.iconBg,
    hoverBg: item.hoverBg,
  }));

  const accountUser = {
    fullName: currentUser?.fullName || "",
    email: currentUser?.email || "",
    role,
    accountStatus: currentUser?.accountStatus || "",
    profileImage: userExtra?.profileImage || "",
  };

  return (
    <DashboardThemeProvider>
      <div
        className={`${roboto.className} h-screen overflow-hidden bg-[#2c241f] text-white`}
      >
        <div className="flex h-screen overflow-hidden">
          <aside className="dashboard-no-scrollbar relative hidden h-screen w-80 shrink-0 overflow-y-auto overflow-x-hidden border-r border-[#d8ad80]/18 bg-[#211b17] p-6 text-white shadow-[25px_0_100px_rgba(44,36,31,0.55)] lg:block">
            <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#c99b69]/25 blur-[100px]" />
            <div className="pointer-events-none absolute -right-28 top-40 h-80 w-80 rounded-full bg-[#d8ad80]/14 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[#9b6f45]/18 blur-[120px]" />

            <div className="relative z-10">
              <div className="mb-10 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8ad80]/25 bg-gradient-to-br from-[#d8ad80]/20 to-[#9b6f45]/18 shadow-[0_0_45px_rgba(216,173,128,0.22)] backdrop-blur-2xl">
                  <HandHeart size={24} className="text-[#d8ad80]" />
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white">
                    Welfare
                  </h2>

                  <p className="text-sm font-medium text-[#ead9c8]/70">
                    {getDashboardTitle(role)}
                  </p>
                </div>
              </div>

              <div className="mb-7 rounded-[26px] border border-[#d8ad80]/25 bg-[#fbf7ef]/10 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#d8ad80]">
                  {getRoleHeaderLabel(role)}
                </p>

                <h3 className="mt-2 text-lg font-bold text-white">
                  {getControlTitle(role)}
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#ead9c8]/65">
                  {getControlDescription(role)}
                </p>

                {currentUser ? (
                  <div className="mt-4 rounded-2xl border border-[#d8ad80]/18 bg-[#2c241f]/55 p-3">
                    <p className="text-xs font-semibold text-[#ead9c8]/60">
                      Logged in as
                    </p>

                    <p className="mt-1 truncate text-sm font-bold text-white">
                      {currentUser.fullName || currentUser.email}
                    </p>

                    <p className="mt-1 text-xs capitalize text-[#d8ad80]">
                      {formatDisplayRole(currentUser.role)}
                    </p>
                  </div>
                ) : null}
              </div>

              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
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

          <main className="dashboard-no-scrollbar h-screen flex-1 overflow-y-auto overflow-x-hidden bg-[var(--bg-primary,#eee6da)]">
            <div className="sticky top-0 z-40 border-b border-[#d9c8b8] bg-[var(--bg-card,#fbf7ef)]/75 px-4 py-3 backdrop-blur-2xl lg:px-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <MobileDashboardMenu
                    menuItems={mobileMenuItems}
                    roleHeaderLabel={getRoleHeaderLabel(role)}
                    dashboardTitle={getDashboardTitle(role)}
                    controlTitle={getControlTitle(role)}
                    controlDescription={getControlDescription(role)}
                    userName={currentUser?.fullName || currentUser?.email || "User"}
                    userRole={formatDisplayRole(currentUser?.role)}
                  />

                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-[var(--theme-color,#9b6f45)]">
                      {getRoleHeaderLabel(role)}
                    </p>

                    <h1 className="mt-1 text-lg font-extrabold text-[var(--text-primary,#2b241f)]">
                      {getDashboardTitle(role)}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <NotificationBell />
                  <AccountMenu user={accountUser} />
                </div>
              </div>
            </div>

            <div className="min-h-full w-full p-4 lg:p-6">{children}</div>
          </main>
        </div>
      </div>
    </DashboardThemeProvider>
  );
}