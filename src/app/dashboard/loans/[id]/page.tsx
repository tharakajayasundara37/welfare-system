"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck,
  Landmark,
  Loader2,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type LoanMember = {
  fullName?: string;
  email?: string;
  phone?: string;
  nic?: string;
  employeeId?: string;
  department?: string;
  jobRole?: string;
  companyName?: string;
  salaryRange?: string;
};

type LoanDocument = {
  id: string;
  documentType: string;
  title: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  status: string;
  remark: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type LoanDetail = {
  id: string;
  reference: string;
  member: LoanMember | null;

  loanType: string;
  requestedAmount: number;
  approvedAmount: number;
  purpose: string;
  monthlyIncome: number;
  employmentType: string;

  guarantorName: string;
  guarantorPhone: string;
  guarantorNic: string;
  guarantorEmployeeId: string;

  systemInterestRate: number;
  preferredPeriodMonths: number;
  recommendedPeriodMonths: number;
  monthlyInstallment: number;
  totalRepayment: number;
  remainingBalance: number;

  riskLevel: string;
  eligibilityStatus: string;
  userAcceptanceStatus: string;
  documentStatus: string;
  status: string;

  officerRemark: string;
  adminRemark: string;
  financeRemark: string;

  createdAt: string | null;
  updatedAt: string | null;

  documents: LoanDocument[];
};

type LoanDetailResponse = {
  success: boolean;
  message?: string;
  loan?: LoanDetail;
};

function safeText(value: unknown) {
  return String(value || "").trim();
}

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

function formatFileSize(bytes: number) {
  if (!bytes) return "N/A";

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatStatus(status?: string) {
  return safeText(status || "pending")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClass(status?: string) {
  const normalized = safeText(status).toLowerCase();

  if (
    normalized.includes("approved") ||
    normalized.includes("verified") ||
    normalized.includes("disbursed") ||
    normalized.includes("active")
  ) {
    return "border-emerald-500/20 bg-emerald-500/15 text-emerald-700";
  }

  if (normalized.includes("reject")) {
    return "border-red-500/20 bg-red-500/15 text-red-700";
  }

  return "border-orange-500/20 bg-orange-500/15 text-orange-700";
}

function getRiskClass(risk?: string) {
  const normalized = safeText(risk).toLowerCase();

  if (normalized === "low") {
    return "border-emerald-500/20 bg-emerald-500/15 text-emerald-700";
  }

  if (normalized === "high") {
    return "border-red-500/20 bg-red-500/15 text-red-700";
  }

  return "border-orange-500/20 bg-orange-500/15 text-orange-700";
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();
    console.error("NON_JSON_RESPONSE:", text.slice(0, 500));

    throw new Error(
      "API returned HTML instead of JSON. Check /api/member/loans/[id] route path."
    );
  }

  return response.json();
}

function InfoCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <Card className="group overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_25px_90px_rgba(44,36,31,0.16)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-[#9b6f45]/45 hover:bg-[#fffaf3]">
      <CardContent className="relative p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#d8ad80]/30 blur-3xl" />

        <div
          className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d9c8b8] ${iconBg} ${iconColor} shadow-lg backdrop-blur-xl`}
        >
          <Icon size={24} />
        </div>

        <p className="relative mt-6 text-sm font-semibold text-[#6b5e54]">
          {title}
        </p>

        <h3 className="relative mt-2 text-3xl font-extrabold tracking-tight text-[#2b241f]">
          {value}
        </h3>

        <p className="relative mt-2 text-sm text-[#79695d]">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#d9c8b8] py-3 last:border-b-0">
      <p className="text-sm text-[#6b5e54]">{label}</p>
      <p className="text-right text-sm font-extrabold text-[#2b241f]">
        {value || "N/A"}
      </p>
    </div>
  );
}

export default function MemberLoanDetailPage() {
  const params = useParams<{ id: string }>();
  const loanId = params.id;

  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadLoan() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`/api/member/loans/${loanId}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = (await readJsonResponse(response)) as LoanDetailResponse;

      if (!result.success || !result.loan) {
        setLoan(null);
        setMessage(result.message || "Failed to load loan details.");
        return;
      }

      setLoan(result.loan);
    } catch (error) {
      console.error("LOAD_MEMBER_LOAN_DETAIL_ERROR", error);
      setLoan(null);
      setMessage(
        error instanceof Error ? error.message : "Failed to load loan details."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLoan();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loanId]);

  const verifiedDocuments = useMemo(() => {
    if (!loan) return 0;

    return loan.documents.filter((document) => document.status === "verified")
      .length;
  }, [loan]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading loan details...
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="dashboard-no-scrollbar min-h-screen overflow-hidden rounded-[34px] bg-[#eee6da] p-1 text-[#2b241f]">
        <div className="rounded-[32px] border border-red-500/25 bg-red-500/10 p-6 text-red-700">
          {message || "Loan application not found."}
        </div>

        <Link href="/dashboard/loans">
          <Button className="mt-5 rounded-2xl bg-[#9b6f45] text-white hover:bg-[#835c38]">
            <ArrowLeft className="mr-2" size={18} />
            Back to Loans
          </Button>
        </Link>
      </div>
    );
  }

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
                href="/dashboard/loans"
                className="mb-4 inline-flex items-center text-sm font-extrabold text-[#9b6f45] transition hover:text-[#835c38]"
              >
                <ArrowLeft className="mr-2" size={17} />
                Back to My Loans
              </Link>

              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
                Loan Details
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
                {loan.reference}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6b5e54]">
                View your loan application details, approval status, guarantor
                information, EMI summary and uploaded documents.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span
                className={`rounded-full border px-4 py-2 text-sm font-bold ${getStatusClass(
                  loan.status
                )}`}
              >
                {formatStatus(loan.status)}
              </span>

              <span
                className={`rounded-full border px-4 py-2 text-sm font-bold ${getRiskClass(
                  loan.riskLevel
                )}`}
              >
                {loan.riskLevel || "Not Calculated"} Risk
              </span>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm font-semibold text-red-700">
            {message}
          </div>
        )}

        <section className="relative grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            title="Requested Amount"
            value={formatCurrency(loan.requestedAmount)}
            subtitle={loan.loanType || "Loan type"}
            icon={Landmark}
            iconColor="text-[#8a5f3c]"
            iconBg="bg-[#f1e5d8]"
          />

          <InfoCard
            title="Approved Amount"
            value={formatCurrency(loan.approvedAmount)}
            subtitle="Final approved value"
            icon={CheckCircle2}
            iconColor="text-emerald-700"
            iconBg="bg-emerald-500/10"
          />

          <InfoCard
            title="Monthly EMI"
            value={formatCurrency(loan.monthlyInstallment)}
            subtitle={`${loan.preferredPeriodMonths || 0} months repayment`}
            icon={Banknote}
            iconColor="text-orange-700"
            iconBg="bg-orange-500/10"
          />

          <InfoCard
            title="Total Repayment"
            value={formatCurrency(loan.totalRepayment)}
            subtitle={`${loan.systemInterestRate || 0}% annual interest`}
            icon={ShieldCheck}
            iconColor="text-[#8a5f3c]"
            iconBg="bg-[#f1e5d8]"
          />
        </section>

        <section className="relative grid gap-6 xl:grid-cols-3">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c]">
                  <User size={22} />
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold">Member Details</h2>
                  <p className="text-sm text-[#6b5e54]">
                    Applicant information
                  </p>
                </div>
              </div>

              <DetailRow label="Full Name" value={loan.member?.fullName} />
              <DetailRow label="Email" value={loan.member?.email} />
              <DetailRow label="Phone" value={loan.member?.phone} />
              <DetailRow label="NIC" value={loan.member?.nic} />
              <DetailRow label="Employee ID" value={loan.member?.employeeId} />
              <DetailRow label="Department" value={loan.member?.department} />
              <DetailRow label="Job Role" value={loan.member?.jobRole} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c]">
                  <Landmark size={22} />
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold">Loan Details</h2>
                  <p className="text-sm text-[#6b5e54]">
                    Application information
                  </p>
                </div>
              </div>

              <DetailRow label="Loan Type" value={loan.loanType} />
              <DetailRow label="Purpose" value={loan.purpose} />
              <DetailRow
                label="Requested Amount"
                value={formatCurrency(loan.requestedAmount)}
              />
              <DetailRow
                label="Approved Amount"
                value={formatCurrency(loan.approvedAmount)}
              />
              <DetailRow
                label="Preferred Period"
                value={`${loan.preferredPeriodMonths || 0} months`}
              />
              <DetailRow
                label="Recommended Period"
                value={`${loan.recommendedPeriodMonths || 0} months`}
              />
              <DetailRow label="Applied Date" value={formatDate(loan.createdAt)} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700">
                  <Users size={22} />
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold">
                    Guarantor Details
                  </h2>
                  <p className="text-sm text-[#6b5e54]">
                    Guarantee information
                  </p>
                </div>
              </div>

              <DetailRow
                label="Guarantor Employee ID"
                value={loan.guarantorEmployeeId}
              />
              <DetailRow label="Guarantor Name" value={loan.guarantorName} />
              <DetailRow label="Guarantor Phone" value={loan.guarantorPhone} />
              <DetailRow label="Guarantor NIC" value={loan.guarantorNic} />
              <DetailRow label="Employment Type" value={loan.employmentType} />
              <DetailRow
                label="Monthly Income"
                value={formatCurrency(loan.monthlyIncome)}
              />
              <DetailRow label="Eligibility" value={formatStatus(loan.eligibilityStatus)} />
            </CardContent>
          </Card>
        </section>

        <section className="relative grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="relative mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold">
                    Uploaded Documents
                  </h2>

                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Documents uploaded with this loan application.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8] px-4 py-3 text-sm font-bold text-[#9b6f45]">
                  {verifiedDocuments}/{loan.documents.length} Verified
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-[#d9c8b8] bg-[#efe3d6]/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="bg-[#f8f1e8] text-xs uppercase tracking-wide text-[#6b5e54]">
                      <tr>
                        <th className="px-5 py-4">Document</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">File Size</th>
                        <th className="px-5 py-4">Remark</th>
                        <th className="px-5 py-4 text-right">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#d9c8b8]">
                      {loan.documents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-5 py-10 text-center text-sm font-semibold text-[#6b5e54]"
                          >
                            No documents found for this loan.
                          </td>
                        </tr>
                      ) : (
                        loan.documents.map((document) => (
                          <tr
                            key={document.id}
                            className="bg-[#fbf7ef]/55 transition hover:bg-[#fffaf3]"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c]">
                                  <FileCheck size={18} />
                                </div>

                                <div>
                                  <p className="font-extrabold text-[#2b241f]">
                                    {document.title}
                                  </p>
                                  <p className="mt-1 text-xs text-[#79695d]">
                                    {document.originalName}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                  document.status
                                )}`}
                              >
                                {formatStatus(document.status)}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-[#6b5e54]">
                              {formatFileSize(document.size)}
                            </td>

                            <td className="max-w-[220px] px-5 py-4 text-[#6b5e54]">
                              <span className="line-clamp-2">
                                {document.remark || "-"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end">
                                {document.fileUrl ? (
                                  <a
                                    href={document.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-xl border-[#d9c8b8] bg-[#f8f1e8] text-[#2b241f] hover:bg-[#fffaf3]"
                                    >
                                      <Eye size={15} className="mr-1" />
                                      View
                                    </Button>
                                  </a>
                                ) : (
                                  <Button
                                    size="sm"
                                    disabled
                                    variant="outline"
                                    className="rounded-xl border-[#d9c8b8] bg-[#f8f1e8] text-[#2b241f] opacity-50"
                                  >
                                    <Eye size={15} className="mr-1" />
                                    No File
                                  </Button>
                                )}
                              </div>
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

          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#2c241f] text-white shadow-[0_30px_100px_rgba(44,36,31,0.24)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/25 blur-3xl" />

              <h2 className="relative text-2xl font-extrabold">
                Approval Progress
              </h2>

              <p className="relative mt-2 text-sm text-[#ead9c8]/70">
                Current workflow status and review remarks.
              </p>

              <div className="relative mt-6 space-y-4">
                <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8ad80]">
                    Current Status
                  </p>
                  <p className="mt-2 text-base font-extrabold">
                    {formatStatus(loan.status)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8ad80]">
                    Document Status
                  </p>
                  <p className="mt-2 text-base font-extrabold">
                    {loan.documentStatus
                      ? formatStatus(loan.documentStatus)
                      : `${verifiedDocuments}/${loan.documents.length} Verified`}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8ad80]">
                    Officer Remark
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#ead9c8]/75">
                    {loan.officerRemark || "No officer remark yet."}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#d8ad80]/20 bg-[#fbf7ef]/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8ad80]">
                    Admin Remark
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#ead9c8]/75">
                    {loan.adminRemark || "No admin remark yet."}
                  </p>
                </div>

                <Link href="/dashboard/loans/apply">
                  <Button className="mt-2 w-full rounded-2xl bg-[#d8ad80] text-[#2c241f] hover:bg-[#ead9c8]">
                    Apply Another Loan
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}