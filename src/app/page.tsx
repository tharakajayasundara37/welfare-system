import Link from "next/link";

import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  FileCheck,
  HandHeart,
  Landmark,
  LockKeyhole,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";

const modules = [
  {
    title: "Member Management",
    description:
      "Register welfare members, approve accounts, manage member profiles and control account status.",
    icon: Users,
  },
  {
    title: "Loan Approval Workflow",
    description:
      "Manage welfare loan applications through welfare officer review, admin approval and finance processing.",
    icon: Landmark,
  },
  {
    title: "Document Verification",
    description:
      "Verify NIC details, salary information and supporting documents before approving requests.",
    icon: FileCheck,
  },
  {
    title: "Payment Tracking",
    description:
      "Track monthly welfare fees, loan installments, due payments and gateway-based transaction records.",
    icon: CreditCard,
  },
];

const roles = [
  {
    title: "Admin",
    description:
      "Controls members, staff accounts, loan settings, loan approvals and system reports.",
  },
  {
    title: "Member",
    description:
      "Registers to the system, applies for welfare loans or support and tracks application status.",
  },
  {
    title: "Welfare Officer",
    description:
      "Reviews member applications, checks documents and forwards verified requests.",
  },
  {
    title: "Finance Officer",
    description:
      "Handles disbursement records, installment tracking and payment-related activities.",
  },
];

const workflow = [
  "Member creates an account and submits required details.",
  "Admin reviews and activates the member account.",
  "Member applies for loan or welfare support.",
  "Welfare officer checks documents and application details.",
  "Admin gives the final approval or rejection.",
  "Finance officer manages disbursement and payment tracking.",
];

