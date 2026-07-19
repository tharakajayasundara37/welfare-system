"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Loader2,
  ReceiptText,
  RefreshCcw,
  Search,
  User,
  UserRound,
  Wallet,
  WalletCards,
  Clock3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type HistoryItem = {
  _id?: string;
  loanId?: string;
  loanReference?: string;
  userId?: string;
  memberName?: string;
  memberEmail?: string;
  memberPhone?: string;
  employeeId?: string;
  loanType?: string;
  loanStatus?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  amount?: number;
  paidAmount?: number;
  paymentReference?: string;
  approvedAmount?: number;
  totalRepayment?: number;
  remainingBalance?: number;
  totalPaidInstallments?: number;
  dueDate?: string;
  paidAt?: string | null;
};

type GroupedHistoryInstallment = {
  _id: string;
  installmentNumber: number;
  amount: number;
  paidAmount: number;
  paymentReference: string;
  dueDate: string;
  paidAt: string | null;
};

type GroupedHistoryLoan = {
  loanId: string;
  loanReference: string;
  loanType: string;
  loanStatus: string;
  approvedAmount: number;
  totalRepayment: number;
  remainingBalance: number;
  totalInstallments: number;
  totalPaidInstallments: number;
  installments: GroupedHistoryInstallment[];
};

type GroupedHistoryUser = {
  userId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  employeeId: string;
  loans: GroupedHistoryLoan[];
};

type Summary = {
  totalPayments: number;
  totalCollected: number;
  uniqueMembers: number;
  uniqueLoans: number;
};

type ApiResponse = {
  success: boolean;
  history?: HistoryItem[];
  summary?: Summary;
  message?: string;
};

const defaultSummary: Summary = {
  totalPayments: 0,
  totalCollected: 0,
  uniqueMembers: 0,
  uniqueLoans: 0,
};

function safeText(value?: string | number | null) {
  return String(value || "").trim();
}

