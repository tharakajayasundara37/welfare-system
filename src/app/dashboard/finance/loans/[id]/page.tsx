"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Landmark,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type StatusColor = "pending" | "approved" | "rejected" | "completed";

type PersonInfo = {
  fullName: string;
  email: string;
  phone: string;
  role?: string;
  employeeId?: string;
  nic?: string;
  department?: string;
  jobRole?: string;
  companyName?: string;
  salaryRange?: string;
  accountStatus?: string;
};

type FinanceLoanDetail = {
  id: string;
  reference: string;

  member: PersonInfo;
  welfareOfficer: PersonInfo;
  admin: PersonInfo;
  financeOfficer: PersonInfo;

  loanType: string;
  purpose: string;

  requestedAmount: number;
  approvedAmount: number;
  monthlyIncome: number;
  employmentType: string;

  systemInterestRate: number;
  preferredPeriodMonths: number;
  approvedPeriodMonths: number;
  recommendedPeriodMonths: number;

  monthlyInstallment: number;
  totalRepayment: number;
  remainingBalance: number;

  guarantorEmployeeId: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorNic: string;

  riskLevel: string;
  eligibilityStatus: string;
  documentStatus: string;

  status: string;
  statusLabel: string;
  statusColor: StatusColor;

  officerRemark: string;
  adminRemark: string;
  financeRemark: string;

  officerApprovedAt: string | null;
  adminApprovedAt: string | null;
  financeApprovedAt: string | null;
  financeRejectedAt: string | null;

  disbursementDate: string | null;
  nextEMIDueDate: string | null;

  approvalLetterUrl: string;
  officerReportUrl: string;

  createdAt: string | null;
  updatedAt: string | null;
};

type LoanDocument = {
  id: string;
  documentType: string;
  label: string;
  originalName: string;
  fileName: string;
  fileUrl: string;
  status: string;
  remark: string;
  verifiedAt: string | null;
  createdAt: string | null;
};

type FinanceLoanDetailResponse = {
  success: boolean;
  message?: string;
  loan?: FinanceLoanDetail;
  documents?: LoanDocument[];
};

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatDate(dateValue?: string | null) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateValue?: string | null) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClass(statusColor: StatusColor) {
  if (statusColor === "approved") {
    return "border-emerald-500/20 bg-emerald-500/15 text-emerald-700";
  }

  if (statusColor === "rejected") {
    return "border-red-500/20 bg-red-500/15 text-red-700";
  }

  if (statusColor === "completed") {
    return "border-[#d8ad80]/35 bg-[#d8ad80]/20 text-[#8a5f3c]";
  }

  return "border-orange-500/20 bg-orange-500/15 text-orange-700";
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();
    console.error("NON_JSON_RESPONSE:", text.slice(0, 500));

    throw new Error(
      "API returned HTML instead of JSON. Check /api/finance/loans/[id] route path."
    );
  }

  return response.json();
}

function InfoCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="rounded-[28px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_20px_70px_rgba(44,36,31,0.12)]">
      <CardContent className="p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c]">
          <Icon size={22} />
        </div>

        <p className="mt-5 text-sm font-bold text-[#6b5e54]">{title}</p>

        <h3 className="mt-2 text-2xl font-black tracking-tight text-[#2b241f]">
          {value}
        </h3>

        <p className="mt-2 text-sm text-[#79695d]">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col justify-between gap-1 border-b border-[#d9c8b8] py-3 md:flex-row">
      <span className="text-sm font-bold text-[#6b5e54]">{label}</span>
      <span className="text-sm font-extrabold text-[#2b241f] md:text-right">
        {value || "-"}
      </span>
    </div>
  );
}