const highlights = [
  "Runs locally on localhost:3000",
  "Designed as an internal system, not a public website",
  "Role-based dashboards for system users",
  "Loan, grant, document and finance workflow support",
  "Payment gateway based flow without internal wallet balance",
  "Reports and tracking for better admin decisions",
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#eee6da] text-[#2b241f]">
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 h-[520px] w-[520px] rounded-full bg-[#c99b69]/25 blur-[130px]" />
        <div className="pointer-events-none absolute right-0 top-40 h-[520px] w-[520px] rounded-full bg-[#2c241f]/10 blur-[150px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-[420px] w-[420px] rounded-full bg-[#d8ad80]/25 blur-[140px]" />

        <section className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-8 flex items-center justify-between rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 px-5 py-4 shadow-[0_20px_70px_rgba(44,36,31,0.12)] backdrop-blur-2xl">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2c241f] text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20">
                <HandHeart size={24} />
              </div>

              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-[#2b241f]">
                  WelfareX
                </h1>
                <p className="text-xs font-semibold text-[#9b6f45]">
                  Internal Welfare Management System
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/80 px-5 py-2.5 text-sm font-extrabold text-[#2b241f] transition hover:bg-[#fffaf3]"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="hidden rounded-2xl bg-[#2c241f] px-5 py-2.5 text-sm font-extrabold text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20 transition hover:bg-[#9b6f45] sm:inline-flex"
              >
                Register
                <ArrowRight className="ml-2" size={16} />
              </Link>
            </div>
          </header>

          {/* Hero */}
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative overflow-hidden rounded-[38px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl md:p-10 lg:p-12">
              <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#d8ad80]/25 blur-3xl" />

              <div className="relative">
                <div className="mb-6 inline-flex items-center rounded-full border border-[#d9c8b8] bg-[#f8f1e8] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.25em] text-[#9b6f45]">
                  <LockKeyhole className="mr-2" size={15} />
                  Local System 
                </div>

                <h2 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-[-0.05em] text-[#2b241f] md:text-6xl">
                  Welfare Management & Emergency Relief System
                </h2>

                <p className="mt-6 max-w-3xl text-base leading-8 text-[#6b5e54] md:text-lg">
                  Welfare is a professional internal welfare management system
                  designed to manage members, welfare loans, emergency support,
                  staff accounts, document verification, approvals, payment
                  records and reports from one secure local system interface.
                </p>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-[#79695d] md:text-base">
                  The system runs on{" "}
                  <span className="font-extrabold text-[#9b6f45]">
                  </span>{" "}
                  and is designed for internal organizational use.
                </p>

                <div className="mt-9 flex flex-wrap gap-3">
                  <Link
                    href="/login"
                    className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#2c241f] px-7 text-sm font-extrabold text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20 transition hover:-translate-y-0.5 hover:bg-[#9b6f45]"
                  >
                    Open System Login
                    <ArrowRight className="ml-2" size={18} />
                  </Link>

                  <Link
                    href="/register"
                    className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/80 px-7 text-sm font-extrabold text-[#2b241f] transition hover:-translate-y-0.5 hover:bg-[#fffaf3]"
                  >
                    Create Member Account
                  </Link>
                </div>

                <div className="mt-9 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/80 p-4">
                    <p className="text-2xl font-extrabold text-[#2b241f]">
                      4 Roles
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#79695d]">
                      Admin, Member, Officer, Finance
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/80 p-4">
                    <p className="text-2xl font-extrabold text-[#2b241f]">
                      Secure
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#79695d]">
                      Login and approval workflow
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/80 p-4">
                    <p className="text-2xl font-extrabold text-[#2b241f]">
                      Gateway
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#79695d]">
                      No internal wallet balance
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Summary Panel */}
            <div className="relative overflow-hidden rounded-[38px] border border-[#d9c8b8] bg-[#2c241f] p-7 text-[#fbf7ef] shadow-[0_30px_100px_rgba(44,36,31,0.22)] md:p-8">
              <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#d8ad80]/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-[#9b6f45]/20 blur-3xl" />

              <div className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d8ad80]/35 bg-[#d8ad80]/15 text-[#d8ad80]">
                  <Building2 size={27} />
                </div>

                <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-[#d8ad80]">
                  System Overview
                </p>

                <h3 className="mt-5 text-3xl font-extrabold leading-tight">
                  Built for organized welfare operations
                </h3>

                <p className="mt-5 text-sm leading-7 text-[#f6eadc]/75">
                  Welfare helps an organization manage the full welfare
                  process from member registration to finance processing using
                  role-based dashboards and clear workflow stages.
                </p>

                <div className="mt-7 space-y-3">
                  {highlights.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#d8ad80]" />
                      <p className="text-sm leading-6 text-[#f6eadc]/85">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Modules */}
          <section className="mt-8">
            <div className="mb-6 flex flex-col gap-2">
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-[#9b6f45]">
                Main Modules
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#2b241f] md:text-4xl">
                Core system capabilities
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {modules.map((module) => {
                const Icon = module.icon;

                return (
                  <div
                    key={module.title}
                    className="group overflow-hidden rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-6 text-[#2b241f] shadow-[0_25px_90px_rgba(44,36,31,0.14)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#9b6f45]/45 hover:bg-[#fffaf3]"
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#9b6f45] shadow-lg shadow-[#2c241f]/10">
                      <Icon size={22} />
                    </div>

                    <h3 className="text-lg font-extrabold text-[#2b241f]">
                      {module.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-[#6b5e54]">
                      {module.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Roles and Workflow */}
          <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative overflow-hidden rounded-[34px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.14)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/20 blur-3xl" />

              <div className="relative">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#9b6f45]">
                  <ShieldCheck size={24} />
                </div>

                <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-[#9b6f45]">
                  User Roles
                </p>

                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#2b241f]">
                  Role-based system access
                </h2>

                <div className="mt-6 grid gap-3">
                  {roles.map((role) => (
                    <div
                      key={role.title}
                      className="rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/80 p-4"
                    >
                      <h3 className="text-base font-extrabold text-[#2b241f]">
                        {role.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#6b5e54]">
                        {role.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[34px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.14)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/20 blur-3xl" />

              <div className="relative">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#9b6f45]">
                  <ClipboardCheck size={24} />
                </div>

                <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-[#9b6f45]">
                  Workflow
                </p>

                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#2b241f]">
                  How the system works
                </h2>

                <div className="mt-6 grid gap-3">
                  {workflow.map((step, index) => (
                    <div
                      key={step}
                      className="flex items-start gap-3 rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/80 p-4"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2c241f] text-xs font-extrabold text-[#fbf7ef]">
                        {index + 1}
                      </div>

                      <p className="text-sm font-semibold leading-6 text-[#6b5e54]">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Payment and Reports */}
          <section className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-[34px] border border-[#d9c8b8] bg-[#2c241f] p-7 text-[#fbf7ef] shadow-[0_30px_100px_rgba(44,36,31,0.22)] lg:col-span-1">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8ad80]/35 bg-[#d8ad80]/15 text-[#d8ad80]">
                <WalletCards size={24} />
              </div>

              <h2 className="text-2xl font-extrabold">
                Payment Gateway Based
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#f6eadc]/75">
                Welfare does not use an internal wallet balance. Monthly fees,
                installments and transaction records are handled using a
                gateway-based payment tracking flow.
              </p>
            </div>

            <div className="rounded-[34px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.14)] lg:col-span-2">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                <div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#9b6f45]">
                    <BarChart3 size={24} />
                  </div>

                  <h2 className="text-2xl font-extrabold text-[#2b241f]">
                    Reports and Tracking
                  </h2>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6b5e54]">
                    Admins can monitor member counts, loan approvals, staff
                    accounts, repayment status, finance records and system
                    performance using internal reports.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#9b6f45] px-6 text-sm font-extrabold text-white shadow-lg shadow-[#9b6f45]/20 transition hover:bg-[#835c38]"
                >
                  Continue to System
                  <ArrowRight className="ml-2" size={17} />
                </Link>
              </div>
            </div>
          </section>

          {/* Footer Note */}
          <section className="mt-8 pb-8">
            <div className="rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/80 p-5 text-center shadow-[0_20px_70px_rgba(44,36,31,0.10)] backdrop-blur-2xl">
              <p className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-[#6b5e54]">
                <BadgeCheck size={17} className="text-[#9b6f45]" />
                This is the introduction page of the Welfare internal system.
                Actual system operations are available after login.
              </p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}