"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type MonthlyFeePayment = {
  id: string;
  month: number;
  year: number;
  monthName: string;
  amount: number;
  status: "pending" | "paid" | "overdue" | "failed";
  dueDate: string | null;
  paidAt: string | null;
  paymentMethod: string;
  transactionReference: string;
  receiptNumber: string;
  isOverdue: boolean;
};

type MonthlyFeeStatusResponse = {
  success: boolean;
  message?: string;
  payment?: MonthlyFeePayment;
};

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
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
    const text = await response.text();

    console.error("NON_JSON_RESPONSE:", text.slice(0, 500));

    throw new Error(
      "API returned HTML instead of JSON. Check /api/member/monthly-fee/status route path."
    );
  }

  return response.json();
}

function getStatusStyle(status?: string) {
  if (status === "paid") {
    return {
      card: "border-emerald-500/20 bg-emerald-500/10",
      iconBg: "bg-emerald-500/15 text-emerald-700",
      badge: "border-emerald-500/20 bg-emerald-500/15 text-emerald-700",
      title: "Monthly Welfare Fee Paid",
      icon: CheckCircle2,
    };
  }

  if (status === "overdue") {
    return {
      card: "border-red-500/25 bg-red-500/10",
      iconBg: "bg-red-500/15 text-red-700",
      badge: "border-red-500/20 bg-red-500/15 text-red-700",
      title: "Monthly Welfare Fee Overdue",
      icon: AlertTriangle,
    };
  }

  return {
    card: "border-orange-500/25 bg-orange-500/10",
    iconBg: "bg-orange-500/15 text-orange-700",
    badge: "border-orange-500/20 bg-orange-500/15 text-orange-700",
    title: "Monthly Welfare Fee Pending",
    icon: CalendarDays,
  };
}

export default function MonthlyFeeCard() {
  const [payment, setPayment] = useState<MonthlyFeePayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadMonthlyFeeStatus(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setMessage("");

      const response = await fetch("/api/member/monthly-fee/status", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await readJsonResponse(
        response
      )) as MonthlyFeeStatusResponse;

      if (!result.success || !result.payment) {
        setPayment(null);
        setMessage(result.message || "Failed to load monthly fee status.");
        return;
      }

      setPayment(result.payment);
    } catch (error) {
      console.error("LOAD_MONTHLY_FEE_STATUS_ERROR", error);

      setPayment(null);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load monthly fee status."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMonthlyFeeStatus(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-6 text-[#2b241f] shadow-[0_24px_80px_rgba(44,36,31,0.12)]">
        <div className="flex items-center text-sm font-bold text-[#6b5e54]">
          <Loader2 className="mr-2 animate-spin text-[#9b6f45]" size={18} />
          Loading monthly welfare fee...
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="rounded-[30px] border border-red-500/25 bg-red-500/10 p-6 text-red-700">
        <p className="text-sm font-bold">
          {message || "Monthly fee status could not be loaded."}
        </p>

        <Button
          type="button"
          onClick={() => void loadMonthlyFeeStatus(true)}
          className="mt-4 rounded-2xl bg-red-700 text-white hover:bg-red-800"
        >
          <RefreshCcw className="mr-2" size={16} />
          Retry
        </Button>
      </div>
    );
  }

  const style = getStatusStyle(payment.status);
  const Icon = style.icon;

  return (
    <div
      className={`relative overflow-hidden rounded-[30px] border p-6 shadow-[0_24px_80px_rgba(44,36,31,0.12)] ${style.card}`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#d8ad80]/25 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${style.iconBg}`}
          >
            <Icon size={27} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-extrabold text-[#2b241f]">
                {style.title}
              </h3>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-extrabold uppercase ${style.badge}`}
              >
                {payment.status}
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-[#6b5e54]">
              {payment.status === "paid"
                ? `Your monthly welfare contribution for ${payment.monthName} ${payment.year} has been paid successfully.`
                : payment.status === "overdue"
                ? `Your monthly welfare contribution for ${payment.monthName} ${payment.year} is overdue. Please complete the payment as soon as possible.`
                : `Your monthly welfare contribution for ${payment.monthName} ${payment.year} is pending. Please complete the payment before the first week deadline.`}
            </p>

            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-2xl border border-[#d9c8b8] bg-[#fbf7ef]/70 p-3">
                <p className="font-bold text-[#9b6f45]">Amount</p>
                <p className="mt-1 font-extrabold text-[#2b241f]">
                  {formatCurrency(payment.amount)}
                </p>
              </div>

              <div className="rounded-2xl border border-[#d9c8b8] bg-[#fbf7ef]/70 p-3">
                <p className="font-bold text-[#9b6f45]">Due Date</p>
                <p className="mt-1 font-extrabold text-[#2b241f]">
                  {formatDate(payment.dueDate)}
                </p>
              </div>

              <div className="rounded-2xl border border-[#d9c8b8] bg-[#fbf7ef]/70 p-3">
                <p className="font-bold text-[#9b6f45]">Receipt</p>
                <p className="mt-1 font-extrabold text-[#2b241f]">
                  {payment.receiptNumber || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col gap-3 sm:flex-row lg:flex-col">
          {payment.status === "paid" ? (
            <Button
              type="button"
              disabled
              className="rounded-2xl bg-emerald-700 text-white disabled:opacity-80"
            >
              <CheckCircle2 className="mr-2" size={17} />
              Paid
            </Button>
          ) : (
            <Link href="/dashboard/payments/monthly-fee">
              <Button className="rounded-2xl bg-[#9b6f45] px-5 text-white shadow-lg shadow-[#9b6f45]/25 hover:bg-[#835c38]">
                <CreditCard className="mr-2" size={17} />
                Pay Now
              </Button>
            </Link>
          )}

          <Button
            type="button"
            onClick={() => void loadMonthlyFeeStatus(true)}
            className="rounded-2xl bg-[#2c241f] px-5 text-white hover:bg-[#3a3029]"
          >
            <RefreshCcw className="mr-2" size={17} />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}