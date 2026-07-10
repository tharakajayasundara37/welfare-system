"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
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

interface LoanDocument {
  _id: string;
  documentType?: string;
  label?: string;
  fileName?: string;
  originalName?: string;
  fileUrl?: string;
  mimeType?: string;
  size?: number;
  status?: string;
  remark?: string;
  createdAt?: string;
}

interface Loan {
  _id: string;
  userId?: LoanUser;
  documents?: LoanDocument[];

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
  userAcceptanceStatus?: string;
  documentStatus?: string;
  status?: string;
  officerRemark?: string;
  createdAt?: string;
}

interface LoanDetailResponse {
  success: boolean;
  loan?: Loan;
  message?: string;
}

interface ActionResponse {
  success: boolean;
  message?: string;
  loan?: Loan;
}

interface DocumentActionResponse {
  success: boolean;
  message?: string;
  allVerified?: boolean;
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

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "N/A";

  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

const getStatusStyle = (status?: string) => {
  if (status === "verified" || status === "eligible") {
    return "border-emerald-600/25 bg-emerald-100 text-emerald-700";
  }

  if (
    status === "uploaded" ||
    status === "pending_verification" ||
    status === "review_required"
  ) {
    return "border-[#d8ad80]/50 bg-[#f6eadc] text-[#9b6f45]";
  }

  if (
    status === "rejected" ||
    status === "not_eligible" ||
    status === "resubmission_required"
  ) {
    return "border-red-500/20 bg-red-100 text-red-700";
  }

  return "border-[#d9c8b8] bg-[#fbf7ef] text-[#9b6f45]";
};

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
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <Card className="overflow-hidden rounded-[28px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_25px_90px_rgba(44,36,31,0.14)] backdrop-blur-2xl transition hover:-translate-y-1 hover:border-[#9b6f45]/45 hover:bg-[#fffaf3]">
      <CardContent className="relative p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#d8ad80]/20 blur-3xl" />

