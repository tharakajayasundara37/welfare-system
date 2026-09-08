"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  RefreshCcw,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Installment = {
  _id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  paidAt?: string | null;
  paidAmount?: number;
  paymentReference?: string;
  penaltyAmount?: number;
  loanId?: {
    _id: string;
    loanType: string;
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
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [paying, setPaying] = useState(false);
  const [selectedInstallment, setSelectedInstallment] =
    useState<Installment | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    cardHolderName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

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
        String(item.installmentNumber).includes(keyword)
      );
    });
  }, [installments, search]);

  function openPayment(installment: Installment) {
    setSelectedInstallment(installment);
    setPaymentForm({
      cardHolderName: "",
      cardNumber: "",
      expiry: "",
      cvv: "",
    });
    setMessage("");
    setError("");
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentForm),
        }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Payment failed");
        return;
      }

      setMessage(data.message || "Installment paid successfully.");
      setSelectedInstallment(null);
      setPaymentForm({
        cardHolderName: "",
        cardNumber: "",
        expiry: "",
        cvv: "",
      });
      await loadInstallments(true);
    } catch {
      setError("Something went wrong while paying installment");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="min-h-screen rounded-[34px] bg-[#eee6da] p-6 text-[#2b241f]">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-6 shadow-lg md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">My Installments</h1>
          <p className="mt-2 text-sm text-[#6b5e54]">
            Track your loan installments and penalties
          </p>
        </div>

        <Button
          onClick={() => loadInstallments(true)}
          disabled={refreshing || loading}
          variant="outline"
          className="rounded-2xl border-[#d9c8b8] bg-[#f8f1e8] text-[#9b6f45]"
        >
          {refreshing || loading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <RefreshCcw size={18} className="mr-2" />}
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-[#d9c8b8] bg-[#fbf7ef] p-5 shadow">
          <div className="flex items-center gap-3">
            <Clock3 className="text-yellow-600" />
            <div>
              <p className="text-sm text-[#6b5e54]">Pending</p>
              <h2 className="text-2xl font-extrabold">{summary.pendingCount}</h2>
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
            <AlertTriangle className="text-red-600" />
            <div>
              <p className="text-sm text-[#6b5e54]">Overdue</p>
              <h2 className="text-2xl font-extrabold">{summary.overdueCount}</h2>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#d9c8b8] bg-[#fbf7ef] p-5 shadow">
          <div className="flex items-center gap-3">
            <CreditCard className="text-blue-600" />
            <div>
              <p className="text-sm text-[#6b5e54]">Pending Amount</p>
              <h2 className="text-xl font-extrabold">{formatCurrency(summary.totalPendingAmount)}</h2>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border border-emerald-600/25 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-600/20 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-6 flex items-center gap-2 rounded-3xl border border-[#d9c8b8] bg-[#fbf7ef] px-4 py-3 shadow">
        <Search size={18} className="text-[#9b6f45]" />
        <input
          type="text"
          placeholder="Search by loan type or installment number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#9b6f45]/60"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#9b6f45]" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-[#d9c8b8] bg-[#fbf7ef] shadow">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-[#f6f1ea]">
              <tr>
                <th className="p-4 text-left text-sm font-extrabold">Loan</th>
                <th className="p-4 text-left text-sm font-extrabold">Installment</th>
                <th className="p-4 text-left text-sm font-extrabold">Amount</th>
                <th className="p-4 text-left text-sm font-extrabold">Due Date</th>
                <th className="p-4 text-left text-sm font-extrabold">Penalty</th>
                <th className="p-4 text-left text-sm font-extrabold">Total Payable</th>
                <th className="p-4 text-left text-sm font-extrabold">Status</th>
                <th className="p-4 text-right text-sm font-extrabold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstallments.map((item) => {
                const isOverdue = item.status === "overdue";
                const totalPayable = item.amount + (item.penaltyAmount || 0);

                return (
                  <tr key={item._id} className="border-t border-[#d9c8b8] hover:bg-[#f8f1e8]/50">
                    <td className="p-4 text-sm font-semibold">{item.loanId?.loanType || "Loan"}</td>
                    <td className="p-4 text-sm font-bold">#{item.installmentNumber}</td>
                    <td className="p-4 text-sm font-semibold">{formatCurrency(item.amount)}</td>
                    <td className="p-4 text-sm">{format(new Date(item.dueDate), "yyyy-MM-dd")}</td>

                    {/* Penalty Column */}
                    <td className="p-4">
                      {isOverdue && item.penaltyAmount && item.penaltyAmount > 0 ? (
                        <div>
                          <span className="font-bold text-red-600">{formatCurrency(item.penaltyAmount)}</span>
                          <div className="text-[10px] text-red-500">Daily penalty applied</div>
                        </div>
                      ) : (
                        <span className="text-[#9b6f45]">-</span>
                      )}
                    </td>

                    {/* Total Payable */}
                    <td className="p-4 font-extrabold text-[#2b241f]">
                      {formatCurrency(totalPayable)}
                    </td>

                    <td className="p-4">
                      {item.status === "overdue" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                          <AlertTriangle size={14} /> Overdue
                        </span>
                      )}
                      {item.status === "pending" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                          Pending
                        </span>
                      )}
                      {item.status === "paid" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                          <CheckCircle2 size={14} /> Paid
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      {item.status === "paid" ? (
                        <span className="text-sm font-bold text-green-700">Paid</span>
                      ) : canPayInstallment(item) ? (
                        <Button
                          onClick={() => openPayment(item)}
                          className="rounded-xl bg-[#9b6f45] text-white hover:bg-[#835c38]"
                        >
                          <CreditCard size={16} className="mr-2" /> Pay
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-500">Opens tomorrow</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredInstallments.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-[#6b5e54]">
                    No installments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={Boolean(selectedInstallment)}
        onOpenChange={(open) => {
          if (!open && !paying) setSelectedInstallment(null);
        }}
      >
        <DialogContent className="border-[#d9c8b8] bg-[#fbf7ef] p-6 text-[#2b241f] sm:max-w-lg">
          <form onSubmit={handlePayInstallment}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold">
                Pay installment
              </DialogTitle>
              <DialogDescription className="leading-6 text-[#6b5e54]">
                This is a demo payment. No real card charge will be made.
              </DialogDescription>
            </DialogHeader>

            {selectedInstallment && (
              <div className="mt-5 rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b6f45]">
                      {selectedInstallment.loanId?.loanType || "Loan"}
                    </p>
                    <p className="mt-1 font-extrabold">
                      Installment #{selectedInstallment.installmentNumber}
                    </p>
                  </div>
                  <p className="text-lg font-black">
                    {formatCurrency(
                      selectedInstallment.amount +
                        (selectedInstallment.penaltyAmount || 0)
                    )}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-2xl border border-red-600/20 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <div className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="installment-card-holder">Card holder name</Label>
                <Input
                  id="installment-card-holder"
                  value={paymentForm.cardHolderName}
                  onChange={(event) =>
                    setPaymentForm((current) => ({
                      ...current,
                      cardHolderName: event.target.value,
                    }))
                  }
                  placeholder="Name on card"
                  autoComplete="cc-name"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="installment-card-number">Card number</Label>
                <Input
                  id="installment-card-number"
                  value={paymentForm.cardNumber}
                  onChange={(event) =>
                    setPaymentForm((current) => ({
                      ...current,
                      cardNumber: event.target.value,
                    }))
                  }
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  minLength={12}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="installment-expiry">Expiry</Label>
                  <Input
                    id="installment-expiry"
                    value={paymentForm.expiry}
                    onChange={(event) =>
                      setPaymentForm((current) => ({
                        ...current,
                        expiry: event.target.value,
                      }))
                    }
                    placeholder="MM/YY"
                    autoComplete="cc-exp"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="installment-cvv">CVV</Label>
                  <Input
                    id="installment-cvv"
                    type="password"
                    value={paymentForm.cvv}
                    onChange={(event) =>
                      setPaymentForm((current) => ({
                        ...current,
                        cvv: event.target.value,
                      }))
                    }
                    placeholder="123"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    minLength={3}
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 border-[#d9c8b8] bg-[#f1e5d8]/60">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={paying}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={paying}
                className="bg-[#9b6f45] text-white hover:bg-[#835c38]"
              >
                {paying ? (
                  <Loader2 className="mr-2 animate-spin" size={17} />
                ) : (
                  <CreditCard className="mr-2" size={17} />
                )}
                {paying ? "Processing..." : "Confirm mock payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
