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
  loanId: string;
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
  daysLeft: number;
  status: "pending" | "paid" | "overdue";
  dueStatus: "upcoming" | "due_soon" | "overdue" | "paid";
  paidAt?: string | null;
  reminderSent: boolean;
  reminderSentAt?: string | null;
};

type ApiResponse = {
  success: boolean;
  installments: Installment[];
  message?: string;
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

function getInstallmentKey(item: Installment, index: number) {
  return (
    item._id ||
    `${item.loanId || "loan"}-${item.userId || "user"}-${
      item.installmentNumber || index
    }-${item.dueDate || index}`
  );
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

      const res = await fetch("/api/finance/installments", {
        cache: "no-store",
      });

      const data = (await res.json()) as ApiResponse;

      if (!data.success) {
        setError(data.message || "Failed to load installments");
        return;
      }

      setItems(data.installments || []);
    } catch {
      setError("Something went wrong while loading installments");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) => {
      return (
        item.memberName.toLowerCase().includes(query) ||
        item.memberPhone.toLowerCase().includes(query) ||
        item.loanType.toLowerCase().includes(query) ||
        item.employeeId.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query) ||
        item.dueStatus.toLowerCase().includes(query) ||
        item.paymentReference.toLowerCase().includes(query)
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

        <Button onClick={() => loadInstallments(true)} variant="outline">
          <RefreshCcw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
          <CardContent className="p-5">
            <p className="text-sm text-[#6b5e54]">Pending</p>
            <h2 className="mt-2 text-3xl font-extrabold">{pendingCount}</h2>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
          <CardContent className="p-5">
            <p className="text-sm text-[#6b5e54]">Paid</p>
            <h2 className="mt-2 text-3xl font-extrabold text-green-700">
              {paidCount}
            </h2>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
          <CardContent className="p-5">
            <p className="text-sm text-[#6b5e54]">Due Soon</p>
            <h2 className="mt-2 text-3xl font-extrabold text-orange-700">
              {dueSoonCount}
            </h2>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
          <CardContent className="p-5">
            <p className="text-sm text-[#6b5e54]">Overdue</p>
            <h2 className="mt-2 text-3xl font-extrabold text-red-700">
              {overdueCount}
            </h2>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
          <CardContent className="p-5">
            <p className="text-sm text-[#6b5e54]">Pending Amount</p>
            <h2 className="mt-2 text-2xl font-extrabold">
              {formatCurrency(totalPendingAmount)}
            </h2>
          </CardContent>
        </Card>
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
            filteredItems.map((item, index) => (
              <Card
                key={getInstallmentKey(item, index)}
                className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]"
              >
                <CardContent className="flex flex-col justify-between gap-4 p-5 xl:flex-row xl:items-center">
                  <div>
                    <h3 className="text-lg font-extrabold">
                      {item.memberName}
                    </h3>

                    <p className="text-sm text-[#6b5e54]">
                      {item.loanType} • Installment {item.installmentNumber}/
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
                      {item.status === "paid"
                        ? `Paid: ${formatDate(item.paidAt)}`
                        : item.daysLeft >= 0
                          ? `${item.daysLeft} days left`
                          : `${Math.abs(item.daysLeft)} days overdue`}
                    </p>

                    {item.paymentReference && (
                      <p className="mt-1 text-xs text-[#8b7a6d]">
                        Payment Ref: {item.paymentReference}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        item.dueStatus === "overdue"
                          ? "bg-red-100 text-red-700"
                          : item.dueStatus === "due_soon"
                            ? "bg-orange-100 text-orange-700"
                            : item.dueStatus === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {item.dueStatus.replaceAll("_", " ")}
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

                    {item.status === "paid" && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                        <CheckCircle2 size={13} className="mr-1" />
                        Paid
                      </span>
                    )}
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