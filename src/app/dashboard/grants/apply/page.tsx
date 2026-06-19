"use client";

import { useEffect, useState } from "react";

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  FileText,
  Gift,
  HeartPulse,
  Loader2,
  Phone,
  RefreshCcw,
  ShieldCheck,
  UploadCloud,
  User,
  UserRoundCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MemberInfo = {
  _id: string;
  fullName: string;
  email: string;
  employeeId?: string;
  phone?: string;
  department?: string;
  jobRole?: string;
};

type CurrentUserResponse = {
  success: boolean;
  message?: string;
  user?: MemberInfo;
};

type GrantApplyResponse = {
  success: boolean;
  message: string;
  grant?: {
    id: string;
    grantId: string;
    memberId: string;
    memberName: string;
    grantType: string;
    requestedAmount: number;
    status: string;
    priorityLevel: string;
  };
};

type FileKey =
  | "nicFront"
  | "nicBack"
  | "employeeProof"
  | "medicalDocument"
  | "educationDocument"
  | "deathCertificate"
  | "relationshipProof"
  | "disasterProof"
  | "hardshipProof"
  | "bankStatement";

type FileItem = {
  key: FileKey;
  label: string;
  description: string;
};

const commonDocuments: FileItem[] = [
  {
    key: "nicFront",
    label: "NIC Front",
    description: "Upload clear NIC front photo or PDF.",
  },
  {
    key: "nicBack",
    label: "NIC Back",
    description: "Upload clear NIC back photo or PDF.",
  },
  {
    key: "employeeProof",
    label: "Employee Proof",
    description: "Employee ID or employment confirmation document.",
  },
  {
    key: "bankStatement",
    label: "Bank Details / Statement",
    description: "Bank account proof or bank statement.",
  },
];

const grantSpecificDocuments: Record<string, FileItem[]> = {
  "Medical Grant": [
    {
      key: "medicalDocument",
      label: "Medical Document",
      description: "Medical report, bill, prescription or hospital proof.",
    },
  ],
  "Education Grant": [
    {
      key: "educationDocument",
      label: "Education Document",
      description: "Course invoice, school letter or education proof.",
    },
  ],
  "Funeral Support Grant": [
    {
      key: "deathCertificate",
      label: "Death Certificate",
      description: "Official death certificate or valid funeral proof.",
    },
    {
      key: "relationshipProof",
      label: "Relationship Proof",
      description: "Document proving relationship with deceased person.",
    },
  ],
  "Disaster Relief Grant": [
    {
      key: "disasterProof",
      label: "Disaster Proof",
      description: "Police report, GS certificate, damage proof or photos.",
    },
  ],
  "Hardship Grant": [
    {
      key: "hardshipProof",
      label: "Hardship Proof",
      description: "Letter, income proof or supporting hardship document.",
    },
  ],
};

const inputClass =
  "mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/85 text-[#2b241f] placeholder:text-[#8a7a6b] focus-visible:border-[#9b6f45] focus-visible:ring-[#9b6f45]/25";

const readonlyInputClass =
  "mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#efe3d6]/80 text-[#6b5e54]";

const selectClass =
  "mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/85 text-[#2b241f] focus:ring-[#9b6f45]/25";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function getPriorityText(grantType: string, amount: number) {
  if (grantType === "Funeral Support Grant") return "Emergency";
  if (grantType === "Disaster Relief Grant") return "Emergency";
  if (grantType === "Medical Grant") return "High";
  if (amount >= 100000) return "High";
  return "Normal";
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    await response.text();
    throw new Error(
      "API returned HTML instead of JSON. Check API route path."
    );
  }

  return response.json();
}

