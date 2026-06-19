"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck,
  Landmark,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type LoanDocument = {
  _id?: string;
  id?: string;
  status?: string;
};

type LoanReview = {
  id?: string;
  _id?: string;
  reference?: string;

  member?: string;
  fullName?: string;
  email?: string;

  userId?: {
    fullName?: string;
    email?: string;
  };

  loanType?: string;
  amount?: number;
  requestedAmount?: number;
  purpose?: string;
  monthlyIncome?: number;
  employmentType?: string;

  status?: string;
  statusLabel?: string;
  documentStatus?: string;

  documents?: LoanDocument[];
  uploadedDocuments?: LoanDocument[];

  createdAt?: string;
  updatedAt?: string;
};

type LoanReviewResponse = {
  success: boolean;
  message?: string;
  loans?: LoanReview[];
};

function safeText(value: unknown) {
  return String(value || "").trim();
}

function normalizeStatus(status?: string) {
  return safeText(status).toLowerCase();
}

function getLoanId(loan: LoanReview) {
  return safeText(loan.id || loan._id);
}

function getMemberName(loan: LoanReview) {
  return (
    loan.userId?.fullName ||
    loan.member ||
    loan.fullName ||
    "Unknown Member"
  );
}

function getMemberEmail(loan: LoanReview) {
  return loan.userId?.email || loan.email || "No email";
}

function getAmount(loan: LoanReview) {
  return loan.requestedAmount || loan.amount || 0;
}

function getDocuments(loan: LoanReview) {
  return loan.documents || loan.uploadedDocuments || [];
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
    value === "approved" ||
    value === "admin_approved" ||
    value === "user_offer_pending" ||
    value === "pending_finance_processing" ||
    value.includes("officer_approved") ||
    value.includes("pending_admin") ||
    value.includes("approved")
  );
}

