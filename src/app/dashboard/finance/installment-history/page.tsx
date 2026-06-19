"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Loader2,
  ReceiptText,
  RefreshCcw,
  Search,
  UserRound,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type HistoryItem = {
  _id: string;

  loanId: string;
  loanReference: string;

  userId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  employeeId: string;

  loanType: string;
  loanStatus: string;

  installmentNumber: number;
  totalInstallments: number;

  amount: number;
  paidAmount: number;
  paymentReference: string;

  approvedAmount: number;
  totalRepayment: number;
  remainingBalance: number;
  totalPaidInstallments: number;

  dueDate: string;
  paidAt: string | null;
};

type Summary = {
  totalPayments: number;
  totalCollected: number;
  uniqueMembers: number;
  uniqueLoans: number;
};

type ApiResponse = {
  success: boolean;
  history: HistoryItem[];
  summary: Summary;
  message?: string;
};

const defaultSummary: Summary = {
  totalPayments: 0,
  totalCollected: 0,
  uniqueMembers: 0,
  uniqueLoans: 0,
};

function formatCurrency(amount?: number) {
  return `Rs. ${Number(amount || 0).toLocaleString()}`;
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

function getHistoryKey(item: HistoryItem, index: number) {
  return (
    item._id ||
    `${item.loanId || "loan"}-${item.installmentNumber || index}-${
      item.paymentReference || index
    }`
  );
}

export default function FinanceInstallmentHistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [summary, setSummary] = useState<Summary>(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const initialized = useRef(false);

  async function loadHistory(showLoader = true) {
    try {
      if (showLoader) setLoading(true);
      setError("");

      const res = await fetch("/api/finance/installment-history", {
        cache: "no-store",
      });

      const data = (await res.json()) as ApiResponse;

      if (!data.success) {
        setError(data.message || "Failed to load installment history.");
        return;
      }

      setHistory(data.history || []);
      setSummary(data.summary || defaultSummary);
    } catch {
      setError("Something went wrong while loading installment history.");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return history;

    return history.filter((item) => {
      return (
        item.memberName.toLowerCase().includes(query) ||
        item.memberPhone.toLowerCase().includes(query) ||
        item.employeeId.toLowerCase().includes(query) ||
        item.loanType.toLowerCase().includes(query) ||
        item.loanReference.toLowerCase().includes(query) ||
        item.paymentReference.toLowerCase().includes(query)
      );
    });
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

        <Button onClick={() => loadHistory(true)} variant="outline">
          <RefreshCcw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-700" />
              <div>
                <p className="text-sm text-[#6b5e54]">Total Payments</p>
                <h2 className="mt-1 text-3xl font-extrabold">
                  {summary.totalPayments}
                </h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <WalletCards className="text-[#9b6f45]" />
              <div>
                <p className="text-sm text-[#6b5e54]">Total Collected</p>
                <h2 className="mt-1 text-2xl font-extrabold">
                  {formatCurrency(summary.totalCollected)}
                </h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <UserRound className="text-blue-700" />
              <div>
                <p className="text-sm text-[#6b5e54]">Members</p>
                <h2 className="mt-1 text-3xl font-extrabold">
                  {summary.uniqueMembers}
                </h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <FileText className="text-orange-700" />
              <div>
                <p className="text-sm text-[#6b5e54]">Loans</p>
                <h2 className="mt-1 text-3xl font-extrabold">
                  {summary.uniqueLoans}
                </h2>
              </div>
            </div>
          </CardContent>
        </Card>
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
        <div className="space-y-4">
          {filteredHistory.length === 0 ? (
            <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
              <CardContent className="p-10 text-center text-[#6b5e54]">
                No payment history found.
              </CardContent>
            </Card>
          ) : (
            filteredHistory.map((item, index) => (
              <Card
                key={getHistoryKey(item, index)}
                className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]"
              >
                <CardContent className="flex flex-col justify-between gap-4 p-5 xl:flex-row xl:items-center">
                  <div>
                    <h3 className="text-lg font-extrabold">
                      {item.memberName}
                    </h3>

                    <p className="text-xs font-semibold text-[#9b6f45]">
                      {item.loanReference}
                    </p>

                    <p className="mt-1 text-sm text-[#6b5e54]">
                      {item.loanType} • Installment {item.installmentNumber}/
                      {item.totalInstallments || "-"}
                    </p>

                    <p className="mt-1 text-xs text-[#8b7a6d]">
                      Phone: {item.memberPhone || "-"} • Employee ID:{" "}
                      {item.employeeId || "-"}
                    </p>

                    <p className="mt-1 text-xs text-[#8b7a6d]">
                      Due: {formatDate(item.dueDate)} • Paid:{" "}
                      {formatDateTime(item.paidAt)}
                    </p>

                    <p className="mt-1 text-xs text-[#8b7a6d]">
                      Payment Ref: {item.paymentReference || "-"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                      Paid
                    </span>

                    <span className="rounded-full bg-[#f1e5d8] px-3 py-1 text-sm font-extrabold text-[#9b6f45]">
                      {formatCurrency(item.paidAmount || item.amount)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}