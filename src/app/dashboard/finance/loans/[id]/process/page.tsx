"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type StatusColor = "pending" | "approved" | "rejected" | "completed";

type PersonInfo = {
  fullName: string;
  email: string;
  phone: string;
  employeeId?: string;
  nic?: string;
  department?: string;
  jobRole?: string;
};

type FinanceLoanDetail = {
  id: string;
  reference: string;

  member: PersonInfo;

  loanType: string;
  purpose: string;

  requestedAmount: number;
  approvedAmount: number;
  monthlyInstallment: number;
  totalRepayment: number;
  remainingBalance: number;

  systemInterestRate: number;
  approvedPeriodMonths: number;

  status: string;
  statusLabel: string;
  statusColor: StatusColor;

  adminRemark: string;
  financeRemark: string;

  adminApprovedAt: string | null;
  disbursementDate: string | null;
  nextEMIDueDate: string | null;
};

type FinanceLoanDetailResponse = {
  success: boolean;
  message?: string;
  loan?: FinanceLoanDetail;
};

type ActionResponse = {
  success: boolean;
  message?: string;
  loan?: unknown;
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

function getTodayInputDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

    throw new Error("API returned HTML instead of JSON. Check finance API route path.");
  }

  return response.json();
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col justify-between gap-1 border-b border-[#d9c8b8] py-3 md:flex-row">
      <span className="text-sm font-bold text-[#6b5e54]">{label}</span>
      <span className="text-sm font-extrabold text-[#2b241f] md:text-right">
        {value || "-"}
      </span>
    </div>
  );
}