function formatCurrency(amount?: number) {
  return `Rs. ${Number(amount || 0).toLocaleString("en-LK")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    await response.text();
    throw new Error(
      "API returned HTML instead of JSON. Check /api/finance/installment-history route."
    );
  }

  return response.json();
}

export default function FinanceInstallmentHistoryPage() {
  const [history, setHistory] = useState<GroupedHistoryUser[]>([]);
  const [summary, setSummary] = useState<Summary>(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const initialized = useRef(false);

  async function loadHistory(showLoader = true) {
    try {
      if (showLoader) setLoading(true);

      setError("");

      const response = await fetch("/api/finance/installment-history", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await readJsonResponse(response)) as ApiResponse;

      if (!data.success) {
        setHistory([]);
        setSummary(defaultSummary);
        setError(data.message || "Failed to load installment history.");
        return;
      }

      // Grouping flat data to User -> Loan -> Installment structure
      const groupedData = (data.history || []).reduce<GroupedHistoryUser[]>(
        (acc, item) => {
          const userId = item.userId || "unknown_user";
          const loanId = item.loanId || "unknown_loan";

          let userGroup = acc.find((u) => u.userId === userId);
          if (!userGroup) {
            userGroup = {
              userId,
              memberName: item.memberName || "Unknown Member",
              memberEmail: item.memberEmail || "",
              memberPhone: item.memberPhone || "",
              employeeId: item.employeeId || "",
              loans: [],
            };
            acc.push(userGroup);
          }

          let loanGroup = userGroup.loans.find((l) => l.loanId === loanId);
          if (!loanGroup) {
            loanGroup = {
              loanId,
              loanReference: item.loanReference || "",
              loanType: item.loanType || "Loan",
              loanStatus: item.loanStatus || "",
              approvedAmount: item.approvedAmount || 0,
              totalRepayment: item.totalRepayment || 0,
              remainingBalance: item.remainingBalance || 0,
              totalInstallments: item.totalInstallments || 0,
              totalPaidInstallments: item.totalPaidInstallments || 0,
              installments: [],
            };
            userGroup.loans.push(loanGroup);
          }

          loanGroup.installments.push({
            _id: item._id || `${loanId}-${item.installmentNumber}`,
            installmentNumber: item.installmentNumber || 0,
            amount: item.amount || 0,
            paidAmount: item.paidAmount || 0,
            paymentReference: item.paymentReference || "",
            dueDate: item.dueDate || "",
            paidAt: item.paidAt || null,
          });

          return acc;
        },
        []
      );

      setHistory(groupedData);
      setSummary({
        ...defaultSummary,
        ...(data.summary || {}),
      });
    } catch (err) {
      console.error("LOAD_FINANCE_INSTALLMENT_HISTORY_ERROR", err);
      setHistory([]);
      setSummary(defaultSummary);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading installment history."
      );
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    if (initialized.current) return;

    initialized.current = true;

    const timeout = window.setTimeout(() => {
      void loadHistory(true);
    }, 0);

    const interval = window.setInterval(() => {
      void loadHistory(false);
    }, 15000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return history;

    return history
      .map((user) => {
        const userMatches =
          safeText(user.memberName).toLowerCase().includes(query) ||
          safeText(user.memberPhone).toLowerCase().includes(query) ||
          safeText(user.employeeId).toLowerCase().includes(query);

        const filteredLoans = user.loans
          .map((loan) => {
            const loanMatches =
              safeText(loan.loanType).toLowerCase().includes(query) ||
              safeText(loan.loanReference).toLowerCase().includes(query);

            const filteredInstallments = loan.installments.filter((inst) =>
              safeText(inst.paymentReference).toLowerCase().includes(query)
            );

            if (userMatches || loanMatches || filteredInstallments.length > 0) {
              return {
                ...loan,
                installments:
                  (userMatches || loanMatches) &&
                  filteredInstallments.length === 0
                    ? loan.installments
                    : filteredInstallments,
              };
            }
            return null;
          })
          .filter(Boolean) as GroupedHistoryLoan[];

        if (userMatches || filteredLoans.length > 0) {
          return {
            ...user,
            loans: filteredLoans.length > 0 ? filteredLoans : user.loans,
          };
        }
        return null;
      })
      .filter(Boolean) as GroupedHistoryUser[];
  }, [history, search]);

  return (
    <div className="min-h-screen rounded-[34px] bg-[#eee6da] p-6 text-[#2b241f]">
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-6 shadow-lg lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <ReceiptText className="text-[#9b6f45]" />
            <h1 className="text-3xl font-extrabold">
              Installment Payment History
            </h1>
          </div>

          <p className="mt-2 text-sm text-[#6b5e54]">
            View paid loan installments, payment references and collection
            history.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => void loadHistory(true)}
          variant="outline"
          className="rounded-2xl border-[#d9c8b8] bg-[#fbf7ef] text-[#2b241f] hover:bg-[#fffaf3]"
        >
          <RefreshCcw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <SummaryCard
          title="Total Payments"
          value={summary.totalPayments}
          icon={CheckCircle2}
          iconClass="text-green-700"
        />

        <SummaryCard
          title="Total Collected"
          value={formatCurrency(summary.totalCollected)}
          icon={WalletCards}
          iconClass="text-[#9b6f45]"
          valueClass="text-2xl"
        />

        <SummaryCard
          title="Members"
          value={summary.uniqueMembers}
          icon={UserRound}
          iconClass="text-blue-700"
        />

        <SummaryCard
          title="Loans"
          value={summary.uniqueLoans}
          icon={FileText}
          iconClass="text-orange-700"
        />
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-3xl border border-[#d9c8b8] bg-[#fbf7ef] p-4">
        <Search size={18} className="text-[#9b6f45]" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by member, phone, employee ID, loan ref or payment ref..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#9b6f45]/60"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin text-[#9b6f45]" />
        </div>
      ) : (
        <div className="space-y-6">
          {filteredHistory.length === 0 ? (
            <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
              <CardContent className="p-10 text-center text-[#6b5e54]">
                No payment history found.
              </CardContent>
            </Card>
          ) : (
            filteredHistory.map((user) => (
              <Card
                key={user.userId}
                className="overflow-hidden rounded-3xl border-[#d9c8b8] bg-[#fbf7ef] shadow-sm"
              >
                <div className="flex flex-col gap-4 border-b border-[#d9c8b8] bg-[#f2eadc] p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8dac6] text-[#9b6f45]">
                      <User size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-[#2b241f]">
                        {user.memberName}
                      </h2>
                      <p className="text-sm font-medium text-[#6b5e54]">
                        Emp ID: {user.employeeId || "-"} • Phone:{" "}
                        {user.memberPhone || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <CardContent className="p-0">
                  {user.loans.map((loan) => (
                    <div
                      key={loan.loanId}
                      className="border-b border-[#d9c8b8]/50 p-5 last:border-none"
                    >
                      <div className="mb-4 flex flex-col gap-2 rounded-2xl bg-white/50 p-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet size={18} className="text-[#9b6f45]" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-[#4a3f35]">
                                {loan.loanType}
                              </h3>
                              {loan.loanReference && (
                                <span className="rounded-full bg-[#e8dac6] px-2 py-0.5 text-[10px] font-bold text-[#9b6f45]">
                                  {loan.loanReference}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-medium text-[#8b7a6d]">
                              Approved: {formatCurrency(loan.approvedAmount)} •
                              Remaining: {formatCurrency(loan.remainingBalance)}
                            </p>
                          </div>
                        </div>
                        <span className="inline-block rounded-full border border-[#d9c8b8] bg-white px-3 py-1 text-xs font-bold text-[#6b5e54]">
                          {loan.totalPaidInstallments} / {loan.totalInstallments}{" "}
                          Paid
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                        {loan.installments.map((item) => (
                          <div
                            key={item._id}
                            className="flex flex-col justify-between gap-3 rounded-2xl border border-[#e8dac6] bg-white p-4 shadow-sm transition hover:shadow-md"
                          >
                            <div>
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-bold text-[#4a3f35]">
                                  Installment {item.installmentNumber}
                                </span>
                                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700 flex items-center gap-1">
                                  <CheckCircle2 size={10} /> Paid
                                </span>
                              </div>

                              <p className="text-lg font-extrabold text-[#2b241f]">
                                {formatCurrency(item.paidAmount || item.amount)}
                              </p>

                              <p className="mt-1 flex items-center gap-1 text-xs text-[#8b7a6d]">
                                <Clock3 size={12} />
                                Due: {formatDate(item.dueDate)}
                              </p>

                              {item.paymentReference && (
                                <p className="mt-1 text-xs font-medium text-[#8b7a6d]">
                                  Ref: {item.paymentReference}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center pt-2">
                              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-600">
                                Paid at {formatDateTime(item.paidAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconClass,
  valueClass = "text-3xl",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconClass: string;
  valueClass?: string;
}) {
  return (
    <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <Icon className={iconClass} />

          <div>
            <p className="text-sm text-[#6b5e54]">{title}</p>
            <h2 className={`mt-1 font-extrabold ${valueClass}`}>{value}</h2>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}