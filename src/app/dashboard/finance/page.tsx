"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  Landmark,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type StatusColor = "pending" | "approved" | "rejected" | "completed";

type FinanceStats = {
  totalFinanceLoans: number;
  pendingFinanceLoans: number;
  disbursedLoans: number;
  completedLoans: number;
  rejectedLoans: number;
  totalDisbursedAmount: number;
};

type FinanceLoan = {
  id: string;
  reference: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  employeeId: string;
  loanType: string;
  approvedAmount: number;
  monthlyInstallment: number;
  approvedPeriodMonths: number;
  totalRepayment: number;
  status: string;
  statusLabel: string;
  statusColor: StatusColor;
  adminApprovedAt: string | null;
  disbursementDate: string | null;
  updatedAt: string | null;
};

type FinanceDashboardResponse = {
  success: boolean;
  message?: string;
  stats?: FinanceStats;
  recentLoans?: FinanceLoan[];
};

const defaultStats: FinanceStats = {
  totalFinanceLoans: 0,
  pendingFinanceLoans: 0,
  disbursedLoans: 0,
  completedLoans: 0,
  rejectedLoans: 0,
  totalDisbursedAmount: 0,
};

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatDate(dateValue?: string | null) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(statusColor: StatusColor) {
  if (statusColor === "approved") {
    return "border-emerald-500/20 bg-emerald-500/15 text-emerald-700";
  }

  if (statusColor === "rejected") {
    return "border-red-500/20 bg-red-500/15 text-red-700";
  }

  if (statusColor === "completed") {
    return "border-[#d8ad80]/35 bg-[#d8ad80]/20 text-[#8a5f3c]";
  }

  return "border-orange-500/20 bg-orange-500/15 text-orange-700";
}