function PersonCard({
  title,
  person,
  icon: Icon,
}: {
  title: string;
  person: PersonInfo;
  icon: React.ElementType;
}) {
  return (
    <Card className="rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_24px_80px_rgba(44,36,31,0.12)]">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c]">
            <Icon size={22} />
          </div>

          <div>
            <h3 className="text-xl font-extrabold">{title}</h3>
            <p className="text-sm text-[#6b5e54]">
              {person.employeeId || person.role || "-"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <DetailRow label="Name" value={person.fullName || "-"} />
          <DetailRow label="Email" value={person.email || "-"} />
          <DetailRow label="Phone" value={person.phone || "-"} />
          {person.nic ? <DetailRow label="NIC" value={person.nic} /> : null}
          {person.department ? (
            <DetailRow label="Department" value={person.department} />
          ) : null}
          {person.jobRole ? <DetailRow label="Job Role" value={person.jobRole} /> : null}
          {person.accountStatus ? (
            <DetailRow
              label="Account Status"
              value={person.accountStatus.replaceAll("_", " ")}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function FinanceLoanDetailPage() {
  const params = useParams<{ id?: string }>();

  const loanId = useMemo(() => {
    return String(params.id || "").trim();
  }, [params.id]);

  const [loan, setLoan] = useState<FinanceLoanDetail | null>(null);
  const [documents, setDocuments] = useState<LoanDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadLoanDetail() {
    try {
      setLoading(true);
      setMessage("");

      if (!loanId) {
        setLoan(null);
        setMessage("Loan ID is missing.");
        return;
      }

      const response = await fetch(`/api/finance/loans/${loanId}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = (await readJsonResponse(
        response
      )) as FinanceLoanDetailResponse;

      if (!result.success || !result.loan) {
        setLoan(null);
        setDocuments([]);
        setMessage(result.message || "Failed to load finance loan details.");
        return;
      }

      setLoan(result.loan);
      setDocuments(Array.isArray(result.documents) ? result.documents : []);
    } catch (error) {
      console.error("LOAD_FINANCE_LOAN_DETAIL_ERROR", error);

      setLoan(null);
      setDocuments([]);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load finance loan details."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLoanDetail();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loanId]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#eee6da] text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading finance loan details...
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen rounded-[34px] bg-[#eee6da] p-6 text-[#2b241f]">
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm font-semibold text-red-700">
          {message || "Loan not found."}
        </div>

        <Link href="/dashboard/finance/loans">
          <Button className="mt-5 rounded-2xl bg-[#9b6f45] text-white hover:bg-[#835c38]">
            <ArrowLeft className="mr-2" size={17} />
            Back to Finance Loans
          </Button>
        </Link>
      </div>
    );
  }

  const canProcess =
    loan.status === "pending_finance_processing" ||
    loan.status === "pending_finance" ||
    loan.status === "user_accepted";

  return (
    <div className="dashboard-no-scrollbar min-h-screen overflow-hidden rounded-[34px] bg-[#eee6da] text-[#2b241f]">
      <div className="relative min-h-screen space-y-7 overflow-hidden p-1">
        <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-[#c99b69]/25 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-[480px] w-[480px] rounded-full bg-[#2c241f]/10 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-[360px] w-[360px] rounded-full bg-[#d8ad80]/25 blur-[130px]" />

        <section className="relative overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d8ad80]/25 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div>
              <Link
                href="/dashboard/finance/loans"
                className="mb-4 inline-flex items-center text-sm font-extrabold text-[#9b6f45] hover:text-[#835c38]"
              >
                <ArrowLeft className="mr-2" size={17} />
                Back to Finance Loan Queue
              </Link>

              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
                Finance Review
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
                {loan.reference}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6b5e54]">
                Review loan details, member information, documents and finance
                approval status.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span
                  className={`inline-flex rounded-full border px-4 py-2 text-xs font-extrabold ${getStatusClass(
                    loan.statusColor
                  )}`}
                >
                  {loan.statusLabel}
                </span>

                <span className="inline-flex rounded-full border border-[#d9c8b8] bg-[#f8f1e8] px-4 py-2 text-xs font-bold text-[#9b6f45]">
                  {loan.loanType}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {loan.approvalLetterUrl ? (
                <a
                  href={loan.approvalLetterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="rounded-2xl bg-[#2c241f] px-5 text-white hover:bg-[#9b6f45]">
                    <Download className="mr-2" size={17} />
                    Approval Letter
                  </Button>
                </a>
              ) : null}

              {loan.officerReportUrl ? (
                <a
                  href={loan.officerReportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="rounded-2xl bg-[#9b6f45] px-5 text-white hover:bg-[#835c38]">
                    <FileText className="mr-2" size={17} />
                    Officer Report
                  </Button>
                </a>
              ) : null}

              {canProcess ? (
                <Link href={`/dashboard/finance/loans/${loan.id}/process`}>
                  <Button className="rounded-2xl bg-emerald-700 px-5 text-white hover:bg-emerald-800">
                    <CheckCircle2 className="mr-2" size={17} />
                    Process Finance
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {message && (
          <div className="relative rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm font-semibold text-red-700">
            {message}
          </div>
        )}

        <section className="relative grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            title="Approved Amount"
            value={formatCurrency(loan.approvedAmount)}
            subtitle="Amount approved by admin"
            icon={Banknote}
          />

          <InfoCard
            title="Monthly EMI"
            value={formatCurrency(loan.monthlyInstallment)}
            subtitle="Expected monthly installment"
            icon={CreditCardIcon}
          />

          <InfoCard
            title="Repayment Period"
            value={`${loan.approvedPeriodMonths || 0} Months`}
            subtitle={`${loan.systemInterestRate || 0}% interest rate`}
            icon={CalendarDays}
          />

          <InfoCard
            title="Total Repayment"
            value={formatCurrency(loan.totalRepayment)}
            subtitle="Total repayment amount"
            icon={Landmark}
          />
        </section>

        <section className="relative grid gap-6 xl:grid-cols-[1fr_1fr]">
          <PersonCard title="Member Information" person={loan.member} icon={UserRound} />

          <Card className="rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_24px_80px_rgba(44,36,31,0.12)]">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c]">
                  <Landmark size={22} />
                </div>

                <div>
                  <h3 className="text-xl font-extrabold">Loan Information</h3>
                  <p className="text-sm text-[#6b5e54]">
                    Application and repayment details
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <DetailRow label="Loan Type" value={loan.loanType} />
                <DetailRow label="Purpose" value={loan.purpose || "-"} />
                <DetailRow
                  label="Requested Amount"
                  value={formatCurrency(loan.requestedAmount)}
                />
                <DetailRow
                  label="Approved Amount"
                  value={formatCurrency(loan.approvedAmount)}
                />
                <DetailRow
                  label="Monthly Income"
                  value={formatCurrency(loan.monthlyIncome)}
                />
                <DetailRow
                  label="Employment Type"
                  value={loan.employmentType || "-"}
                />
                <DetailRow
                  label="Preferred Period"
                  value={`${loan.preferredPeriodMonths || 0} months`}
                />
                <DetailRow
                  label="Approved Period"
                  value={`${loan.approvedPeriodMonths || 0} months`}
                />
                <DetailRow
                  label="Interest Rate"
                  value={`${loan.systemInterestRate || 0}%`}
                />
                <DetailRow
                  label="Remaining Balance"
                  value={formatCurrency(loan.remainingBalance)}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="relative grid gap-6 xl:grid-cols-3">
          <Card className="rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_24px_80px_rgba(44,36,31,0.12)]">
            <CardContent className="p-6">
              <h3 className="text-xl font-extrabold">Guarantor Details</h3>
              <p className="mt-1 text-sm text-[#6b5e54]">
                Loan guarantor information
              </p>

              <div className="mt-5 space-y-2">
                <DetailRow label="Name" value={loan.guarantorName || "-"} />
                <DetailRow
                  label="Employee ID"
                  value={loan.guarantorEmployeeId || "-"}
                />
                <DetailRow label="Phone" value={loan.guarantorPhone || "-"} />
                <DetailRow label="NIC" value={loan.guarantorNic || "-"} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_24px_80px_rgba(44,36,31,0.12)]">
            <CardContent className="p-6">
              <h3 className="text-xl font-extrabold">Workflow Dates</h3>
              <p className="mt-1 text-sm text-[#6b5e54]">
                Approval and finance timeline
              </p>

              <div className="mt-5 space-y-2">
                <DetailRow label="Applied Date" value={formatDate(loan.createdAt)} />
                <DetailRow
                  label="Officer Approved"
                  value={formatDate(loan.officerApprovedAt)}
                />
                <DetailRow
                  label="Admin Approved"
                  value={formatDate(loan.adminApprovedAt)}
                />
                <DetailRow
                  label="Finance Approved"
                  value={formatDate(loan.financeApprovedAt)}
                />
                <DetailRow
                  label="Disbursement Date"
                  value={formatDate(loan.disbursementDate)}
                />
                <DetailRow
                  label="Next EMI Due Date"
                  value={formatDate(loan.nextEMIDueDate)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border border-[#d9c8b8] bg-[#2c241f] text-white shadow-[0_24px_80px_rgba(44,36,31,0.18)]">
            <CardContent className="p-6">
              <ShieldCheck className="text-[#d8ad80]" size={30} />

              <h3 className="mt-5 text-xl font-extrabold">Review Status</h3>

              <div className="mt-5 space-y-3 text-sm">
                <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                  <p className="font-bold text-[#d8ad80]">Risk Level</p>
                  <p className="mt-1 font-extrabold capitalize">
                    {loan.riskLevel || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                  <p className="font-bold text-[#d8ad80]">Eligibility</p>
                  <p className="mt-1 font-extrabold capitalize">
                    {loan.eligibilityStatus?.replaceAll("_", " ") || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                  <p className="font-bold text-[#d8ad80]">Documents</p>
                  <p className="mt-1 font-extrabold capitalize">
                    {loan.documentStatus?.replaceAll("_", " ") || "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="relative grid gap-6 xl:grid-cols-3">
          <PersonCard
            title="Welfare Officer"
            person={loan.welfareOfficer}
            icon={ShieldCheck}
          />

          <PersonCard title="Admin" person={loan.admin} icon={UserRound} />

          <PersonCard
            title="Finance Officer"
            person={loan.financeOfficer}
            icon={Banknote}
          />
        </section>

        <section className="relative">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="p-6">
              <h2 className="text-2xl font-extrabold">Remarks</h2>
              <p className="mt-1 text-sm text-[#6b5e54]">
                Officer, admin and finance review comments.
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-3">
                <div className="rounded-[26px] border border-[#d9c8b8] bg-[#fffaf3] p-5">
                  <p className="text-sm font-extrabold text-[#9b6f45]">
                    Officer Remark
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#6b5e54]">
                    {loan.officerRemark || "No officer remark."}
                  </p>
                </div>

                <div className="rounded-[26px] border border-[#d9c8b8] bg-[#fffaf3] p-5">
                  <p className="text-sm font-extrabold text-[#9b6f45]">
                    Admin Remark
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#6b5e54]">
                    {loan.adminRemark || "No admin remark."}
                  </p>
                </div>

                <div className="rounded-[26px] border border-[#d9c8b8] bg-[#fffaf3] p-5">
                  <p className="text-sm font-extrabold text-[#9b6f45]">
                    Finance Remark
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#6b5e54]">
                    {loan.financeRemark || "No finance remark."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="relative">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="p-6">
              <h2 className="text-2xl font-extrabold">Loan Documents</h2>
              <p className="mt-1 text-sm text-[#6b5e54]">
                Uploaded and verified documents related to this loan.
              </p>

              <div className="mt-6 overflow-hidden rounded-2xl border border-[#d9c8b8] bg-[#efe3d6]/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="bg-[#f8f1e8] text-xs uppercase tracking-wide text-[#6b5e54]">
                      <tr>
                        <th className="px-5 py-4">Document</th>
                        <th className="px-5 py-4">Type</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Verified At</th>
                        <th className="px-5 py-4">Remark</th>
                        <th className="px-5 py-4">View</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#d9c8b8]">
                      {documents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-10 text-center text-sm font-semibold text-[#6b5e54]"
                          >
                            No documents found.
                          </td>
                        </tr>
                      ) : (
                        documents.map((document) => (
                          <tr
                            key={document.id}
                            className="bg-[#fbf7ef]/55 transition hover:bg-[#fffaf3]"
                          >
                            <td className="px-5 py-4 font-semibold text-[#2b241f]">
                              {document.label ||
                                document.originalName ||
                                document.fileName ||
                                "Document"}
                            </td>

                            <td className="px-5 py-4 text-[#6b5e54]">
                              {document.documentType || "-"}
                            </td>

                            <td className="px-5 py-4">
                              <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700">
                                {document.status || "-"}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-[#79695d]">
                              {formatDate(document.verifiedAt)}
                            </td>

                            <td className="px-5 py-4 text-[#6b5e54]">
                              {document.remark || "-"}
                            </td>

                            <td className="px-5 py-4">
                              {document.fileUrl ? (
                                <a
                                  href={document.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button
                                    size="sm"
                                    className="rounded-xl bg-[#2c241f] text-white hover:bg-[#9b6f45]"
                                  >
                                    View
                                  </Button>
                                </a>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function CreditCardIcon({ size = 22 }: { size?: number }) {
  return <Mail size={size} />;
}