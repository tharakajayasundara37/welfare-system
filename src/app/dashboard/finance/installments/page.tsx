"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCcw,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Installment = {
  _id?: string;
  loanId?: string;
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
  daysLeft?: number;
  status?: "pending" | "paid" | "overdue";
  dueStatus?: "upcoming" | "due_soon" | "overdue" | "paid";
  paidAt?: string | null;
  reminderSent?: boolean;
  reminderSentAt?: string | null;
};

type ApiResponse = {
  success: boolean;
  installments?: Installment[];
  message?: string;
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

function getInstallmentKey(item: Installment, index: number) {
  return (
    item._id ||
    `${item.loanId || "loan"}-${item.userId || "user"}-${
      item.installmentNumber || index
    }-${item.dueDate || index}`
  );
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    await response.text();

    throw new Error(
      "API returned HTML instead of JSON. Check /api/finance/installments route."
    );
  }

  return response.json();
}

export default function FinanceInstallmentsPage() {
  const [items, setItems] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const initialized = useRef(false);

  async function loadInstallments(showLoader = true) {
    try {
      if (showLoader) setLoading(true);

      setError("");

      const response = await fetch("/api/finance/installments", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await readJsonResponse(response)) as ApiResponse;

      if (!data.success) {
        setItems([]);
        setError(data.message || "Failed to load installments.");
        return;
      }

      setItems(data.installments || []);
    } catch (err) {
      console.error("LOAD_FINANCE_INSTALLMENTS_ERROR", err);
      setItems([]);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading installments."
      );
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    if (initialized.current) return;

    initialized.current = true;

    const timeout = window.setTimeout(() => {
      void loadInstallments(true);
    }, 0);

    const interval = window.setInterval(() => {
      void loadInstallments(false);
    }, 15000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) => {
      return (
        safeText(item.memberName).toLowerCase().includes(query) ||
        safeText(item.memberPhone).toLowerCase().includes(query) ||
        safeText(item.loanType).toLowerCase().includes(query) ||
        safeText(item.employeeId).toLowerCase().includes(query) ||
        safeText(item.status).toLowerCase().includes(query) ||
        safeText(item.dueStatus).toLowerCase().includes(query) ||
        safeText(item.paymentReference).toLowerCase().includes(query)
      );
    });
  }, [items, search]);

  const pendingCount = items.filter((item) => item.status === "pending").length;
  const paidCount = items.filter((item) => item.status === "paid").length;
  const dueSoonCount = items.filter(
    (item) => item.dueStatus === "due_soon"
  ).length;
  const overdueCount = items.filter(
    (item) => item.dueStatus === "overdue"
  ).length;

  const totalPendingAmount = items
    .filter((item) => item.status !== "paid")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="min-h-screen rounded-[34px] bg-[#eee6da] p-6 text-[#2b241f]">
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-6 shadow-lg lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="text-[#9b6f45]" />
            <h1 className="text-3xl font-extrabold">Loan Installments</h1>
          </div>

          <p className="mt-2 text-sm text-[#6b5e54]">
            Track all member installments from the real installment database.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => void loadInstallments(true)}
          variant="outline"
          className="rounded-2xl border-[#d9c8b8] bg-[#fbf7ef] text-[#2b241f] hover:bg-[#fffaf3]"
        >
          <RefreshCcw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <StatBox title="Pending" value={pendingCount} />
        <StatBox title="Paid" value={paidCount} valueClass="text-green-700" />
        <StatBox
          title="Due Soon"
          value={dueSoonCount}
          valueClass="text-orange-700"
        />
        <StatBox
          title="Overdue"
          value={overdueCount}
          valueClass="text-red-700"
        />
        <StatBox
          title="Pending Amount"
          value={formatCurrency(totalPendingAmount)}
          valueClass="text-2xl"
        />
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-3xl border border-[#d9c8b8] bg-[#fbf7ef] p-4">
        <Search size={18} className="text-[#9b6f45]" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by member, phone, loan type, employee ID, status..."
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
          {filteredItems.length === 0 ? (
            <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
              <CardContent className="p-10 text-center text-[#6b5e54]">
                No installments found.
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item, index) => {
              const status = item.status || "pending";
              const dueStatus = item.dueStatus || "upcoming";
              const daysLeft = Number(item.daysLeft || 0);

              return (
                <Card
                  key={getInstallmentKey(item, index)}
                  className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]"
                >
                  <CardContent className="flex flex-col justify-between gap-4 p-5 xl:flex-row xl:items-center">
                    <div>
                      <h3 className="text-lg font-extrabold">
                        {item.memberName || "Unknown Member"}
                      </h3>

                      <p className="text-sm text-[#6b5e54]">
                        {item.loanType || "Loan"} • Installment{" "}
                        {item.installmentNumber || "-"}/
                        {item.totalInstallments || "-"}
                      </p>

                      <p className="mt-1 text-xs text-[#8b7a6d]">
                        Phone: {item.memberPhone || "-"} • Employee ID:{" "}
                        {item.employeeId || "-"}
                      </p>

                      <p className="mt-1 text-xs text-[#8b7a6d]">
                        Amount: {formatCurrency(item.amount)} • Remaining:{" "}
                        {formatCurrency(item.remainingBalance)}
                      </p>

                      <p className="mt-1 text-xs text-[#8b7a6d]">
                        Due Date: {formatDate(item.dueDate)} •{" "}
                        {status === "paid"
                          ? `Paid: ${formatDate(item.paidAt)}`
                          : daysLeft >= 0
                            ? `${daysLeft} days left`
                            : `${Math.abs(daysLeft)} days overdue`}
                      </p>

                      {item.paymentReference ? (
                        <p className="mt-1 text-xs text-[#8b7a6d]">
                          Payment Ref: {item.paymentReference}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          dueStatus === "overdue"
                            ? "bg-red-100 text-red-700"
                            : dueStatus === "due_soon"
                              ? "bg-orange-100 text-orange-700"
                              : dueStatus === "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {dueStatus.replaceAll("_", " ")}
                      </span>

                      {item.reminderSent ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                          <Bell size={13} className="mr-1" />
                          SMS Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                          <Clock3 size={13} className="mr-1" />
                          No SMS
                        </span>
                      )}

                      {status === "paid" ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                          <CheckCircle2 size={13} className="mr-1" />
                          Paid
                        </span>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function StatBox({
  title,
  value,
  valueClass = "",
}: {
  title: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
      <CardContent className="p-5">
        <p className="text-sm text-[#6b5e54]">{title}</p>
        <h2 className={`mt-2 text-3xl font-extrabold ${valueClass}`}>
          {value}
        </h2>
      </CardContent>
    </Card>
  );
}