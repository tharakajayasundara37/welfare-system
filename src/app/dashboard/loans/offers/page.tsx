"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CheckCircle2,
  Clock3,
  FileText,
  Landmark,
  Loader2,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface LoanUser {
  _id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  nic?: string;
  employeeId?: string;
  department?: string;
  jobRole?: string;
  companyName?: string;
  salaryRange?: string;
}

interface StaffUser {
  _id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  employeeId?: string;
}

interface Loan {
  _id: string;
  userId?: LoanUser;
  welfareOfficerId?: StaffUser;
  adminId?: StaffUser;

  loanType?: string;
  requestedAmount?: number;
  approvedAmount?: number;
  purpose?: string;

  systemInterestRate?: number;
  preferredPeriodMonths?: number;
  approvedPeriodMonths?: number;
  monthlyInstallment?: number;
  totalRepayment?: number;
  remainingBalance?: number;

  riskLevel?: string;
  eligibilityStatus?: string;
  status?: string;
  userAcceptanceStatus?: string;

  officerRemark?: string;
  adminRemark?: string;
  approvalLetterUrl?: string;
  approvalLetterGeneratedAt?: string;

  createdAt?: string;
  updatedAt?: string;
}

interface MyOffersResponse {
  success: boolean;
  loans?: Loan[];
  message?: string;
}

interface OfferActionResponse {
  success: boolean;
  loan?: Loan;
  message?: string;
}

