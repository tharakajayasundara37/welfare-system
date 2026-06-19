"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  Eye,
  Loader2,
  RefreshCcw,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type StatusColor = "pending" | "approved" | "rejected" | "completed";

type FinanceLoan = {
  id: string;
  reference: string;

  memberName: string;
  memberEmail: string;
  memberPhone: string;
  memberNic: string;
  employeeId: string;
  department: string;
  jobRole: string;

  welfareOfficerName: string;
  adminName: string;
  financeOfficerName: string;

  loanType: string;
  purpose: string;

  requestedAmount: number;
  approvedAmount: number;
  monthlyInstallment: number;
  approvedPeriodMonths: number;
  totalRepayment: number;
  remainingBalance: number;

  systemInterestRate: number;

  status: string;
  statusLabel: string;
  statusColor: StatusColor;

  officerRemark: string;
  adminRemark: string;
  financeRemark: string;

  adminApprovedAt: string | null;
  financeApprovedAt: string | null;
  financeRejectedAt: string | null;
  disbursementDate: string | null;
  nextEMIDueDate: string | null;

  createdAt: string | null;
  updatedAt: string | null;
};

type FinanceLoansResponse = {
  success: boolean;
  message?: string;
  loans?: FinanceLoan[];
  total?: number;
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

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();
    console.error("NON_JSON_RESPONSE:", text.slice(0, 500));

    throw new Error(
      "API returned HTML instead of JSON. Check /api/finance/loans route path."
    );
  }

  return response.json();
}

