"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SortType = "newest" | "oldest" | "employeeId" | "name" | "status";

type MemberDocument = {
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

  loanId: string | null;
  grantId: string | null;

  loanType: string;
  loanStatus: string;
  loanAmount: number;
  loanPurpose: string;

  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantNic: string;
  applicantEmployeeId: string;
  applicantDepartment: string;
  applicantJobRole: string;

  createdAt: string | null;
  updatedAt: string | null;
};

type DocumentsResponse = {
  success: boolean;
  message?: string;
  documents?: MemberDocument[];
};

type ApprovalLetterResponse = {
  success: boolean;
  message?: string;
  approvalLetterUrl?: string;
  letterUrl?: string;
  fileUrl?: string;
  url?: string;
};

function safeText(value: unknown) {
  return String(value || "").trim();
}

function formatDate(dateValue: string | null) {
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
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getShortId(id?: string | null) {
  if (!id) return "-";
  return id.slice(-8).toUpperCase();
}

function getStatusClass(status: string) {
  const normalized = safeText(status).toLowerCase();

  if (normalized === "verified" || normalized === "approved") {
    return "border-emerald-500/20 bg-emerald-500/15 text-emerald-700";
  }

  if (normalized === "rejected") {
    return "border-red-500/20 bg-red-500/15 text-red-700";
  }

  return "border-orange-500/20 bg-orange-500/15 text-orange-700";
}

function getStatusLabel(status: string) {
  return safeText(status || "uploaded")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();
    console.error("NON_JSON_RESPONSE:", text.slice(0, 500));

    throw new Error(
      "API returned HTML instead of JSON. Check /api/documents route path."
    );
  }

  return response.json();
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  glow,
  badge,
  iconColor,
  iconBg,
  progress = 72,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  glow: string;
  badge: string;
  iconColor: string;
  iconBg: string;
  progress?: number;
}) {
  return (
    <Card className="group h-full overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_25px_90px_rgba(44,36,31,0.16)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-[#9b6f45]/45 hover:bg-[#fffaf3]">
      <CardContent className="relative flex h-full flex-col p-6">
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

        {/* Text Details Centered & Highlighted to match Dashboards */}
        <div className="relative mt-6 flex flex-col items-center text-center">
          <p className="text-sm font-semibold text-[#6b5e54]">
            {title}
          </p>

          <h2 className="mt-3 break-words text-5xl font-black tracking-tight text-[#2b241f] drop-shadow-sm">
            {value}
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#79695d]">
            {subtitle}
          </p>
        </div>

        <div className="relative mt-auto pt-6">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6b5e54]">
            <span>Live Status</span>
            <span className="text-[#9b6f45]">{progress}%</span>
          </div>

          <div className="mt-3 h-2 rounded-full bg-[#e9dccd]">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#2c241f] via-[#9b6f45] to-[#d8ad80]"
              style={{ width: `${Math.min(Math.max(progress, 6), 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<MemberDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortType, setSortType] = useState<SortType>("newest");
  const [openingId, setOpeningId] = useState<string | null>(null);

  async function loadDocuments(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setMessage("");

      const response = await fetch("/api/documents", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await readJsonResponse(response)) as DocumentsResponse;

      if (!result.success) {
        setDocuments([]);
        setMessage(result.message || "Failed to load documents.");
        return;
      }

      setDocuments(Array.isArray(result.documents) ? result.documents : []);
    } catch (error) {
      console.error("LOAD_DOCUMENTS_ERROR", error);
      setDocuments([]);
      setMessage(
        error instanceof Error ? error.message : "Failed to load documents."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleViewDocument(document: MemberDocument) {
    try {
      setOpeningId(document.id);

      if (!document.fileUrl) {
        alert("File URL not found.");
        return;
      }

      /*
        Admin Approval Letter fileUrl එක /api/... නම්,
        direct open කරන්නේ නැතුව API call කරලා real PDF URL එක open කරනවා.
      */
      if (document.fileUrl.startsWith("/api/")) {
        const response = await fetch(document.fileUrl, {
          method: "GET",
          cache: "no-store",
        });

        const data = (await response.json()) as ApprovalLetterResponse;

        if (!response.ok || !data.success) {
          alert(data.message || "Failed to load approval letter.");
          return;
        }

        const realFileUrl =
          data.approvalLetterUrl || data.letterUrl || data.fileUrl || data.url;

        if (!realFileUrl) {
          alert("Approval letter file URL not found.");
          return;
        }

        window.open(realFileUrl, "_blank", "noopener,noreferrer");
        return;
      }

      /*
        Normal uploaded document එකක් නම් direct open කරනවා.
      */
      window.open(document.fileUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("VIEW_DOCUMENT_ERROR", error);
      alert("Failed to open document.");
    } finally {
      setOpeningId(null);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDocuments(true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const filteredDocuments = useMemo(() => {
    const searchValue = searchTerm.toLowerCase().trim();

    const filtered = searchValue
      ? documents.filter((document) => {
          const searchableText = [
            document.id,
            document.loanId,
            document.grantId,
            document.documentType,
            document.title,
            document.originalName,
            document.status,
            document.applicantName,
            document.applicantEmployeeId,
            document.applicantNic,
            document.applicantPhone,
            document.loanType,
            document.loanStatus,
            getShortId(document.loanId),
            getShortId(document.id),
          ]
            .map((value) => safeText(value).toLowerCase())
            .join(" ");

          return searchableText.includes(searchValue);
        })
      : [...documents];

    filtered.sort((a, b) => {
      if (sortType === "oldest") {
        return (
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
        );
      }

      if (sortType === "employeeId") {
        return safeText(a.applicantEmployeeId).localeCompare(
          safeText(b.applicantEmployeeId)
        );
      }

      if (sortType === "name") {
        return safeText(a.applicantName).localeCompare(
          safeText(b.applicantName)
        );
      }

      if (sortType === "status") {
        return safeText(a.status).localeCompare(safeText(b.status));
      }

      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    });

    return filtered;
  }, [documents, searchTerm, sortType]);

  const totalCount = documents.length;

  const verifiedCount = documents.filter(
    (document) => document.status === "verified"
  ).length;

  const rejectedCount = documents.filter(
    (document) => document.status === "rejected"
  ).length;

  const pendingCount = documents.filter(
    (document) =>
      document.status === "uploaded" ||
      document.status === "pending_verification"
  ).length;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading documents...
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
              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
                Member Documents
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
                Document Center
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
                Search documents by applicant name, employee ID, loan ID,
                document type, NIC or status.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => void loadDocuments(true)}
              className="rounded-2xl bg-[#9b6f45] px-5 text-white shadow-lg shadow-[#9b6f45]/25 hover:bg-[#835c38]"
            >
              <RefreshCcw className="mr-2" size={17} />
              Refresh
            </Button>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm font-semibold text-red-700">
            {message}
          </div>
        )}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Documents"
            value={totalCount}
            subtitle="All uploaded documents"
            icon={FileText}
            glow="bg-[#d8ad80]/30"
            badge="Docs"
            iconColor="text-[#8a5f3c]"
            iconBg="bg-[#f1e5d8]"
            progress={100}
          />

          <StatCard
            title="Verified"
            value={verifiedCount}
            subtitle="Approved by officer"
            icon={CheckCircle2}
            glow="bg-emerald-500/18"
            badge="Verified"
            iconColor="text-emerald-700"
            iconBg="bg-emerald-500/10"
            progress={totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0}
          />

          <StatCard
            title="Pending"
            value={pendingCount}
            subtitle="Waiting verification"
            icon={Clock3}
            glow="bg-orange-500/18"
            badge="Pending"
            iconColor="text-orange-700"
            iconBg="bg-orange-500/10"
            progress={totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0}
          />

          <StatCard
            title="Rejected"
            value={rejectedCount}
            subtitle="Need correction"
            icon={XCircle}
            glow="bg-red-500/16"
            badge="Rejected"
            iconColor="text-red-700"
            iconBg="bg-red-500/10"
            progress={totalCount > 0 ? Math.round((rejectedCount / totalCount) * 100) : 0}
          />
        </section>

        <section className="relative">
          <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
            <CardContent className="relative p-6">
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/20 blur-3xl" />
              <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#9b6f45]/15 blur-3xl" />

              <div className="relative mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold">
                    Uploaded Documents
                  </h2>

                  <p className="mt-1 text-sm text-[#6b5e54]">
                    Applicant name and employee ID are shown under each document
                    for quick identification.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 md:flex-row xl:w-auto">
                  <div className="relative w-full md:w-[420px]">
                    <Search
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9b6f45]"
                    />

                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search name, employee ID, loan ID, NIC..."
                      className="h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/85 pl-11 text-[#2b241f] placeholder:text-[#8a7a6b] focus-visible:border-[#9b6f45] focus-visible:ring-[#9b6f45]/25"
                    />
                  </div>

                  <select
                    title="Sort documents"
                    aria-label="Sort documents"
                    value={sortType}
                    onChange={(event) =>
                      setSortType(event.target.value as SortType)
                    }
                    className="h-12 rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/85 px-4 text-sm font-bold text-[#2b241f] outline-none focus:border-[#9b6f45] focus:ring-2 focus:ring-[#9b6f45]/25"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="employeeId">Sort by Employee ID</option>
                    <option value="name">Sort by Name</option>
                    <option value="status">Sort by Status</option>
                  </select>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-[#d9c8b8] bg-[#efe3d6]/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1250px] text-left text-sm">
                    <thead className="bg-[#f8f1e8] text-xs uppercase tracking-wide text-[#6b5e54]">
                      <tr>
                        <th className="px-5 py-4">Document</th>
                        <th className="px-5 py-4">Applicant</th>
                        <th className="px-5 py-4">Loan</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">File Size</th>
                        <th className="px-5 py-4">Uploaded On</th>
                        <th className="px-5 py-4">Remark</th>
                        <th className="px-5 py-4 text-right">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#d9c8b8]">
                      {filteredDocuments.length === 0 ? (
                        <tr key="no-documents">
                          <td
                            colSpan={8}
                            className="px-5 py-10 text-center text-sm font-semibold text-[#6b5e54]"
                          >
                            No documents found.
                          </td>
                        </tr>
                      ) : (
                        filteredDocuments.map((document, index) => {
                          const linkedTo = document.loanId
                            ? "Loan Application"
                            : document.grantId
                              ? "Grant Application"
                              : "General";

                          return (
                            <tr
                              key={`${document.id || "document"}-${index}`}
                              className="bg-[#fbf7ef]/55 transition hover:bg-[#fffaf3]"
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c]">
                                    <UploadCloud size={19} />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="font-extrabold text-[#2b241f]">
                                      {document.title || "Document"}
                                    </p>

                                    <p className="mt-1 max-w-[260px] truncate text-xs text-[#79695d]">
                                      {document.originalName ||
                                        document.fileName}
                                    </p>

                                    <p className="mt-1 text-[11px] font-bold text-[#9b6f45]">
                                      Doc ID: {getShortId(document.id)}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <p className="font-extrabold text-[#2b241f]">
                                  {document.applicantName || "Unknown Member"}
                                </p>

                                <p className="mt-1 text-xs font-semibold text-[#79695d]">
                                  Emp ID:{" "}
                                  {document.applicantEmployeeId || "N/A"}
                                </p>

                                <p className="mt-1 text-xs text-[#79695d]">
                                  NIC: {document.applicantNic || "N/A"}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <p className="font-semibold text-[#2b241f]">
                                  {linkedTo}
                                </p>

                                <p className="mt-1 text-xs text-[#79695d]">
                                  Loan ID: {getShortId(document.loanId)}
                                </p>

                                <p className="mt-1 text-xs text-[#79695d]">
                                  Type: {document.loanType || "-"}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                    document.status
                                  )}`}
                                >
                                  {getStatusLabel(document.status)}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-[#6b5e54]">
                                {formatFileSize(document.size)}
                              </td>

                              <td className="px-5 py-4 text-[#79695d]">
                                {formatDate(document.createdAt)}
                              </td>

                              <td className="max-w-[220px] px-5 py-4 text-[#6b5e54]">
                                <span className="line-clamp-2">
                                  {document.remark || "-"}
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex justify-end">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={
                                      !document.fileUrl ||
                                      openingId === document.id
                                    }
                                    onClick={() =>
                                      void handleViewDocument(document)
                                    }
                                    className="rounded-xl border-[#d9c8b8] bg-[#f8f1e8] text-[#2b241f] hover:bg-[#fffaf3] disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {openingId === document.id ? (
                                      <>
                                        <Loader2
                                          size={15}
                                          className="mr-1 animate-spin"
                                        />
                                        Opening
                                      </>
                                    ) : (
                                      <>
                                        <Eye size={15} className="mr-1" />
                                        {document.fileUrl ? "View" : "No File"}
                                      </>
                                    )}
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
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <Card className="rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_24px_80px_rgba(44,36,31,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_90px_rgba(44,36,31,0.18)]">
            <CardContent className="p-6">
              <ShieldCheck className="text-[#8a5f3c]" size={28} />
              <h3 className="mt-5 text-xl font-extrabold">Easy Search</h3>
              <p className="mt-3 text-sm leading-7 text-[#6b5e54]">
                Search by applicant name, employee ID, loan ID, NIC or document
                status.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_24px_80px_rgba(44,36,31,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_90px_rgba(44,36,31,0.18)]">
            <CardContent className="p-6">
              <Clock3 className="text-orange-700" size={28} />
              <h3 className="mt-5 text-xl font-extrabold">
                Sorted Documents
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#6b5e54]">
                Sort records by newest, oldest, employee ID, name or status.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_24px_80px_rgba(44,36,31,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_90px_rgba(44,36,31,0.18)]">
            <CardContent className="p-6">
              <FileText className="text-emerald-700" size={28} />
              <h3 className="mt-5 text-xl font-extrabold">Applicant Linked</h3>
              <p className="mt-3 text-sm leading-7 text-[#6b5e54]">
                Each document is linked with the loan applicant and employee
                number.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}