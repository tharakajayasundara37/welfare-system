"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ElementType } from "react";

import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  DollarSign,
  FileCheck,
  Landmark,
  Loader2,
  Settings,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

interface RecentApproval {
  id: string;
  memberName: string;
  employeeId: string;
  loanType: string;
  amount: number;
  status: string;
  updatedAt: string | null;
}

interface AdminStats {
  totalMembers: number;
  activeMembers: number;
  pendingApprovals: number;
  totalLoans: number;

  totalDisbursedAmount: number;

  pendingInstallments: number;
  paidInstallments: number;
  overdueInstallments: number;

  pendingInstallmentAmount: number;
  paidInstallmentAmount: number;
  overdueInstallmentAmount: number;

  approvedLoans: number;
  pendingLoans: number;
  rejectedLoans: number;
  disbursedLoans: number;

  activeAnnouncements: number;

  monthlyDisbursements: MonthlyDisbursement[];
  memberGrowth: MemberGrowth[];
  recentAnnouncements: RecentAnnouncement[];
  recentApprovals?: RecentApproval[];
}

interface AdminStatsResponse {
  success: boolean;
  stats?: AdminStats;
  message?: string;
}

const defaultStats: AdminStats = {
  totalMembers: 0,
  activeMembers: 0,
  pendingApprovals: 0,
  totalLoans: 0,

  totalDisbursedAmount: 0,

  pendingInstallments: 0,
  paidInstallments: 0,
  overdueInstallments: 0,

  pendingInstallmentAmount: 0,
  paidInstallmentAmount: 0,
  overdueInstallmentAmount: 0,

  approvedLoans: 0,
  pendingLoans: 0,
  rejectedLoans: 0,
  disbursedLoans: 0,

  activeAnnouncements: 0,

  monthlyDisbursements: [],
  memberGrowth: [],
  recentAnnouncements: [],
  recentApprovals: [],
};

const chartColors = {
  brown: "#9b6f45",
  dark: "#2c241f",
  gold: "#d8ad80",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  blue: "#2563eb",
  teal: "#14b8a6",
};

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    await response.text();
    throw new Error(
      "API returned HTML instead of JSON. Check /api/admin/stats route path."
    );
  }

  return response.json();
}

function formatCurrency(amount: number) {
  return `LKR ${Number(amount || 0).toLocaleString("en-LK")}`;
}

