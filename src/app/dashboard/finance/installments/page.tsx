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
  User,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type GroupedInstallment = {
  _id: string;
  installmentNumber: number;
  amount: number;
  paidAmount: number;
  paymentReference: string;
  dueDate: string;
  daysLeft: number;
  status: "pending" | "paid" | "overdue";
  dueStatus: "upcoming" | "due_soon" | "overdue" | "paid";
  paidAt: string | null;
  reminderSent: boolean;
  reminderSentAt: string | null;
};

type GroupedLoan = {
  loanId: string;
  loanType: string;
  loanStatus: string;
  approvedAmount: number;
  totalRepayment: number;
  remainingBalance: number;
  totalInstallments: number;
  totalPaidInstallments: number;
  installments: GroupedInstallment[];
};

type GroupedUser = {
  userId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  employeeId: string;
  loans: GroupedLoan[];
};

type ApiResponse = {
  success: boolean;
  data?: GroupedUser[];
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
  const [items, setItems] = useState<GroupedUser[]>([]);
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

      setItems(data.data || []);
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
    }, 5000); 

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items
      .map((user) => {
        const userMatches =
          safeText(user.memberName).toLowerCase().includes(query) ||
          safeText(user.memberPhone).toLowerCase().includes(query) ||
          safeText(user.employeeId).toLowerCase().includes(query);

        const filteredLoans = user.loans
          .map((loan) => {
            const loanMatches = safeText(loan.loanType)
              .toLowerCase()
              .includes(query);

            const filteredInstallments = loan.installments.filter((inst) => {
              return (
                safeText(inst.status).toLowerCase().includes(query) ||
                safeText(inst.dueStatus).toLowerCase().includes(query) ||
                safeText(inst.paymentReference).toLowerCase().includes(query)
              );
            });

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
          .filter(Boolean) as GroupedLoan[];

        if (userMatches || filteredLoans.length > 0) {
          return {
            ...user,
            loans: filteredLoans.length > 0 ? filteredLoans : user.loans,
          };
        }
        return null;
      })
      .filter(Boolean) as GroupedUser[];
  }, [items, search]);

  const allInstallments = useMemo(() => {
    return items.flatMap((user) =>
      user.loans.flatMap((loan) => loan.installments)
    );
  }, [items]);

  const pendingCount = allInstallments.filter((i) => i.status === "pending").length;
  const paidCount = allInstallments.filter((i) => i.status === "paid").length;
  const dueSoonCount = allInstallments.filter((i) => i.dueStatus === "due_soon").length;
  const overdueCount = allInstallments.filter((i) => i.dueStatus === "overdue").length;

  const totalPendingAmount = allInstallments
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  return (
    <div className="min-h-screen rounded-[34px] bg-[#eee6da] p-6 text-[#2b241f]">
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-6 shadow-lg lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="text-[#9b6f45]" />
            <h1 className="text-3xl font-extrabold">Loan Installments</h1>
          </div>

          <p className="mt-2 text-sm text-[#6b5e54]">
            Track all member installments from the real-time database.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => void loadInstallments(true)}
          variant="outline"
          className="rounded-2xl border-[#d9c8b8] bg-[#fbf7ef] text-[#2b241f] hover:bg-[#fffaf3]"
        >
          <RefreshCcw size={16} className="mr-2" />
          Refresh Data
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
        <div className="space-y-6">
          {filteredItems.length === 0 ? (
            <Card className="rounded-3xl border-[#d9c8b8] bg-[#fbf7ef]">
              <CardContent className="p-10 text-center text-[#6b5e54]">
                No active records found.
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((user) => (
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
                            <h3 className="text-base font-bold text-[#4a3f35]">
                              {loan.loanType}
                            </h3>
                            <p className="text-xs font-medium text-[#8b7a6d]">
                              Approved: {formatCurrency(loan.approvedAmount)} •
                              Remaining Balance:{" "}
                              {formatCurrency(loan.remainingBalance)}
                            </p>
                          </div>
                        </div>
                        <span className="inline-block rounded-full border border-[#d9c8b8] bg-white px-3 py-1 text-xs font-bold text-[#6b5e54]">
                          {loan.totalPaidInstallments} / {loan.totalInstallments}{" "}
                          Paid
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                        {loan.installments.map((item) => {
                          const status = item.status || "pending";
                          const dueStatus = item.dueStatus || "upcoming";
                          const daysLeft = Number(item.daysLeft || 0);

                          return (
                            <div
                              key={item._id}
                              className="flex flex-col justify-between gap-3 rounded-2xl border border-[#e8dac6] bg-white p-4 shadow-sm transition hover:shadow-md"
                            >
                              <div>
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-sm font-bold text-[#4a3f35]">
                                    Installment {item.installmentNumber}
                                  </span>
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
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
                                </div>

                                <p className="text-lg font-extrabold text-[#2b241f]">
                                  {formatCurrency(item.amount)}
                                </p>

                                <p className="mt-1 flex items-center gap-1 text-xs text-[#8b7a6d]">
                                  <Clock3 size={12} />
                                  Due: {formatDate(item.dueDate)}
                                  {status !== "paid" && (
                                    <span className="ml-1 opacity-70">
                                      ({daysLeft >= 0
                                        ? `${daysLeft} days left`
                                        : `${Math.abs(daysLeft)} days overdue`})
                                    </span>
                                  )}
                                </p>

                                {item.paymentReference && (
                                  <p className="mt-1 text-xs font-medium text-[#8b7a6d]">
                                    Ref: {item.paymentReference}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 pt-2">
                                {item.reminderSent ? (
                                  <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700">
                                    <Bell size={10} className="mr-1" /> SMS Sent
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-500">
                                    <Bell size={10} className="mr-1 opacity-50" />{" "}
                                    No SMS
                                  </span>
                                )}

                                {status === "paid" && (
                                  <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700">
                                    <CheckCircle2 size={10} className="mr-1" />{" "}
                                    Paid {formatDate(item.paidAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
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
        <p className="text-sm font-medium text-[#6b5e54]">{title}</p>
        <h2 className={`mt-2 text-3xl font-extrabold ${valueClass}`}>
          {value}
        </h2>
      </CardContent>
    </Card>
  );
}