"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ElementType } from "react";

import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck,
  Landmark,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ReviewStatusColor = "approved" | "rejected" | "pending";

type OfficerStats = {
  pendingReviews: number;
  verifiedDocuments: number;
  approvedLoans: number;
  rejectedLoans: number;
};

type LoanDocument = {
  _id?: string;
  id?: string;
  status?: string;
};

type OfficerLoan = {
  _id?: string;
  id?: string;
  reference?: string;
  userId?: {
    fullName?: string;
    email?: string;
  };
  member?: string;
  fullName?: string;
  loanType?: string;
  requestedAmount?: number;
  amount?: number;
  status?: string;
  statusLabel?: string;
  documents?: LoanDocument[];
  uploadedDocuments?: LoanDocument[];
  createdAt?: string;
  updatedAt?: string;
};

type RecentReview = {
  id: string;
  reference: string;
  member: string;
  loanType: string;
  amount: number;
  status: string;
  statusLabel: string;
  statusColor: ReviewStatusColor;
  date: string;
};

type OfficerStatsResponse = {
  success: boolean;
  message?: string;
  stats?: Partial<OfficerStats>;
  data?: {
    stats?: Partial<OfficerStats>;
    recentReviews?: RecentReview[];
    loans?: OfficerLoan[];
  };
  recentReviews?: RecentReview[];
  loans?: OfficerLoan[];
};

type OfficerLoansResponse = {
  success: boolean;
  message?: string;
  loans?: OfficerLoan[];
};

const defaultStats: OfficerStats = {
  pendingReviews: 0,
  verifiedDocuments: 0,
  approvedLoans: 0,
  rejectedLoans: 0,
};

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(dateValue?: string) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeStatus(status?: string) {
  return String(status || "").toLowerCase().trim();
}

function isPendingReview(status?: string) {
  const value = normalizeStatus(status);

  return (
    value === "pending_officer" ||
    value === "under_welfare_review" ||
    value === "officer_review" ||
    value === "pending_review" ||
    value === "pending" ||
    value.includes("pending_officer") ||
    value.includes("welfare_review")
  );
}

function isApprovedLoan(status?: string) {
  const value = normalizeStatus(status);

  return (
    value === "officer_approved" ||
    value === "pending_admin_approval" ||
    value === "admin_approved" ||
    value === "approved" ||
    value === "user_offer_pending" ||
    value === "pending_finance_processing" ||
    value.includes("officer_approved") ||
    value.includes("pending_admin") ||
    value.includes("admin_approved")
  );
}

function isRejectedLoan(status?: string) {
  const value = normalizeStatus(status);

  return (
    value === "officer_rejected" ||
    value === "admin_rejected" ||
    value === "rejected" ||
    value.includes("rejected") ||
    value.includes("reject")
  );
}

function isVerifiedDocument(status?: string) {
  const value = normalizeStatus(status);

  return (
    value === "verified" ||
    value === "approved" ||
    value === "document_verified" ||
    value.includes("verified")
  );
}

function getLoanDocuments(loan: OfficerLoan) {
  return loan.documents || loan.uploadedDocuments || [];
}

function calculateStatsFromLoans(loans: OfficerLoan[]): OfficerStats {
  const pendingReviews = loans.filter((loan) =>
    isPendingReview(loan.status)
  ).length;

  const approvedLoans = loans.filter((loan) =>
    isApprovedLoan(loan.status)
  ).length;

  const rejectedLoans = loans.filter((loan) =>
    isRejectedLoan(loan.status)
  ).length;

  const verifiedDocuments = loans.reduce((total, loan) => {
    const documents = getLoanDocuments(loan);

    return (
      total +
      documents.filter((document) => isVerifiedDocument(document.status)).length
    );
  }, 0);

  return {
    pendingReviews,
    verifiedDocuments,
    approvedLoans,
    rejectedLoans,
  };
}

function toRecentReviews(loans: OfficerLoan[]): RecentReview[] {
  return loans.slice(0, 6).map((loan) => {
    const status = normalizeStatus(loan.status);

    let statusColor: ReviewStatusColor = "pending";

    if (isApprovedLoan(status)) {
      statusColor = "approved";
    }

    if (isRejectedLoan(status)) {
      statusColor = "rejected";
    }

    return {
      id: loan._id || loan.id || "",
      reference: loan.reference || loan._id || loan.id || "N/A",
      member:
        loan.userId?.fullName ||
        loan.member ||
        loan.fullName ||
        "Unknown Member",
      loanType: loan.loanType || "Loan Request",
      amount: loan.requestedAmount || loan.amount || 0,
      status: loan.status || "pending_officer",
      statusLabel:
        loan.statusLabel ||
        String(loan.status || "pending_officer").replaceAll("_", " "),
      statusColor,
      date: loan.updatedAt || loan.createdAt || "",
    };
  });
}

