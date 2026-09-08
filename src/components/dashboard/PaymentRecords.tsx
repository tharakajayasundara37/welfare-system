"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  FileText,
  History,
  Loader2,
  Printer,
  ReceiptText,
  RefreshCcw,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type PaymentRecord = {
  id: string;
  paymentType: "monthly_fee" | "loan_installment";
  title: string;
  amount: number;
  status: string;
  dueDate?: string | null;
  paidAt?: string | null;
  paymentMethod?: string;
  transactionReference?: string;
  receiptNumber?: string;
  maskedCardNumber?: string;
};

type ApiResponse = {
  success: boolean;
  records?: PaymentRecord[];
  message?: string;
};

type Filter = "all" | PaymentRecord["paymentType"];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function paymentTypeLabel(type: PaymentRecord["paymentType"]) {
  return type === "monthly_fee" ? "Monthly fee" : "Loan installment";
}

function statusClass(status: string) {
  if (status === "paid") {
    return "border-emerald-600/20 bg-emerald-50 text-emerald-700";
  }
  if (status === "overdue") {
    return "border-red-600/20 bg-red-50 text-red-700";
  }
  return "border-amber-600/20 bg-amber-50 text-amber-700";
}

export default function PaymentRecords({
  mode,
}: {
  mode: "history" | "receipts";
}) {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedRecord, setSelectedRecord] =
    useState<PaymentRecord | null>(null);

  const loadRecords = useCallback(async (initial = false) => {
    try {
      if (initial) setLoading(true);
      else setRefreshing(true);
      setError("");

      const response = await fetch("/api/member/payment-history", {
        cache: "no-store",
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to load payment records.");
        return;
      }

      setRecords(data.records || []);
    } catch {
      setError("Something went wrong while loading payment records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRecords(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadRecords]);

  const visibleRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return records.filter((record) => {
      if (mode === "receipts" && record.status !== "paid") return false;
      if (filter !== "all" && record.paymentType !== filter) return false;

      if (!keyword) return true;

      return [
        record.title,
        record.status,
        record.transactionReference,
        record.receiptNumber,
      ].some((value) => String(value || "").toLowerCase().includes(keyword));
    });
  }, [filter, mode, records, search]);

  const paidTotal = useMemo(
    () =>
      records
        .filter((record) => record.status === "paid")
        .reduce((total, record) => total + Number(record.amount || 0), 0),
    [records]
  );

  const pageTitle = mode === "history" ? "Transaction History" : "Receipts";
  const pageDescription =
    mode === "history"
      ? "Review monthly welfare fees and loan installment transactions in one place."
      : "Open paid transaction receipts and print or save them as PDF.";
  const PageIcon = mode === "history" ? History : ReceiptText;

  return (
    <div className="payment-records-page min-h-screen rounded-[34px] bg-[#eee6da] p-4 text-[#2b241f] sm:p-6">
      <section className="rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/95 p-6 shadow-[0_24px_80px_rgba(44,36,31,0.14)]">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <Button asChild variant="outline" className="mb-5 border-[#d9c8b8]">
              <Link href="/dashboard/payments">
                <ArrowLeft className="mr-2" size={16} />
                Back to payments
              </Link>
            </Button>

            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2c241f] text-[#d8ad80]">
                <PageIcon size={26} />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#9b6f45]">
                  Payment Center
                </p>
                <h1 className="mt-1 text-3xl font-black sm:text-4xl">
                  {pageTitle}
                </h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6b5e54]">
              {pageDescription}
            </p>
          </div>

          <Button
            type="button"
            onClick={() => void loadRecords(false)}
            disabled={loading || refreshing}
            className="bg-[#9b6f45] text-white hover:bg-[#835c38]"
          >
            <RefreshCcw
              className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
              size={17}
            />
            Refresh
          </Button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="border-[#d9c8b8] bg-[#fbf7ef]">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-[#6b5e54]">All records</p>
            <p className="mt-2 text-3xl font-black">{records.length}</p>
          </CardContent>
        </Card>
        <Card className="border-[#d9c8b8] bg-[#fbf7ef]">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-[#6b5e54]">Paid records</p>
            <p className="mt-2 text-3xl font-black">
              {records.filter((record) => record.status === "paid").length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-[#d9c8b8] bg-[#2c241f] text-white">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-[#ead9c8]">Total paid</p>
            <p className="mt-2 text-3xl font-black text-[#d8ad80]">
              {formatCurrency(paidTotal)}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 rounded-[28px] border border-[#d9c8b8] bg-[#fbf7ef] p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["monthly_fee", "Monthly fees"],
                ["loan_installment", "Installments"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant={filter === value ? "default" : "outline"}
                onClick={() => setFilter(value)}
                className={
                  filter === value
                    ? "bg-[#2c241f] text-white hover:bg-[#9b6f45]"
                    : "border-[#d9c8b8]"
                }
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9b6f45]"
              size={17}
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search receipt or reference..."
              className="border-[#d9c8b8] bg-[#f8f1e8] pl-10"
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-600/20 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <section className="mt-6">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]">
            <Loader2 className="animate-spin text-[#9b6f45]" size={28} />
          </div>
        ) : visibleRecords.length === 0 ? (
          <div className="rounded-[30px] border border-dashed border-[#c9b7a5] bg-[#fbf7ef]/80 p-12 text-center">
            <FileText className="mx-auto text-[#9b6f45]" size={34} />
            <h2 className="mt-4 text-xl font-extrabold">No records found</h2>
            <p className="mt-2 text-sm text-[#6b5e54]">
              {mode === "receipts"
                ? "Receipts will appear after a successful payment."
                : "Try another search or filter."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {visibleRecords.map((record) => (
              <Card
                key={`${record.paymentType}-${record.id}`}
                className="border-[#d9c8b8] bg-[#fbf7ef] shadow-sm"
              >
                <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f1e5d8] text-[#9b6f45]">
                      {record.paymentType === "monthly_fee" ? (
                        <CalendarDays size={22} />
                      ) : (
                        <CreditCard size={22} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#9b6f45]">
                        {paymentTypeLabel(record.paymentType)}
                      </p>
                      <h2 className="mt-1 truncate text-lg font-extrabold">
                        {record.title}
                      </h2>
                      <p className="mt-2 text-sm text-[#6b5e54]">
                        {record.status === "paid"
                          ? `Paid ${formatDate(record.paidAt)}`
                          : `Due ${formatDate(record.dueDate)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-extrabold capitalize ${statusClass(
                        record.status
                      )}`}
                    >
                      {record.status}
                    </span>
                    <p className="min-w-32 text-lg font-black lg:text-right">
                      {formatCurrency(record.amount)}
                    </p>
                    {record.status === "paid" && (
                      <Button
                        type="button"
                        onClick={() => setSelectedRecord(record)}
                        className="bg-[#2c241f] text-white hover:bg-[#9b6f45]"
                      >
                        <ReceiptText className="mr-2" size={16} />
                        View receipt
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(selectedRecord)}
        onOpenChange={(open) => {
          if (!open) setSelectedRecord(null);
        }}
      >
        <DialogContent className="receipt-print-area border-[#d9c8b8] bg-white p-7 text-[#2b241f] sm:max-w-lg">
          <DialogHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2c241f] text-[#d8ad80]">
              <ReceiptText size={23} />
            </div>
            <DialogTitle className="mt-3 text-2xl font-black">
              WelfareX payment receipt
            </DialogTitle>
            <DialogDescription>
              Demo transaction receipt generated by the welfare system.
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="mt-4 grid gap-3 rounded-2xl border border-[#d9c8b8] bg-[#fbf7ef] p-5">
              <ReceiptRow label="Payment" value={selectedRecord.title} />
              <ReceiptRow
                label="Type"
                value={paymentTypeLabel(selectedRecord.paymentType)}
              />
              <ReceiptRow
                label="Amount"
                value={formatCurrency(selectedRecord.amount)}
              />
              <ReceiptRow label="Paid at" value={formatDate(selectedRecord.paidAt)} />
              <ReceiptRow
                label="Receipt number"
                value={selectedRecord.receiptNumber || "Not available"}
              />
              <ReceiptRow
                label="Transaction reference"
                value={selectedRecord.transactionReference || "Not available"}
              />
              <ReceiptRow
                label="Payment method"
                value={
                  selectedRecord.paymentMethod
                    ? selectedRecord.paymentMethod.replaceAll("_", " ")
                    : "Not available"
                }
              />
              {selectedRecord.maskedCardNumber && (
                <ReceiptRow
                  label="Card"
                  value={selectedRecord.maskedCardNumber}
                />
              )}
            </div>
          )}

          <DialogFooter className="receipt-print-actions mt-5 border-[#d9c8b8] bg-[#f8f1e8]">
            <Button
              type="button"
              onClick={() => window.print()}
              className="bg-[#9b6f45] text-white hover:bg-[#835c38]"
            >
              <Printer className="mr-2" size={16} />
              Print / Save PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#e5d8ca] pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#79695d]">
        {label}
      </span>
      <span className="break-all text-sm font-extrabold sm:text-right">
        {value}
      </span>
    </div>
  );
}
