"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  DollarSign,
  FileCheck,
  Landmark,
  Loader2,
  MapPin,
  Megaphone,
  Settings,
  TrendingUp,
  WalletCards,
  CreditCard,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface UnpaidFee {
  id: string;
  month: string;
  year: number;
  amount: number;
  dueDate: string;
}

interface OverdueInstallment {
  id: string;
  loanType: string;
  installmentNumber: number;
  amount: number;
  penaltyAmount: number;
  dueDate: string;
}

interface MonthlyDisbursement {
  month: string;
  amount: number;
  count: number;
}

interface MemberGrowth {
  month: string;
  total: number;
  active: number;
}

interface RecentAnnouncement {
  _id: string;
  title: string;
  desc: string;
}

interface MemberInfo {
  fullName?: string;
  email?: string;
  role?: string;
  accountStatus?: string;
  employeeId?: string;
  department?: string;
  jobRole?: string;
}

interface MemberStats {
  totalLoans: number;
  activeLoans: number;
  pendingLoans: number;
  approvedLoans: number;
  rejectedLoans: number;
}

interface RecentApplication {
  id: string;
  reference: string;
  loanType: string;
  amount: number;
  status: string;
  statusLabel: string;
  statusColor: "approved" | "rejected" | "completed" | "pending";
  purpose: string;
  emiAmount: number;
  nextEMIDueDate: string | null;
  createdAt: string | null;
}

interface DashboardMeeting {
  id: string;
  title: string;
  reason: string;
  description?: string;
  venue: string;
  meetingDate: string;
  meetingTime: string;
  meetingAt: string | Date | null;
  priority: string;
  targetAudience: string;
}

interface MonthlyFee {
  id: string;
  month: number;
  year: number;
  monthName: string;
  amount: number;
  status: string;
  dueDate: string;
  isOverdue: boolean;
}

interface DashboardStats {
  totalLoans: number;
  activeLoans: number;
  pendingLoans: number;
  approvedLoans: number;
  rejectedLoans: number;

  totalRequestedAmount: number;
  totalEmiAmount: number;

  monthlyDisbursements: MonthlyDisbursement[];
  memberGrowth: MemberGrowth[];
  recentAnnouncements: RecentAnnouncement[];
}

interface MemberDashboardResponse {
  success: boolean;
  member?: MemberInfo;
  stats?: MemberStats;
  recentApplications?: RecentApplication[];
  meeting?: DashboardMeeting | null;
  overdueInstallment?: OverdueInstallment | null;
  monthlyFee?: MonthlyFee | null;
  message?: string;
}

const defaultStats: DashboardStats = {
  totalLoans: 0,
  activeLoans: 0,
  pendingLoans: 0,
  approvedLoans: 0,
  rejectedLoans: 0,

  totalRequestedAmount: 0,
  totalEmiAmount: 0,

  monthlyDisbursements: [],
  memberGrowth: [],
  recentAnnouncements: [],
};

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    await response.text();
    throw new Error(
      "API returned HTML instead of JSON. Check route paths."
    );
  }

  return response.json();
}

function formatCurrency(amount: number) {
  return `LKR ${Number(amount || 0).toLocaleString("en-LK")}`;
}

function getPercentage(value: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function getMonthLabel(monthIndex: number) {
  return new Date(2026, monthIndex, 1).toLocaleString("en-US", {
    month: "short",
  });
}

function buildMonthlyApplications(applications: RecentApplication[]) {
  const months = Array.from({ length: 12 }).map((_, index) => ({
    month: getMonthLabel(index),
    amount: 0,
    count: 0,
  }));

  applications.forEach((loan) => {
    if (!loan.createdAt) return;

    const date = new Date(loan.createdAt);

    if (Number.isNaN(date.getTime())) return;

    const monthIndex = date.getMonth();

    months[monthIndex].amount += Number(loan.amount || 0);
    months[monthIndex].count += 1;
  });

  return months;
}

function buildMemberGrowth(applications: RecentApplication[]) {
  const now = new Date();

  return Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const month = getMonthLabel(date.getMonth());

    const loansInMonth = applications.filter((loan) => {
      if (!loan.createdAt) return false;

      const createdAt = new Date(loan.createdAt);

      return (
        createdAt.getFullYear() === date.getFullYear() &&
        createdAt.getMonth() === date.getMonth()
      );
    });

    const activeInMonth = loansInMonth.filter((loan) =>
      ["approved", "disbursed", "completed"].includes(loan.statusColor)
    );

    return {
      month,
      total: loansInMonth.length,
      active: activeInMonth.length,
    };
  });
}