export default function GrantApplyPage() {
  const [member, setMember] = useState<MemberInfo | null>(null);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [emergencyPhoneNumber, setEmergencyPhoneNumber] = useState("");
  const [grantType, setGrantType] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [reason, setReason] = useState("");
  const [relationshipWithDeceased, setRelationshipWithDeceased] = useState("");

  const [files, setFiles] = useState<Record<FileKey, File | null>>({
    nicFront: null,
    nicBack: null,
    employeeProof: null,
    medicalDocument: null,
    educationDocument: null,
    deathCertificate: null,
    relationshipProof: null,
    disasterProof: null,
    hardshipProof: null,
    bankStatement: null,
  });

  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedGrant, setSubmittedGrant] =
    useState<GrantApplyResponse["grant"]>(undefined);

  const amount = Number(requestedAmount || 0);
  const priority = getPriorityText(grantType, amount);
  const isFuneralSupport = grantType === "Funeral Support Grant";

  const activeDocuments = [
    ...commonDocuments,
    ...(grantSpecificDocuments[grantType] || []),
  ];

  async function loadCurrentUser() {
    try {
      setPageLoading(true);

      const response = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await readJsonResponse(response)) as CurrentUserResponse;

      if (!result.success || !result.user) {
        setMessage(result.message || "Failed to load member details.");
        setIsSuccess(false);
        return;
      }

      setMember(result.user);
      setPhoneNumber(result.user.phone || "");
    } catch (error) {
      console.error("LOAD_CURRENT_USER_ERROR", error);
      setMessage("Failed to load member details.");
      setIsSuccess(false);
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCurrentUser();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  function handleFileChange(key: FileKey, file: File | null) {
    setFiles((prev) => ({
      ...prev,
      [key]: file,
    }));
  }

  function validateRequiredDocuments() {
    for (const item of activeDocuments) {
      if (!files[item.key]) {
        return `${item.label} is required.`;
      }
    }

    return "";
  }

  function resetForm() {
    setGrantType("");
    setRequestedAmount("");
    setReason("");
    setRelationshipWithDeceased("");
    setEmergencyPhoneNumber("");
    setSubmittedGrant(undefined);

    setFiles({
      nicFront: null,
      nicBack: null,
      employeeProof: null,
      medicalDocument: null,
      educationDocument: null,
      deathCertificate: null,
      relationshipProof: null,
      disasterProof: null,
      hardshipProof: null,
      bankStatement: null,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");
      setIsSuccess(false);
      setSubmittedGrant(undefined);

      if (
        !phoneNumber ||
        !emergencyPhoneNumber ||
        !grantType ||
        !requestedAmount ||
        !reason
      ) {
        setMessage("Please complete all required grant details.");
        setIsSuccess(false);
        return;
      }

      if (Number(requestedAmount) <= 0) {
        setMessage("Requested amount must be greater than zero.");
        setIsSuccess(false);
        return;
      }

      if (isFuneralSupport && !relationshipWithDeceased) {
        setMessage("Relationship with deceased person is required.");
        setIsSuccess(false);
        return;
      }

      const fileError = validateRequiredDocuments();

      if (fileError) {
        setMessage(fileError);
        setIsSuccess(false);
        return;
      }

      const formData = new FormData();

      formData.append("phoneNumber", phoneNumber);
      formData.append("emergencyPhoneNumber", emergencyPhoneNumber);
      formData.append("grantType", grantType);
      formData.append("requestedAmount", requestedAmount);
      formData.append("reason", reason);
      formData.append("relationshipWithDeceased", relationshipWithDeceased);

      for (const item of activeDocuments) {
        const file = files[item.key];

        if (file) {
          formData.append(item.key, file);
        }
      }

      const response = await fetch("/api/grants/apply", {
        method: "POST",
        body: formData,
      });

      const result = (await readJsonResponse(response)) as GrantApplyResponse;

      if (!result.success) {
        setMessage(result.message || "Failed to submit grant application.");
        setIsSuccess(false);
        return;
      }

      setMessage(result.message);
      setIsSuccess(true);
      setSubmittedGrant(result.grant);
      resetForm();

      if (member?.phone) {
        setPhoneNumber(member.phone);
      }
    } catch (error) {
      console.error("GRANT_SUBMIT_ERROR", error);
      setMessage("Something went wrong while submitting grant application.");
      setIsSuccess(false);
    } finally {
      setSubmitting(false);
    }
  }

  function FileUploadCard({ item }: { item: FileItem }) {
    const selectedFile = files[item.key];

    return (
      <div className="flex h-full flex-col justify-between rounded-[24px] border border-[#d9c8b8] bg-[#f8f1e8]/80 p-4 transition hover:border-[#9b6f45]/45 hover:bg-[#fffaf3]">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
              selectedFile
                ? "border-emerald-300/25 bg-emerald-500/20 text-emerald-700"
                : "border-orange-300/20 bg-orange-500/15 text-orange-700"
            }`}
          >
            {selectedFile ? <BadgeCheck size={20} /> : <UploadCloud size={20} />}
          </div>

          <div className="min-w-0">
            <Label className="text-sm font-extrabold text-[#2b241f]">
              {item.label}
            </Label>
            <p className="mt-1 min-h-[36px] text-xs leading-5 text-[#79695d]">
              {item.description}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <Input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(event) =>
              handleFileChange(item.key, event.target.files?.[0] || null)
            }
            className="h-12 cursor-pointer rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/85 text-sm text-[#2b241f] file:mr-4 file:h-9 file:rounded-xl file:border-0 file:bg-[#9b6f45] file:px-4 file:text-sm file:font-bold file:text-white hover:file:bg-[#835c38]"
          />

          {selectedFile ? (
            <p className="truncate text-xs font-semibold text-emerald-700">
              Selected: {selectedFile.name}
            </p>
          ) : (
            <p className="text-xs text-[#8a7a6b]">JPG, PNG or PDF accepted</p>
          )}
        </div>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading grant application...
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
                Member Grant Application
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
                Apply for Welfare Grant
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b5e54]">
                Submit medical, education, disaster, hardship or funeral support
                grant requests with required documents.
              </p>
            </div>

            <div className="rounded-[26px] border border-[#d9c8b8] bg-[#f8f1e8]/80 p-4 shadow-[0_18px_55px_rgba(44,36,31,0.10)]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c]">
                  <ShieldCheck size={23} />
                </div>

                <div>
                  <p className="text-sm font-extrabold text-[#2b241f]">
                    Auto Member Details
                  </p>
                  <p className="text-xs font-semibold text-[#6b5e54]">
                    Grant ID generated after submit
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit}>
          <section className="relative grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-6">
              <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
                <CardContent className="relative p-6">
                  <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/20 blur-3xl" />

                  <div className="relative mb-7 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c] shadow-[0_14px_38px_rgba(44,36,31,0.12)]">
                      <UserRoundCheck size={26} />
                    </div>

                    <div>
                      <h2 className="text-2xl font-extrabold">
                        Member Details
                      </h2>
                      <p className="mt-1 text-sm text-[#6b5e54]">
                        Member ID and name are loaded automatically from your
                        account.
                      </p>
                    </div>
                  </div>

                  <div className="relative grid gap-5 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-bold text-[#2b241f]">
                        Grant ID
                      </Label>
                      <Input
                        value={submittedGrant?.grantId || "Auto generated"}
                        readOnly
                        className={readonlyInputClass}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-bold text-[#2b241f]">
                        Member ID
                      </Label>
                      <Input
                        value={
                          member?.employeeId ||
                          (member?._id
                            ? `MEM-${member._id.slice(-6).toUpperCase()}`
                            : "")
                        }
                        readOnly
                        className={readonlyInputClass}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-bold text-[#2b241f]">
                        Member Name
                      </Label>
                      <Input
                        value={member?.fullName || ""}
                        readOnly
                        className={readonlyInputClass}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-bold text-[#2b241f]">
                        Email
                      </Label>
                      <Input
                        value={member?.email || ""}
                        readOnly
                        className={readonlyInputClass}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-bold text-[#2b241f]">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Phone
                          size={18}
                          className="pointer-events-none absolute left-4 top-[22px] text-[#9b6f45]"
                        />
                        <Input
                          value={phoneNumber}
                          onChange={(event) =>
                            setPhoneNumber(event.target.value)
                          }
                          placeholder="Enter phone number"
                          className={`${inputClass} pl-11`}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-bold text-[#2b241f]">
                        Emergency Phone Number
                      </Label>
                      <div className="relative">
                        <Phone
                          size={18}
                          className="pointer-events-none absolute left-4 top-[22px] text-[#9b6f45]"
                        />
                        <Input
                          value={emergencyPhoneNumber}
                          onChange={(event) =>
                            setEmergencyPhoneNumber(event.target.value)
                          }
                          placeholder="Enter emergency contact number"
                          className={`${inputClass} pl-11`}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
                <CardContent className="relative p-6">
                  <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/25 blur-3xl" />

                  <div className="relative mb-7 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c] shadow-[0_14px_38px_rgba(44,36,31,0.12)]">
                      <Gift size={26} />
                    </div>

                    <div>
                      <h2 className="text-2xl font-extrabold">
                        Grant Details
                      </h2>
                      <p className="mt-1 text-sm text-[#6b5e54]">
                        Select the grant type and explain your requirement.
                      </p>
                    </div>
                  </div>

                  <div className="relative grid gap-5 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-bold text-[#2b241f]">
                        Grant Type
                      </Label>
                      <Select
                        value={grantType}
                        onValueChange={(value) => {
                          setGrantType(value);
                          setRelationshipWithDeceased("");
                          setMessage("");
                          setSubmittedGrant(undefined);
                        }}
                      >
                        <SelectTrigger className={selectClass}>
                          <SelectValue placeholder="Select grant type" />
                        </SelectTrigger>

                        <SelectContent className="border-[#d9c8b8] bg-[#fbf7ef] text-[#2b241f]">
                          <SelectItem value="Medical Grant">
                            Medical Grant
                          </SelectItem>
                          <SelectItem value="Education Grant">
                            Education Grant
                          </SelectItem>
                          <SelectItem value="Funeral Support Grant">
                            Funeral Support Grant
                          </SelectItem>
                          <SelectItem value="Disaster Relief Grant">
                            Disaster Relief Grant
                          </SelectItem>
                          <SelectItem value="Hardship Grant">
                            Hardship Grant
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-bold text-[#2b241f]">
                        Requested Amount
                      </Label>
                      <div className="relative">
                        <Banknote
                          size={18}
                          className="pointer-events-none absolute left-4 top-[22px] text-[#9b6f45]"
                        />
                        <Input
                          type="number"
                          min="1"
                          value={requestedAmount}
                          onChange={(event) =>
                            setRequestedAmount(event.target.value)
                          }
                          placeholder="Enter requested amount"
                          className={`${inputClass} pl-11`}
                        />
                      </div>
                    </div>

                    {isFuneralSupport && (
                      <div className="md:col-span-2">
                        <Label className="text-sm font-bold text-[#2b241f]">
                          Relationship With Deceased Person
                        </Label>
                        <Input
                          value={relationshipWithDeceased}
                          onChange={(event) =>
                            setRelationshipWithDeceased(event.target.value)
                          }
                          placeholder="Example: Father, Mother, Spouse"
                          className={inputClass}
                        />
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <Label className="text-sm font-bold text-[#2b241f]">
                        Grant Reason
                      </Label>

                      <div className="relative">
                        <FileText
                          size={18}
                          className="pointer-events-none absolute left-4 top-6 text-[#9b6f45]"
                        />
                        <textarea
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                          placeholder="Explain your grant requirement..."
                          className="mt-2 min-h-[130px] w-full resize-none rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/85 px-4 py-4 pl-11 text-sm text-[#2b241f] outline-none placeholder:text-[#8a7a6b] focus:border-[#9b6f45] focus:ring-2 focus:ring-[#9b6f45]/25"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
                <CardContent className="relative p-6">
                  <div className="relative mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#8a5f3c] shadow-[0_14px_38px_rgba(44,36,31,0.12)]">
                        <UploadCloud size={26} />
                      </div>

                      <div>
                        <h2 className="text-2xl font-extrabold">
                          Required Documents
                        </h2>
                        <p className="mt-1 text-sm text-[#6b5e54]">
                          Required documents change based on selected grant
                          type.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/80 px-4 py-3 text-sm font-bold text-[#9b6f45]">
                      {activeDocuments.filter((item) => files[item.key]).length}
                      /{activeDocuments.length} Uploaded
                    </div>
                  </div>

                  {grantType ? (
                    <div className="grid auto-rows-fr gap-5 md:grid-cols-2">
                      {activeDocuments.map((item) => (
                        <FileUploadCard key={item.key} item={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-orange-500/20 bg-orange-500/10 p-5 text-sm font-semibold text-orange-700">
                      Please select a grant type to view required documents.
                    </div>
                  )}
                </CardContent>
              </Card>

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

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-14 flex-1 rounded-2xl bg-[#9b6f45] text-base font-extrabold text-white shadow-lg shadow-[#9b6f45]/25 hover:bg-[#835c38] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" />
                      Submitting Grant Request...
                    </>
                  ) : (
                    <>
                      Submit Grant Request
                      <ArrowRight className="ml-2" size={18} />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="h-14 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8] px-7 text-sm font-extrabold text-[#2b241f] hover:bg-[#fffaf3]"
                >
                  <RefreshCcw className="mr-2" size={17} />
                  Reset
                </Button>
              </div>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-24">
              <Card className="overflow-hidden rounded-[32px] border border-[#3c332d] bg-gradient-to-br from-[#2c241f] via-[#3a3029] to-[#211b17] text-white shadow-[0_30px_100px_rgba(44,36,31,0.28)] backdrop-blur-2xl">
                <CardContent className="relative p-6">
                  <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/25 blur-3xl" />

                  <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d8ad80]/25 bg-[#d8ad80]/10 text-[#d8ad80]">
                    <HeartPulse size={27} />
                  </div>

                  <p className="relative text-sm text-[#ead9c8]/70">
                    Estimated Priority Level
                  </p>

                  <h2 className="relative mt-3 text-4xl font-extrabold text-white">
                    {priority}
                  </h2>

                  <p className="relative mt-3 text-sm leading-6 text-[#ead9c8]/70">
                    Priority is estimated based on grant type and requested
                    amount.
                  </p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
                <CardContent className="p-6">
                  <p className="text-sm text-[#6b5e54]">Requested Amount</p>

                  <h2 className="mt-3 text-3xl font-extrabold">
                    {formatCurrency(amount)}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#6b5e54]">
                    Grants are non-repayable welfare support requests, subject
                    to officer and admin approval.
                  </p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/15 text-orange-700">
                    <AlertTriangle size={24} />
                  </div>

                  <h3 className="text-xl font-extrabold">Important Notes</h3>

                  <div className="mt-4 space-y-3 text-sm leading-6 text-[#6b5e54]">
                    <p>• Grant ID is generated after successful submission.</p>
                    <p>• Member ID and name are taken from login account.</p>
                    <p>• False documents may cause application rejection.</p>
                    <p>• Officer review is required before admin approval.</p>
                  </div>
                </CardContent>
              </Card>

              {submittedGrant && (
                <Card className="overflow-hidden rounded-[32px] border border-emerald-500/25 bg-emerald-500/10 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-extrabold text-emerald-700">
                      Grant Submitted
                    </h2>

                    <div className="mt-4 space-y-2 text-sm text-[#6b5e54]">
                      <p>
                        Grant ID:{" "}
                        <span className="font-bold text-[#2b241f]">
                          {submittedGrant.grantId}
                        </span>
                      </p>
                      <p>
                        Member ID:{" "}
                        <span className="font-bold text-[#2b241f]">
                          {submittedGrant.memberId}
                        </span>
                      </p>
                      <p>
                        Type:{" "}
                        <span className="font-bold text-[#2b241f]">
                          {submittedGrant.grantType}
                        </span>
                      </p>
                      <p>
                        Amount:{" "}
                        <span className="font-bold text-[#2b241f]">
                          {formatCurrency(submittedGrant.requestedAmount)}
                        </span>
                      </p>
                      <p>
                        Status:{" "}
                        <span className="font-bold text-orange-700">
                          {submittedGrant.status.replaceAll("_", " ")}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </aside>
          </section>
        </form>
      </div>
    </div>
  );
}