export default function FinanceLoanProcessPage() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();

  const loanId = useMemo(() => {
    return String(params.id || "").trim();
  }, [params.id]);

  const [loan, setLoan] = useState<FinanceLoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | "">(
    ""
  );

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [financeRemark, setFinanceRemark] = useState(
    "Loan checked and approved for disbursement by finance officer."
  );
  const [rejectRemark, setRejectRemark] = useState("");
  const [disbursementDate, setDisbursementDate] = useState(getTodayInputDate());
  const [disbursementMethod, setDisbursementMethod] = useState("bank_transfer");
  const [disbursementReference, setDisbursementReference] = useState("");

  async function loadLoanDetail() {
    try {
      setLoading(true);
      setMessage("");
      setIsSuccess(false);

      if (!loanId) {
        setLoan(null);
        setMessage("Loan ID is missing.");
        return;
      }

      const response = await fetch(`/api/finance/loans/${loanId}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = (await readJsonResponse(
        response
      )) as FinanceLoanDetailResponse;

      if (!result.success || !result.loan) {
        setLoan(null);
        setMessage(result.message || "Failed to load finance loan details.");
        setIsSuccess(false);
        return;
      }

      setLoan(result.loan);
    } catch (error) {
      console.error("LOAD_FINANCE_PROCESS_LOAN_ERROR", error);

      setLoan(null);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load finance loan details."
      );
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLoanDetail();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loanId]);

  async function handleApproveAndDisburse() {
    try {
      const confirmed = window.confirm(
        "Approve and disburse this loan? This action will update the loan status to Disbursed."
      );

      if (!confirmed) return;

      setActionLoading("approve");
      setMessage("");
      setIsSuccess(false);

      const response = await fetch(`/api/finance/loans/${loanId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          financeRemark,
          disbursementDate,
          disbursementMethod,
          disbursementReference,
        }),
      });

      const result = (await readJsonResponse(response)) as ActionResponse;

      if (!result.success) {
        setMessage(result.message || "Failed to approve and disburse loan.");
        setIsSuccess(false);
        return;
      }

      setMessage(result.message || "Loan approved and disbursed successfully.");
      setIsSuccess(true);

      await loadLoanDetail();

      window.setTimeout(() => {
        router.push(`/dashboard/finance/loans/${loanId}`);
      }, 900);
    } catch (error) {
      console.error("FINANCE_APPROVE_ACTION_ERROR", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to approve and disburse loan."
      );
      setIsSuccess(false);
    } finally {
      setActionLoading("");
    }
  }

  async function handleRejectLoan() {
    try {
      if (!rejectRemark.trim()) {
        setMessage("Finance reject remark is required.");
        setIsSuccess(false);
        return;
      }

      const confirmed = window.confirm(
        "Reject this loan from finance review? This action cannot be undone from this page."
      );

      if (!confirmed) return;

      setActionLoading("reject");
      setMessage("");
      setIsSuccess(false);

      const response = await fetch(`/api/finance/loans/${loanId}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          financeRemark: rejectRemark,
        }),
      });

      const result = (await readJsonResponse(response)) as ActionResponse;

      if (!result.success) {
        setMessage(result.message || "Failed to reject loan.");
        setIsSuccess(false);
        return;
      }

      setMessage(result.message || "Loan rejected by finance officer.");
      setIsSuccess(true);

      await loadLoanDetail();

      window.setTimeout(() => {
        router.push(`/dashboard/finance/loans/${loanId}`);
      }, 900);
    } catch (error) {
      console.error("FINANCE_REJECT_ACTION_ERROR", error);

      setMessage(
        error instanceof Error ? error.message : "Failed to reject loan."
      );
      setIsSuccess(false);
    } finally {
      setActionLoading("");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#eee6da] text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading finance process page...
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen rounded-[34px] bg-[#eee6da] p-6 text-[#2b241f]">
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm font-semibold text-red-700">
          {message || "Loan not found."}
        </div>

        <Link href="/dashboard/finance/loans">
          <Button className="mt-5 rounded-2xl bg-[#9b6f45] text-white hover:bg-[#835c38]">
            <ArrowLeft className="mr-2" size={17} />
            Back to Finance Loans
          </Button>
        </Link>
      </div>
    );
  }

  const canProcess =
    loan.status === "pending_finance_processing" ||
    loan.status === "pending_finance" ||
    loan.status === "user_accepted" ||
    loan.status === "approved";

  return (
    <div className="dashboard-no-scrollbar min-h-screen overflow-hidden rounded-[34px] bg-[#eee6da] text-[#2b241f]">
      <div className="relative min-h-screen space-y-7 overflow-hidden p-1">
        <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-[#c99b69]/25 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-[480px] w-[480px] rounded-full bg-[#2c241f]/10 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-[360px] w-[360px] rounded-full bg-[#d8ad80]/25 blur-[130px]" />

        <section className="relative overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div>
              <Link
                href={`/dashboard/finance/loans/${loan.id}`}
                className="mb-4 inline-flex items-center text-sm font-extrabold text-[#9b6f45] hover:text-[#835c38]"
              >
                <ArrowLeft className="mr-2" size={17} />
                Back to Loan Details
              </Link>

              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
                Finance Processing
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
                {loan.reference}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6b5e54]">
                Approve and disburse the loan or reject it with a finance
                review remark.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span
                  className={`inline-flex rounded-full border px-4 py-2 text-xs font-extrabold ${getStatusClass(
                    loan.statusColor
                  )}`}
                >
                  {loan.statusLabel}
                </span>

                <span className="inline-flex rounded-full border border-[#d9c8b8] bg-[#f8f1e8] px-4 py-2 text-xs font-bold text-[#9b6f45]">
                  {loan.loanType}
                </span>
              </div>
            </div>

            <Link href="/dashboard/finance/loans">
              <Button className="rounded-2xl bg-[#2c241f] px-5 text-white hover:bg-[#9b6f45]">
                Finance Loan Queue
              </Button>
            </Link>
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

        {!canProcess && (
          <div className="relative rounded-2xl border border-orange-500/25 bg-orange-500/10 p-4 text-sm font-semibold text-orange-700">
            This loan is already processed or cannot be processed from current
            status: {loan.statusLabel}
          </div>
        )}

        <section className="relative grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <Card className="rounded-[32px] border border-[#d9c8b8] bg-[#2c241f] text-white shadow-[0_30px_100px_rgba(44,36,31,0.24)]">
            <CardContent className="p-6">
              <Banknote className="text-[#d8ad80]" size={32} />

              <h2 className="mt-5 text-3xl font-black">
                {formatCurrency(loan.approvedAmount)}
              </h2>

              <p className="mt-2 text-sm text-[#ead9c8]/75">
                Approved amount for this loan
              </p>

              <div className="mt-7 space-y-2">
                <DetailRow
                  label="Member"
                  value={loan.member?.fullName || "-"}
                />
                <DetailRow
                  label="Phone"
                  value={loan.member?.phone || "-"}
                />
                <DetailRow
                  label="Employee ID"
                  value={loan.member?.employeeId || "-"}
                />
                <DetailRow label="Loan Type" value={loan.loanType || "-"} />
                <DetailRow
                  label="Monthly EMI"
                  value={formatCurrency(loan.monthlyInstallment)}
                />
                <DetailRow
                  label="Period"
                  value={`${loan.approvedPeriodMonths || 0} months`}
                />
                <DetailRow
                  label="Interest Rate"
                  value={`${loan.systemInterestRate || 0}%`}
                />
                <DetailRow
                  label="Total Repayment"
                  value={formatCurrency(loan.totalRepayment)}
                />
                <DetailRow
                  label="Admin Approved"
                  value={formatDate(loan.adminApprovedAt)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)]">
              <CardContent className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c]">
                    <CheckCircle2 size={22} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold">
                      Approve & Disburse
                    </h2>
                    <p className="text-sm text-[#6b5e54]">
                      Final finance approval and loan disbursement details.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-bold text-[#2b241f]">
                      Disbursement Date
                    </label>
                    <Input
                      type="date"
                      value={disbursementDate}
                      onChange={(event) =>
                        setDisbursementDate(event.target.value)
                      }
                      disabled={!canProcess || Boolean(actionLoading)}
                      className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-[#2b241f]">
                      Disbursement Method
                    </label>

                    <select
                      title="Select disbursement method"
                      aria-label="Select disbursement method"
                      value={disbursementMethod}
                      onChange={(event) =>
                        setDisbursementMethod(event.target.value)
                      }
                      disabled={!canProcess || Boolean(actionLoading)}
                      className="mt-2 h-12 w-full rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8] px-4 text-sm font-bold outline-none"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="online_transfer">Online Transfer</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-bold text-[#2b241f]">
                    Disbursement Reference
                  </label>
                  <Input
                    value={disbursementReference}
                    onChange={(event) =>
                      setDisbursementReference(event.target.value)
                    }
                    disabled={!canProcess || Boolean(actionLoading)}
                    className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]"
                    placeholder="Bank slip / cheque / transaction reference"
                  />
                </div>

                <div className="mt-4">
                  <label className="text-sm font-bold text-[#2b241f]">
                    Finance Remark
                  </label>
                  <textarea
                    value={financeRemark}
                    onChange={(event) => setFinanceRemark(event.target.value)}
                    disabled={!canProcess || Boolean(actionLoading)}
                    className="mt-2 min-h-[120px] w-full rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8] p-4 text-sm outline-none focus:border-[#9b6f45] focus:ring-2 focus:ring-[#9b6f45]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="Type finance approval remark..."
                  />
                </div>

                <Button
                  type="button"
                  onClick={() => void handleApproveAndDisburse()}
                  disabled={!canProcess || actionLoading === "approve"}
                  className="mt-5 h-12 w-full rounded-2xl bg-emerald-700 font-extrabold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading === "approve" ? (
                    <Loader2 className="mr-2 animate-spin" size={18} />
                  ) : (
                    <CheckCircle2 className="mr-2" size={18} />
                  )}
                  Approve & Disburse Loan
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border border-red-500/20 bg-red-500/10 text-[#2b241f] shadow-[0_24px_80px_rgba(44,36,31,0.10)]">
              <CardContent className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-700">
                    <XCircle size={22} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold text-red-800">
                      Reject Loan
                    </h2>
                    <p className="text-sm text-red-700">
                      Reject this loan from finance review with a clear reason.
                    </p>
                  </div>
                </div>

                <label className="text-sm font-bold text-red-800">
                  Finance Reject Remark
                </label>
                <textarea
                  value={rejectRemark}
                  onChange={(event) => setRejectRemark(event.target.value)}
                  disabled={!canProcess || Boolean(actionLoading)}
                  className="mt-2 min-h-[120px] w-full rounded-2xl border border-red-500/20 bg-white/70 p-4 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Type rejection reason..."
                />

                <Button
                  type="button"
                  onClick={() => void handleRejectLoan()}
                  disabled={!canProcess || actionLoading === "reject"}
                  className="mt-5 h-12 w-full rounded-2xl bg-red-700 font-extrabold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading === "reject" ? (
                    <Loader2 className="mr-2 animate-spin" size={18} />
                  ) : (
                    <XCircle className="mr-2" size={18} />
                  )}
                  Reject Loan
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}