function buildRecentAnnouncements(applications: RecentApplication[]) {
  if (applications.length === 0) {
    return [
      {
        _id: "empty-1",
        title: "No recent loan activity",
        desc: "Apply for a welfare loan to see your latest updates here.",
      },
    ];
  }

  return applications.slice(0, 3).map((loan) => ({
    _id: loan.id,
    title: `${loan.loanType} - ${loan.statusLabel}`,
    desc: `${loan.reference} • ${formatCurrency(loan.amount)} • ${
      loan.purpose || "No purpose added"
    }`,
  }));
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  glow,
  badge,
  iconColor,
  iconBg,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  glow: string;
  badge: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <Card className="group overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_25px_90px_rgba(44,36,31,0.16)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-[#9b6f45]/45 hover:bg-[#fffaf3]">
      <CardContent className="relative p-6">
        <div
          className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl ${glow}`}
        />

        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[#d8ad80]/18 blur-3xl" />

        <div className="relative flex items-start justify-between">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d9c8b8] ${iconBg} ${iconColor} shadow-lg backdrop-blur-xl`}
          >
            <Icon size={25} />
          </div>

          <span className="rounded-full border border-[#d9c8b8] bg-[#f8f1e8] px-3 py-1 text-[11px] font-bold text-[#9b6f45] backdrop-blur-xl">
            {badge}
          </span>
        </div>

        <p className="relative mt-6 text-sm font-semibold text-[#6b5e54]">
          {title}
        </p>

        <h2 className="relative mt-2 text-4xl font-extrabold tracking-tight text-[#2b241f]">
          {value}
        </h2>

        <p className="relative mt-2 text-sm text-[#79695d]">{subtitle}</p>

        <div className="relative mt-6 rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/70 p-3 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6b5e54]">
            <span>Current Status</span>
            <span className="text-[#9b6f45]">Live</span>
          </div>

          <div className="mt-3 h-2 rounded-full bg-[#e9dccd]">
            <div className="h-2 w-[72%] rounded-full bg-gradient-to-r from-[#2c241f] via-[#9b6f45] to-[#d8ad80]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  title,
  href,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  title: string;
  href: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between rounded-2xl border border-[#d9c8b8] bg-[#fbf7ef]/90 p-4 text-[#2b241f] backdrop-blur-xl transition hover:border-[#9b6f45]/45 hover:bg-[#f1e5d8]"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border border-[#d9c8b8] ${iconBg} ${iconColor}`}
        >
          <Icon size={19} />
        </div>

        <span className="text-sm font-bold">{title}</span>
      </div>

      <span className="text-lg font-bold text-[#9b6f45] transition group-hover:translate-x-1">
        →
      </span>
    </a>
  );
}