function formatCurrency(amount?: number) {
  if (amount === undefined || amount === null) return "LKR 0";

  return `LKR ${Number(amount).toLocaleString("en-LK", {
    maximumFractionDigits: 0,
  })}`;
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

function getStatusLabel(status?: string) {
  if (status === "user_offer_pending") return "Waiting for Your Decision";
  if (status === "pending_finance_processing") return "Sent to Finance";
  if (status === "pending_finance") return "Waiting Finance Review";
  if (status === "user_accepted") return "Accepted";
  if (status === "user_rejected") return "Rejected";

  return status?.replaceAll("_", " ") || "Unknown";
}

function getStatusStyle(status?: string) {
  if (status === "user_offer_pending") {
    return "border-[#d8ad80]/50 bg-[#f6eadc] text-[#9b6f45]";
  }

  if (
    status === "pending_finance_processing" ||
    status === "pending_finance" ||
    status === "user_accepted"
  ) {
    return "border-emerald-600/25 bg-emerald-100 text-emerald-700";
  }

  if (status === "user_rejected") {
    return "border-red-500/20 bg-red-100 text-red-700";
  }

  return "border-[#d9c8b8] bg-[#fbf7ef] text-[#9b6f45]";
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();
    console.error("NON_JSON_RESPONSE:", text.slice(0, 500));

    throw new Error(
      "API returned HTML instead of JSON. Check /api/loans/my-offers route path."
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
    <Card className="group overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_25px_90px_rgba(44,36,31,0.16)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#9b6f45]/45 hover:bg-[#fffaf3]">
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

export default function MemberLoanOffersPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchText, setSearchText] = useState("");

  async function loadOffers() {
    try {
      setLoading(true);
      setMessage("");
      setIsSuccess(false);

      const response = await fetch("/api/loans/my-offers", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await readJsonResponse(response)) as MyOffersResponse;

      if (!result.success) {
        setLoans([]);
        setMessage(result.message || "Failed to load loan offers.");
        setIsSuccess(false);
        return;
      }

      setLoans(Array.isArray(result.loans) ? result.loans : []);
    } catch (error) {
      console.error("LOAD_MY_OFFERS_ERROR", error);
      setLoans([]);
      setMessage(
        error instanceof Error ? error.message : "Failed to load loan offers."
      );
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOffers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function handleOfferAction(loanId: string, action: "accept" | "reject") {
    try {
      const confirmed = window.confirm(
        action === "accept"
          ? "Are you sure you want to accept this loan offer?"
          : "Are you sure you want to reject this loan offer?"
      );

      if (!confirmed) return;

      setActionLoadingId(`${action}-${loanId}`);
      setMessage("");
      setIsSuccess(false);

      const apiUrl =
        action === "accept"
          ? `/api/loans/${loanId}/accept-offer`
          : `/api/loans/${loanId}/reject-offer`;

      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason:
            action === "reject"
              ? "Member rejected the approved loan offer."
              : "",
        }),
      });

      const result = (await readJsonResponse(response)) as OfferActionResponse;

      if (!result.success) {
        setMessage(result.message || `Failed to ${action} offer.`);
        setIsSuccess(false);
        return;
      }

      if (result.loan) {
        setLoans((prevLoans) =>
          prevLoans.map((loan) =>
            loan._id === loanId ? (result.loan as Loan) : loan
          )
        );
      } else {
        await loadOffers();
      }

      setMessage(result.message || "Offer action completed successfully.");
      setIsSuccess(true);
    } catch (error) {
      console.error("OFFER_ACTION_ERROR", error);
      setMessage(
        error instanceof Error
          ? error.message
          : `Failed to ${action} loan offer.`
      );
      setIsSuccess(false);
    } finally {
      setActionLoadingId("");
    }
  }

  const filteredLoans = useMemo(() => {
    const keyword = searchText.toLowerCase().trim();

    if (!keyword) return loans;

    return loans.filter((loan) => {
      const searchableText = [
        loan.loanType,
        loan.purpose,
        loan.status,
        loan.userAcceptanceStatus,
        loan.adminId?.fullName,
        loan.welfareOfficerId?.fullName,
        loan.approvedAmount,
        loan.requestedAmount,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      return searchableText.includes(keyword);
    });
  }, [loans, searchText]);

  const pendingCount = loans.filter(
    (loan) => loan.status === "user_offer_pending"
  ).length;

  const acceptedCount = loans.filter(
    (loan) =>
      loan.status === "pending_finance_processing" ||
      loan.status === "pending_finance" ||
      loan.status === "user_accepted"
  ).length;

  const rejectedCount = loans.filter(
    (loan) => loan.status === "user_rejected"
  ).length;

  const totalCount = loans.length;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#eee6da] text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading your loan offers...
      </div>
    );
  }

  return (
    <div className="relative min-h-full space-y-6 overflow-hidden rounded-[34px] bg-[#eee6da] p-1 text-[#2b241f]">
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
              My Loan Offers
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
              View your approval letter, review loan terms and accept or reject
              the offer.
            </p>
          </div>

          <Button
            onClick={() => void loadOffers()}
            className="rounded-2xl bg-[#2c241f] px-5 text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20 transition hover:bg-[#9b6f45]"
          >
            <Landmark className="mr-2" size={17} />
            Refresh Offers
          </Button>
        </div>
      </section>

      {message && (
        <div
          className={`relative rounded-2xl border p-4 text-sm font-semibold ${
            isSuccess
              ? "border-emerald-600/25 bg-emerald-100 text-emerald-700"
              : "border-red-500/20 bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <section className="relative grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending Offers"
          value={pendingCount}
          subtitle="Waiting for your decision"
          icon={Clock3}
          iconColor="text-[#9b6f45]"
          iconBg="bg-[#f6eadc]"
          glow="bg-[#d8ad80]/25"
          badge="Pending"
        />

        <StatCard
          title="Accepted"
          value={acceptedCount}
          subtitle="Forwarded to finance"
          icon={CheckCircle2}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-100"
          glow="bg-emerald-400/20"
          badge="Accepted"
        />

        <StatCard
          title="Rejected"
          value={rejectedCount}
          subtitle="Offers rejected by you"
          icon={XCircle}
          iconColor="text-red-700"
          iconBg="bg-red-100"
          glow="bg-red-400/15"
          badge="Rejected"
        />

        <StatCard
          title="Total Offers"
          value={totalCount}
          subtitle="All loan offers"
          icon={ShieldCheck}
          iconColor="text-[#9b6f45]"
          iconBg="bg-[#f1e5d8]"
          glow="bg-[#d8ad80]/30"
          badge="Total"
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
                  Loan Offer Queue
                </h2>
                <p className="mt-1 text-sm text-[#6b5e54]">
                  Check your approval letter before accepting the loan offer.
                </p>
              </div>

              <div className="relative w-full lg:w-[400px]">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9b6f45]"
                />

                <Input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search offers..."
                  className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 pl-11 text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/70">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1250px] table-fixed text-left text-sm">
                  <thead className="bg-[#efe2d2] text-xs uppercase tracking-wide text-[#6b5e54]">
                    <tr>
                      <th className="w-[210px] px-5 py-4 font-extrabold">
                        Loan Type
                      </th>
                      <th className="w-[165px] px-5 py-4 text-center font-extrabold">
                        Approved Amount
                      </th>
                      <th className="w-[140px] px-5 py-4 text-center font-extrabold">
                        EMI
                      </th>
                      <th className="w-[120px] px-5 py-4 text-center font-extrabold">
                        Period
                      </th>
                      <th className="w-[160px] px-5 py-4 text-center font-extrabold">
                        Total Repayment
                      </th>
                      <th className="w-[165px] px-5 py-4 text-center font-extrabold">
                        Approval Letter
                      </th>
                      <th className="w-[190px] px-5 py-4 text-center font-extrabold">
                        Status
                      </th>
                      <th className="w-[140px] px-5 py-4 text-center font-extrabold">
                        Updated
                      </th>
                      <th className="w-[190px] px-5 py-4 text-center font-extrabold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#d9c8b8]">
                    {filteredLoans.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-5 py-10 text-center text-[#6b5e54]"
                        >
                          No loan offers found.
                        </td>
                      </tr>
                    ) : (
                      filteredLoans.map((loan) => {
                        const isPending =
                          loan.status === "user_offer_pending";

                        return (
                          <tr
                            key={loan._id}
                            className="bg-[#fbf7ef]/60 transition-all duration-300 hover:bg-[#fffaf3] hover:shadow-[inset_4px_0_0_rgba(155,111,69,0.75)]"
                          >
                            <td className="px-5 py-4 align-middle">
                              <p className="truncate font-bold text-[#2b241f]">
                                {loan.loanType || "N/A"}
                              </p>
                              <p className="mt-1 truncate text-xs text-[#79695d]">
                                {loan.purpose || "No purpose"}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-center align-middle font-bold text-[#2b241f]">
                              <span className="whitespace-nowrap">
                                {formatCurrency(loan.approvedAmount)}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center align-middle text-[#6b5e54]">
                              <span className="whitespace-nowrap">
                                {formatCurrency(loan.monthlyInstallment)}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center align-middle text-[#6b5e54]">
                              <span className="whitespace-nowrap">
                                {loan.approvedPeriodMonths ||
                                  loan.preferredPeriodMonths ||
                                  0}{" "}
                                months
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center align-middle text-[#6b5e54]">
                              <span className="whitespace-nowrap">
                                {formatCurrency(loan.totalRepayment)}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center align-middle">
                              {loan.approvalLetterUrl ? (
                                <a
                                  href={`/api/documents/view?url=${encodeURIComponent(loan.approvalLetterUrl)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 rounded-xl border-[#9b6f45]/35 bg-[#f1e5d8] px-3 text-xs font-bold text-[#2b241f] hover:bg-[#efe2d2]"
                                  >
                                    <FileText className="mr-1" size={15} />
                                    View Letter
                                  </Button>
                                </a>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled
                                  variant="outline"
                                  className="h-9 rounded-xl border-[#d9c8b8] bg-[#fbf7ef] px-3 text-xs font-bold text-[#79695d] opacity-60"
                                >
                                  No Letter
                                </Button>
                              )}
                            </td>

                            <td className="px-5 py-4 text-center align-middle">
                              <span
                                className={`inline-flex min-w-[160px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-extrabold ${getStatusStyle(
                                  loan.status
                                )}`}
                              >
                                {getStatusLabel(loan.status)}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center align-middle text-[#79695d]">
                              <span className="whitespace-nowrap">
                                {formatDate(loan.updatedAt)}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center align-middle">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  disabled={
                                    !isPending ||
                                    actionLoadingId === `accept-${loan._id}`
                                  }
                                  onClick={() =>
                                    void handleOfferAction(loan._id, "accept")
                                  }
                                  className="h-9 rounded-xl bg-emerald-700 px-3 text-xs font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {actionLoadingId === `accept-${loan._id}` ? (
                                    <Loader2
                                      size={15}
                                      className="mr-1 animate-spin"
                                    />
                                  ) : null}
                                  Accept
                                </Button>

                                <Button
                                  size="sm"
                                  disabled={
                                    !isPending ||
                                    actionLoadingId === `reject-${loan._id}`
                                  }
                                  onClick={() =>
                                    void handleOfferAction(loan._id, "reject")
                                  }
                                  className="h-9 rounded-xl bg-red-700 px-3 text-xs font-bold text-white shadow-lg shadow-red-700/20 transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {actionLoadingId === `reject-${loan._id}` ? (
                                    <Loader2
                                      size={15}
                                      className="mr-1 animate-spin"
                                    />
                                  ) : null}
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}