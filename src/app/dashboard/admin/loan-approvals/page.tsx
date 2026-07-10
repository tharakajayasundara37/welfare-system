"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Landmark,
  Loader2,
  Search,
  Send,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface LoanUser {
  _id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  nic?: string;
  employeeId?: string;
  department?: string;
  jobRole?: string;
  companyName?: string;
  salaryRange?: string;
  accountStatus?: string;
}

interface StaffUser {
  _id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  nic?: string;
  role?: string;
  department?: string;
  jobRole?: string;
  employeeId?: string;
}

interface Loan {
  _id: string;
  userId?: LoanUser;
  welfareOfficerId?: StaffUser;
  adminId?: StaffUser;

  loanType?: string;
  requestedAmount?: number;
  approvedAmount?: number;
  purpose?: string;
  monthlyIncome?: number;
  employmentType?: string;

  guarantorName?: string;
  guarantorPhone?: string;
  guarantorNic?: string;

  systemInterestRate?: number;
  preferredPeriodMonths?: number;
  recommendedPeriodMonths?: number;
  monthlyInstallment?: number;
  totalRepayment?: number;
  remainingBalance?: number;

  riskLevel?: string;
  eligibilityStatus?: string;
  documentStatus?: string;
  status?: string;
  userAcceptanceStatus?: string;

  officerRemark?: string;
  adminRemark?: string;
  officerReportUrl?: string;
  officerReportGeneratedAt?: string;
  approvalLetterUrl?: string;
  approvalLetterGeneratedAt?: string;

  createdAt?: string;
  updatedAt?: string;
}

interface AdminLoansResponse {
  success: boolean;
  loans?: Loan[];
  message?: string;
}

interface AdminLoanActionResponse {
  success: boolean;
  loan?: Loan;
  message?: string;
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null) return "LKR 0";
  return `LKR ${amount.toLocaleString("en-LK")}`;
};

const formatDate = (date?: string) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusLabel = (status?: string) => {
  if (status === "pending_admin_approval") return "Pending Admin";
  if (status === "user_offer_pending") return "Offer Sent";
  if (status === "user_accepted") return "Accepted";
  if (status === "user_rejected") return "User Rejected";
  if (status === "pending_finance_processing") return "Finance Processing";
  if (status === "admin_rejected") return "Admin Rejected";

  return status?.replaceAll("_", " ") || "Unknown";
};

const getStatusStyle = (status?: string) => {
  if (status === "pending_admin_approval") {
    return "border-[#d8ad80]/50 bg-[#f6eadc] text-[#9b6f45]";
  }

  if (status === "user_offer_pending") {
    return "border-[#9b6f45]/35 bg-[#f1e5d8] text-[#2b241f]";
  }

  if (status === "user_accepted" || status === "pending_finance_processing") {
    return "border-emerald-600/25 bg-emerald-100 text-emerald-700";
  }

  if (status === "admin_rejected" || status === "user_rejected") {
    return "border-red-500/20 bg-red-100 text-red-700";
  }

  return "border-[#d9c8b8] bg-[#fbf7ef] text-[#9b6f45]";
};

