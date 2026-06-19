"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
  maskedCardNumber?: string;
  isOverdue: boolean;
};

type MonthlyFeeStatusResponse = {
  success: boolean;
  message?: string;
  payment?: MonthlyFeePayment;
};

type MonthlyFeePayResponse = {
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

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);

  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();

    console.error("NON_JSON_RESPONSE:", text.slice(0, 500));

    throw new Error(
      "API returned HTML instead of JSON. Check monthly fee API route path."
    );
  }

  return response.json();
}

export default function MonthlyFeePaymentPage() {
  const [payment, setPayment] = useState<MonthlyFeePayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/30");
  const [cvv, setCvv] = useState("123");

  async function loadMonthlyFeeStatus(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setMessage("");
      setIsSuccess(false);

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
        setIsSuccess(false);
        return;
      }

      setPayment(result.payment);
    } catch (error) {
      console.error("LOAD_MONTHLY_FEE_PAYMENT_PAGE_ERROR", error);

      setPayment(null);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load monthly fee status."
      );
      setIsSuccess(false);
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

  async function handlePayMonthlyFee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setPaying(true);
      setMessage("");
      setIsSuccess(false);

      const response = await fetch("/api/member/monthly-fee/pay", {
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
      });

      const result = (await readJsonResponse(response)) as MonthlyFeePayResponse;

      if (!result.success) {
        setMessage(result.message || "Payment failed.");
        setIsSuccess(false);
        return;
      }

      setPayment(result.payment || null);
      setMessage(result.message || "Monthly welfare fee paid successfully.");
      setIsSuccess(true);

      await loadMonthlyFeeStatus(false);
    } catch (error) {
      console.error("PAY_MONTHLY_FEE_ACTION_ERROR", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to pay monthly welfare fee."
      );
      setIsSuccess(false);
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#eee6da] text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading monthly welfare fee payment...
      </div>
    );
  }

  const isPaid = payment?.status === "paid";

  return (
    <div className="dashboard-no-scrollbar min-h-screen overflow-hidden rounded-[34px] bg-[#eee6da] text-[#2b241f]">
      <div className="relative min-h-screen space-y-7 overflow-hidden p-1">
        <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-[#c99b69]/25 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-[480px] w-[480px] rounded-full bg-[#2c241f]/10 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-[360px] w-[360px] rounded-full bg-[#d8ad80]/25 blur-[130px]" />

        <section className="relative overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <Link
            href="/dashboard"
            className="mb-5 inline-flex items-center text-sm font-extrabold text-[#9b6f45] hover:text-[#835c38]"
          >
            <ArrowLeft className="mr-2" size={17} />
            Back to Dashboard
          </Link>

          <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
            Monthly Welfare Fee
          </p>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
            Mock Card Payment
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
            Pay your monthly welfare contribution using a demo mock card payment
            flow. No real money is charged.
          </p>
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

        <section className="relative grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#2c241f] text-white shadow-[0_30px_100px_rgba(44,36,31,0.24)]">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#d8ad80]/25 blur-3xl" />

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d8ad80]/25 bg-[#d8ad80]/10 text-[#d8ad80]">
                  <ReceiptText size={28} />
                </div>

                <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.25em] text-[#d8ad80]">
                  Payment Summary
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-tight">
                  {formatCurrency(payment?.amount)}
                </h2>

                <p className="mt-4 text-sm leading-7 text-[#ead9c8]/75">
                  Monthly welfare contribution for{" "}
                  <span className="font-bold text-[#d8ad80]">
                    {payment?.monthName} {payment?.year}
                  </span>
                  .
                </p>

                <div className="mt-7 space-y-3">
                  <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8ad80]">
                      Status
                    </p>
                    <p className="mt-2 text-base font-extrabold capitalize">
                      {payment?.status || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8ad80]">
                      Due Date
                    </p>
                    <p className="mt-2 text-base font-extrabold">
                      {formatDate(payment?.dueDate)}
                    </p>
                  </div>

                  {isPaid ? (
                    <>
                      <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8ad80]">
                          Receipt Number
                        </p>
                        <p className="mt-2 break-all text-base font-extrabold">
                          {payment?.receiptNumber || "-"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8ad80]">
                          Transaction Reference
                        </p>
                        <p className="mt-2 break-all text-base font-extrabold">
                          {payment?.transactionReference || "-"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8ad80]">
                          Paid At
                        </p>
                        <p className="mt-2 text-base font-extrabold">
                          {formatDateTime(payment?.paidAt)}
                        </p>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)]">
            <CardContent className="p-8">
              {isPaid ? (
                <div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-700">
                    <CheckCircle2 size={32} />
                  </div>

                  <h2 className="mt-6 text-3xl font-extrabold">
                    Monthly Fee Paid
                  </h2>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6b5e54]">
                    Your monthly welfare contribution has already been paid for
                    this month. You can return to the dashboard to view the
                    updated payment card.
                  </p>

                  <div className="mt-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck
                        className="mt-1 text-emerald-700"
                        size={23}
                      />
                      <div>
                        <h3 className="font-extrabold text-[#2b241f]">
                          Payment Confirmed
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[#6b5e54]">
                          Receipt: {payment?.receiptNumber || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link href="/dashboard">
                    <Button className="mt-7 rounded-2xl bg-[#9b6f45] px-6 text-white hover:bg-[#835c38]">
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handlePayMonthlyFee}>
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f1e5d8] text-[#8a5f3c]">
                    <CreditCard size={31} />
                  </div>

                  <h2 className="mt-6 text-3xl font-extrabold">
                    Enter Mock Card Details
                  </h2>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6b5e54]">
                    Use demo card details only. This payment is simulated for
                    project demonstration and does not charge real money.
                  </p>

                  <div className="mt-6 rounded-3xl border border-[#d9c8b8] bg-[#fffaf3] p-5 text-sm">
                    <p className="font-extrabold text-[#2b241f]">
                      Demo Card
                    </p>
                    <p className="mt-2 text-[#6b5e54]">
                      Card Number:{" "}
                      <span className="font-bold">4242 4242 4242 4242</span>
                    </p>
                    <p className="text-[#6b5e54]">
                      Expiry: <span className="font-bold">12/30</span> | CVV:{" "}
                      <span className="font-bold">123</span>
                    </p>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="text-sm font-bold text-[#2b241f]">
                        Card Holder Name
                      </label>
                      <Input
                        value={cardHolderName}
                        onChange={(event) =>
                          setCardHolderName(event.target.value)
                        }
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
                  </div>

                  <Button
                    type="submit"
                    disabled={paying}
                    className="mt-7 h-12 w-full rounded-2xl bg-[#9b6f45] font-extrabold text-white hover:bg-[#835c38] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {paying ? (
                      <Loader2 className="mr-2 animate-spin" size={18} />
                    ) : (
                      <CreditCard className="mr-2" size={18} />
                    )}
                    Pay {formatCurrency(payment?.amount)}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}