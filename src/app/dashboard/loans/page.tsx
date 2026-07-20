"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  RefreshCcw,
  Search,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type StatusColor = "approved" | "rejected" | "pending" | "completed";

type Loan = {
  id: string;
  reference: string;
  loanType: string;
  amount: number;
  approvedAmount: number;
  purpose: string;
  status: string;
  statusLabel: string;
  statusColor: StatusColor;
  emiAmount: number;
  nextEMIDueDate?: string | null;
  createdAt?: string | null;
};

type ApiResponse = {
  success: boolean;
  loans: Loan[];
  message?: string;
};

const activeStatuses = [
  "user_accepted",
  "pending_finance_processing",
  "pending_finance",
  "under_finance_review",
  "approved",
  "disbursed",
];

const pendingStatuses = [
  "under_welfare_review",
  "pending_officer",
  "pending_admin_approval",
  "pending_admin",
  "under_admin_review",
  "user_offer_pending",
];

const rejectedStatuses = [
  "rejected",
  "welfare_rejected",
  "admin_rejected",
  "finance_rejected",
  "user_rejected",
];

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
  icon: ElementType;
  glow: string;
  badge: string;
  iconColor: string;
  iconBg: string;
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
      </CardContent>
    </Card>
  );
}

export default function MemberLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const initialized = useRef(false);

  async function loadLoans(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const res = await fetch("/api/member/loans", {
        cache: "no-store",
      });

      const data = (await res.json()) as ApiResponse;

      if (!data.success) {
        setError(data.message || "Failed to load loans");
        return;
      }

      setLoans(data.loans || []);
    } catch {
      setError("Something went wrong while loading loans");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    void loadLoans(true);

    const interval = window.setInterval(() => {
      void loadLoans(false);
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLoans = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return loans;

    return loans.filter((loan) => {
      return (
        loan.reference.toLowerCase().includes(query) ||
        loan.loanType.toLowerCase().includes(query) ||
        loan.status.toLowerCase().includes(query) ||
        loan.statusLabel.toLowerCase().includes(query) ||
        loan.purpose.toLowerCase().includes(query)
      );
    });
  }, [loans, search]);

  const totalLoans = loans.length;

  const activeLoans = loans.filter((loan) =>
    activeStatuses.includes(loan.status)
  ).length;

  const pendingLoans = loans.filter((loan) =>
    pendingStatuses.includes(loan.status)
  ).length;

  const rejectedLoans = loans.filter((loan) =>
    rejectedStatuses.includes(loan.status)
  ).length;

  return (
    <div className="dashboard-no-scrollbar min-h-screen overflow-hidden rounded-[34px] bg-[#eee6da] text-[#2b241f]">
      <div className="relative min-h-screen space-y-6 overflow-hidden p-1">
        <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-[#c99b69]/25 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-[480px] w-[480px] rounded-full bg-[#2c241f]/10 blur-[140px]" />

        <section className="relative overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="text-[#9b6f45]" size={28} />
                <h1 className="text-3xl font-extrabold tracking-tight text-[#2b241f] md:text-4xl">
                  My Loans
                </h1>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b5e54]">
                View your loan applications, approvals, disbursements and EMI
                details.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => loadLoans(true)}
                className="rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 text-[#9b6f45] hover:bg-[#fffaf3]"
              >
                <RefreshCcw className="mr-2" size={17} />
                Refresh
              </Button>

              <Link href="/dashboard/loans/apply">
                <Button className="rounded-2xl bg-[#9b6f45] px-5 text-white shadow-lg shadow-[#9b6f45]/25 hover:bg-[#835c38]">
                  Apply Loan
                  <ArrowRight className="ml-2" size={17} />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Loans"
            value={totalLoans}
            subtitle="All submitted applications"
            icon={FileText}
            glow="bg-[#d8ad80]/30"
            badge="Loans"
            iconColor="text-[#8a5f3c]"
            iconBg="bg-orange-100"
          />

          <StatCard
            title="Active Loans"
            value={activeLoans}
            subtitle="Accepted or disbursed loans"
            icon={CheckCircle2}
            glow="bg-emerald-500/18"
            badge="Active"
            iconColor="text-emerald-700"
            iconBg="bg-emerald-100"
          />

          <StatCard
            title="Pending Requests"
            value={pendingLoans}
            subtitle="Waiting for process"
            icon={Clock3}
            glow="bg-orange-500/18"
            badge="Pending"
            iconColor="text-amber-700"
            iconBg="bg-amber-100"
          />

          <StatCard
            title="Rejected Requests"
            value={rejectedLoans}
            subtitle="Applications rejected"
            icon={XCircle}
            glow="bg-red-500/16"
            badge="Rejected"
            iconColor="text-red-700"
            iconBg="bg-red-100"
          />
        </section>

        <section className="relative rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-4 shadow-[0_18px_50px_rgba(44,36,31,0.08)]">
          <div className="flex items-center gap-3 rounded-2xl border border-[#d9c8b8] bg-[#fffaf3] px-4 py-3">
            <Search size={18} className="text-[#9b6f45]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by reference, loan type, purpose or status..."
              className="w-full bg-transparent text-sm font-medium text-[#2b241f] outline-none placeholder:text-[#9b6f45]/60"
            />
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
            Loading loans...
          </div>
        ) : filteredLoans.length === 0 ? (
          <Card className="rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90">
            <CardContent className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-[#d9c8b8]" />
              <p className="mt-4 text-lg font-bold text-[#6b5e54]">
                No loans found
              </p>
              <p className="mt-1 text-sm text-[#8b7a6d]">
                Apply for a loan or change the search keyword.
              </p>
            </CardContent>
          </Card>
        ) : (
          <section className="space-y-4">
            {filteredLoans.map((loan) => (
              <Card
                key={loan.id}
                className="rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 shadow-[0_18px_50px_rgba(44,36,31,0.07)] transition hover:shadow-[0_25px_70px_rgba(44,36,31,0.13)]"
              >
                <CardContent className="flex flex-col justify-between gap-4 p-5 xl:flex-row xl:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-extrabold text-[#2b241f]">
                        {loan.loanType}
                      </h3>
                      <span className="rounded-full border border-[#d9c8b8] bg-[#fffaf3] px-3 py-1 text-xs font-bold text-[#9b6f45]">
                        {loan.reference}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-[#6b5e54]">
                      Requested: Rs. {Number(loan.amount || 0).toLocaleString()}
                      {loan.approvedAmount > 0
                        ? ` • Approved: Rs. ${Number(
                            loan.approvedAmount || 0
                          ).toLocaleString()}`
                        : ""}
                    </p>

                    <p className="mt-1 max-w-3xl text-xs leading-5 text-[#8b7a6d]">
                      Purpose: {loan.purpose}
                    </p>

                    {loan.emiAmount > 0 && (
                      <p className="mt-1 text-xs text-[#8b7a6d]">
                        EMI: Rs. {Number(loan.emiAmount).toLocaleString()}
                      </p>
                    )}

                    {loan.nextEMIDueDate && (
                      <p className="mt-1 text-xs text-[#8b7a6d]">
                        Next EMI Due:{" "}
                        {new Date(loan.nextEMIDueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        loan.statusColor === "approved"
                          ? "bg-green-100 text-green-700"
                          : loan.statusColor === "rejected"
                          ? "bg-red-100 text-red-700"
                          : loan.statusColor === "completed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {loan.statusLabel}
                    </span>

                    <Link href={`/dashboard/loans/${loan.id}`}>
                      <Button
                        variant="outline"
                        className="rounded-2xl border-[#d9c8b8] bg-[#f8f1e8] text-[#9b6f45] hover:bg-[#fffaf3]"
                      >
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}