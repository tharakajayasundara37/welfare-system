"use client";

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
  PieChart,
  RefreshCcw,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

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

const primaryButtonClass =
  "h-12 rounded-2xl bg-[#2c241f] px-5 font-extrabold text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#9b6f45] disabled:cursor-not-allowed disabled:opacity-60";

const outlineButtonClass =
  "h-12 rounded-2xl border border-[#d9c8b8] bg-[#fbf7ef]/90 px-5 font-extrabold text-[#2b241f] shadow-lg shadow-[#2c241f]/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[#9b6f45]/45 hover:bg-[#f1e5d8] disabled:cursor-not-allowed disabled:opacity-60";

function formatCurrency(amount: number) {
  return `LKR ${Number(amount || 0).toLocaleString("en-LK")}`;
}

function formatDate(date?: string) {
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
    normalized.includes("active") ||
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
  trend,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ElementType;
  iconColor: string;
  iconBg: string;
  glow: string;
  badge: string;
  trend?: string;
}) {
  return (
    <Card className="group h-full overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_25px_90px_rgba(44,36,31,0.16)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#9b6f45]/45 hover:bg-[#fffaf3]">
      <CardContent className="relative flex h-full flex-col p-6">
        <div
          className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl ${glow}`}
        />

        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[#d8ad80]/18 blur-3xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#d9c8b8] ${iconBg} ${iconColor} shadow-lg backdrop-blur-xl`}
          >
            <Icon size={25} />
          </div>

          <span className="rounded-full border border-[#d9c8b8] bg-[#f8f1e8] px-3 py-1 text-[11px] font-bold text-[#9b6f45]">
            {badge}
          </span>
        </div>

        <p className="relative mt-6 text-sm font-semibold text-[#6b5e54]">
          {title}
        </p>

        <h2 className="relative mt-2 break-words text-3xl font-extrabold tracking-tight text-[#2b241f]">
          {value}
        </h2>

        <p className="relative mt-2 text-sm leading-6 text-[#79695d]">
          {subtitle}
        </p>

        <div className="relative mt-5 rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/70 p-3 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6b5e54]">
            <span>Report Status</span>
            <span className="text-[#9b6f45]">{trend || "Live Data"}</span>
          </div>

          <div className="mt-3 h-2 rounded-full bg-[#e9dccd]">
            <div className="h-2 w-[72%] rounded-full bg-gradient-to-r from-[#2c241f] via-[#9b6f45] to-[#d8ad80]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniBarChart({ data }: { data: MonthlyActivity[] }) {
  const chartData =
    data.length > 0
      ? data
      : Array.from({ length: 12 }, (_, index) => ({
          key: `empty-${index}`,
          label: `${index + 1}`,
          year: 0,
          month: index + 1,
          amount: 0,
          count: 0,
        }));

  const maxAmount = Math.max(...chartData.map((item) => item.amount), 1);

  return (
    <div className="relative flex h-[320px] items-end gap-3 rounded-[28px] border border-[#d9c8b8] bg-[#efe3d6]/70 p-5 backdrop-blur-xl md:gap-4">
      {chartData.map((item) => {
        const height =
          item.amount > 0 ? Math.max((item.amount / maxAmount) * 100, 14) : 3;

        return (
          <div
            key={item.key}
            className="flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <div className="h-5 text-[10px] font-bold text-[#9b6f45]">
              {item.amount > 0 ? `${Math.round(item.amount / 1000)}K` : ""}
            </div>

            <div className="flex h-[240px] w-full items-end">
              <div
                title={`${item.label}: ${formatCurrency(item.amount)} / ${
                  item.count
                } loans`}
                className="w-full rounded-t-xl bg-gradient-to-t from-[#2c241f] via-[#9b6f45] to-[#d8ad80] shadow-lg shadow-[#9b6f45]/20 transition-all duration-300 hover:from-[#9b6f45] hover:to-[#e0bf9a]"
                style={{
                  height: `${height}%`,
                  opacity: item.amount > 0 ? 1 : 0.22,
                }}
              />
            </div>

            <span className="text-[10px] font-semibold text-[#79695d]">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatusRow({
  label,
  value,
  percentage,
  colorClass,
}: {
  label: string;
  value: number;
  percentage: number;
  colorClass: string;
}) {
  return (
    <div className="rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/70 p-4 transition hover:border-[#9b6f45]/35 hover:bg-[#fffaf3]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#6b5e54]">{label}</span>
        <span className={`text-sm font-extrabold ${colorClass}`}>{value}</span>
      </div>

      <div className="mt-3 h-2 rounded-full bg-[#e9dccd]">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-[#2c241f] via-[#9b6f45] to-[#d8ad80]"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <p className="mt-2 text-xs font-bold text-[#9b6f45]">{percentage}%</p>
    </div>
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
    <div className="rounded-3xl border border-[#d9c8b8] bg-[#fffaf3]/80 p-5 shadow-lg shadow-[#2c241f]/5 transition hover:-translate-y-0.5 hover:bg-[#fffaf3]">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon size={22} />
      </div>

      <p className="mt-5 text-sm font-semibold text-[#6b5e54]">{title}</p>
      <h3 className="mt-2 break-words text-2xl font-extrabold text-[#2b241f]">
        {value}
      </h3>
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
      if (showLoader) {
        setRefreshing(true);
      }

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
        setMessage(result.message || "Failed to load reports.");
        return;
      }

      setReports(result.reports);
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

  const statusPercentages = useMemo(() => {
    const total = reports.statusSummary.total;

    return {
      approved: calculatePercentage(reports.statusSummary.approved, total),
      pending: calculatePercentage(reports.statusSummary.pending, total),
      rejected: calculatePercentage(reports.statusSummary.rejected, total),
      finance: calculatePercentage(
        reports.statusSummary.financeProcessing,
        total
      ),
      completed: calculatePercentage(reports.statusSummary.completed, total),
    };
  }, [reports.statusSummary]);

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

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#eee6da] text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading admin reports...
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

          <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
                Welfare Analytics
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
                Reports & Analytics
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6b5e54]">
                Enterprise reporting dashboard for member growth, loan
                approvals, disbursements, repayment performance and collection
                monitoring.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto">
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
                Export Report
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
            subtitle={`${reports.activeMembers} active members, ${reports.pendingMembers} pending approvals`}
            icon={Users}
            iconColor="text-[#9b6f45]"
            iconBg="bg-[#f1e5d8]"
            glow="bg-[#d8ad80]/30"
            badge={`${activeMemberRate}% Active`}
            trend="Member Base"
          />

          <StatCard
            title="Loan Applications"
            value={reports.totalLoans}
            subtitle={`${reports.pendingLoans} pending review, ${reports.approvedLoans} approved`}
            icon={Landmark}
            iconColor="text-[#9b6f45]"
            iconBg="bg-[#f6eadc]"
            glow="bg-[#d8ad80]/25"
            badge={`${approvalRate}% Approved`}
            trend="Loan Pipeline"
          />

          <StatCard
            title="Disbursed Amount"
            value={formatCurrency(reports.disbursedAmount)}
            subtitle="Total loan amount released to approved members"
            icon={WalletCards}
            iconColor="text-emerald-700"
            iconBg="bg-emerald-100"
            glow="bg-emerald-400/20"
            badge="Finance"
            trend="Disbursed"
          />

          <StatCard
            title="Overdue Amount"
            value={formatCurrency(reports.overdueAmount)}
            subtitle="Total overdue loan or installment exposure"
            icon={AlertTriangle}
            iconColor="text-red-700"
            iconBg="bg-red-100"
            glow="bg-red-400/15"
            badge="Risk"
            trend="Monitor"
          />
        </section>

        <section className="relative grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/25 blur-3xl" />

              <div className="relative mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold">
                    Monthly Loan Activity
                  </h2>

                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Disbursement and loan activity trend by month.
                  </p>
                </div>

                <span className="rounded-full border border-[#d9c8b8] bg-[#f8f1e8] px-4 py-2 text-xs font-extrabold text-[#9b6f45]">
                  Live Database Data
                </span>
              </div>

              <MiniBarChart data={reports.monthlyLoanActivity} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#2c241f] text-[#fbf7ef] shadow-[0_30px_100px_rgba(44,36,31,0.25)]">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#d8ad80]/20 blur-3xl" />

              <PieChart className="text-[#d8ad80]" size={34} />

              <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.25em] text-[#d8ad80]">
                Collection Performance
              </p>

              <h2 className="mt-4 text-5xl font-black">
                {reports.collectionRate}%
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#ead9c8]/75">
                Current repayment collection efficiency based on total repayment
                and paid amount.
              </p>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                  <p className="text-xs font-bold text-[#d8ad80]">
                    Total Paid
                  </p>
                  <p className="mt-1 text-xl font-extrabold">
                    {formatCurrency(reports.totalPaid)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                  <p className="text-xs font-bold text-[#d8ad80]">
                    Total Repayment
                  </p>
                  <p className="mt-1 text-xl font-extrabold">
                    {formatCurrency(reports.totalRepayment)}
                  </p>
                </div>
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
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <h2 className="text-2xl font-extrabold">Loan Status Summary</h2>
              <p className="mt-1 text-sm text-[#6b5e54]">
                Workflow status distribution.
              </p>

              <div className="mt-6 space-y-3">
                <StatusRow
                  label="Approved"
                  value={reports.statusSummary.approved}
                  percentage={statusPercentages.approved}
                  colorClass="text-emerald-700"
                />

                <StatusRow
                  label="Pending"
                  value={reports.statusSummary.pending}
                  percentage={statusPercentages.pending}
                  colorClass="text-orange-700"
                />

                <StatusRow
                  label="Finance Processing"
                  value={reports.statusSummary.financeProcessing}
                  percentage={statusPercentages.finance}
                  colorClass="text-[#9b6f45]"
                />

                <StatusRow
                  label="Completed"
                  value={reports.statusSummary.completed}
                  percentage={statusPercentages.completed}
                  colorClass="text-blue-700"
                />

                <StatusRow
                  label="Rejected"
                  value={reports.statusSummary.rejected}
                  percentage={statusPercentages.rejected}
                  colorClass="text-red-700"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl xl:col-span-2">
            <CardContent className="relative p-6">
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold">
                    Recent Report Activity
                  </h2>
                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Latest member, loan and payment activities.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => window.print()}
                  className="h-10 rounded-xl bg-[#2c241f] px-4 text-xs font-extrabold text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#9b6f45]"
                >
                  <Download className="mr-1.5" size={15} />
                  Export
                </Button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] text-left text-sm">
                    <thead className="bg-[#efe2d2] text-xs uppercase tracking-wide text-[#6b5e54]">
                      <tr>
                        <th className="px-5 py-4 font-extrabold">Type</th>
                        <th className="px-5 py-4 font-extrabold">Member</th>
                        <th className="px-5 py-4 font-extrabold">Amount</th>
                        <th className="px-5 py-4 font-extrabold">Status</th>
                        <th className="px-5 py-4 font-extrabold">Date</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#d9c8b8]">
                      {reports.recentActivity.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-5 py-10 text-center text-[#6b5e54]"
                          >
                            No recent report activity found.
                          </td>
                        </tr>
                      ) : (
                        reports.recentActivity.map((activity) => (
                          <tr
                            key={activity.id}
                            className="bg-[#fbf7ef]/60 transition hover:bg-[#fffaf3]"
                          >
                            <td className="px-5 py-4 font-bold text-[#2b241f]">
                              {formatStatus(activity.type)}
                            </td>

                            <td className="px-5 py-4 text-[#6b5e54]">
                              {activity.member || "N/A"}
                            </td>

                            <td className="px-5 py-4 font-extrabold text-[#9b6f45]">
                              {formatCurrency(activity.amount)}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold capitalize ${statusBadgeClass(
                                  activity.status
                                )}`}
                              >
                                {formatStatus(activity.status)}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-[#79695d]">
                              {formatDate(activity.date)}
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