function formatCompactCurrency(amount: number) {
  const value = Number(amount || 0);

  if (value >= 1_000_000) {
    return `LKR ${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `LKR ${(value / 1_000).toFixed(0)}K`;
  }

  return `LKR ${value.toLocaleString("en-LK")}`;
}

function formatDate(date?: string | null) {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "N/A";

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status?: string) {
  return String(status || "pending")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getPercentage(value: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.round((Number(value || 0) / Number(total || 0)) * 100);
}

function getStatusBadgeClass(status?: string) {
  const normalized = String(status || "").toLowerCase();

  if (
    normalized.includes("approved") ||
    normalized.includes("disbursed") ||
    normalized.includes("completed") ||
    normalized.includes("paid")
  ) {
    return "border-emerald-600/25 bg-emerald-100 text-emerald-700";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("review") ||
    normalized.includes("processing") ||
    normalized.includes("offer")
  ) {
    return "border-[#d8ad80]/50 bg-[#f6eadc] text-[#9b6f45]";
  }

  if (normalized.includes("reject") || normalized.includes("overdue")) {
    return "border-red-500/20 bg-red-100 text-red-700";
  }

  return "border-[#d9c8b8] bg-[#fbf7ef] text-[#9b6f45]";
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
  progress = 72,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ElementType;
  glow: string;
  badge: string;
  iconColor: string;
  iconBg: string;
  progress?: number;
}) {
  return (
    <Card className="group h-full overflow-hidden rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_25px_90px_rgba(44,36,31,0.14)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#9b6f45]/45 hover:bg-[#fffaf3]">
      <CardContent className="relative flex h-full flex-col p-5">
        <div
          className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl ${glow}`}
        />

        <div className="relative flex items-start justify-between gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d9c8b8] ${iconBg} ${iconColor} shadow-lg backdrop-blur-xl`}
          >
            <Icon size={22} />
          </div>

          <span className="rounded-full border border-[#d9c8b8] bg-[#f8f1e8] px-3 py-1 text-[11px] font-bold text-[#9b6f45]">
            {badge}
          </span>
        </div>

        {/* Text Details Centered & Highlighted */}
        <div className="relative mt-6 flex flex-col items-center text-center">
          <p className="text-sm font-semibold text-[#6b5e54]">
            {title}
          </p>

          <h2 className="mt-3 break-words text-5xl font-black tracking-tight text-[#2b241f] drop-shadow-sm">
            {value}
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#79695d]">
            {subtitle}
          </p>
        </div>

        <div className="relative mt-auto pt-6">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6b5e54]">
            <span>Live Status</span>
            <span className="text-[#9b6f45]">{progress}%</span>
          </div>

          <div className="mt-3 h-2 rounded-full bg-[#e9dccd]">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#2c241f] via-[#9b6f45] to-[#d8ad80]"
              style={{ width: `${Math.min(Math.max(progress, 6), 100)}%` }}
            />
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
  icon: ElementType;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <Link
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
    </Link>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; dataKey?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-[#d9c8b8] bg-[#fffaf3] p-3 text-xs shadow-xl shadow-[#2c241f]/15">
      <p className="font-extrabold text-[#2b241f]">{label}</p>

      <div className="mt-2 space-y-1">
        {payload.map((item) => (
          <p key={`${item.name}-${item.dataKey}`} className="text-[#6b5e54]">
            <span className="font-bold text-[#9b6f45]">
              {item.name || item.dataKey}:
            </span>{" "}
            {item.dataKey === "amount"
              ? formatCurrency(Number(item.value || 0))
              : Number(item.value || 0).toLocaleString("en-LK")}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadStats() {
    try {
      setMessage("");

      const response = await fetch("/api/admin/stats", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await readJsonResponse(response)) as AdminStatsResponse;

      if (!result.success || !result.stats) {
        setMessage(result.message || "Failed to load admin dashboard stats.");
        return;
      }

      setStats({
        ...defaultStats,
        ...result.stats,
        monthlyDisbursements: result.stats.monthlyDisbursements || [],
        memberGrowth: result.stats.memberGrowth || [],
        recentAnnouncements: result.stats.recentAnnouncements || [],
        recentApprovals: result.stats.recentApprovals || [],
      });
    } catch (error) {
      console.error("LOAD_ADMIN_STATS_ERROR", error);
      setMessage("Something went wrong while loading admin dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStats();
    }, 0);

    const interval = window.setInterval(() => {
      void loadStats();
    }, 10000);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);

  const approvedPercentage = getPercentage(stats.approvedLoans, stats.totalLoans);
  const pendingPercentage = getPercentage(stats.pendingLoans, stats.totalLoans);
  const rejectedPercentage = getPercentage(stats.rejectedLoans, stats.totalLoans);
  const activeMemberPercentage = getPercentage(
    stats.activeMembers,
    stats.totalMembers
  );
  const disbursedPercentage = getPercentage(
    stats.disbursedLoans,
    stats.totalLoans
  );
  const paidInstallmentPercentage = getPercentage(
    stats.paidInstallments,
    stats.pendingInstallments + stats.paidInstallments + stats.overdueInstallments
  );

  const loanStatusData = useMemo(
    () => [
      {
        name: "Approved",
        value: stats.approvedLoans,
        color: chartColors.green,
      },
      {
        name: "Pending",
        value: stats.pendingLoans,
        color: chartColors.amber,
      },
      {
        name: "Rejected",
        value: stats.rejectedLoans,
        color: chartColors.red,
      },
      {
        name: "Disbursed",
        value: stats.disbursedLoans,
        color: chartColors.blue,
      },
    ],
    [
      stats.approvedLoans,
      stats.pendingLoans,
      stats.rejectedLoans,
      stats.disbursedLoans,
    ]
  );

  const installmentData = useMemo(
    () => [
      {
        name: "Pending",
        value: stats.pendingInstallmentAmount,
        count: stats.pendingInstallments,
        color: chartColors.amber,
      },
      {
        name: "Paid",
        value: stats.paidInstallmentAmount,
        count: stats.paidInstallments,
        color: chartColors.green,
      },
      {
        name: "Overdue",
        value: stats.overdueInstallmentAmount,
        count: stats.overdueInstallments,
        color: chartColors.red,
      },
    ],
    [
      stats.pendingInstallmentAmount,
      stats.paidInstallmentAmount,
      stats.overdueInstallmentAmount,
      stats.pendingInstallments,
      stats.paidInstallments,
      stats.overdueInstallments,
    ]
  );

  const announcements =
    stats.recentAnnouncements.length > 0
      ? stats.recentAnnouncements
      : [
          {
            _id: "empty-1",
            title: "No active announcements",
            desc: "Create meeting notices to show latest updates here.",
          },
        ];

  const recentApprovals = stats.recentApprovals || [];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading admin dashboard...
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
                Admin Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
                Enterprise control center for members, approvals, loans,
                disbursements, installments and welfare operations.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                className="rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 text-[#2b241f] backdrop-blur-xl hover:bg-[#fffaf3]"
              >
                {new Date().toLocaleDateString("en-LK", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Button>

              <Link href="/dashboard/admin/reports">
                <Button className="w-full rounded-2xl bg-[#9b6f45] px-5 text-white shadow-lg shadow-[#9b6f45]/25 hover:bg-[#835c38] sm:w-auto">
                  <TrendingUp className="mr-2" size={17} />
                  View Reports
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {message && (
          <div className="relative rounded-2xl border border-red-500/20 bg-red-100 p-4 text-sm font-semibold text-red-700">
            {message}
          </div>
        )}

        <section className="relative grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Members"
            value={stats.totalMembers}
            subtitle="All registered welfare members"
            icon={Users}
            glow="bg-[#d8ad80]/30"
            badge="Members"
            iconColor="text-[#8a5f3c]"
            iconBg="bg-[#f1e5d8]"
            progress={activeMemberPercentage}
          />

          <StatCard
            title="Active Members"
            value={stats.activeMembers}
            subtitle={`${activeMemberPercentage}% active member rate`}
            icon={CheckCircle2}
            glow="bg-emerald-500/18"
            badge="Active"
            iconColor="text-emerald-700"
            iconBg="bg-emerald-500/10"
            progress={activeMemberPercentage}
          />

          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            subtitle="Members waiting for admin approval"
            icon={Clock3}
            glow="bg-orange-500/18"
            badge="Pending"
            iconColor="text-orange-700"
            iconBg="bg-orange-500/10"
            progress={stats.pendingApprovals > 0 ? 45 : 8}
          />

          <StatCard
            title="Total Loans"
            value={stats.totalLoans}
            subtitle="Total loan and support records"
            icon={Landmark}
            glow="bg-[#9b6f45]/25"
            badge="Loans"
            iconColor="text-[#8a5f3c]"
            iconBg="bg-[#f1e5d8]"
            progress={approvedPercentage || 8}
          />

          <StatCard
            title="Disbursed Amount"
            value={formatCompactCurrency(stats.totalDisbursedAmount)}
            subtitle={formatCurrency(stats.totalDisbursedAmount)}
            icon={DollarSign}
            glow="bg-[#d8ad80]/25"
            badge="Finance"
            iconColor="text-[#8a5f3c]"
            iconBg="bg-[#f1e5d8]"
            progress={disbursedPercentage || 8}
          />

          <StatCard
            title="Pending Installments"
            value={formatCompactCurrency(stats.pendingInstallmentAmount)}
            subtitle={`${stats.pendingInstallments} installments awaiting collection`}
            icon={ClipboardCheck}
            glow="bg-orange-500/18"
            badge="Collect"
            iconColor="text-amber-700"
            iconBg="bg-amber-500/10"
            progress={pendingPercentage || 8}
          />

          <StatCard
            title="Paid Installments"
            value={formatCompactCurrency(stats.paidInstallmentAmount)}
            subtitle={`${stats.paidInstallments} collected repayments`}
            icon={WalletCards}
            glow="bg-teal-500/16"
            badge="Paid"
            iconColor="text-teal-700"
            iconBg="bg-teal-500/10"
            progress={paidInstallmentPercentage || 8}
          />

          <StatCard
            title="Overdue Installments"
            value={formatCompactCurrency(stats.overdueInstallmentAmount)}
            subtitle={`${stats.overdueInstallments} records need attention`}
            icon={AlertTriangle}
            glow="bg-red-500/16"
            badge="Risk"
            iconColor="text-red-700"
            iconBg="bg-red-500/10"
            progress={stats.overdueInstallments > 0 ? 80 : 8}
          />
        </section>

        <section className="relative grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/25 blur-3xl" />

              <div className="relative mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold">
                    Loan Disbursement Overview
                  </h2>
                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Real monthly disbursement trend from database.
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 text-[#2b241f] hover:bg-[#fffaf3]"
                >
                  Last 12 Months
                </Button>
              </div>

              <div className="h-[320px] rounded-[28px] border border-[#d9c8b8] bg-[#efe3d6]/70 p-5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyDisbursements}>
                    <CartesianGrid stroke="#d9c8b8" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#79695d", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#79695d", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) =>
                        Number(value) >= 1000
                          ? `${Number(value) / 1000}K`
                          : String(value)
                      }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="amount"
                      name="Amount"
                      fill={chartColors.brown}
                      radius={[12, 12, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border border-[#3c332d] bg-[#2c241f] text-white shadow-[0_30px_100px_rgba(44,36,31,0.24)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#d8ad80]/20 blur-3xl" />

              <div className="relative">
                <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#d8ad80]">
                  Loan Status
                </p>

                <h2 className="mt-3 text-2xl font-extrabold">
                  Workflow Breakdown
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#ead9c8]/70">
                  Approved, pending, rejected and disbursed loan records.
                </p>
              </div>

              <div className="relative mt-5 h-[235px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={loanStatusData}
                      dataKey="value"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={3}
                    >
                      {loanStatusData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-[#ead9c8]/70">
                      Total
                    </p>
                    <p className="text-3xl font-extrabold">
                      {stats.totalLoans}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {loanStatusData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[#ead9c8]/80">{item.name}</span>
                    </div>

                    <span className="font-extrabold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="relative grid gap-6 xl:grid-cols-3">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl xl:col-span-2">
            <CardContent className="relative p-6">
              <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold">Members Overview</h2>
                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Real monthly total and active member growth.
                  </p>
                </div>

                <span className="rounded-full border border-[#d9c8b8] bg-[#f8f1e8] px-4 py-2 text-xs font-extrabold text-[#9b6f45]">
                  Growth Analytics
                </span>
              </div>

              <div className="h-[300px] rounded-[28px] border border-[#d9c8b8] bg-[#efe3d6]/70 p-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.memberGrowth}>
                    <CartesianGrid stroke="#d9c8b8" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#79695d", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#79695d", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total Members"
                      stroke={chartColors.brown}
                      strokeWidth={3}
                      dot={{ r: 4, fill: chartColors.brown }}
                    />
                    <Line
                      type="monotone"
                      dataKey="active"
                      name="Active Members"
                      stroke={chartColors.green}
                      strokeWidth={3}
                      dot={{ r: 4, fill: chartColors.green }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <h2 className="text-2xl font-extrabold">Installment Status</h2>
              <p className="mt-1 text-sm text-[#6b5e54]">
                Collection, pending and overdue amount status.
              </p>

              <div className="mt-6 space-y-4">
                {installmentData.map((item) => {
                  const total =
                    stats.pendingInstallmentAmount +
                    stats.paidInstallmentAmount +
                    stats.overdueInstallmentAmount;

                  const width = getPercentage(item.value, total);

                  return (
                    <div
                      key={item.name}
                      className="rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/70 p-4"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-bold text-[#2b241f]">
                            {item.name}
                          </span>
                        </div>

                        <span className="font-extrabold text-[#9b6f45]">
                          {formatCompactCurrency(item.value)}
                        </span>
                      </div>

                      <div className="mt-3 h-2 rounded-full bg-[#e9dccd]">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.max(width, item.value > 0 ? 8 : 2)}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-[#79695d]">
                        {item.count} installment records
                      </p>
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
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#d8ad80]/25 blur-3xl" />

              <div className="relative mb-6 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-extrabold">Announcements</h2>
                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Latest notices and updates.
                  </p>
                </div>

                <Link
                  href="/dashboard/admin/meeting-notices"
                  className="text-sm font-bold text-[#9b6f45]"
                >
                  View All
                </Link>
              </div>

              <div className="relative space-y-3">
                {announcements.map((item) => (
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
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <h2 className="text-2xl font-extrabold">Quick Shortcuts</h2>
              <p className="mt-1 text-sm text-[#6b5e54]">
                Common admin actions.
              </p>

              <div className="mt-6 grid gap-3">
                <QuickLink
                  title="User Management"
                  href="/dashboard/admin/users"
                  icon={Users}
                  iconColor="text-[#8a5f3c]"
                  iconBg="bg-[#f1e5d8]"
                />

                <QuickLink
                  title="Loan Approvals"
                  href="/dashboard/admin/loan-approvals"
                  icon={FileCheck}
                  iconColor="text-emerald-700"
                  iconBg="bg-emerald-500/10"
                />

                <QuickLink
                  title="Reports & Analytics"
                  href="/dashboard/admin/reports"
                  icon={BarChart3}
                  iconColor="text-blue-700"
                  iconBg="bg-blue-500/10"
                />

                <QuickLink
                  title="Loan Settings"
                  href="/dashboard/admin/loan-settings"
                  icon={Settings}
                  iconColor="text-orange-700"
                  iconBg="bg-orange-500/10"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <h2 className="text-2xl font-extrabold">Approval Ratio</h2>
              <p className="mt-1 text-sm text-[#6b5e54]">
                Current approval, pending and rejected percentage.
              </p>

              <div className="mt-6 space-y-4">
                {[
                  {
                    label: "Approved",
                    value: approvedPercentage,
                    color: chartColors.green,
                  },
                  {
                    label: "Pending",
                    value: pendingPercentage,
                    color: chartColors.amber,
                  },
                  {
                    label: "Rejected",
                    value: rejectedPercentage,
                    color: chartColors.red,
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-[#2b241f]">
                        {item.label}
                      </span>
                      <span className="font-extrabold text-[#9b6f45]">
                        {item.value}%
                      </span>
                    </div>

                    <div className="mt-2 h-3 rounded-full bg-[#e9dccd]">
                      <div
                        className="h-3 rounded-full"
                        style={{
                          width: `${Math.max(item.value, 2)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="relative">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold">
                    Recent Loan Approvals
                  </h2>
                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Latest admin approval records from real database.
                  </p>
                </div>

                <Link href="/dashboard/admin/loan-approvals">
                  <Button className="rounded-2xl bg-[#2c241f] px-5 text-white shadow-lg shadow-[#2c241f]/20 hover:bg-[#9b6f45]">
                    View All Approvals
                  </Button>
                </Link>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-[#d9c8b8] bg-[#f8f1e8]/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[920px] table-fixed text-left text-sm">
                    <colgroup>
                      <col className="w-[230px]" />
                      <col className="w-[140px]" />
                      <col className="w-[210px]" />
                      <col className="w-[170px]" />
                      <col className="w-[170px]" />
                    </colgroup>

                    <thead className="bg-[#efe2d2] text-xs uppercase tracking-wide text-[#6b5e54]">
                      <tr>
                        <th className="px-5 py-4 font-extrabold">Member</th>
                        <th className="px-5 py-4 text-center font-extrabold">
                          Employee ID
                        </th>
                        <th className="px-5 py-4 font-extrabold">Loan Type</th>
                        <th className="px-5 py-4 text-center font-extrabold">
                          Amount
                        </th>
                        <th className="px-5 py-4 text-center font-extrabold">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#d9c8b8]">
                      {recentApprovals.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-5 py-10 text-center text-[#6b5e54]"
                          >
                            No recent approvals found.
                          </td>
                        </tr>
                      ) : (
                        recentApprovals.map((approval) => (
                          <tr
                            key={approval.id}
                            className="bg-[#fbf7ef]/60 transition hover:bg-[#fffaf3] hover:shadow-[inset_4px_0_0_rgba(155,111,69,0.75)]"
                          >
                            <td className="px-5 py-4 align-middle">
                              <p className="truncate font-bold text-[#2b241f]">
                                {approval.memberName || "Unknown Member"}
                              </p>
                              <p className="mt-1 text-xs text-[#79695d]">
                                {formatDate(approval.updatedAt)}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-center align-middle text-[#6b5e54]">
                              {approval.employeeId || "N/A"}
                            </td>

                            <td className="px-5 py-4 align-middle text-[#6b5e54]">
                              <p className="truncate">
                                {approval.loanType || "N/A"}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-center align-middle font-extrabold text-[#9b6f45]">
                              {formatCurrency(approval.amount)}
                            </td>

                            <td className="px-5 py-4 text-center align-middle">
                              <span
                                className={`inline-flex min-w-[145px] justify-center rounded-full border px-3 py-1.5 text-xs font-extrabold ${getStatusBadgeClass(
                                  approval.status
                                )}`}
                              >
                                {formatStatus(approval.status)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