function canProcessFinance(status: string) {
  return (
    status === "pending_finance_processing" ||
    status === "pending_finance" ||
    status === "user_accepted" ||
    status === "approved"
  );
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();
    console.error("NON_JSON_RESPONSE:", text.slice(0, 500));

    throw new Error(
      "API returned HTML instead of JSON. Check /api/finance/dashboard route path."
    );
  }

  return response.json();
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
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  glow: string;
  badge: string;
}) {
  return (
    <Card className="group overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_25px_90px_rgba(44,36,31,0.16)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-[#9b6f45]/45 hover:bg-[#fffaf3]">
      <CardContent className="relative p-6">
        <div
          className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl ${glow}`}
        />

        <div className="relative flex items-start justify-between">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d9c8b8] ${iconBg} ${iconColor} shadow-lg backdrop-blur-xl`}
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

        <h2 className="relative mt-2 text-3xl font-extrabold tracking-tight text-[#2b241f]">
          {value}
        </h2>

        <p className="relative mt-2 text-sm text-[#79695d]">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function FinanceOfficerDashboardPage() {
  const [stats, setStats] = useState<FinanceStats>(defaultStats);
  const [recentLoans, setRecentLoans] = useState<FinanceLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadDashboard(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setMessage("");

      const response = await fetch("/api/finance/dashboard", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await readJsonResponse(
        response
      )) as FinanceDashboardResponse;

      if (!result.success) {
        setMessage(result.message || "Failed to load finance dashboard.");
        setStats(defaultStats);
        setRecentLoans([]);
        return;
      }

      setStats({
        totalFinanceLoans: result.stats?.totalFinanceLoans ?? 0,
        pendingFinanceLoans: result.stats?.pendingFinanceLoans ?? 0,
        disbursedLoans: result.stats?.disbursedLoans ?? 0,
        completedLoans: result.stats?.completedLoans ?? 0,
        rejectedLoans: result.stats?.rejectedLoans ?? 0,
        totalDisbursedAmount: result.stats?.totalDisbursedAmount ?? 0,
      });

      setRecentLoans(
        Array.isArray(result.recentLoans) ? result.recentLoans : []
      );
    } catch (error) {
      console.error("LOAD_FINANCE_DASHBOARD_ERROR", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load finance dashboard."
      );

      setStats(defaultStats);
      setRecentLoans([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#eee6da] text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading finance dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-no-scrollbar min-h-screen overflow-hidden rounded-[34px] bg-[#eee6da] text-[#2b241f]">
      <div className="relative min-h-screen space-y-7 overflow-hidden p-1">
        <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-[#c99b69]/25 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-[480px] w-[480px] rounded-full bg-[#2c241f]/10 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-[360px] w-[360px] rounded-full bg-[#d8ad80]/25 blur-[130px]" />

        <section className="relative overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d8ad80]/25 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
                Finance Portal
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
                Finance Officer Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
                Review member accepted loan offers, process finance approvals,
                manage disbursements and monitor repayment records.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => void loadDashboard(true)}
                className="rounded-2xl bg-[#9b6f45] px-5 text-white shadow-lg shadow-[#9b6f45]/25 hover:bg-[#835c38]"
              >
                <RefreshCcw className="mr-2" size={17} />
                Refresh
              </Button>

              <Link href="/dashboard/finance/loans">
                <Button className="rounded-2xl bg-[#2c241f] px-5 text-white shadow-lg shadow-[#2c241f]/20 hover:bg-[#3a3029]">
                  <Landmark className="mr-2" size={17} />
                  Review Loans
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {message && (
          <div className="relative rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm font-semibold text-red-700">
            {message}
          </div>
        )}

        <section className="relative grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Total Finance Loans"
            value={stats.totalFinanceLoans}
            subtitle="Loans under finance workflow"
            icon={WalletCards}
            iconColor="text-[#8a5f3c]"
            iconBg="bg-[#f1e5d8]"
            glow="bg-[#d8ad80]/30"
            badge="Total"
          />

          <StatCard
            title="Pending Finance"
            value={stats.pendingFinanceLoans}
            subtitle="Waiting for finance action"
            icon={Clock3}
            iconColor="text-orange-700"
            iconBg="bg-orange-500/10"
            glow="bg-orange-500/18"
            badge="Pending"
          />

          <StatCard
            title="Disbursed"
            value={stats.disbursedLoans}
            subtitle="Loans already disbursed"
            icon={CheckCircle2}
            iconColor="text-emerald-700"
            iconBg="bg-emerald-500/10"
            glow="bg-emerald-500/18"
            badge="Paid"
          />

          <StatCard
            title="Completed"
            value={stats.completedLoans}
            subtitle="Fully completed loans"
            icon={ShieldCheck}
            iconColor="text-[#8a5f3c]"
            iconBg="bg-[#f1e5d8]"
            glow="bg-[#d8ad80]/30"
            badge="Done"
          />

          <StatCard
            title="Rejected"
            value={stats.rejectedLoans}
            subtitle="Rejected by finance"
            icon={XCircle}
            iconColor="text-red-700"
            iconBg="bg-red-500/10"
            glow="bg-red-500/16"
            badge="Reject"
          />
        </section>

        <section className="relative grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#2c241f] text-white shadow-[0_30px_100px_rgba(44,36,31,0.24)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#d8ad80]/25 blur-3xl" />

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d8ad80]/25 bg-[#d8ad80]/10 text-[#d8ad80]">
                  <Banknote size={28} />
                </div>

                <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.25em] text-[#d8ad80]">
                  Total Disbursed Amount
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-tight">
                  {formatCurrency(stats.totalDisbursedAmount)}
                </h2>

                <p className="mt-4 text-sm leading-7 text-[#ead9c8]/75">
                  This amount represents finance-approved and disbursed loan
                  values currently recorded in the system.
                </p>

                <div className="mt-7 rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8ad80]">
                    Finance Process
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#ead9c8]/80">
                    Member accepted loans will appear here for final finance
                    approval and disbursement action.
                  </p>
                </div>

                <Link href="/dashboard/finance/loans">
                  <Button className="mt-7 h-12 w-full rounded-2xl bg-[#d8ad80] font-extrabold text-[#2c241f] hover:bg-[#c99b69]">
                    Open Finance Loan Queue
                    <ArrowRight className="ml-2" size={17} />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/20 blur-3xl" />
              <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#9b6f45]/15 blur-3xl" />

              <div className="relative mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold">
                    Recent Finance Loans
                  </h2>

                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Latest loans that are ready for finance review or already
                    processed.
                  </p>
                </div>

                <Link
                  href="/dashboard/finance/loans"
                  className="rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/80 px-4 py-2 text-sm font-bold text-[#9b6f45] transition hover:bg-[#fffaf3]"
                >
                  View Queue
                </Link>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-[#d9c8b8] bg-[#efe3d6]/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] text-left text-sm">
                    <thead className="bg-[#f8f1e8] text-xs uppercase tracking-wide text-[#6b5e54]">
                      <tr>
                        <th className="px-5 py-4">Reference</th>
                        <th className="px-5 py-4">Member</th>
                        <th className="px-5 py-4">Loan Type</th>
                        <th className="px-5 py-4">Approved Amount</th>
                        <th className="px-5 py-4">EMI</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Updated</th>
                        <th className="px-5 py-4">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#d9c8b8]">
                      {recentLoans.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-5 py-10 text-center text-sm font-semibold text-[#6b5e54]"
                          >
                            No finance loan records found.
                          </td>
                        </tr>
                      ) : (
                        recentLoans.map((loan) => (
                          <tr
                            key={loan.id}
                            className="bg-[#fbf7ef]/55 transition hover:bg-[#fffaf3]"
                          >
                            <td className="px-5 py-4 font-semibold text-[#2b241f]">
                              {loan.reference}
                            </td>

                            <td className="px-5 py-4">
                              <p className="font-semibold text-[#2b241f]">
                                {loan.memberName}
                              </p>
                              <p className="mt-1 text-xs text-[#79695d]">
                                {loan.employeeId || loan.memberPhone || "-"}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-[#6b5e54]">
                              {loan.loanType}
                            </td>

                            <td className="px-5 py-4 font-semibold text-[#2b241f]">
                              {formatCurrency(loan.approvedAmount)}
                            </td>

                            <td className="px-5 py-4 font-semibold text-[#2b241f]">
                              {loan.monthlyInstallment
                                ? formatCurrency(loan.monthlyInstallment)
                                : "-"}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                  loan.statusColor
                                )}`}
                              >
                                {loan.statusLabel}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-[#79695d]">
                              {formatDate(loan.updatedAt)}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-2">
                                <Link
                                  href={`/dashboard/finance/loans/${loan.id}`}
                                >
                                  <Button
                                    size="sm"
                                    className="rounded-xl bg-[#2c241f] text-white hover:bg-[#9b6f45]"
                                  >
                                    View
                                  </Button>
                                </Link>

                                {canProcessFinance(loan.status) ? (
                                  <Link
                                    href={`/dashboard/finance/loans/${loan.id}/process`}
                                  >
                                    <Button
                                      size="sm"
                                      className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
                                    >
                                      Process
                                    </Button>
                                  </Link>
                                ) : null}
                              </div>
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

        <section className="grid gap-5 md:grid-cols-3">
          <Card className="rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_24px_80px_rgba(44,36,31,0.12)]">
            <CardContent className="p-6">
              <CreditCard className="text-[#8a5f3c]" size={28} />
              <h3 className="mt-5 text-xl font-extrabold">
                Disbursement Control
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#6b5e54]">
                Process member accepted loans and maintain disbursement records.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_24px_80px_rgba(44,36,31,0.12)]">
            <CardContent className="p-6">
              <Clock3 className="text-orange-700" size={28} />
              <h3 className="mt-5 text-xl font-extrabold">
                Pending Finance Queue
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#6b5e54]">
                Track finance pending loans and review approval readiness.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_24px_80px_rgba(44,36,31,0.12)]">
            <CardContent className="p-6">
              <ShieldCheck className="text-emerald-700" size={28} />
              <h3 className="mt-5 text-xl font-extrabold">Secure Finance</h3>
              <p className="mt-3 text-sm leading-7 text-[#6b5e54]">
                Finance actions are protected by role-based access control.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}