export default function MemberDashboardPage() {
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [meeting, setMeeting] = useState<DashboardMeeting | null>(null);
  const [unpaidFee, setUnpaidFee] = useState<UnpaidFee | null>(null);
  const [overdueInstallment, setOverdueInstallment] = useState<OverdueInstallment | null>(null);
  const [todayText, setTodayText] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    try {
      const res = await fetch("/api/member/dashboard", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await readJsonResponse(res)) as MemberDashboardResponse;

      if (result.success) {
        const applications = result.recentApplications || [];

        const totalRequestedAmount = applications.reduce((sum, loan) => sum + Number(loan.amount || 0), 0);
        const totalEmiAmount = applications.reduce((sum, loan) => sum + Number(loan.emiAmount || 0), 0);

        setMember(result.member || null);
        setRecentApplications(applications);
        setMeeting(result.meeting || null);

        if (result.overdueInstallment) {
          const formattedDate = new Date(result.overdueInstallment.dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric"
          });
          setOverdueInstallment({
            ...result.overdueInstallment,
            dueDate: formattedDate
          });
        } else {
          setOverdueInstallment(null);
        }

        if (result.monthlyFee && (result.monthlyFee.isOverdue || result.monthlyFee.status === "overdue")) {
          const formattedDate = new Date(result.monthlyFee.dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric"
          });

          setUnpaidFee({
            id: result.monthlyFee.id,
            month: result.monthlyFee.monthName,
            year: result.monthlyFee.year,
            amount: result.monthlyFee.amount,
            dueDate: formattedDate,
          });
        } else {
          setUnpaidFee(null);
        }

        setStats({
          ...defaultStats,
          totalLoans: result.stats?.totalLoans || 0,
          activeLoans: result.stats?.activeLoans || 0,
          pendingLoans: result.stats?.pendingLoans || 0,
          approvedLoans: result.stats?.approvedLoans || 0,
          rejectedLoans: result.stats?.rejectedLoans || 0,
          totalRequestedAmount,
          totalEmiAmount,
          monthlyDisbursements: buildMonthlyApplications(applications),
          memberGrowth: buildMemberGrowth(applications),
          recentAnnouncements: buildRecentAnnouncements(applications),
        });
      }
    } catch (error) {
      console.error("LOAD_MEMBER_DASHBOARD_ERROR", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTodayText(
        new Date().toLocaleDateString("en-LK", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      );
      void loadStats();
    }, 0);

    const interval = window.setInterval(() => {
      void loadStats();
    }, 30000);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);

  const approvedPercentage = getPercentage(stats.approvedLoans, stats.totalLoans);
  const pendingPercentage = getPercentage(stats.pendingLoans, stats.totalLoans);
  const rejectedPercentage = getPercentage(stats.rejectedLoans, stats.totalLoans);

  const maxDisbursementAmount = Math.max(...stats.monthlyDisbursements.map((item) => item.amount), 1);
  const maxMemberGrowth = Math.max(...stats.memberGrowth.map((item) => Math.max(item.total, item.active)), 1);

  const announcements = stats.recentAnnouncements.length > 0
    ? stats.recentAnnouncements
    : [
        {
          _id: "empty-1",
          title: "No recent loan activity",
          desc: "Apply for a welfare loan to see your latest updates here.",
        },
      ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading member dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden rounded-[34px] bg-[#eee6da] text-[#2b241f]">
      <div className="relative min-h-screen space-y-7 overflow-hidden p-1">
        <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-[#c99b69]/25 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-[480px] w-[480px] rounded-full bg-[#2c241f]/10 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-[360px] w-[360px] rounded-full bg-[#d8ad80]/25 blur-[130px]" />

        <section className="relative overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d8ad80]/25 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
                Welfare
              </p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
                Member Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
                Welcome {member?.fullName || "Member"}. Track your welfare
                loans, approvals, payments, installments and notifications.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 text-[#2b241f] backdrop-blur-xl hover:bg-[#fffaf3]"
              >
                {todayText || "-"}
              </Button>

              <Link href="/dashboard/loans/apply">
                <Button className="rounded-2xl bg-[#9b6f45] px-5 text-white shadow-lg shadow-[#9b6f45]/25 hover:bg-[#835c38]">
                  <TrendingUp className="mr-2" size={17} />
                  Apply Loan
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* OVERDUE LOAN INSTALLMENT BANNER */}
        {overdueInstallment && (
          <section className="relative overflow-hidden rounded-[34px] border border-red-500/30 bg-[#fbf0f0]/90 p-7 shadow-sm backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-500/30">
                  <AlertTriangle size={28} />
                </div>
                
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-extrabold text-[#2b241f]">{overdueInstallment.loanType} Installment Overdue</h2>
                    <span className="rounded-full border border-red-500/30 bg-red-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-red-700">
                      Overdue
                    </span>
                    {overdueInstallment.penaltyAmount > 0 && (
                      <span className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-sm">
                        Penalty Applied
                      </span>
                    )}
                  </div>
                  <p className="mt-2 max-w-3xl text-sm text-[#6b5e54]">
                    Your installment <span className="font-bold text-[#2b241f]">#{overdueInstallment.installmentNumber}</span> is currently overdue. Please settle this amount immediately.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-4">
                    <div className="rounded-2xl border border-red-500/20 bg-white px-6 py-4 shadow-sm">
                      <p className="text-xs font-bold text-red-600">Total Payable</p>
                      <p className="mt-1 text-xl font-extrabold text-[#2b241f]">{formatCurrency(overdueInstallment.amount + (overdueInstallment.penaltyAmount || 0))}</p>
                    </div>
                    {overdueInstallment.penaltyAmount > 0 && (
                      <div className="rounded-2xl border border-[#d9c8b8] bg-[#fbf7ef]/90 px-6 py-4 shadow-sm">
                        <p className="text-xs font-bold text-[#9b6f45]">Included Penalty</p>
                        <p className="mt-1 text-base font-extrabold text-[#2b241f]">{formatCurrency(overdueInstallment.penaltyAmount)}</p>
                      </div>
                    )}
                    <div className="rounded-2xl border border-[#d9c8b8] bg-[#fbf7ef]/90 px-6 py-4 shadow-sm">
                      <p className="text-xs font-bold text-[#9b6f45]">Due Date</p>
                      <p className="mt-1 text-base font-extrabold text-[#2b241f]">{overdueInstallment.dueDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-row gap-3 lg:flex-col justify-end">
                <Link href="/dashboard/installments">
                  <Button className="h-12 w-full min-w-[140px] rounded-2xl bg-red-600 px-6 font-extrabold text-white shadow-lg shadow-red-600/20 hover:bg-red-700">
                    <CreditCard className="mr-2" size={18} /> Pay Installment
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* OVERDUE FEE BANNER SECTION */}
        {unpaidFee && (
          <section className="relative overflow-hidden rounded-[34px] border border-orange-500/30 bg-[#fdf5ed]/90 p-7 shadow-sm backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-700">
                  <AlertTriangle size={28} />
                </div>
                
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-extrabold text-[#2b241f]">Monthly Welfare Fee Overdue</h2>
                    <span className="rounded-full border border-orange-500/30 bg-orange-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-orange-700">
                      Overdue
                    </span>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm text-[#6b5e54]">
                    Your monthly welfare contribution for {unpaidFee.month} {unpaidFee.year} is overdue. Please complete the payment.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-4">
                    <div className="rounded-2xl border border-[#d9c8b8] bg-[#fbf7ef]/90 px-6 py-4 shadow-sm">
                      <p className="text-xs font-bold text-[#9b6f45]">Amount</p>
                      <p className="mt-1 text-base font-extrabold text-[#2b241f]">{formatCurrency(unpaidFee.amount)}</p>
                    </div>
                    <div className="rounded-2xl border border-[#d9c8b8] bg-[#fbf7ef]/90 px-6 py-4 shadow-sm">
                      <p className="text-xs font-bold text-[#9b6f45]">Due Date</p>
                      <p className="mt-1 text-base font-extrabold text-[#2b241f]">{unpaidFee.dueDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-row gap-3 lg:flex-col justify-end">
                <Link href="/dashboard/payments">
                  <Button className="h-12 w-full min-w-[140px] rounded-2xl bg-[#9b6f45] px-6 text-white shadow-lg shadow-[#9b6f45]/20 hover:bg-[#835c38]">
                    <CreditCard className="mr-2" size={18} /> Pay Fee
                  </Button>
                </Link>
                <Button 
                  onClick={() => loadStats()}
                  className="h-12 w-full min-w-[140px] rounded-2xl bg-[#2c241f] px-6 text-white shadow-lg shadow-[#2c241f]/20 hover:bg-[#1a1512]"
                >
                  <RefreshCw className="mr-2" size={18} /> Refresh
                </Button>
              </div>
            </div>
          </section>
        )}

        {meeting && (
          <section className="relative overflow-hidden rounded-[34px] border border-[#d9c8b8] bg-[#f7f1ea] shadow-[0_30px_100px_rgba(44,36,31,0.12)]">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
              <div className="relative overflow-hidden bg-[#f3dfcd] p-8 text-[#2c241f]">
                <div className="absolute left-5 top-5 h-3 w-3 bg-[#d8c0aa]" />
                <div className="absolute right-5 top-5 h-3 w-3 bg-[#d8c0aa]" />
                <div className="absolute bottom-5 left-5 h-3 w-3 bg-[#d8c0aa]" />

                <div className="inline-flex items-center gap-2 rounded-xl bg-[#4b2d27] px-4 py-2 text-xs font-black uppercase text-[#f7f1ea]">
                  <Megaphone size={15} />
                  Meeting Notice
                </div>

                <p className="mt-8 text-sm font-black uppercase tracking-[0.45em] text-[#6b453d]">
                  Welfare Society
                </p>

                <h2 className="mt-6 text-6xl font-black uppercase leading-none tracking-tight text-[#4b2d27] md:text-7xl">
                  {meeting.title}
                </h2>

                <p className="mt-4 max-w-xl text-base font-black leading-7 text-[#4b2d27]">
                  {meeting.reason}
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#d8c0aa] bg-[#ead6c4] p-4">
                    <div className="flex items-center gap-3">
                      <CalendarClock size={28} className="text-[#6b453d]" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6b453d]">
                          Date
                        </p>
                        <p className="text-xl font-black text-[#2c241f]">
                          {meeting.meetingDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#d8c0aa] bg-[#ead6c4] p-4">
                    <div className="flex items-center gap-3">
                      <Clock3 size={28} className="text-[#6b453d]" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6b453d]">
                          Time
                        </p>
                        <p className="text-xl font-black text-[#2c241f]">
                          {meeting.meetingTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-start gap-3">
                  <MapPin size={24} className="mt-1 text-[#6b453d]" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6b453d]">
                      Venue
                    </p>
                    <p className="text-xl font-black text-[#2c241f]">
                      {meeting.venue}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center justify-center bg-[#f7f1ea] p-8">
                <div className="relative w-full max-w-sm border-[3px] border-[#4b2d27] bg-[#f3dfcd] p-8 text-center shadow-xl">
                  <div className="absolute -left-3 -top-3 h-6 w-6 bg-[#d8c0aa]" />
                  <div className="absolute -right-3 -top-3 h-6 w-6 bg-[#d8c0aa]" />
                  <div className="absolute -bottom-3 -left-3 h-6 w-6 bg-[#4b2d27]" />
                  <div className="absolute -bottom-3 -right-3 h-6 w-6 bg-[#4b2d27]" />

                  <p className="text-xs font-black uppercase tracking-[0.45em] text-[#4b2d27]">
                    Special Meeting
                  </p>

                  <div className="mt-6 bg-[#d8c0aa] p-5">
                    <h3 className="text-4xl font-black uppercase leading-none text-[#2c241f]">
                      {meeting.title}
                    </h3>
                  </div>

                  <div className="mt-8">
                    <CalendarClock
                      size={120}
                      className="mx-auto text-[#4b2d27]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-[#d9c8b8] bg-[#f7f1ea] p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-6 text-base font-black text-[#4b2d27]">
                <span>{meeting.meetingDate}</span>
                <span>{meeting.meetingTime}</span>
                <span>{meeting.venue}</span>
              </div>

              <Link
                href={`/dashboard/meeting-notices/${meeting.id}`}
                className="inline-flex items-center justify-center rounded-2xl bg-[#4b2d27] px-6 py-3 text-base font-black uppercase tracking-[0.15em] text-white transition hover:bg-[#6b453d]"
              >
                View Details →
              </Link>
            </div>
          </section>
        )}

        <section className="relative grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Loans"
            value={stats.totalLoans}
            subtitle="All registered loan applications"
            icon={Landmark}
            glow="bg-[#d8ad80]/30"
            badge="Live"
            iconColor="text-[#8a5f3c]"
            iconBg="bg-[#f1e5d8]"
          />

          <StatCard
            title="Active Loans"
            value={stats.activeLoans}
            subtitle="Approved or disbursed loans"
            icon={CheckCircle2}
            glow="bg-emerald-500/18"
            badge="Live"
            iconColor="text-emerald-700"
            iconBg="bg-emerald-500/10"
          />

          <StatCard
            title="Pending Loans"
            value={stats.pendingLoans}
            subtitle="Waiting for review decision"
            icon={Clock3}
            glow="bg-orange-500/18"
            badge="Pending"
            iconColor="text-orange-700"
            iconBg="bg-orange-500/10"
          />

          <StatCard
            title="Rejected Loans"
            value={stats.rejectedLoans}
            subtitle="Rejected application records"
            icon={AlertTriangle}
            glow="bg-red-500/16"
            badge="Loans"
            iconColor="text-red-700"
            iconBg="bg-red-500/10"
          />

          <StatCard
            title="Requested Amount"
            value={formatCurrency(stats.totalRequestedAmount)}
            subtitle="Recent application amount"
            icon={DollarSign}
            glow="bg-[#d8ad80]/25"
            badge="Live"
            iconColor="text-[#8a5f3c]"
            iconBg="bg-[#f1e5d8]"
          />

          <StatCard
            title="Monthly EMI"
            value={formatCurrency(stats.totalEmiAmount)}
            subtitle="Recent estimated installment total"
            icon={ClipboardCheck}
            glow="bg-orange-500/18"
            badge="Live"
            iconColor="text-amber-700"
            iconBg="bg-amber-500/10"
          />

          <StatCard
            title="Approved Loans"
            value={stats.approvedLoans}
            subtitle="Approved loan requests"
            icon={WalletCards}
            glow="bg-teal-500/16"
            badge="Live"
            iconColor="text-teal-700"
            iconBg="bg-teal-500/10"
          />

          <StatCard
            title="Notifications"
            value="View"
            subtitle="Check latest welfare updates"
            icon={Bell}
            glow="bg-[#9b6f45]/25"
            badge="Live"
            iconColor="text-[#8a5f3c]"
            iconBg="bg-[#f1e5d8]"
          />
        </section>

        <section className="relative grid gap-6 xl:grid-cols-3">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl xl:col-span-2">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/25 blur-3xl" />

              <div className="relative mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold">
                    Loan Application Overview
                  </h2>
                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Monthly requested amount trend for your recent welfare loan
                    applications.
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 text-[#2b241f] hover:bg-[#fffaf3]"
                >
                  Last 12 Months
                </Button>
              </div>

              <div className="relative flex h-[280px] items-end gap-4 rounded-[28px] border border-[#d9c8b8] bg-[#efe3d6]/70 p-5 backdrop-blur-xl">
                {stats.monthlyDisbursements.map((item) => {
                  const height =
                    item.amount > 0
                      ? Math.max(
                          25,
                          (item.amount / maxDisbursementAmount) * 100
                        )
                      : 0;

                  return (
                    <div
                      key={item.month}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div className="h-5 text-[10px] font-bold text-[#9b6f45]">
                        {item.amount > 0
                          ? `${Math.round(item.amount / 1000)}K`
                          : ""}
                      </div>

                      <div className="flex h-[210px] w-full items-end justify-center">
                        {item.amount > 0 ? (
                          <div
                            className="w-full rounded-t-xl bg-[#9b6f45] shadow-lg shadow-[#9b6f45]/30"
                            style={{ height: `${height}%` }}
                            title={`${item.month}: ${formatCurrency(
                              item.amount
                            )}`}
                          />
                        ) : (
                          <div className="h-[2px] w-full rounded-full bg-[#d9c8b8]" />
                        )}
                      </div>

                      <span className="text-[10px] font-semibold text-[#79695d]">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#d8ad80]/25 blur-3xl" />

              <div className="relative mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold">Loan Updates</h2>
                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Latest application status updates.
                  </p>
                </div>

                <Link
                  href="/dashboard/loans"
                  className="text-sm font-bold text-[#9b6f45]"
                >
                  View All
                </Link>
              </div>

              <div className="relative space-y-3">
                {announcements.map((item) => {
                  return (
                    <div
                      key={item._id}
                      className="flex gap-3 rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/75 p-4 backdrop-blur-xl"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c]">
                        <Bell size={18} />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-[#2b241f]">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-[#6b5e54]">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="relative grid gap-6 xl:grid-cols-3">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <h2 className="text-2xl font-extrabold">Loans by Status</h2>
              <p className="mt-1 text-sm text-[#6b5e54]">
                Summary of your loan workflow stages.
              </p>

              <div className="mt-7 flex items-center justify-center">
                <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-[22px] border-[#9b6f45] shadow-[0_25px_80px_rgba(91,60,32,0.25)]">
                  <div className="absolute inset-[-22px] rounded-full border-[22px] border-b-red-400 border-l-[#9b6f45] border-r-orange-400 border-t-emerald-400" />
                  <div className="z-10 rounded-full bg-[#f8f1e8] p-4 text-center backdrop-blur-xl">
                    <p className="text-xs font-semibold text-[#6b5e54]">
                      Total Loans
                    </p>
                    <p className="text-3xl font-extrabold text-[#2b241f]">
                      {stats.totalLoans}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6b5e54]">Approved</span>
                  <span className="font-bold text-emerald-700">
                    {approvedPercentage}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b5e54]">Pending</span>
                  <span className="font-bold text-orange-700">
                    {pendingPercentage}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b5e54]">Rejected</span>
                  <span className="font-bold text-red-700">
                    {rejectedPercentage}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <h2 className="text-2xl font-extrabold">Applications Overview</h2>
              <p className="mt-1 text-sm text-[#6b5e54]">
                New and active loan activity.
              </p>

              <div className="mt-7 flex h-56 items-end gap-4 rounded-[28px] border border-[#d9c8b8] bg-[#efe3d6]/70 p-5">
                {stats.memberGrowth.map((item) => {
                  const totalHeight =
                    item.total > 0
                      ? Math.max(25, (item.total / maxMemberGrowth) * 100)
                      : 0;

                  const activeHeight =
                    item.active > 0
                      ? Math.max(25, (item.active / maxMemberGrowth) * 100)
                      : 0;

                  return (
                    <div
                      key={item.month}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div className="h-5 text-[10px] font-bold text-[#9b6f45]">
                        {item.total > 0 ? item.total : ""}
                      </div>

                      <div className="flex h-[150px] w-full items-end justify-center gap-1">
                        {item.total > 0 ? (
                          <div
                            className="w-1/2 rounded-t-lg bg-[#9b6f45] shadow"
                            style={{ height: `${totalHeight}%` }}
                            title={`${item.month} applications: ${item.total}`}
                          />
                        ) : (
                          <div className="h-[2px] w-1/2 rounded-full bg-[#d9c8b8]" />
                        )}

                        {item.active > 0 ? (
                          <div
                            className="w-1/2 rounded-t-lg bg-emerald-600 shadow"
                            style={{ height: `${activeHeight}%` }}
                            title={`${item.month} active: ${item.active}`}
                          />
                        ) : (
                          <div className="h-[2px] w-1/2 rounded-full bg-[#d9c8b8]" />
                        )}
                      </div>

                      <span className="text-[10px] font-semibold text-[#79695d]">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <h2 className="text-2xl font-extrabold">Quick Shortcuts</h2>
              <p className="mt-1 text-sm text-[#6b5e54]">
                Common member actions.
              </p>

              <div className="mt-6 grid gap-3">
                <QuickLink
                  title="Apply Loan"
                  href="/dashboard/loans/apply"
                  icon={Landmark}
                  iconColor="text-[#8a5f3c]"
                  iconBg="bg-[#f1e5d8]"
                />

                <QuickLink
                  title="Loan Offers"
                  href="/dashboard/loans/offers"
                  icon={FileCheck}
                  iconColor="text-emerald-700"
                  iconBg="bg-emerald-500/10"
                />

                <QuickLink
                  title="My Loans"
                  href="/dashboard/loans"
                  icon={BarChart3}
                  iconColor="text-blue-700"
                  iconBg="bg-blue-500/10"
                />

                <QuickLink
                  title="Payments"
                  href="/dashboard/payments"
                  icon={Settings}
                  iconColor="text-orange-700"
                  iconBg="bg-orange-500/10"
                />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}