export default function FinanceLoansPage() {
  const [loans, setLoans] = useState<FinanceLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  async function loadLoans(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setMessage("");

      const params = new URLSearchParams();

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const url = params.toString()
        ? `/api/finance/loans?${params.toString()}`
        : "/api/finance/loans";

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const result = (await readJsonResponse(response)) as FinanceLoansResponse;

      if (!result.success) {
        setLoans([]);
        setMessage(result.message || "Failed to load finance loans.");
        return;
      }

      setLoans(Array.isArray(result.loans) ? result.loans : []);
    } catch (error) {
      console.error("LOAD_FINANCE_LOANS_ERROR", error);

      setLoans([]);
      setMessage(
        error instanceof Error ? error.message : "Failed to load finance loans."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLoans(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [statusFilter]);

  const filteredLoans = useMemo(() => {
    const keyword = searchText.toLowerCase().trim();

    if (!keyword) return loans;

    return loans.filter((loan) => {
      const searchableText = [
        loan.reference,
        loan.memberName,
        loan.memberEmail,
        loan.memberPhone,
        loan.memberNic,
        loan.employeeId,
        loan.department,
        loan.jobRole,
        loan.welfareOfficerName,
        loan.adminName,
        loan.financeOfficerName,
        loan.loanType,
        loan.purpose,
        loan.status,
        loan.statusLabel,
        loan.requestedAmount,
        loan.approvedAmount,
        loan.monthlyInstallment,
        loan.totalRepayment,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      return searchableText.includes(keyword);
    });
  }, [loans, searchText]);

  const summary = useMemo(() => {
    const pending = filteredLoans.filter(
      (loan) => loan.statusColor === "pending"
    ).length;

    const approved = filteredLoans.filter(
      (loan) => loan.statusColor === "approved"
    ).length;

    const rejected = filteredLoans.filter(
      (loan) => loan.statusColor === "rejected"
    ).length;

    const completed = filteredLoans.filter(
      (loan) => loan.statusColor === "completed"
    ).length;

    return {
      total: filteredLoans.length,
      pending,
      approved,
      rejected,
      completed,
    };
  }, [filteredLoans]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#eee6da] text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading finance loans...
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
              <Link
                href="/dashboard/finance"
                className="mb-4 inline-flex items-center text-sm font-extrabold text-[#9b6f45] hover:text-[#835c38]"
              >
                <ArrowLeft className="mr-2" size={17} />
                Back to Finance Dashboard
              </Link>

              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
                Finance Portal
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
                Finance Loan Queue
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
                Review member accepted loans, check repayment terms and process
                finance actions.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => void loadLoans(true)}
              className="rounded-2xl bg-[#9b6f45] px-5 text-white shadow-lg shadow-[#9b6f45]/25 hover:bg-[#835c38]"
            >
              <RefreshCcw className="mr-2" size={17} />
              Refresh
            </Button>
          </div>
        </section>

        {message && (
          <div className="relative rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm font-semibold text-red-700">
            {message}
          </div>
        )}

        <section className="relative grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <Card className="rounded-[28px] border border-[#d9c8b8] bg-[#fbf7ef]/90 shadow-[0_20px_70px_rgba(44,36,31,0.12)]">
            <CardContent className="p-5">
              <p className="text-sm font-bold text-[#6b5e54]">Total</p>
              <h2 className="mt-2 text-3xl font-black">{summary.total}</h2>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-orange-500/20 bg-orange-500/10 shadow-[0_20px_70px_rgba(44,36,31,0.08)]">
            <CardContent className="p-5">
              <p className="text-sm font-bold text-orange-700">Pending</p>
              <h2 className="mt-2 text-3xl font-black text-orange-700">
                {summary.pending}
              </h2>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 shadow-[0_20px_70px_rgba(44,36,31,0.08)]">
            <CardContent className="p-5">
              <p className="text-sm font-bold text-emerald-700">Approved</p>
              <h2 className="mt-2 text-3xl font-black text-emerald-700">
                {summary.approved}
              </h2>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-[#d8ad80]/35 bg-[#d8ad80]/20 shadow-[0_20px_70px_rgba(44,36,31,0.08)]">
            <CardContent className="p-5">
              <p className="text-sm font-bold text-[#8a5f3c]">Completed</p>
              <h2 className="mt-2 text-3xl font-black text-[#8a5f3c]">
                {summary.completed}
              </h2>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-red-500/20 bg-red-500/10 shadow-[0_20px_70px_rgba(44,36,31,0.08)]">
            <CardContent className="p-5">
              <p className="text-sm font-bold text-red-700">Rejected</p>
              <h2 className="mt-2 text-3xl font-black text-red-700">
                {summary.rejected}
              </h2>
            </CardContent>
          </Card>
        </section>

        <section className="relative">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/20 blur-3xl" />
              <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#9b6f45]/15 blur-3xl" />

              <div className="relative mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold">
                    Finance Loan Applications
                  </h2>
                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Search and filter loans waiting for finance processing.
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="relative w-full md:w-[330px]">
                    <Search
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9b6f45]"
                    />
                    <Input
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder="Search member, NIC, employee ID..."
                      className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 pl-11 text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                    />
                  </div>

                  <select
                    title="Filter finance loan status"
                    aria-label="Filter finance loan status"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-12 rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/80 px-4 text-sm font-bold text-[#2b241f] outline-none focus:border-[#9b6f45]"
                  >
                    <option value="all">All Loans</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved / Disbursed</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <Button
                    type="button"
                    onClick={() => setSearchText("")}
                    className="h-12 rounded-2xl bg-[#2c241f] px-5 text-white hover:bg-[#9b6f45]"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-[#d9c8b8] bg-[#efe3d6]/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1250px] text-left text-sm">
                    <thead className="bg-[#f8f1e8] text-xs uppercase tracking-wide text-[#6b5e54]">
                      <tr>
                        <th className="px-5 py-4">Reference</th>
                        <th className="px-5 py-4">Member</th>
                        <th className="px-5 py-4">Loan Type</th>
                        <th className="px-5 py-4">Approved Amount</th>
                        <th className="px-5 py-4">EMI</th>
                        <th className="px-5 py-4">Period</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Admin Approved</th>
                        <th className="px-5 py-4">Updated</th>
                        <th className="px-5 py-4">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#d9c8b8]">
                      {filteredLoans.length === 0 ? (
                        <tr>
                          <td
                            colSpan={10}
                            className="px-5 py-10 text-center text-sm font-semibold text-[#6b5e54]"
                          >
                            No finance loans found.
                          </td>
                        </tr>
                      ) : (
                        filteredLoans.map((loan) => (
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

                            <td className="px-5 py-4 text-[#6b5e54]">
                              {loan.approvedPeriodMonths
                                ? `${loan.approvedPeriodMonths} months`
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
                              {formatDate(loan.adminApprovedAt)}
                            </td>

                            <td className="px-5 py-4 text-[#79695d]">
                              {formatDate(loan.updatedAt)}
                            </td>

                            <td className="px-5 py-4">
                              <Link href={`/dashboard/finance/loans/${loan.id}`}>
                                <Button
                                  size="sm"
                                  className="rounded-xl bg-[#2c241f] text-white hover:bg-[#9b6f45]"
                                >
                                  <Eye className="mr-1" size={15} />
                                  View
                                </Button>
                              </Link>
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