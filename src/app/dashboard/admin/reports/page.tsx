"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ElementType } from "react";

import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  FileText,
  Landmark,
  Loader2,
  PieChart as PieChartIcon,
  RefreshCcw,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MonthlyActivity {
  key: string;
  label: string;
  year: number;
  month: number;
  amount: number;
  count: number;
}

interface StatusSummary {
  total: number;
  pending: number;
  offerSent: number;
  financeProcessing: number;
  approved: number;
  rejected: number;
  completed: number;
}

interface RecentActivity {
  id: string;
  type: string;
  member: string;
  amount: number;
  status: string;
  date?: string;
}

interface AdminReports {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;

  totalLoans: number;
  pendingLoans: number;
  offerSentLoans: number;
  financeProcessingLoans: number;
  approvedLoans: number;
  rejectedLoans: number;
  completedLoans: number;

  disbursedAmount: number;
  outstandingAmount: number;
  overdueAmount: number;

  totalPaid: number;
  totalRepayment: number;
  collectionRate: number;

  monthlyLoanActivity: MonthlyActivity[];
  statusSummary: StatusSummary;
  recentActivity: RecentActivity[];
}

interface AdminReportsResponse {
  success: boolean;
  message?: string;
  reports?: AdminReports;
}

const defaultReports: AdminReports = {
  totalMembers: 0,
  activeMembers: 0,
  pendingMembers: 0,

  totalLoans: 0,
  pendingLoans: 0,
  offerSentLoans: 0,
  financeProcessingLoans: 0,
  approvedLoans: 0,
  rejectedLoans: 0,
  completedLoans: 0,

  disbursedAmount: 0,
  outstandingAmount: 0,
  overdueAmount: 0,

  totalPaid: 0,
  totalRepayment: 0,
  collectionRate: 0,

  monthlyLoanActivity: [],
  statusSummary: {
    total: 0,
    pending: 0,
    offerSent: 0,
    financeProcessing: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
  },
  recentActivity: [],
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

const primaryButtonClass =
  "h-12 rounded-2xl bg-[#2c241f] px-5 font-extrabold text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#9b6f45] disabled:cursor-not-allowed disabled:opacity-60";

const outlineButtonClass =
  "h-12 rounded-2xl border border-[#d9c8b8] bg-[#fbf7ef]/90 px-5 font-extrabold text-[#2b241f] shadow-lg shadow-[#2c241f]/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[#9b6f45]/45 hover:bg-[#f1e5d8] disabled:cursor-not-allowed disabled:opacity-60";

function formatCurrency(amount: number) {
  return `LKR ${Number(amount || 0).toLocaleString("en-LK")}`;
}

function formatCompactCurrency(amount: number) {
  const value = Number(amount || 0);

  if (value >= 1_000_000) return `LKR ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `LKR ${(value / 1_000).toFixed(0)}K`;

  return `LKR ${value.toLocaleString("en-LK")}`;
}

function formatDate(date?: string) {
  if (!date) return "N/A";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "N/A";

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status?: string) {
  return String(status || "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function calculatePercentage(value: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.round((Number(value || 0) / Number(total || 0)) * 100);
}

function statusBadgeClass(status: string) {
  const normalized = String(status || "").toLowerCase();

  if (
    normalized.includes("approved") ||
    normalized.includes("completed") ||
    normalized.includes("disbursed") ||
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

  if (
    normalized.includes("rejected") ||
    normalized.includes("cancelled") ||
    normalized.includes("overdue")
  ) {
    return "border-red-500/20 bg-red-100 text-red-700";
  }

  return "border-[#d9c8b8] bg-[#fbf7ef] text-[#9b6f45]";
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  glow,
  badge,
  ratio,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ElementType;
  iconColor: string;
  iconBg: string;
  glow: string;
  badge: string;
  ratio: number;
}) {
  return (
    <Card className="print-card group h-full overflow-hidden rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_25px_90px_rgba(44,36,31,0.14)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#9b6f45]/45 hover:bg-[#fffaf3]">
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
            <span>Report Ratio</span>
            <span className="text-[#9b6f45]">{ratio}%</span>
          </div>

          <div className="mt-3 h-2 rounded-full bg-[#e9dccd]">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#2c241f] via-[#9b6f45] to-[#d8ad80]"
              style={{ width: `${Math.min(Math.max(ratio, 6), 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FinancialTile({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  icon: ElementType;
  tone: "brown" | "green" | "orange" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "orange"
        ? "bg-orange-100 text-orange-700"
        : tone === "red"
          ? "bg-red-100 text-red-700"
          : "bg-[#f1e5d8] text-[#9b6f45]";

  return (
    <div className="print-card rounded-3xl border border-[#d9c8b8] bg-[#fffaf3]/80 p-5 shadow-lg shadow-[#2c241f]/5 transition hover:-translate-y-0.5 hover:bg-[#fffaf3]">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}
      >
        <Icon size={22} />
      </div>

      <p className="mt-5 text-sm font-semibold text-[#6b5e54]">{title}</p>
      <h3 className="mt-2 break-words text-2xl font-extrabold text-[#2b241f]">
        {value}
      </h3>
    </div>
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
            {item.dataKey === "amount" || item.dataKey === "value"
              ? formatCurrency(Number(item.value || 0))
              : Number(item.value || 0).toLocaleString("en-LK")}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReports>(defaultReports);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  async function loadReports(showLoader = false) {
    try {
      if (showLoader) setRefreshing(true);

      setMessage("");

      const response = await fetch("/api/admin/reports", {
        method: "GET",
        cache: "no-store",
      });

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error("API returned HTML instead of JSON");
      }

      const result = (await response.json()) as AdminReportsResponse;

      if (!result.success || !result.reports) {
        setReports(defaultReports);
        setMessage(result.message || "Failed to load reports.");
        return;
      }

      setReports({
        ...defaultReports,
        ...result.reports,
        monthlyLoanActivity: result.reports.monthlyLoanActivity || [],
        statusSummary: {
          ...defaultReports.statusSummary,
          ...(result.reports.statusSummary || {}),
        },
        recentActivity: result.reports.recentActivity || [],
      });
    } catch (error) {
      console.error("LOAD_ADMIN_REPORTS_ERROR", error);
      setMessage("Something went wrong while loading reports.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReports(false);
    }, 0);

    const interval = window.setInterval(() => {
      void loadReports(false);
    }, 15000);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);

  const activeMemberRate = calculatePercentage(
    reports.activeMembers,
    reports.totalMembers
  );

  const approvalRate = calculatePercentage(
    reports.approvedLoans + reports.completedLoans,
    reports.totalLoans
  );

  const pendingRate = calculatePercentage(
    reports.pendingLoans + reports.financeProcessingLoans + reports.offerSentLoans,
    reports.totalLoans
  );

  const overdueRate = calculatePercentage(
    reports.overdueAmount,
    reports.totalRepayment || reports.disbursedAmount
  );

  const collectionPieData = useMemo(
    () => [
      {
        name: "Paid",
        value: reports.totalPaid,
        color: chartColors.green,
      },
      {
        name: "Outstanding",
        value: reports.outstandingAmount,
        color: chartColors.amber,
      },
      {
        name: "Overdue",
        value: reports.overdueAmount,
        color: chartColors.red,
      },
    ],
    [reports.totalPaid, reports.outstandingAmount, reports.overdueAmount]
  );

  const loanStatusData = useMemo(
    () => [
      {
        name: "Approved",
        value: reports.statusSummary.approved,
        color: chartColors.green,
      },
      {
        name: "Pending",
        value: reports.statusSummary.pending,
        color: chartColors.amber,
      },
      {
        name: "Finance",
        value: reports.statusSummary.financeProcessing,
        color: chartColors.blue,
      },
      {
        name: "Rejected",
        value: reports.statusSummary.rejected,
        color: chartColors.red,
      },
      {
        name: "Completed",
        value: reports.statusSummary.completed,
        color: chartColors.teal,
      },
    ],
    [reports.statusSummary]
  );

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#eee6da] text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading admin reports...
      </div>
    );
  }

  return (
    <div className="reports-print-root min-h-screen overflow-visible rounded-[34px] bg-[#eee6da] text-[#2b241f]">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          html,
          body {
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          .reports-print-root,
          .reports-print-root * {
            visibility: visible !important;
          }

          .reports-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-height: auto !important;
            overflow: visible !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #2b241f !important;
          }

          .reports-print-content {
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
          }

          .print-hide {
            display: none !important;
          }

          .print-card,
          .reports-print-root section,
          .reports-print-root table,
          .reports-print-root .recharts-wrapper {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .reports-print-root section {
            margin-bottom: 12px !important;
          }

          .reports-print-root .rounded-\\[32px\\],
          .reports-print-root .rounded-\\[34px\\],
          .reports-print-root .rounded-\\[30px\\],
          .reports-print-root .rounded-\\[28px\\] {
            border-radius: 14px !important;
          }

          .reports-print-root .shadow-\\[0_30px_100px_rgba\\(44\\,36\\,31\\,0\\.16\\)\\],
          .reports-print-root .shadow-\\[0_25px_90px_rgba\\(44\\,36\\,31\\,0\\.14\\)\\],
          .reports-print-root .shadow-lg,
          .reports-print-root .shadow-xl {
            box-shadow: none !important;
          }

          .reports-print-root .backdrop-blur-2xl,
          .reports-print-root .backdrop-blur-xl {
            backdrop-filter: none !important;
          }

          .reports-print-root .grid {
            display: grid !important;
          }

          .reports-print-root .xl\\:grid-cols-4 {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }

          .reports-print-root .xl\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }

          .reports-print-root .xl\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .reports-print-root .xl\\:grid-cols-\\[1\\.35fr_0\\.65fr\\] {
            grid-template-columns: 1.35fr 0.65fr !important;
          }

          .reports-print-root .xl\\:col-span-2 {
            grid-column: span 2 / span 2 !important;
          }

          .reports-print-root h1 {
            font-size: 28px !important;
            line-height: 1.1 !important;
          }

          .reports-print-root h2 {
            font-size: 18px !important;
          }

          .reports-print-root h3 {
            font-size: 16px !important;
          }

          .reports-print-root p,
          .reports-print-root span,
          .reports-print-root td,
          .reports-print-root th {
            font-size: 10px !important;
          }

          .reports-print-root .h-\\[320px\\],
          .reports-print-root .h-\\[300px\\],
          .reports-print-root .h-\\[280px\\],
          .reports-print-root .h-\\[260px\\] {
            height: 210px !important;
          }

          .reports-print-root table {
            min-width: 0 !important;
            width: 100% !important;
          }

          .reports-print-root .overflow-x-auto,
          .reports-print-root .overflow-hidden {
            overflow: visible !important;
          }

          .reports-print-root .pointer-events-none {
            display: none !important;
          }
        }
      `}</style>

      <div className="reports-print-content relative min-h-screen space-y-7 overflow-visible p-1">
        <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-[#c99b69]/25 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-[480px] w-[480px] rounded-full bg-[#2c241f]/10 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-[360px] w-[360px] rounded-full bg-[#d8ad80]/25 blur-[130px]" />

        <section className="relative overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d8ad80]/25 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
                Welfare Analytics
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
                Reports & Analytics
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6b5e54]">
                Enterprise reporting dashboard for member growth, loan approvals,
                disbursements, repayment collection and risk monitoring using
                real database data.
              </p>
            </div>

            <div className="print-hide grid w-full gap-3 sm:grid-cols-2 xl:w-auto">
              <Button
                type="button"
                variant="outline"
                disabled={refreshing}
                onClick={() => void loadReports(true)}
                className={outlineButtonClass}
              >
                {refreshing ? (
                  <Loader2 className="mr-2 animate-spin" size={17} />
                ) : (
                  <RefreshCcw className="mr-2" size={17} />
                )}
                Refresh
              </Button>

              <Button
                type="button"
                onClick={() => window.print()}
                className={primaryButtonClass}
              >
                <Download className="mr-2" size={17} />
                Print Report
              </Button>
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
            value={reports.totalMembers}
            subtitle={`${reports.activeMembers} active, ${reports.pendingMembers} pending`}
            icon={Users}
            iconColor="text-[#9b6f45]"
            iconBg="bg-[#f1e5d8]"
            glow="bg-[#d8ad80]/30"
            badge="Members"
            ratio={activeMemberRate}
          />

          <StatCard
            title="Loan Applications"
            value={reports.totalLoans}
            subtitle={`${reports.pendingLoans} pending, ${reports.approvedLoans} approved`}
            icon={Landmark}
            iconColor="text-[#9b6f45]"
            iconBg="bg-[#f6eadc]"
            glow="bg-[#d8ad80]/25"
            badge="Loans"
            ratio={approvalRate}
          />

          <StatCard
            title="Disbursed Amount"
            value={formatCompactCurrency(reports.disbursedAmount)}
            subtitle={formatCurrency(reports.disbursedAmount)}
            icon={WalletCards}
            iconColor="text-emerald-700"
            iconBg="bg-emerald-100"
            glow="bg-emerald-400/20"
            badge="Finance"
            ratio={calculatePercentage(reports.disbursedAmount, reports.totalRepayment)}
          />

          <StatCard
            title="Overdue Amount"
            value={formatCompactCurrency(reports.overdueAmount)}
            subtitle="Total overdue exposure"
            icon={AlertTriangle}
            iconColor="text-red-700"
            iconBg="bg-red-100"
            glow="bg-red-400/15"
            badge="Risk"
            ratio={overdueRate || 6}
          />
        </section>

        <section className="relative grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <Card className="print-card overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-5 md:p-6">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/20 blur-3xl" />

              <div className="relative mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#2b241f]">
                    Monthly Loan Activity
                  </h2>
                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Real monthly loan amount and application count.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8] px-4 py-2 text-sm font-bold text-[#9b6f45]">
                  Last 12 Months
                </div>
              </div>

              <div className="h-[320px] rounded-[28px] border border-[#d9c8b8] bg-[#efe3d6]/70 p-5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reports.monthlyLoanActivity}>
                    <CartesianGrid stroke="#d9c8b8" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#79695d", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="amount"
                      tick={{ fill: "#79695d", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) =>
                        Number(value) >= 1000
                          ? `${Number(value) / 1000}K`
                          : String(value)
                      }
                    />
                    <YAxis
                      yAxisId="count"
                      orientation="right"
                      tick={{ fill: "#79695d", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      yAxisId="amount"
                      dataKey="amount"
                      name="Amount"
                      fill={chartColors.brown}
                      radius={[12, 12, 0, 0]}
                    />
                    <Area
                      yAxisId="count"
                      type="monotone"
                      dataKey="count"
                      name="Applications"
                      stroke={chartColors.green}
                      fill={chartColors.green}
                      fillOpacity={0.18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="print-card overflow-hidden rounded-[32px] border border-[#3c332d] bg-[#2c241f] text-white shadow-[0_30px_100px_rgba(44,36,31,0.25)]">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#d8ad80]/20 blur-3xl" />

              <PieChartIcon className="text-[#d8ad80]" size={34} />

              <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.25em] text-[#d8ad80]">
                Collection Performance
              </p>

              <h2 className="mt-4 text-5xl font-black">
                {reports.collectionRate}%
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#ead9c8]/75">
                Repayment collection efficiency based on total repayment and
                paid amount.
              </p>

              <div className="mt-6 h-[190px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={collectionPieData}
                      dataKey="value"
                      innerRadius={48}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {collectionPieData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-2">
                {collectionPieData.map((item) => (
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

                    <span className="font-extrabold">
                      {formatCompactCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="relative grid gap-6 xl:grid-cols-4">
          <FinancialTile
            title="Outstanding Amount"
            value={formatCurrency(reports.outstandingAmount)}
            icon={CreditCard}
            tone="orange"
          />

          <FinancialTile
            title="Total Paid"
            value={formatCurrency(reports.totalPaid)}
            icon={CheckCircle2}
            tone="green"
          />

          <FinancialTile
            title="Total Repayment"
            value={formatCurrency(reports.totalRepayment)}
            icon={FileText}
            tone="brown"
          />

          <FinancialTile
            title="Pending Pipeline"
            value={`${pendingRate}%`}
            icon={Clock3}
            tone="red"
          />
        </section>

        <section className="relative grid gap-6 xl:grid-cols-3">
          <Card className="print-card overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-5 md:p-6">
              <h2 className="text-2xl font-extrabold text-[#2b241f]">
                Loan Status Summary
              </h2>
              <p className="mt-1 text-sm text-[#6b5e54]">
                Current workflow status distribution.
              </p>

              <div className="mt-6 h-[260px]">
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
              </div>

              <div className="mt-4 space-y-2">
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
                      <span className="text-[#6b5e54]">{item.name}</span>
                    </div>
                    <span className="font-extrabold text-[#2b241f]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="print-card overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl xl:col-span-2">
            <CardContent className="relative p-5 md:p-6">
              <div className="relative mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#2b241f]">
                    Recent Loan Report Activity
                  </h2>
                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Latest loan records from database.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => window.print()}
                  className="print-hide h-10 rounded-xl bg-[#2c241f] px-4 text-xs font-extrabold text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#9b6f45]"
                >
                  <Download className="mr-1.5" size={15} />
                  Print
                </Button>
              </div>

              <div className="relative overflow-hidden rounded-[28px] border border-[#d9c8b8] bg-[#f8f1e8]/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] table-fixed text-left text-sm">
                    <colgroup>
                      <col className="w-[230px]" />
                      <col className="w-[230px]" />
                      <col className="w-[160px]" />
                      <col className="w-[180px]" />
                      <col className="w-[130px]" />
                    </colgroup>

                    <thead className="bg-[#efe2d2] text-xs uppercase tracking-wide text-[#6b5e54]">
                      <tr>
                        <th className="px-5 py-4 align-middle font-extrabold">
                          Loan Type
                        </th>
                        <th className="px-5 py-4 align-middle font-extrabold">
                          Member
                        </th>
                        <th className="px-5 py-4 text-center align-middle font-extrabold">
                          Amount
                        </th>
                        <th className="px-5 py-4 text-center align-middle font-extrabold">
                          Status
                        </th>
                        <th className="px-5 py-4 text-center align-middle font-extrabold">
                          Date
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#d9c8b8]">
                      {reports.recentActivity.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-5 py-10 text-center text-[#6b5e54]"
                          >
                            No recent loan activity found.
                          </td>
                        </tr>
                      ) : (
                        reports.recentActivity.map((item) => (
                          <tr
                            key={item.id}
                            className="bg-[#fbf7ef]/60 transition hover:bg-[#fffaf3] hover:shadow-[inset_4px_0_0_rgba(155,111,69,0.75)]"
                          >
                            <td className="px-5 py-4 align-middle">
                              <p className="truncate font-bold text-[#2b241f]">
                                {item.type}
                              </p>
                            </td>

                            <td className="px-5 py-4 align-middle">
                              <p className="truncate text-[#6b5e54]">
                                {item.member}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-center align-middle">
                              <p className="whitespace-nowrap font-extrabold text-[#2b241f]">
                                {formatCurrency(item.amount)}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-center align-middle">
                              <span
                                className={`inline-flex min-w-[150px] justify-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-extrabold capitalize ${statusBadgeClass(
                                  item.status
                                )}`}
                              >
                                {formatStatus(item.status)}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center align-middle">
                              <p className="whitespace-nowrap font-semibold text-[#79695d]">
                                {formatDate(item.date)}
                              </p>
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

        <section className="relative grid gap-6 xl:grid-cols-2">
          <Card className="print-card overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-5 md:p-6">
              <h2 className="text-2xl font-extrabold text-[#2b241f]">
                Payment Collection Trend
              </h2>
              <p className="mt-1 text-sm text-[#6b5e54]">
                Paid, outstanding and overdue financial exposure.
              </p>

              <div className="mt-6 h-[280px] rounded-[28px] border border-[#d9c8b8] bg-[#efe3d6]/70 p-5">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      {
                        name: "Paid",
                        value: reports.totalPaid,
                      },
                      {
                        name: "Outstanding",
                        value: reports.outstandingAmount,
                      },
                      {
                        name: "Overdue",
                        value: reports.overdueAmount,
                      },
                    ]}
                  >
                    <CartesianGrid stroke="#d9c8b8" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
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
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="Amount"
                      stroke={chartColors.brown}
                      fill={chartColors.gold}
                      fillOpacity={0.45}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="print-card overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-5 md:p-6">
              <h2 className="text-2xl font-extrabold text-[#2b241f]">
                Professional Summary
              </h2>
              <p className="mt-1 text-sm text-[#6b5e54]">
                Key operational ratios generated from live system data.
              </p>

              <div className="mt-6 space-y-4">
                {[
                  {
                    label: "Active Member Rate",
                    value: activeMemberRate,
                    color: chartColors.green,
                  },
                  {
                    label: "Loan Approval Rate",
                    value: approvalRate,
                    color: chartColors.brown,
                  },
                  {
                    label: "Pending Loan Pipeline",
                    value: pendingRate,
                    color: chartColors.amber,
                  },
                  {
                    label: "Collection Rate",
                    value: reports.collectionRate,
                    color: chartColors.blue,
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
                          width: `${Math.min(Math.max(item.value, 2), 100)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/70 p-4">
                <p className="text-sm font-extrabold text-[#2b241f]">
                  Generated At
                </p>
                <p className="mt-1 text-sm text-[#6b5e54]">
                  {new Date().toLocaleString("en-LK")}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}