function getStatusClass(statusColor: ReviewStatusColor) {
  if (statusColor === "approved") {
    return "border-emerald-600/25 bg-emerald-100 text-emerald-700";
  }

  if (statusColor === "rejected") {
    return "border-red-500/20 bg-red-100 text-red-700";
  }

  return "border-[#d8ad80]/50 bg-[#f6eadc] text-[#9b6f45]";
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  iconColor,
  iconBg,
  glow,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: ElementType;
  badge: string;
  iconColor: string;
  iconBg: string;
  glow: string;
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

        <h2 className="relative mt-2 text-4xl font-extrabold tracking-tight text-[#2b241f]">
          {value}
        </h2>

        <p className="relative mt-2 text-sm text-[#79695d]">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    await response.text();
    throw new Error("API returned HTML instead of JSON");
  }

  return response.json();
}

export default function OfficerDashboardPage() {
  const [stats, setStats] = useState<OfficerStats>(defaultStats);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const loadOfficerData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setRefreshing(true);
      setMessage("");

      const response = await fetch("/api/officer/stats", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await readJsonResponse(response)) as OfficerStatsResponse;

      if (!result.success) {
        setMessage(result.message || "Failed to load officer dashboard data.");
        return;
      }

      const directStats = result.stats || result.data?.stats;
      const loansFromStatsApi = result.loans || result.data?.loans || [];

      if (directStats) {
        setStats({
          pendingReviews: Number(directStats.pendingReviews || 0),
          verifiedDocuments: Number(directStats.verifiedDocuments || 0),
          approvedLoans: Number(directStats.approvedLoans || 0),
          rejectedLoans: Number(directStats.rejectedLoans || 0),
        });
      } else if (loansFromStatsApi.length > 0) {
        setStats(calculateStatsFromLoans(loansFromStatsApi));
      } else {
        const loansResponse = await fetch("/api/officer/loans", {
          method: "GET",
          cache: "no-store",
        });

        const loansResult = (await readJsonResponse(
          loansResponse
        )) as OfficerLoansResponse;

        if (loansResult.success && loansResult.loans) {
          setStats(calculateStatsFromLoans(loansResult.loans));
          setRecentReviews(toRecentReviews(loansResult.loans));
          return;
        }

        setStats(defaultStats);
      }

      const reviews =
        result.recentReviews ||
        result.data?.recentReviews ||
        toRecentReviews(loansFromStatsApi);

      setRecentReviews(reviews);
    } catch (error) {
      console.error("LOAD_OFFICER_DASHBOARD_ERROR", error);
      setMessage("Failed to load officer dashboard data.");
      setStats(defaultStats);
      setRecentReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOfficerData(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadOfficerData]);

  const totalProcessed = useMemo(() => {
    return stats.approvedLoans + stats.rejectedLoans;
  }, [stats.approvedLoans, stats.rejectedLoans]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#eee6da] text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading officer dashboard...
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
                Welfare Officer
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
                Officer Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
                Review member loan applications, verify uploaded documents and
                forward approved loan reports to admin approval.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                disabled={refreshing}
                onClick={() => void loadOfficerData(false)}
                className="rounded-2xl bg-[#2c241f] px-5 text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20 transition hover:bg-[#9b6f45] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? (
                  <Loader2 className="mr-2 animate-spin" size={17} />
                ) : (
                  <RefreshCcw className="mr-2" size={17} />
                )}
                Refresh Counts
              </Button>

              <Link href="/dashboard/officer/loans">
                <Button className="rounded-2xl bg-[#9b6f45] px-5 text-white shadow-lg shadow-[#9b6f45]/25 hover:bg-[#835c38]">
                  Open Reviews
                  <ArrowRight className="ml-2" size={17} />
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

        <section className="relative grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Pending Reviews"
            value={stats.pendingReviews}
            subtitle="Loan requests waiting for officer review"
            icon={Clock3}
            badge="Pending"
            iconColor="text-[#9b6f45]"
            iconBg="bg-[#f6eadc]"
            glow="bg-[#d8ad80]/25"
          />

          <StatCard
            title="Verified Documents"
            value={stats.verifiedDocuments}
            subtitle="Documents verified by officer"
            icon={FileCheck}
            badge="Verified"
            iconColor="text-emerald-700"
            iconBg="bg-emerald-100"
            glow="bg-emerald-400/20"
          />

          <StatCard
            title="Approved Loans"
            value={stats.approvedLoans}
            subtitle="Loans forwarded to admin or approved"
            icon={CheckCircle2}
            badge="Approved"
            iconColor="text-emerald-700"
            iconBg="bg-emerald-100"
            glow="bg-emerald-400/20"
          />

          <StatCard
            title="Rejected Loans"
            value={stats.rejectedLoans}
            subtitle="Loan applications rejected by officer/admin"
            icon={XCircle}
            badge="Rejected"
            iconColor="text-red-700"
            iconBg="bg-red-100"
            glow="bg-red-400/15"
          />
        </section>

        <section className="relative grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/20 blur-3xl" />

              <div className="relative mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold">
                    Recent Loan Reviews
                  </h2>
                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Latest applications assigned to officer workflow.
                  </p>
                </div>

                <Link href="/dashboard/officer/loans">
                  <Button
                    variant="outline"
                    className="rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 text-[#2b241f] hover:bg-[#fffaf3]"
                  >
                    View All
                  </Button>
                </Link>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] table-fixed text-left text-sm">
                    <thead className="bg-[#efe2d2] text-xs uppercase tracking-wide text-[#6b5e54]">
                      <tr>
                        <th className="w-[150px] px-5 py-4 font-extrabold">
                          Reference
                        </th>
                        <th className="w-[210px] px-5 py-4 font-extrabold">
                          Member
                        </th>
                        <th className="w-[170px] px-5 py-4 font-extrabold">
                          Loan Type
                        </th>
                        <th className="w-[145px] px-5 py-4 text-center font-extrabold">
                          Amount
                        </th>
                        <th className="w-[155px] px-5 py-4 text-center font-extrabold">
                          Status
                        </th>
                        <th className="w-[120px] px-5 py-4 text-center font-extrabold">
                          Date
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#d9c8b8]">
                      {recentReviews.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-10 text-center text-[#6b5e54]"
                          >
                            No recent reviews found.
                          </td>
                        </tr>
                      ) : (
                        recentReviews.map((review) => (
                          <tr
                            key={review.id || review.reference}
                            className="bg-[#fbf7ef]/60 transition hover:bg-[#fffaf3] hover:shadow-[inset_4px_0_0_rgba(155,111,69,0.75)]"
                          >
                            <td className="px-5 py-4 align-middle font-semibold text-[#2b241f]">
                              <p className="truncate">{review.reference}</p>
                            </td>

                            <td className="px-5 py-4 align-middle">
                              <p className="truncate font-bold text-[#2b241f]">
                                {review.member}
                              </p>
                            </td>

                            <td className="px-5 py-4 align-middle text-[#6b5e54]">
                              <p className="truncate">{review.loanType}</p>
                            </td>

                            <td className="px-5 py-4 text-center align-middle font-bold text-[#2b241f]">
                              <span className="whitespace-nowrap">
                                {formatCurrency(review.amount)}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center align-middle">
                              <span
                                className={`inline-flex min-w-[115px] justify-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusClass(
                                  review.statusColor
                                )}`}
                              >
                                {review.statusLabel}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center align-middle text-[#79695d]">
                              <span className="whitespace-nowrap">
                                {formatDate(review.date)}
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

          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#2c241f] text-[#fbf7ef] shadow-[0_30px_100px_rgba(44,36,31,0.22)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/25 blur-3xl" />

              <div className="relative">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8ad80]/35 bg-[#d8ad80]/15 text-[#d8ad80]">
                  <ShieldCheck size={24} />
                </div>

                <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#d8ad80]">
                  Officer Summary
                </p>

                <h2 className="mt-4 text-3xl font-extrabold">
                  {totalProcessed} processed reviews
                </h2>

                <p className="mt-4 text-sm leading-7 text-[#f6eadc]/75">
                  This summary updates from officer loan statuses and verified
                  document records. Use Refresh Counts after approving or
                  rejecting records.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                    <p className="text-sm text-[#f6eadc]/70">
                      Pending Reviews
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-[#d8ad80]">
                      {stats.pendingReviews}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                    <p className="text-sm text-[#f6eadc]/70">
                      Verified Documents
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-[#d8ad80]">
                      {stats.verifiedDocuments}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}