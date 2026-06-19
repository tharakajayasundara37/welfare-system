"use client";

import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarDays,
  CreditCard,
  FileText,
  HandCoins,
  History,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import MonthlyFeeCard from "@/components/dashboard/MonthlyFeeCard";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function PaymentActionCard({
  title,
  description,
  href,
  icon: Icon,
  badge,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge: string;
}) {
  return (
    <Link href={href}>
      <Card className="group h-full overflow-hidden rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_20px_80px_rgba(44,36,31,0.14)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#9b6f45]/45 hover:bg-[#fffaf3]">
        <CardContent className="relative p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#d8ad80]/20 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c] shadow-[0_14px_38px_rgba(44,36,31,0.12)]">
              <Icon size={25} />
            </div>

            <span className="rounded-full border border-[#d9c8b8] bg-[#f8f1e8] px-3 py-1 text-[11px] font-bold text-[#9b6f45]">
              {badge}
            </span>
          </div>

          <h3 className="relative mt-6 text-xl font-extrabold tracking-[-0.03em]">
            {title}
          </h3>

          <p className="relative mt-3 text-sm leading-7 text-[#6b5e54]">
            {description}
          </p>

          <div className="relative mt-5 inline-flex items-center text-sm font-extrabold text-[#9b6f45]">
            Open
            <ArrowRight
              className="ml-2 transition group-hover:translate-x-1"
              size={16}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function InfoCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_24px_80px_rgba(44,36,31,0.12)]">
      <CardContent className="p-6">
        <Icon className="text-[#8a5f3c]" size={29} />

        <h3 className="mt-5 text-xl font-extrabold">{title}</h3>

        <p className="mt-3 text-sm leading-7 text-[#6b5e54]">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export default function MemberPaymentsPage() {
  return (
    <div className="dashboard-no-scrollbar min-h-screen overflow-hidden rounded-[34px] bg-[#eee6da] text-[#2b241f]">
      <div className="relative min-h-screen space-y-7 overflow-hidden p-1">
        <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-[#c99b69]/25 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-[480px] w-[480px] rounded-full bg-[#2c241f]/10 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-[360px] w-[360px] rounded-full bg-[#d8ad80]/25 blur-[130px]" />

        <section className="relative overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d8ad80]/25 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <Link
                href="/dashboard"
                className="mb-4 inline-flex items-center text-sm font-extrabold text-[#9b6f45] hover:text-[#835c38]"
              >
                <ArrowLeft className="mr-2" size={17} />
                Back to Dashboard
              </Link>

              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
                Member Payments
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
                Payment Center
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
                Manage your monthly welfare contribution, loan installments,
                receipts, and payment records from one secure page.
              </p>
            </div>

            <Link href="/dashboard/payments/monthly-fee">
              <Button className="rounded-2xl bg-[#9b6f45] px-5 text-white shadow-lg shadow-[#9b6f45]/25 hover:bg-[#835c38]">
                <CreditCard className="mr-2" size={17} />
                Pay Monthly Fee
              </Button>
            </Link>
          </div>
        </section>

        <section className="relative">
          <MonthlyFeeCard />
        </section>

        <section className="relative grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <PaymentActionCard
            title="Monthly Welfare Fee"
            description="View current month welfare contribution status and pay using mock card payment."
            href="/dashboard/payments/monthly-fee"
            icon={CalendarDays}
            badge="Monthly"
          />

          <PaymentActionCard
            title="Loan Installments"
            description="View EMI due dates, monthly installment amount and active loan repayment status."
            href="/dashboard/payments/installments"
            icon={HandCoins}
            badge="EMI"
          />

          <PaymentActionCard
            title="Transaction History"
            description="View past monthly fee payments, installment records, receipt numbers and transaction references."
            href="/dashboard/payments/history"
            icon={History}
            badge="History"
          />

          <PaymentActionCard
            title="Receipts"
            description="Download or view generated receipts for monthly fees and loan installment payments."
            href="/dashboard/payments/receipts"
            icon={ReceiptText}
            badge="Receipts"
          />
        </section>

        <section className="relative grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#2c241f] text-white shadow-[0_30px_100px_rgba(44,36,31,0.24)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#d8ad80]/25 blur-3xl" />

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d8ad80]/25 bg-[#d8ad80]/10 text-[#d8ad80]">
                  <WalletCards size={28} />
                </div>

                <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.25em] text-[#d8ad80]">
                  Payment Rules
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-tight">
                  Monthly Welfare Contribution
                </h2>

                <p className="mt-4 text-sm leading-7 text-[#ead9c8]/75">
                  Members should complete the monthly welfare fee payment within
                  the first week of each month. If the payment is not completed
                  before the due date, the dashboard will show an overdue
                  warning.
                </p>

                <div className="mt-7 space-y-3">
                  <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8ad80]">
                      Due Period
                    </p>
                    <p className="mt-2 text-base font-extrabold">
                      1st week of each month
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8ad80]">
                      Demo Payment
                    </p>
                    <p className="mt-2 text-base font-extrabold">
                      Mock card payment only
                    </p>
                  </div>
                </div>

                <Link href="/dashboard/payments/monthly-fee">
                  <Button className="mt-7 h-12 w-full rounded-2xl bg-[#d8ad80] font-extrabold text-[#2c241f] hover:bg-[#c99b69]">
                    Open Monthly Fee Payment
                    <ArrowRight className="ml-2" size={17} />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/20 blur-3xl" />

              <div className="relative flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c]">
                  <Banknote size={27} />
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold">
                    Payment Modules Overview
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#6b5e54]">
                    The current version includes monthly welfare fee status and
                    mock card payment. Additional pages can be connected later
                    for installment tracking, transaction history, and receipt
                    downloads.
                  </p>
                </div>
              </div>

              <div className="relative mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[26px] border border-[#d9c8b8] bg-[#fffaf3] p-5">
                  <CreditCard className="text-[#8a5f3c]" size={26} />
                  <h3 className="mt-4 text-lg font-extrabold">
                    Monthly Fee Payment
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#6b5e54]">
                    Completed with status checking and mock payment API.
                  </p>
                </div>

                <div className="rounded-[26px] border border-[#d9c8b8] bg-[#fffaf3] p-5">
                  <HandCoins className="text-orange-700" size={26} />
                  <h3 className="mt-4 text-lg font-extrabold">
                    Loan Installments
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#6b5e54]">
                    Planned section for EMI payment tracking.
                  </p>
                </div>

                <div className="rounded-[26px] border border-[#d9c8b8] bg-[#fffaf3] p-5">
                  <FileText className="text-[#8a5f3c]" size={26} />
                  <h3 className="mt-4 text-lg font-extrabold">
                    Receipt Records
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#6b5e54]">
                    Planned section for receipt preview and download.
                  </p>
                </div>

                <div className="rounded-[26px] border border-[#d9c8b8] bg-[#fffaf3] p-5">
                  <ShieldCheck className="text-emerald-700" size={26} />
                  <h3 className="mt-4 text-lg font-extrabold">
                    Secure Payments
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#6b5e54]">
                    Mock gateway is used for demo without real money movement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <InfoCard
            title="Monthly Fee Reminder"
            description="The member dashboard warns users when the current month contribution is pending or overdue."
            icon={CalendarDays}
          />

          <InfoCard
            title="Mock Payment Gateway"
            description="Payments are simulated using fake card details for demonstration purposes."
            icon={CreditCard}
          />

          <InfoCard
            title="Transaction Tracking"
            description="Each successful mock payment generates a receipt number and transaction reference."
            icon={ReceiptText}
          />
        </section>
      </div>
    </div>
  );
}