function isRejectedLoan(status?: string) {
  const value = normalizeStatus(status);

  return (
    value === "officer_rejected" ||
    value === "admin_rejected" ||
    value === "rejected" ||
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

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
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

function getStatusClass(status?: string) {
  const normalized = normalizeStatus(status);

  if (isApprovedLoan(normalized) || normalized.includes("verified")) {
    return "border-emerald-600/25 bg-emerald-100 text-emerald-700";
  }

  if (isRejectedLoan(normalized)) {
    return "border-red-500/20 bg-red-100 text-red-700";
  }

  return "border-[#d8ad80]/50 bg-[#f6eadc] text-[#9b6f45]";
}

function getStatusLabel(status?: string) {
  return safeText(status || "pending_officer")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRowKey(loan: LoanReview, index: number) {
  const loanId = getLoanId(loan);

  return [
    loanId || "no-id",
    safeText(loan.reference) || "no-reference",
    safeText(getMemberName(loan)) || "no-member",
    safeText(loan.createdAt) || "no-date",
    index,
  ].join("-");
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();
    console.error("NON_JSON_RESPONSE:", text.slice(0, 500));
    throw new Error(
      "API returned HTML instead of JSON. Check /api/officer/loans route path."
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
  value: number;
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

        <h2 className="relative mt-2 text-4xl font-extrabold tracking-tight text-[#2b241f]">
          {value}
        </h2>

        <p className="relative mt-2 text-sm text-[#79695d]">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function OfficerLoanReviewsPage() {
  const [loans, setLoans] = useState<LoanReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  async function loadLoans(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setRefreshing(true);
      setMessage("");

      const response = await fetch("/api/officer/loans", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await readJsonResponse(response)) as LoanReviewResponse;

      if (!result.success) {
        setLoans([]);
        setMessage(result.message || "Failed to load loan reviews.");
        return;
      }

      setLoans(Array.isArray(result.loans) ? result.loans : []);
    } catch (error) {
      console.error("LOAD_OFFICER_LOANS_ERROR", error);
      setLoans([]);
      setMessage(
        error instanceof Error ? error.message : "Failed to load loan reviews."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLoans(true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const searchValue = searchTerm.toLowerCase().trim();

  const filteredLoans = useMemo(() => {
    if (!searchValue) return loans;

    return loans.filter((loan) => {
      return (
        safeText(loan.reference).toLowerCase().includes(searchValue) ||
        getMemberName(loan).toLowerCase().includes(searchValue) ||
        getMemberEmail(loan).toLowerCase().includes(searchValue) ||
        safeText(loan.loanType).toLowerCase().includes(searchValue) ||
        safeText(loan.purpose).toLowerCase().includes(searchValue) ||
        safeText(loan.status).toLowerCase().includes(searchValue) ||
        safeText(loan.statusLabel).toLowerCase().includes(searchValue)
      );
    });
  }, [loans, searchValue]);

  const pendingReviews = useMemo(() => {
    return loans.filter((loan) => isPendingReview(loan.status)).length;
  }, [loans]);

  const verifiedDocuments = useMemo(() => {
    return loans.reduce((total, loan) => {
      const documents = getDocuments(loan);

      return (
        total +
        documents.filter((document) => isVerifiedDocument(document.status))
          .length
      );
    }, 0);
  }, [loans]);

  const approvedLoans = useMemo(() => {
    return loans.filter((loan) => isApprovedLoan(loan.status)).length;
  }, [loans]);

  const rejectedLoans = useMemo(() => {
    return loans.filter((loan) => isRejectedLoan(loan.status)).length;
  }, [loans]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#eee6da] text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading loan reviews...
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
                Officer Review
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
                Loan Reviews
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
                Review loan applications, open uploaded documents, verify
                documents and forward approved reports to admin.
              </p>
            </div>

            <Button
              type="button"
              disabled={refreshing}
              onClick={() => void loadLoans(false)}
              className="rounded-2xl bg-[#2c241f] px-5 text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20 transition hover:bg-[#9b6f45] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? (
                <Loader2 className="mr-2 animate-spin" size={17} />
              ) : (
                <RefreshCcw className="mr-2" size={17} />
              )}
              Refresh
            </Button>
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
            value={pendingReviews}
            subtitle="Waiting for officer review"
            icon={Clock3}
            iconColor="text-[#9b6f45]"
            iconBg="bg-[#f6eadc]"
            glow="bg-[#d8ad80]/25"
            badge="Pending"
          />

          <StatCard
            title="Verified Documents"
            value={verifiedDocuments}
            subtitle="Documents verified by officer"
            icon={FileCheck}
            iconColor="text-emerald-700"
            iconBg="bg-emerald-100"
            glow="bg-emerald-400/20"
            badge="Verified"
          />

          <StatCard
            title="Approved Loans"
            value={approvedLoans}
            subtitle="Forwarded to admin / approved"
            icon={CheckCircle2}
            iconColor="text-emerald-700"
            iconBg="bg-emerald-100"
            glow="bg-emerald-400/20"
            badge="Approved"
          />

          <StatCard
            title="Rejected Loans"
            value={rejectedLoans}
            subtitle="Rejected loan applications"
            icon={XCircle}
            iconColor="text-red-700"
            iconBg="bg-red-100"
            glow="bg-red-400/15"
            badge="Rejected"
          />
        </section>

        <section className="relative">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/20 blur-3xl" />
              <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#2c241f]/10 blur-3xl" />

              <div className="relative mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#2b241f]">
                    Loan Review Queue
                  </h2>

                  <p className="mt-1 text-sm text-[#6b5e54]">
                    All applications assigned to the welfare officer.
                  </p>
                </div>

                <div className="relative w-full lg:w-[380px]">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9b6f45]"
                  />

                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search loan reviews..."
                    className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 pl-11 text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                  />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] table-fixed text-left text-sm">
                    <thead className="bg-[#efe2d2] text-xs uppercase tracking-wide text-[#6b5e54]">
                      <tr>
                        <th className="w-[150px] px-5 py-4 font-extrabold">
                          Reference
                        </th>
                        <th className="w-[230px] px-5 py-4 font-extrabold">
                          Member
                        </th>
                        <th className="w-[180px] px-5 py-4 font-extrabold">
                          Loan Type
                        </th>
                        <th className="w-[150px] px-5 py-4 text-center font-extrabold">
                          Amount
                        </th>
                        <th className="w-[150px] px-5 py-4 text-center font-extrabold">
                          Documents
                        </th>
                        <th className="w-[170px] px-5 py-4 text-center font-extrabold">
                          Status
                        </th>
                        <th className="w-[130px] px-5 py-4 text-center font-extrabold">
                          Date
                        </th>
                        <th className="w-[140px] px-5 py-4 text-center font-extrabold">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#d9c8b8]">
                      {filteredLoans.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-5 py-10 text-center text-[#6b5e54]"
                          >
                            No loan reviews found.
                          </td>
                        </tr>
                      ) : (
                        filteredLoans.map((loan, index) => {
                          const loanId = getLoanId(loan);
                          const documents = getDocuments(loan);
                          const verifiedCount = documents.filter((document) =>
                            isVerifiedDocument(document.status)
                          ).length;

                          return (
                            <tr
                              key={getRowKey(loan, index)}
                              className="bg-[#fbf7ef]/60 transition hover:bg-[#fffaf3] hover:shadow-[inset_4px_0_0_rgba(155,111,69,0.75)]"
                            >
                              <td className="px-5 py-4 align-middle font-semibold text-[#2b241f]">
                                <p className="truncate">
                                  {loan.reference || loanId || "N/A"}
                                </p>
                              </td>

                              <td className="px-5 py-4 align-middle">
                                <p className="truncate font-bold text-[#2b241f]">
                                  {getMemberName(loan)}
                                </p>

                                <p className="mt-1 truncate text-xs text-[#79695d]">
                                  {getMemberEmail(loan)}
                                </p>
                              </td>

                              <td className="px-5 py-4 align-middle text-[#6b5e54]">
                                <p className="truncate">
                                  {loan.loanType || "Loan Request"}
                                </p>
                              </td>

                              <td className="px-5 py-4 text-center align-middle font-bold text-[#2b241f]">
                                <span className="whitespace-nowrap">
                                  {formatCurrency(getAmount(loan))}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-center align-middle">
                                <span className="inline-flex min-w-[90px] justify-center rounded-full border border-[#d8ad80]/50 bg-[#f6eadc] px-3 py-1 text-xs font-bold text-[#9b6f45]">
                                  {verifiedCount}/{documents.length}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-center align-middle">
                                <span
                                  className={`inline-flex min-w-[130px] justify-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusClass(
                                    loan.status
                                  )}`}
                                >
                                  {loan.statusLabel ||
                                    getStatusLabel(loan.status)}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-center align-middle text-[#79695d]">
                                <span className="whitespace-nowrap">
                                  {formatDate(loan.updatedAt || loan.createdAt)}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-center align-middle">
                                {loanId ? (
                                  <Link
                                    href={`/dashboard/officer/loans/${loanId}`}
                                  >
                                    <Button
                                      size="sm"
                                      className="h-9 rounded-xl bg-[#2c241f] px-3 text-xs font-bold text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20 transition hover:bg-[#9b6f45]"
                                    >
                                      <Eye className="mr-1" size={15} />
                                      View
                                    </Button>
                                  </Link>
                                ) : (
                                  <Button
                                    size="sm"
                                    disabled
                                    className="h-9 rounded-xl bg-[#2c241f] px-3 text-xs font-bold text-[#fbf7ef] opacity-50"
                                  >
                                    No ID
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="relative mt-4 flex flex-col justify-between gap-3 text-sm text-[#6b5e54] md:flex-row">
                <p>
                  Showing{" "}
                  <span className="font-bold text-[#9b6f45]">
                    {filteredLoans.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#9b6f45]">
                    {loans.length}
                  </span>{" "}
                  loan reviews
                </p>

                <p>
                  Counts are calculated from current loan status and document
                  status.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}