        <div
          className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] ${iconBg} ${iconColor}`}
        >
          <Icon size={22} />
        </div>

        <p className="relative mt-5 text-sm font-semibold text-[#6b5e54]">
          {title}
        </p>

        <h3 className="relative mt-2 text-2xl font-extrabold text-[#2b241f]">
          {value}
        </h3 >

        {subtitle ? (
          <p className="relative mt-2 text-sm text-[#79695d]">{subtitle}</p>
        ) : null}
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
      <p className="text-right text-sm font-bold text-[#2b241f]">
        {value || "N/A"}
      </p>
    </div>
  );
}

export default function OfficerLoanDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const loanId = params.id;

  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [officerRemark, setOfficerRemark] = useState("");
  const [documentsVerified, setDocumentsVerified] = useState(false);

  const loadLoan = async () => {
    try {
      setLoading(true);
      setMessage("");
      setIsSuccess(false);

      const response = await fetch(`/api/officer/loans/${loanId}`, {
        method: "GET",
        cache: "no-store",
      });

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error("API returned HTML instead of JSON");
      }

      const result = (await response.json()) as LoanDetailResponse;

      if (!result.success || !result.loan) {
        setMessage(result.message || "Failed to load loan details.");
        setIsSuccess(false);
        return;
      }

      const allDocumentsVerified =
        result.loan.documents &&
        result.loan.documents.length > 0 &&
        result.loan.documents.every((doc) => doc.status === "verified");

      setLoan(result.loan);
      setOfficerRemark(result.loan.officerRemark || "");
      setDocumentsVerified(Boolean(allDocumentsVerified));
    } catch (error) {
      console.error("LOAD_LOAN_DETAIL_ERROR", error);
      setMessage("Failed to load loan details.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLoan();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loanId]);

  const documentItems = useMemo(() => {
    if (!loan || !loan.documents || loan.documents.length === 0) {
      return [];
    }

    return loan.documents.map((document) => ({
      id: document._id,
      name: document.label || document.documentType || "Document",
      originalName:
        document.originalName || document.fileName || "Uploaded file",
      fileUrl: document.fileUrl || "",
      mimeType: document.mimeType || "",
      size: document.size || 0,
      status: document.status || "uploaded",
    }));
  }, [loan]);

  const handleDocumentAction = async (
    documentId: string,
    action: "verify" | "reject"
  ) => {
    try {
      setActionLoading(`${action}-${documentId}`);
      setMessage("");
      setIsSuccess(false);

      const response = await fetch(
        `/api/officer/documents/${documentId}/${action}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            remark:
              action === "verify"
                ? "Document verified by welfare officer."
                : "Document rejected by welfare officer.",
          }),
        }
      );

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error("API returned HTML instead of JSON");
      }

      const result = (await response.json()) as DocumentActionResponse;

      if (!result.success) {
        setMessage(result.message || `Failed to ${action} document.`);
        setIsSuccess(false);
        return;
      }

      setMessage(result.message || "Document action completed.");
      setIsSuccess(true);

      await loadLoan();
    } catch (error) {
      console.error("DOCUMENT_ACTION_ERROR", error);
      setMessage(`Failed to ${action} document.`);
      setIsSuccess(false);
    } finally {
      setActionLoading("");
    }
  };

  const handleBulkDocumentAction = async (action: "verify" | "reject") => {
    try {
      if (documentItems.length === 0) {
        setMessage("No documents found for this loan.");
        setIsSuccess(false);
        return;
      }

      if (action === "reject") {
        const confirmed = window.confirm(
          "Are you sure you want to reject all uploaded documents?"
        );

        if (!confirmed) return;
      }

      setActionLoading(`${action}-all`);
      setMessage("");
      setIsSuccess(false);

      const targetDocuments = documentItems.filter((doc) =>
        action === "verify"
          ? doc.status !== "verified"
          : doc.status !== "rejected"
      );

      if (targetDocuments.length === 0) {
        setMessage(
          action === "verify"
            ? "All documents are already verified."
            : "All documents are already rejected."
        );
        setIsSuccess(true);
        return;
      }

      for (const doc of targetDocuments) {
        const response = await fetch(
          `/api/officer/documents/${doc.id}/${action}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              remark:
                action === "verify"
                  ? "All documents verified by welfare officer."
                  : "All documents rejected by welfare officer.",
            }),
          }
        );

        const contentType = response.headers.get("content-type");

        if (!contentType?.includes("application/json")) {
          throw new Error("API returned HTML instead of JSON");
        }

        const result = (await response.json()) as DocumentActionResponse;

        if (!result.success) {
          setMessage(result.message || `Failed to ${action} documents.`);
          setIsSuccess(false);
          return;
        }
      }

      setMessage(
        action === "verify"
          ? "All documents verified successfully."
          : "All documents rejected successfully."
      );
      setIsSuccess(true);

      await loadLoan();
    } catch (error) {
      console.error("BULK_DOCUMENT_ACTION_ERROR", error);
      setMessage(
        action === "verify"
          ? "Failed to verify all documents."
          : "Failed to reject all documents."
      );
      setIsSuccess(false);
    } finally {
      setActionLoading("");
    }
  };

  const handleAction = async (action: "approve" | "reject") => {
    try {
      setActionLoading(action);
      setMessage("");
      setIsSuccess(false);

      if (action === "approve" && !documentsVerified) {
        setMessage("Please verify all documents before approving this loan.");
        setIsSuccess(false);
        return;
      }

      const response = await fetch(`/api/officer/loans/${loanId}/${action}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          officerRemark:
            officerRemark ||
            (action === "approve"
              ? "Welfare officer approved after document review."
              : "Loan rejected by welfare officer after review."),
        }),
      });

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error("API returned HTML instead of JSON");
      }

      const result = (await response.json()) as ActionResponse;

      if (!result.success) {
        setMessage(result.message || `Failed to ${action} loan.`);
        setIsSuccess(false);
        return;
      }

      setMessage(result.message || "Action completed successfully.");
      setIsSuccess(true);

      window.setTimeout(() => {
        router.push("/dashboard/officer/loans");
      }, 1200);
    } catch (error) {
      console.error("OFFICER_DETAIL_ACTION_ERROR", error);
      setMessage(`Failed to ${action} loan.`);
      setIsSuccess(false);
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#eee6da] text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading loan details...
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="relative min-h-full space-y-6 overflow-hidden bg-[#eee6da] p-1 text-[#2b241f]">
        <div className="rounded-[32px] border border-red-500/20 bg-red-100 p-6 text-red-700">
          {message || "Loan application not found."}
        </div>

        <Link href="/dashboard/officer/loans">
          <Button className="rounded-2xl bg-[#2c241f] text-[#fbf7ef] hover:bg-[#9b6f45]">
            <ArrowLeft className="mr-2" size={18} />
            Back to Loan Reviews
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-full space-y-6 overflow-hidden rounded-[34px] bg-[#eee6da] p-1 text-[#2b241f]">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-[#c99b69]/25 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-20 h-[480px] w-[480px] rounded-full bg-[#2c241f]/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[360px] w-[360px] rounded-full bg-[#d8ad80]/25 blur-[130px]" />

      <section className="relative overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-7 shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d8ad80]/25 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <Link
              href="/dashboard/officer/loans"
              className="mb-4 inline-flex items-center text-sm font-bold text-[#9b6f45] transition hover:text-[#2c241f]"
            >
              <ArrowLeft className="mr-2" size={17} />
              Back to Review Queue
            </Link>

            <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
              Welfare
            </p>

            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
              Loan Review Details
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
              Review applicant details, loan information, guarantor details,
              financial assessment and uploaded documents before making a
              decision.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-4 py-2 text-sm font-bold capitalize ${getStatusStyle(
                loan.status
              )}`}
            >
              {(loan.status || "under_welfare_review").replaceAll("_", " ")}
            </span>

            <span
              className={`rounded-full border px-4 py-2 text-sm font-bold capitalize ${getRiskStyle(
                loan.riskLevel
              )}`}
            >
              {loan.riskLevel || "medium"} risk
            </span>
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
        <InfoCard
          title="Requested Amount"
          value={formatCurrency(loan.requestedAmount)}
          subtitle={loan.loanType || "Loan type"}
          icon={Landmark}
          iconColor="text-[#9b6f45]"
          iconBg="bg-[#f1e5d8]"
        />

        <InfoCard
          title="Monthly EMI"
          value={formatCurrency(loan.monthlyInstallment)}
          subtitle={`${loan.preferredPeriodMonths || 0} months repayment`}
          icon={Banknote}
          iconColor="text-[#9b6f45]"
          iconBg="bg-[#f6eadc]"
        />

        <InfoCard
          title="Monthly Income"
          value={formatCurrency(loan.monthlyIncome)}
          subtitle={loan.employmentType || "Employment type"}
          icon={BriefcaseBusiness}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-100"
        />

        <InfoCard
          title="Total Repayment"
          value={formatCurrency(loan.totalRepayment)}
          subtitle={`${loan.systemInterestRate || 0}% annual interest`}
          icon={ShieldCheck}
          iconColor="text-[#9b6f45]"
          iconBg="bg-[#f1e5d8]"
        />
      </section>

      <section className="relative grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <CardContent className="relative p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#9b6f45]">
                <User size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold">Member Details</h2>
                <p className="text-sm text-[#6b5e54]">
                  Applicant information
                </p>
              </div>
            </div>

            <DetailRow label="Full Name" value={loan.userId?.fullName} />
            <DetailRow label="Email" value={loan.userId?.email} />
            <DetailRow label="Phone" value={loan.userId?.phone} />
            <DetailRow label="NIC" value={loan.userId?.nic} />
            <DetailRow label="Employee ID" value={loan.userId?.employeeId} />
            <DetailRow label="Department" value={loan.userId?.department} />
            <DetailRow label="Job Role" value={loan.userId?.jobRole} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <CardContent className="relative p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f6eadc] text-[#9b6f45]">
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
            <DetailRow label="Applied Date" value={formatDate(loan.createdAt)} />
            <DetailRow
              label="User Acceptance"
              value={loan.userAcceptanceStatus?.replaceAll("_", " ")}
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <CardContent className="relative p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-emerald-100 text-emerald-700">
                <Users size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold">Guarantor Details</h2>
                <p className="text-sm text-[#6b5e54]">
                  Guarantee information
                </p>
              </div>
            </div>

            <DetailRow label="Guarantor Name" value={loan.guarantorName} />
            <DetailRow label="Guarantor Phone" value={loan.guarantorPhone} />
            <DetailRow label="Guarantor NIC" value={loan.guarantorNic} />
            <DetailRow label="Employment Type" value={loan.employmentType} />
            <DetailRow
              label="Monthly Income"
              value={formatCurrency(loan.monthlyIncome)}
            />
            <DetailRow label="Risk Level" value={loan.riskLevel} />
            <DetailRow
              label="Eligibility"
              value={loan.eligibilityStatus?.replaceAll("_", " ")}
            />
          </CardContent>
        </Card>
      </section>

      <section className="relative grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <CardContent className="relative p-6">
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/20 blur-3xl" />

            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-extrabold">
                  Document Verification
                </h2>

                <p className="mt-1 text-sm text-[#6b5e54]">
                  Officer must open each file, verify/reject documents, then
                  approve the loan only after all documents are verified.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                    documentsVerified
                      ? "border-emerald-600/25 bg-emerald-100 text-emerald-700"
                      : "border-[#d8ad80]/50 bg-[#f6eadc] text-[#9b6f45]"
                  }`}
                >
                  {documentsVerified
                    ? "All documents verified"
                    : "Verify each document one by one"}
                </div>

                <Button
                  type="button"
                  disabled={
                    documentItems.length === 0 ||
                    documentsVerified ||
                    actionLoading === "verify-all"
                  }
                  onClick={() => void handleBulkDocumentAction("verify")}
                  className="rounded-2xl bg-emerald-700 px-4 text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading === "verify-all" ? (
                    <Loader2 className="mr-2 animate-spin" size={16} />
                  ) : (
                    <CheckCircle2 className="mr-2" size={16} />
                  )}
                  Verify All
                </Button>

                <Button
                  type="button"
                  disabled={
                    documentItems.length === 0 ||
                    actionLoading === "reject-all"
                  }
                  onClick={() => void handleBulkDocumentAction("reject")}
                  className="rounded-2xl bg-red-700 px-4 text-white shadow-lg shadow-red-700/20 transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading === "reject-all" ? (
                    <Loader2 className="mr-2 animate-spin" size={16} />
                  ) : (
                    <XCircle className="mr-2" size={16} />
                  )}
                  Reject All
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/70">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="bg-[#efe2d2] text-xs uppercase tracking-wide text-[#6b5e54]">
                    <tr>
                      <th className="px-5 py-4">Document</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">File Size</th>
                      <th className="px-5 py-4">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#d9c8b8]">
                    {documentItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-5 py-10 text-center text-[#6b5e54]"
                        >
                          No uploaded documents found for this loan. Submit a
                          new loan application with documents.
                        </td>
                      </tr>
                    ) : (
                      documentItems.map((doc) => (
                        <tr
                          key={doc.id}
                          className="bg-[#fbf7ef]/60 transition hover:bg-[#fffaf3]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#9b6f45]">
                                <FileCheck size={18} />
                              </div>

                              <div>
                                <p className="font-bold text-[#2b241f]">
                                  {doc.name}
                                </p>
                                <p className="mt-1 text-xs text-[#79695d]">
                                  {doc.originalName}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusStyle(
                                doc.status
                              )}`}
                            >
                              {doc.status.replaceAll("_", " ")}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-[#6b5e54]">
                            {formatFileSize(doc.size)}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              {doc.fileUrl ? (
                                // මෙතන තමයි ලින්ක් එක වෙනස් කළේ! 👇
                                <a
                                  href={`/api/documents/view?url=${encodeURIComponent(doc.fileUrl)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] hover:bg-[#f1e5d8]"
                                  >
                                    View File
                                  </Button>
                                </a>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled
                                  variant="outline"
                                  className="rounded-xl border-[#d9c8b8] bg-[#fbf7ef] text-[#6b5e54] opacity-50"
                                >
                                  No File
                                </Button>
                              )}

                              <Button
                                size="sm"
                                disabled={
                                  doc.status === "verified" ||
                                  actionLoading === `verify-${doc.id}` ||
                                  actionLoading === "verify-all" ||
                                  actionLoading === "reject-all"
                                }
                                onClick={() =>
                                  void handleDocumentAction(doc.id, "verify")
                                }
                                className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {actionLoading === `verify-${doc.id}` ? (
                                  <Loader2
                                    className="mr-1 animate-spin"
                                    size={14}
                                  />
                                ) : null}
                                Verify
                              </Button>

                              <Button
                                size="sm"
                                disabled={
                                  doc.status === "rejected" ||
                                  actionLoading === `reject-${doc.id}` ||
                                  actionLoading === "verify-all" ||
                                  actionLoading === "reject-all"
                                }
                                onClick={() =>
                                  void handleDocumentAction(doc.id, "reject")
                                }
                                className="rounded-xl bg-red-700 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {actionLoading === `reject-${doc.id}` ? (
                                  <Loader2
                                    className="mr-1 animate-spin"
                                    size={14}
                                  />
                                ) : null}
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {!documentsVerified && (
              <div className="mt-4 rounded-2xl border border-[#d8ad80]/50 bg-[#f6eadc] p-4 text-sm font-semibold text-[#9b6f45]">
                All documents must be verified before approving this loan.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
          <CardContent className="relative p-6">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/20 blur-3xl" />

            <div className="mb-6">
              <h2 className="text-2xl font-extrabold">Officer Decision</h2>
              <p className="mt-1 text-sm text-[#6b5e54]">
                Add remark and submit the review decision.
              </p>
            </div>

            <label className="text-sm font-semibold text-[#2b241f]">
              Officer Remark
            </label>

            <textarea
              value={officerRemark}
              onChange={(event) => setOfficerRemark(event.target.value)}
              placeholder="Write review remark..."
              className="mt-2 min-h-[150px] w-full resize-none rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/80 p-4 text-sm text-[#2b241f] shadow-inner shadow-[#2c241f]/5 outline-none placeholder:text-[#9b6f45]/45 focus:border-[#9b6f45]/50"
            />

            <div className="mt-6 space-y-3">
              <Button
                type="button"
                disabled={!documentsVerified || actionLoading === "approve"}
                onClick={() => void handleAction("approve")}
                className="h-12 w-full rounded-2xl bg-emerald-700 font-extrabold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === "approve" ? (
                  <Loader2 className="mr-2 animate-spin" size={18} />
                ) : (
                  <CheckCircle2 className="mr-2" size={18} />
                )}
                Approve & Forward to Admin
              </Button>

              <Button
                type="button"
                disabled={actionLoading === "reject"}
                onClick={() => void handleAction("reject")}
                className="h-12 w-full rounded-2xl bg-red-700 font-extrabold text-white shadow-lg shadow-red-700/20 transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === "reject" ? (
                  <Loader2 className="mr-2 animate-spin" size={18} />
                ) : (
                  <XCircle className="mr-2" size={18} />
                )}
                Reject Application
              </Button>
            </div>

            <div className="mt-5 rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/80 p-4">
              <div className="flex items-center gap-3 text-sm text-[#6b5e54]">
                <AlertTriangle className="text-[#9b6f45]" size={18} />
                Officer approval sends this loan to Admin final approval queue.
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}