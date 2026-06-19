"use client";

import { Suspense, useEffect, useState } from "react";import { useSearchParams } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type DocumentDetail = {
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

  applicant: {
    name: string;
    email: string;
    phone: string;
    nic: string;
    employeeId: string;
    department: string;
    jobRole: string;
  };

  loan: {
    id: string;
    loanType: string;
    requestedAmount: number;
    approvedAmount: number;
    purpose: string;
    status: string;
    createdAt: string | null;
  } | null;

  grantId: string | null;
};

type DocumentDetailResponse = {
  success: boolean;
  message?: string;
  document?: DocumentDetail;
};

type ActionResponse = {
  success: boolean;
  message?: string;
};

function safeText(value: unknown) {
  return String(value || "").trim();
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

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatFileSize(bytes: number) {
  if (!bytes) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatStatus(status?: string) {
  return safeText(status || "uploaded")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClass(status?: string) {
  const normalized = safeText(status).toLowerCase();

  if (normalized === "verified" || normalized.includes("approved")) {
    return "border-emerald-500/20 bg-emerald-500/15 text-emerald-700";
  }

  if (normalized === "rejected" || normalized.includes("reject")) {
    return "border-red-500/20 bg-red-500/15 text-red-700";
  }

  return "border-orange-500/20 bg-orange-500/15 text-orange-700";
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();

    console.error(
      "NON_JSON_RESPONSE:",
      response.url,
      text.slice(0, 500)
    );

    throw new Error(
      `API returned HTML instead of JSON. URL: ${response.url}`
    );
  }

  return response.json();
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

function DocumentPreview({ document }: { document: DocumentDetail }) {
  const fileUrl = document.fileUrl;
  const mimeType = document.mimeType.toLowerCase();

  if (!fileUrl) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-red-500/25 bg-red-500/10 text-sm font-bold text-red-700">
        File URL not found.
      </div>
    );
  }

  if (mimeType.includes("image")) {
    return (
      <div className="overflow-hidden rounded-[28px] border border-[#d9c8b8] bg-[#efe3d6]/70 p-4">
        <img
          src={fileUrl}
          alt={document.title}
          className="mx-auto max-h-[720px] w-auto max-w-full rounded-2xl object-contain shadow-[0_20px_70px_rgba(44,36,31,0.18)]"
        />
      </div>
    );
  }

  if (mimeType.includes("pdf")) {
    return (
      <div className="overflow-hidden rounded-[28px] border border-[#d9c8b8] bg-[#efe3d6]/70">
        <iframe
          src={fileUrl}
          title={document.title}
          className="h-[720px] w-full"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-[#d9c8b8] bg-[#efe3d6]/70 p-6 text-center">
      <FileText className="text-[#9b6f45]" size={54} />

      <h3 className="mt-4 text-xl font-extrabold text-[#2b241f]">
        Preview not available
      </h3>

      <p className="mt-2 text-sm text-[#6b5e54]">
        This file type cannot preview here. Open original file.
      </p>

      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
        <Button className="mt-5 rounded-2xl bg-[#9b6f45] text-white hover:bg-[#835c38]">
          <Eye className="mr-2" size={17} />
          Open File
        </Button>
      </a>
    </div>
  );
}

function OfficerDocumentViewContent() {
  const searchParams = useSearchParams();
  const documentId = String(searchParams.get("documentId") || "").trim();

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  async function loadDocument() {
    try {
      setLoading(true);
      setMessage("");
      setIsSuccess(false);

      if (!documentId) {
        setDocument(null);
        setMessage("Document ID is missing. Please go back and click View again.");
        return;
      }

      const response = await fetch(`/api/officer/documents/${documentId}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = (await readJsonResponse(response)) as DocumentDetailResponse;

      if (!result.success || !result.document) {
        setDocument(null);
        setMessage(result.message || "Failed to load document details.");
        return;
      }

      setDocument(result.document);
    } catch (error) {
      console.error("LOAD_DOCUMENT_DETAIL_ERROR", error);
      setDocument(null);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load document details."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDocument();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [documentId]);

  async function handleDocumentAction(action: "verify" | "reject") {
    try {
      if (!documentId) {
        setMessage("Document ID is missing. Please go back and click View again.");
        setIsSuccess(false);
        return;
      }

      setActionLoading(action);
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

      const result = (await readJsonResponse(response)) as ActionResponse;

      if (!result.success) {
        setMessage(result.message || `Failed to ${action} document.`);
        setIsSuccess(false);
        return;
      }

      setMessage(result.message || `Document ${action} completed.`);
      setIsSuccess(true);

      await loadDocument();
    } catch (error) {
      console.error("DOCUMENT_ACTION_ERROR", error);
      setMessage(
        error instanceof Error
          ? error.message
          : `Failed to ${action} document.`
      );
      setIsSuccess(false);
    } finally {
      setActionLoading("");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading document details...
      </div>
    );
  }

  if (!document) {
    return (
      <div className="dashboard-no-scrollbar min-h-screen overflow-hidden rounded-[34px] bg-[#eee6da] p-1 text-[#2b241f]">
        <div className="rounded-[32px] border border-red-500/25 bg-red-500/10 p-6 text-red-700">
          {message || "Document not found."}
        </div>

        <Link href="/dashboard/officer/documents">
          <Button className="mt-5 rounded-2xl bg-[#9b6f45] text-white hover:bg-[#835c38]">
            <ArrowLeft className="mr-2" size={18} />
            Back to Documents
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

          <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div>
              <Link
                href="/dashboard/officer/documents"
                className="mb-4 inline-flex items-center text-sm font-extrabold text-[#9b6f45] transition hover:text-[#835c38]"
              >
                <ArrowLeft className="mr-2" size={17} />
                Back to Document Verification
              </Link>

              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
                Officer Document Review
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
                {document.title}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6b5e54]">
                Review the full uploaded document, applicant details, linked
                loan information and verification status.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span
                className={`rounded-full border px-4 py-2 text-sm font-bold ${getStatusClass(
                  document.status
                )}`}
              >
                {formatStatus(document.status)}
              </span>

              {document.fileUrl ? (
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="rounded-2xl border-[#d9c8b8] bg-[#f8f1e8] text-[#2b241f] hover:bg-[#fffaf3]"
                  >
                    <Eye className="mr-2" size={17} />
                    Open Original
                  </Button>
                </a>
              ) : null}
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`rounded-2xl border p-4 text-sm font-semibold ${
              isSuccess
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700"
                : "border-red-500/25 bg-red-500/10 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <section className="relative grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c]">
                  <FileText size={22} />
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold">
                    Full Document Preview
                  </h2>

                  <p className="text-sm text-[#6b5e54]">
                    File: {document.originalName || document.fileName}
                  </p>
                </div>
              </div>

              <DocumentPreview document={document} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
              <CardContent className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c]">
                    <User size={22} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold">
                      Applicant Details
                    </h2>

                    <p className="text-sm text-[#6b5e54]">
                      Member who uploaded this document
                    </p>
                  </div>
                </div>

                <DetailRow label="Name" value={document.applicant.name} />
                <DetailRow
                  label="Employee ID"
                  value={document.applicant.employeeId}
                />
                <DetailRow label="NIC" value={document.applicant.nic} />
                <DetailRow label="Phone" value={document.applicant.phone} />
                <DetailRow label="Email" value={document.applicant.email} />
                <DetailRow
                  label="Department"
                  value={document.applicant.department}
                />
                <DetailRow label="Job Role" value={document.applicant.jobRole} />
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
              <CardContent className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c]">
                    <ShieldCheck size={22} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold">
                      Document Details
                    </h2>

                    <p className="text-sm text-[#6b5e54]">
                      Verification and file information
                    </p>
                  </div>
                </div>

                <DetailRow
                  label="Document ID"
                  value={document.id.slice(-8).toUpperCase()}
                />
                <DetailRow
                  label="Document Type"
                  value={document.documentType}
                />
                <DetailRow
                  label="Original Name"
                  value={document.originalName}
                />
                <DetailRow
                  label="File Size"
                  value={formatFileSize(document.size)}
                />
                <DetailRow label="MIME Type" value={document.mimeType} />
                <DetailRow
                  label="Uploaded Date"
                  value={formatDate(document.createdAt)}
                />
                <DetailRow label="Status" value={formatStatus(document.status)} />
                <DetailRow label="Remark" value={document.remark || "-"} />
              </CardContent>
            </Card>

            {document.loan ? (
              <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-extrabold">Linked Loan</h2>

                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Loan application linked with this document
                  </p>

                  <div className="mt-5">
                    <DetailRow
                      label="Loan ID"
                      value={document.loan.id.slice(-8).toUpperCase()}
                    />
                    <DetailRow label="Loan Type" value={document.loan.loanType} />
                    <DetailRow
                      label="Requested Amount"
                      value={formatCurrency(document.loan.requestedAmount)}
                    />
                    <DetailRow
                      label="Approved Amount"
                      value={formatCurrency(document.loan.approvedAmount)}
                    />
                    <DetailRow label="Purpose" value={document.loan.purpose} />
                    <DetailRow
                      label="Loan Status"
                      value={formatStatus(document.loan.status)}
                    />
                  </div>

                  <Link href={`/dashboard/officer/loans/${document.loan.id}`}>
                    <Button className="mt-5 w-full rounded-2xl bg-[#9b6f45] text-white hover:bg-[#835c38]">
                      Open Loan Review
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : null}

            <Card className="overflow-hidden rounded-[32px] border border-[#3c332d] bg-[#2c241f] text-white shadow-[0_30px_100px_rgba(44,36,31,0.24)] backdrop-blur-2xl">
              <CardContent className="p-6">
                <h2 className="text-2xl font-extrabold">Officer Action</h2>

                <p className="mt-2 text-sm text-[#ead9c8]/70">
                  Verify valid documents or reject incorrect/unclear documents.
                </p>

                <div className="mt-6 space-y-3">
                  <Button
                    type="button"
                    disabled={
                      document.status === "verified" ||
                      actionLoading === "verify"
                    }
                    onClick={() => void handleDocumentAction("verify")}
                    className="h-12 w-full rounded-2xl bg-emerald-700 font-extrabold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionLoading === "verify" ? (
                      <Loader2 className="mr-2 animate-spin" size={18} />
                    ) : (
                      <CheckCircle2 className="mr-2" size={18} />
                    )}
                    Verify Document
                  </Button>

                  <Button
                    type="button"
                    disabled={
                      document.status === "rejected" ||
                      actionLoading === "reject"
                    }
                    onClick={() => void handleDocumentAction("reject")}
                    className="h-12 w-full rounded-2xl bg-red-700 font-extrabold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionLoading === "reject" ? (
                      <Loader2 className="mr-2 animate-spin" size={18} />
                    ) : (
                      <XCircle className="mr-2" size={18} />
                    )}
                    Reject Document
                  </Button>
                  
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
export default function OfficerDocumentViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-[#2b241f]">
          <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
          Loading document details...
        </div>
      }
    >
      <OfficerDocumentViewContent />
    </Suspense>
  );
}