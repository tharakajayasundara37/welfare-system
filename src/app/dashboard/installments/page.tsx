"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Installment = {
  _id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  paidAt?: string | null;
  paidAmount?: number;
  paymentReference?: string;
  loanId?: {
    _id: string;
    loanType: string;
    approvedAmount: number;
    remainingBalance: number;
    status: string;
  };
};

type ApiResponse = {
  success: boolean;
  installments: Installment[];
  summary: {
    total: number;
    pendingCount: number;
    paidCount: number;
    overdueCount: number;
    totalPendingAmount: number;
  };
  message?: string;
};

type PayResponse = {
  success: boolean;
  message?: string;
};

const defaultSummary = {
  total: 0,
  pendingCount: 0,
  paidCount: 0,
  overdueCount: 0,
  totalPendingAmount: 0,
};

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function getPaymentOpenDate(dueDate: string) {
  const date = new Date(dueDate);
  date.setDate(date.getDate() - 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function canPayInstallment(item: Installment) {
  if (item.status === "paid") return false;

  const now = new Date();
  const openDate = getPaymentOpenDate(item.dueDate);

  return now >= openDate;
}

export default function InstallmentsPage() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [summary, setSummary] = useState(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [selectedInstallment, setSelectedInstallment] =
    useState<Installment | null>(null);

  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/30");
  const [cvv, setCvv] = useState("123");

  const loadInstallments = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      setError("");

      const response = await fetch("/api/member/installments", {
        cache: "no-store",
      });

      const data = (await response.json()) as ApiResponse;

      if (!data.success) {
        setError(data.message || "Failed to load installments");
        return;
      }

      setInstallments(data.installments || []);
      setSummary(data.summary || defaultSummary);
    } catch (error) {
      console.error(error);
      setError("Something went wrong while loading installments");
    } finally {
      if (showLoader) setLoading(false);
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => {
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
  }, [loadInstallments]);

  const filteredInstallments = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return installments;

    return installments.filter((item) => {
      return (
        item.loanId?.loanType?.toLowerCase().includes(keyword) ||
        item.status.toLowerCase().includes(keyword) ||
        String(item.installmentNumber).includes(keyword) ||
        String(item.amount).includes(keyword) ||
        String(item.paymentReference || "").toLowerCase().includes(keyword)
      );
    });
  }, [installments, search]);

  function openPayment(installment: Installment) {
    setSelectedInstallment(installment);
    setMessage("");
    setError("");
    setCardHolderName("");
    setCardNumber("4242 4242 4242 4242");
    setExpiry("12/30");
    setCvv("123");
  }

  async function handlePayInstallment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedInstallment) return;

    try {
      setPaying(true);
      setMessage("");
      setError("");

      const response = await fetch(
        `/api/member/installments/${selectedInstallment._id}/pay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cardHolderName,
            cardNumber,
            expiry,
            cvv,
          }),
        }
      );

      const data = (await response.json()) as PayResponse;

      if (!data.success) {
        setError(data.message || "Payment failed");
        return;
      }

      setMessage(data.message || "Installment paid successfully.");
      setSelectedInstallment(null);
      await loadInstallments(true);
    } catch (error) {
      console.error(error);
      setError("Something went wrong while paying installment");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="min-h-screen rounded-[34px] bg-[#eee6da] p-6 text-[#2b241f]">
      <div className="mb-8 flex flex-col gap-4 rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-6 shadow-lg md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2b241f]">
            My Installments
          </h1>

          <p className="mt-2 text-sm text-[#6b5e54]">
            View pending, paid and overdue installment payments.
          </p>
        </div>

        <Button
          onClick={() => loadInstallments(true)}
          disabled={refreshing || loading}
          variant="outline"
          className="rounded-2xl border-[#d9c8b8] bg-[#f8f1e8] text-[#9b6f45]"
        >
          {refreshing || loading ? (
            <Loader2 size={18} className="mr-2 animate-spin" />
          ) : (
            <RefreshCcw size={18} className="mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-[#d9c8b8] bg-[#fbf7ef] p-5 shadow">
          <div className="flex items-center gap-3">
            <Clock3 className="text-yellow-600" />
            <div>
              <p className="text-sm text-[#6b5e54]">Pending</p>
              <h2 className="text-2xl font-extrabold">
                {summary.pendingCount}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#d9c8b8] bg-[#fbf7ef] p-5 shadow">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-green-600" />
            <div>
              <p className="text-sm text-[#6b5e54]">Paid</p>
              <h2 className="text-2xl font-extrabold">{summary.paidCount}</h2>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#d9c8b8] bg-[#fbf7ef] p-5 shadow">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600" />
            <div>
              <p className="text-sm text-[#6b5e54]">Overdue</p>
              <h2 className="text-2xl font-extrabold">
                {summary.overdueCount}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#d9c8b8] bg-[#fbf7ef] p-5 shadow">
          <div className="flex items-center gap-3">
            <CreditCard className="text-blue-600" />
            <div>
              <p className="text-sm text-[#6b5e54]">Pending Amount</p>
              <h2 className="text-xl font-extrabold">
                {formatCurrency(summary.totalPendingAmount)}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-2xl border border-emerald-600/25 bg-emerald-100 p-4 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 flex items-center gap-2 rounded-3xl border border-[#d9c8b8] bg-[#fbf7ef] px-4 py-3 shadow">
        <Search size={18} className="text-[#9b6f45]" />
        <input
          type="text"
          placeholder="Search installments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#9b6f45]/60"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#9b6f45]" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-[#d9c8b8] bg-[#fbf7ef] shadow">
          <table className="w-full min-w-[900px]">
            <thead className="bg-[#f6f1ea]">
              <tr>
                <th className="p-4 text-left text-sm font-extrabold">Loan</th>
                <th className="p-4 text-left text-sm font-extrabold">
                  Installment
                </th>
                <th className="p-4 text-left text-sm font-extrabold">
                  Amount
                </th>
                <th className="p-4 text-left text-sm font-extrabold">
                  Due Date
                </th>
                <th className="p-4 text-left text-sm font-extrabold">
                  Status
                </th>
                <th className="p-4 text-left text-sm font-extrabold">
                  Reference
                </th>
                <th className="p-4 text-left text-sm font-extrabold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredInstallments.map((item) => {
                const paymentOpenDate = getPaymentOpenDate(item.dueDate);
                const canPay = canPayInstallment(item);

                return (
                  <tr key={item._id} className="border-t border-[#d9c8b8]">
                    <td className="p-4 text-sm font-semibold">
                      {item.loanId?.loanType || "Loan"}
                    </td>

                    <td className="p-4 text-sm">#{item.installmentNumber}</td>

                    <td className="p-4 text-sm font-semibold">
                      {formatCurrency(item.amount)}
                    </td>

                    <td className="p-4 text-sm">
                      {format(new Date(item.dueDate), "yyyy-MM-dd")}
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          item.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : item.status === "overdue"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="p-4 text-xs text-[#6b5e54]">
                      {item.paymentReference || "-"}
                    </td>

                    <td className="p-4">
                      {item.status === "paid" ? (
                        <span className="text-xs font-bold text-green-700">
                          Paid
                        </span>
                      ) : canPay ? (
                        <Button
                          onClick={() => openPayment(item)}
                          className="rounded-xl bg-[#9b6f45] text-white hover:bg-[#835c38]"
                        >
                          <CreditCard size={16} className="mr-2" />
                          Pay Now
                        </Button>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                          Opens {format(paymentOpenDate, "yyyy-MM-dd")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredInstallments.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-[#6b5e54]">
                    No installments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedInstallment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-3xl rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef] shadow-2xl">
            <CardContent className="p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e5d8] text-[#8a5f3c]">
                    <CreditCard size={28} />
                  </div>

                  <h2 className="mt-4 text-3xl font-extrabold">
                    Mock Card Payment
                  </h2>

                  <p className="mt-2 text-sm text-[#6b5e54]">
                    Installment #{selectedInstallment.installmentNumber} •{" "}
                    {formatCurrency(selectedInstallment.amount)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedInstallment(null)}
                  aria-label="Close payment modal"
                  title="Close payment modal"
                  className="rounded-full bg-[#f1e5d8] p-2 text-[#9b6f45]"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              <div className="mb-6 rounded-3xl border border-[#d9c8b8] bg-[#fffaf3] p-5 text-sm">
                <p className="font-extrabold text-[#2b241f]">Demo Card</p>
                <p className="mt-2 text-[#6b5e54]">
                  Card Number:{" "}
                  <span className="font-bold">4242 4242 4242 4242</span>
                </p>
                <p className="text-[#6b5e54]">
                  Expiry: <span className="font-bold">12/30</span> | CVV:{" "}
                  <span className="font-bold">123</span>
                </p>
              </div>

              <form onSubmit={handlePayInstallment} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-[#2b241f]">
                    Card Holder Name
                  </label>
                  <Input
                    value={cardHolderName}
                    onChange={(event) => setCardHolderName(event.target.value)}
                    className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]"
                    placeholder="Example: Tharaka Jayasundara"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-[#2b241f]">
                    Card Number
                  </label>
                  <Input
                    value={cardNumber}
                    onChange={(event) =>
                      setCardNumber(formatCardNumber(event.target.value))
                    }
                    className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]"
                    placeholder="4242 4242 4242 4242"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-bold text-[#2b241f]">
                      Expiry Date
                    </label>
                    <Input
                      value={expiry}
                      onChange={(event) =>
                        setExpiry(formatExpiry(event.target.value))
                      }
                      className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]"
                      placeholder="12/30"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-[#2b241f]">
                      CVV
                    </label>
                    <Input
                      value={cvv}
                      onChange={(event) =>
                        setCvv(
                          event.target.value.replace(/\D/g, "").slice(0, 4)
                        )
                      }
                      className="mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]"
                      placeholder="123"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={paying}
                  className="h-12 w-full rounded-2xl bg-[#9b6f45] font-extrabold text-white hover:bg-[#835c38]"
                >
                  {paying ? (
                    <Loader2 className="mr-2 animate-spin" size={18} />
                  ) : (
                    <ShieldCheck className="mr-2" size={18} />
                  )}
                  Pay {formatCurrency(selectedInstallment.amount)}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}