const getRiskStyle = (risk?: string) => {
  if (risk === "low") {
    return "border-emerald-600/25 bg-emerald-100 text-emerald-700";
  }

  if (risk === "medium") {
    return "border-[#d8ad80]/50 bg-[#f6eadc] text-[#9b6f45]";
  }

  if (risk === "high") {
    return "border-red-500/20 bg-red-100 text-red-700";
  }

  return "border-[#d9c8b8] bg-[#fbf7ef] text-[#9b6f45]";
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  glow,
  badge,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  glow: string;
  badge: string;
}) {
  return (
    <Card className="group cursor-pointer overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_25px_90px_rgba(44,36,31,0.16)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#9b6f45]/45 hover:bg-[#fffaf3]">
      <CardContent className="relative p-6">
        <div
          className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl ${glow}`}
        />

        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[#d8ad80]/18 blur-3xl" />

        <div className="relative flex items-start justify-between">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d9c8b8] ${iconBg} ${iconColor} shadow-lg backdrop-blur-xl`}
          >
            <Icon size={25} />
          </div>

          <span className="rounded-full border border-[#d9c8b8] bg-[#f8f1e8] px-3 py-1 text-[11px] font-bold text-[#9b6f45] backdrop-blur-xl">
            {badge}
          </span>
        </div>

        <p className="relative mt-6 text-sm font-semibold text-[#6b5e54]">
          {title}
        </p>

        <h2 className="relative mt-2 text-4xl font-extrabold tracking-tight text-[#2b241f]">
          {value}
        </h2>

        <p className="relative mt-2 text-sm text-[#79695d]">{subtitle}</p>

        <div className="relative mt-6 rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/70 p-3 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6b5e54]">
            <span>Current Status</span>
            <span className="text-[#9b6f45]">Live</span>
          </div>

          <div className="mt-3 h-2 rounded-full bg-[#e9dccd]">
            <div className="h-2 w-[72%] rounded-full bg-gradient-to-r from-[#2c241f] via-[#9b6f45] to-[#d8ad80]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminLoanApprovalsPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    | "all"
    | "pending_admin_approval"
    | "user_offer_pending"
    | "user_accepted"
    | "pending_finance_processing"
    | "admin_rejected"
  >("pending_admin_approval");

  const loadLoans = async () => {
    try {
      setLoading(true);
      setMessage("");
      setIsSuccess(false);

      const response = await fetch("/api/admin/loans", {
        method: "GET",
        cache: "no-store",
      });

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error("API returned HTML instead of JSON");
      }

      const result = (await response.json()) as AdminLoansResponse;

      if (!result.success) {
        setMessage(result.message || "Failed to load admin loan approvals.");
        setIsSuccess(false);
        return;
      }

      setLoans(result.loans || []);
    } catch (error) {
      console.error("LOAD_ADMIN_LOANS_ERROR", error);
      setMessage("Failed to load admin loan approvals.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLoans();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleAdminAction = async (
    loanId: string,
    action: "approve" | "reject"
  ) => {
    try {
      const confirmMessage =
        action === "approve"
          ? "Are you sure you want to approve this loan and send offer letter to member?"
          : "Are you sure you want to reject this loan?";

      const confirmed = window.confirm(confirmMessage);

      if (!confirmed) return;

      setActionLoadingId(`${action}-${loanId}`);
      setMessage("");
      setIsSuccess(false);

      const response = await fetch(`/api/admin/loans/${loanId}/${action}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminRemark:
            action === "approve"
              ? "Main Admin approved this loan and sent offer to member."
              : "Main Admin rejected this loan after reviewing officer report.",
        }),
      });

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error("API returned HTML instead of JSON");
      }

      const result = (await response.json()) as AdminLoanActionResponse;

      if (!result.success) {
        setMessage(result.message || `Failed to ${action} loan.`);
        setIsSuccess(false);
        return;
      }

      if (result.loan) {
        setLoans((prevLoans) =>
          prevLoans.map((loan) =>
            loan._id === loanId ? (result.loan as Loan) : loan
          )
        );
      }

      setMessage(result.message || "Admin action completed successfully.");
      setIsSuccess(true);
    } catch (error) {
      console.error("ADMIN_LOAN_ACTION_ERROR", error);
      setMessage(`Failed to ${action} loan.`);
      setIsSuccess(false);
    } finally {
      setActionLoadingId("");
    }
  };

  const filteredLoans = useMemo(() => {
    const keyword = searchText.toLowerCase().trim();

    return loans.filter((loan) => {
      const matchesStatus =
        statusFilter === "all" ? true : loan.status === statusFilter;

      const matchesSearch =
        !keyword ||
        loan.userId?.fullName?.toLowerCase().includes(keyword) ||
        loan.userId?.email?.toLowerCase().includes(keyword) ||
        loan.userId?.phone?.toLowerCase().includes(keyword) ||
        loan.userId?.nic?.toLowerCase().includes(keyword) ||
        loan.loanType?.toLowerCase().includes(keyword) ||
        loan.purpose?.toLowerCase().includes(keyword) ||
        loan.riskLevel?.toLowerCase().includes(keyword) ||
        loan.status?.toLowerCase().includes(keyword) ||
        loan.welfareOfficerId?.fullName?.toLowerCase().includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [loans, searchText, statusFilter]);

  const pendingCount = loans.filter(
    (loan) => loan.status === "pending_admin_approval"
  ).length;

  const offerSentCount = loans.filter(
    (loan) => loan.status === "user_offer_pending"
  ).length;

  const memberAcceptedCount = loans.filter(
    (loan) =>
      loan.status === "user_accepted" ||
      loan.status === "pending_finance_processing"
  ).length;

  const rejectedCount = loans.filter(
    (loan) => loan.status === "admin_rejected"
  ).length;

  const totalCount = loans.length;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#eee6da] text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading admin loan approvals...
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden rounded-[34px] bg-[#eee6da] text-[#2b241f]">
      <div className="relative min-h-screen space-y-7 overflow-hidden p-1">
        <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-[#c99b69]/25 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-[480px] w-[480px] rounded-full bg-[#2c241f]/10 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-[360px] w-[360px] rounded-full bg-[#d8ad80]/25 blur-[130px]" />

        <section className="relative overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d8ad80]/25 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
                Welfare
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
                Loan Approval
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
                Review welfare officer approved loans, open officer PDF reports,
                approve loans and send approval offer letters to members.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => void loadLoans()}
                className="rounded-2xl border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] backdrop-blur-xl transition hover:border-[#9b6f45]/45 hover:bg-[#f1e5d8]"
              >
                Refresh
              </Button>

              <Button className="rounded-2xl bg-[#2c241f] px-5 text-[#fbf7ef] shadow-lg shadow-[#2c241f]/20 transition hover:bg-[#9b6f45]">
                <Landmark className="mr-2" size={17} />
                {pendingCount} Pending
              </Button>
            </div>
          </div>
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

        <section className="relative grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Pending Approval"
            value={pendingCount}
            subtitle="Waiting for main admin review"
            icon={Clock3}
            iconColor="text-[#9b6f45]"
            iconBg="bg-[#f6eadc]"
            glow="bg-[#d8ad80]/25"
            badge="Pending"
          />

          <StatCard
            title="Offer Sent"
            value={offerSentCount}
            subtitle="Waiting for member acceptance"
            icon={Send}
            iconColor="text-[#2b241f]"
            iconBg="bg-[#f1e5d8]"
            glow="bg-[#2c241f]/10"
            badge="Offer"
          />

          <StatCard
            title="Member Accepted"
            value={memberAcceptedCount}
            subtitle="Ready for finance processing"
            icon={CheckCircle2}
            iconColor="text-emerald-700"
            iconBg="bg-emerald-100"
            glow="bg-emerald-400/20"
            badge="Accepted"
          />

          <StatCard
            title="Admin Rejected"
            value={rejectedCount}
            subtitle="Rejected by main admin"
            icon={XCircle}
            iconColor="text-red-700"
            iconBg="bg-red-100"
            glow="bg-red-400/15"
            badge="Rejected"
          />
        </section>

        <section className="relative">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/20 blur-3xl" />
              <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#2c241f]/10 blur-3xl" />

              <div className="relative mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#2b241f]">
                    Admin Loan Review Queue
                  </h2>

                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Pending approvals, sent offers, accepted offers and rejected
                    loan applications.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 md:flex-row xl:w-auto">
                  <div className="relative w-full md:w-[360px]">
                    <Search
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9b6f45]"
                    />

                    <Input
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder="Search loans..."
                      className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/80 pl-11 text-[#2b241f] placeholder:text-[#9b6f45]/55 focus-visible:ring-[#9b6f45]/30"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => setStatusFilter("pending_admin_approval")}
                      className={`rounded-2xl ${
                        statusFilter === "pending_admin_approval"
                          ? "bg-[#9b6f45] text-[#fbf7ef]"
                          : "border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] hover:bg-[#f1e5d8]"
                      }`}
                    >
                      Pending
                    </Button>

                    <Button
                      type="button"
                      onClick={() => setStatusFilter("user_offer_pending")}
                      className={`rounded-2xl ${
                        statusFilter === "user_offer_pending"
                          ? "bg-[#2c241f] text-[#fbf7ef]"
                          : "border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] hover:bg-[#f1e5d8]"
                      }`}
                    >
                      Offer Sent
                    </Button>

                    <Button
                      type="button"
                      onClick={() =>
                        setStatusFilter("pending_finance_processing")
                      }
                      className={`rounded-2xl ${
                        statusFilter === "pending_finance_processing"
                          ? "bg-emerald-700 text-white"
                          : "border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] hover:bg-[#f1e5d8]"
                      }`}
                    >
                      Accepted
                    </Button>

                    <Button
                      type="button"
                      onClick={() => setStatusFilter("admin_rejected")}
                      className={`rounded-2xl ${
                        statusFilter === "admin_rejected"
                          ? "bg-red-700 text-white"
                          : "border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] hover:bg-[#f1e5d8]"
                      }`}
                    >
                      Rejected
                    </Button>

                    <Button
                      type="button"
                      onClick={() => setStatusFilter("all")}
                      className={`rounded-2xl ${
                        statusFilter === "all"
                          ? "bg-[#2c241f] text-[#fbf7ef]"
                          : "border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] hover:bg-[#f1e5d8]"
                      }`}
                    >
                      All
                    </Button>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1620px] table-fixed border-collapse text-left text-sm">
                    <thead className="bg-[#efe2d2] text-xs uppercase tracking-wide text-[#6b5e54]">
                      <tr>
                        <th className="w-[250px] px-5 py-4 align-middle font-extrabold">
                          Member
                        </th>
                        <th className="w-[230px] px-5 py-4 align-middle font-extrabold">
                          Loan Type
                        </th>
                        <th className="w-[145px] px-5 py-4 text-center align-middle font-extrabold">
                          Amount
                        </th>
                        <th className="w-[145px] px-5 py-4 text-center align-middle font-extrabold">
                          EMI
                        </th>
                        <th className="w-[120px] px-5 py-4 text-center align-middle font-extrabold">
                          Risk
                        </th>
                        <th className="w-[200px] px-5 py-4 align-middle font-extrabold">
                          Officer
                        </th>
                        <th className="w-[170px] px-5 py-4 text-center align-middle font-extrabold">
                          Officer Report
                        </th>
                        <th className="w-[160px] px-5 py-4 text-center align-middle font-extrabold">
                          Offer Letter
                        </th>
                        <th className="w-[175px] px-5 py-4 text-center align-middle font-extrabold">
                          Status
                        </th>
                        <th className="w-[135px] px-5 py-4 text-center align-middle font-extrabold">
                          Updated
                        </th>
                        <th className="w-[250px] px-5 py-4 text-center align-middle font-extrabold">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#d9c8b8]">
                      {filteredLoans.length === 0 ? (
                        <tr>
                          <td
                            colSpan={11}
                            className="px-5 py-10 text-center text-[#6b5e54]"
                          >
                            No loans found for selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredLoans.map((loan) => {
                          const isPending =
                            loan.status === "pending_admin_approval";

                          return (
                            <tr
                              key={loan._id}
                              className="cursor-pointer bg-[#fbf7ef]/60 transition-all duration-300 hover:bg-[#fffaf3] hover:shadow-[inset_4px_0_0_rgba(155,111,69,0.75)]"
                            >
                              <td className="px-5 py-4 align-middle">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-sm font-extrabold text-[#9b6f45] shadow-lg shadow-[#2c241f]/10">
                                    {loan.userId?.fullName
                                      ?.charAt(0)
                                      ?.toUpperCase() || "M"}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate font-bold text-[#2b241f]">
                                      {loan.userId?.fullName ||
                                        "Unknown Member"}
                                    </p>

                                    <p className="mt-1 truncate text-xs text-[#79695d]">
                                      {loan.userId?.email || "No email"}
                                    </p>

                                    <p className="mt-1 truncate text-xs font-semibold text-[#9b6f45]">
                                      {loan.userId?.employeeId ||
                                        "No employee ID"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4 align-middle">
                                <p className="truncate font-semibold text-[#2b241f]">
                                  {loan.loanType || "N/A"}
                                </p>

                                <p className="mt-1 truncate text-xs text-[#79695d]">
                                  {loan.purpose || "No purpose"}
                                </p>
                              </td>

                              <td className="px-5 py-4 text-center align-middle">
                                <span className="whitespace-nowrap font-extrabold text-[#2b241f]">
                                  {formatCurrency(loan.requestedAmount)}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-center align-middle">
                                <span className="whitespace-nowrap font-semibold text-[#6b5e54]">
                                  {formatCurrency(loan.monthlyInstallment)}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-center align-middle">
                                <span
                                  className={`inline-flex min-w-[80px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-extrabold capitalize ${getRiskStyle(
                                    loan.riskLevel
                                  )}`}
                                >
                                  {loan.riskLevel || "medium"}
                                </span>
                              </td>

                              <td className="px-5 py-4 align-middle">
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-[#2b241f]">
                                    {loan.welfareOfficerId?.fullName || "N/A"}
                                  </p>

                                  <p className="mt-1 truncate text-xs text-[#79695d]">
                                    {loan.welfareOfficerId?.employeeId ||
                                      "No ID"}
                                  </p>
                                </div>
                              </td>

                              <td className="px-5 py-4 text-center align-middle">
                                {loan.officerReportUrl ? (
                                  <a
                                    href={`/api/documents/view?url=${encodeURIComponent(loan.officerReportUrl)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-9 rounded-xl border-[#9b6f45]/35 bg-[#f1e5d8] px-3 text-xs font-bold text-[#2b241f] hover:bg-[#efe2d2]"
                                    >
                                      <FileText className="mr-1" size={15} />
                                      Report
                                    </Button>
                                  </a>
                                ) : (
                                  <Button
                                    size="sm"
                                    disabled
                                    variant="outline"
                                    className="h-9 rounded-xl border-[#d9c8b8] bg-[#fbf7ef] px-3 text-xs font-bold text-[#79695d] opacity-60"
                                  >
                                    No Report
                                  </Button>
                                )}
                              </td>

                              <td className="px-5 py-4 text-center align-middle">
                                {loan.approvalLetterUrl ? (
                                  <a
                                    href={`/api/documents/view?url=${encodeURIComponent(loan.approvalLetterUrl)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-9 rounded-xl border-emerald-600/25 bg-emerald-100 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-200"
                                    >
                                      <FileText className="mr-1" size={15} />
                                      Letter
                                    </Button>
                                  </a>
                                ) : (
                                  <Button
                                    size="sm"
                                    disabled
                                    variant="outline"
                                    className="h-9 rounded-xl border-[#d9c8b8] bg-[#fbf7ef] px-3 text-xs font-bold text-[#79695d] opacity-60"
                                  >
                                    No Letter
                                  </Button>
                                )}
                              </td>

                              <td className="px-5 py-4 text-center align-middle">
                                <span
                                  className={`inline-flex min-w-[140px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-extrabold capitalize ${getStatusStyle(
                                    loan.status
                                  )}`}
                                >
                                  {getStatusLabel(loan.status)}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-center align-middle text-[#79695d]">
                                <span className="whitespace-nowrap">
                                  {formatDate(loan.updatedAt)}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-center align-middle">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 rounded-xl border-[#d9c8b8] bg-[#fbf7ef]/90 px-3 text-xs font-bold text-[#2b241f] hover:bg-[#f1e5d8]"
                                    onClick={() => {
                                      window.alert(
                                        `Member: ${
                                          loan.userId?.fullName || "N/A"
                                        }\nLoan: ${
                                          loan.loanType || "N/A"
                                        }\nAmount: ${formatCurrency(
                                          loan.requestedAmount
                                        )}\nOfficer Remark: ${
                                          loan.officerRemark || "N/A"
                                        }\nAdmin Remark: ${
                                          loan.adminRemark || "N/A"
                                        }`
                                      );
                                    }}
                                  >
                                    <Eye className="mr-1" size={15} />
                                    View
                                  </Button>

                                  <Button
                                    size="sm"
                                    disabled={
                                      !isPending ||
                                      actionLoadingId ===
                                        `approve-${loan._id}`
                                    }
                                    onClick={() =>
                                      void handleAdminAction(
                                        loan._id,
                                        "approve"
                                      )
                                    }
                                    className="h-9 rounded-xl bg-emerald-700 px-3 text-xs font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {actionLoadingId ===
                                    `approve-${loan._id}` ? (
                                      <Loader2
                                        size={15}
                                        className="mr-1 animate-spin"
                                      />
                                    ) : null}
                                    Approve
                                  </Button>

                                  <Button
                                    size="sm"
                                    disabled={
                                      !isPending ||
                                      actionLoadingId === `reject-${loan._id}`
                                    }
                                    onClick={() =>
                                      void handleAdminAction(loan._id, "reject")
                                    }
                                    className="h-9 rounded-xl bg-red-700 px-3 text-xs font-bold text-white shadow-lg shadow-red-700/20 transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {actionLoadingId ===
                                    `reject-${loan._id}` ? (
                                      <Loader2
                                        size={15}
                                        className="mr-1 animate-spin"
                                      />
                                    ) : null}
                                    Reject
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="relative mt-4 flex flex-col justify-between gap-3 text-sm text-[#6b5e54] md:flex-row">
                <p>
                  Showing{" "}
                  <span className="font-bold text-[#9b6f45]">
                    {filteredLoans.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#9b6f45]">
                    {totalCount}
                  </span>{" "}
                  loan reviews
                </p>

                <p>
                  Admin approval generates an offer letter and waits for member
                  acceptance.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}