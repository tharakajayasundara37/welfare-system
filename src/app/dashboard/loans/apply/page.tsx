"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  BadgeDollarSign,
  CalendarClock,
  CheckCircle2,
  FileUp,
  Gift,
  Landmark,
  Loader2,
  ShieldCheck,
  UploadCloud,
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

type FileKey =
  | "nicFront"
  | "nicBack"
  | "employeeProof"
  | "salarySlip"
  | "bankStatement"
  | "guarantorNicFront"
  | "guarantorNicBack"
  | "guarantorConsentLetter"
  | "loanPurposeProof"
  | "deathCertificate"
  | "relationshipProof"
  | "funeralExpenseProof";

interface LoanSettings {
  interestRate: number;
  minimumLoanAmount: number;
  maximumLoanAmount: number;
  funeralSupportMaxAmount: number;
  allowedRepaymentPeriods: number[];
  latePaymentPenaltyRate: number;
  monthlyFeeAmount: number;
}

interface LoanSettingsResponse {
  success: boolean;
  message?: string;
  settings?: LoanSettings;
}

interface LoanResult {
  requestedAmount: number;
  approvedAmount: number;
  systemInterestRate: number;
  recommendedPeriodMonths: number;
  preferredPeriodMonths: number;
  approvedPeriodMonths: number;
  monthlyInstallment: number;
  totalRepayment: number;
  riskLevel: string;
  eligibilityStatus: string;
  status: string;
}

interface LoanApplyResponse {
  success: boolean;
  message: string;
  loan?: LoanResult;
}

interface FileLabelItem {
  key: FileKey;
  label: string;
  description: string;
}

type GuarantorDetails = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  nic: string;
  employeeId: string;
  department: string;
  jobRole: string;
};

type GuarantorLookupResponse = {
  success: boolean;
  message?: string;
  guarantor?: GuarantorDetails;
};

const defaultLoanSettings: LoanSettings = {
  interestRate: 12,
  minimumLoanAmount: 10000,
  maximumLoanAmount: 500000,
  funeralSupportMaxAmount: 100000,
  allowedRepaymentPeriods: [6, 12, 18, 24, 30, 36, 42, 48, 54],
  latePaymentPenaltyRate: 2,
  monthlyFeeAmount: 1000,
};

const normalLoanFileLabels: FileLabelItem[] = [
  {
    key: "nicFront",
    label: "NIC Front Photo",
    description: "Clear photo or PDF of member NIC front side",
  },
  {
    key: "nicBack",
    label: "NIC Back Photo",
    description: "Clear photo or PDF of member NIC back side",
  },
  {
    key: "employeeProof",
    label: "Employee ID / Employment Proof",
    description: "Employee ID, appointment letter, or employment proof",
  },
  {
    key: "salarySlip",
    label: "Latest Salary Slip",
    description: "Recent salary slip or paysheet",
  },
  {
    key: "bankStatement",
    label: "Bank Statement",
    description: "Salary account statement or bank statement",
  },
  {
    key: "guarantorNicFront",
    label: "Guarantor NIC Front",
    description: "Clear photo or PDF of guarantor NIC front side",
  },
  {
    key: "guarantorNicBack",
    label: "Guarantor NIC Back",
    description: "Clear photo or PDF of guarantor NIC back side",
  },
  {
    key: "guarantorConsentLetter",
    label: "Guarantor Consent Letter",
    description: "Signed consent letter from guarantor",
  },
  {
    key: "loanPurposeProof",
    label: "Loan Purpose Proof",
    description: "Medical bill, emergency proof, education invoice, etc.",
  },
];

const funeralSupportFileLabels: FileLabelItem[] = [
  {
    key: "nicFront",
    label: "NIC Front Photo",
    description: "Clear photo or PDF of member NIC front side",
  },
  {
    key: "nicBack",
    label: "NIC Back Photo",
    description: "Clear photo or PDF of member NIC back side",
  },
  {
    key: "employeeProof",
    label: "Employee ID / Employment Proof",
    description: "Employee ID, appointment letter, or employment proof",
  },
  {
    key: "deathCertificate",
    label: "Death Certificate / Funeral Proof",
    description: "Official death certificate or valid funeral proof document",
  },
  {
    key: "relationshipProof",
    label: "Relationship Proof",
    description: "Document proving relationship with the deceased person",
  },
  {
    key: "funeralExpenseProof",
    label: "Funeral Expense Bill / Receipt",
    description: "Funeral expense bill, receipt, or payment proof",
  },
  {
    key: "bankStatement",
    label: "Bank Details / Bank Statement",
    description: "Bank account proof for support payment disbursement",
  },
];

const inputClassName =
  "mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/85 text-[#2b241f] placeholder:text-[#8a7a6b] focus-visible:border-[#9b6f45] focus-visible:ring-[#9b6f45]/25";

const readonlyInputClassName =
  "mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#efe3d6]/80 text-[#6b5e54] placeholder:text-[#8a7a6b]";

const selectTriggerClassName =
  "mt-2 h-12 rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/85 text-[#2b241f] focus:ring-[#9b6f45]/25 disabled:cursor-not-allowed disabled:opacity-60";

function getRecommendedPeriod(amount: number) {
  if (amount <= 50000) return 6;
  if (amount <= 100000) return 12;
  if (amount <= 250000) return 24;
  return 36;
}

function calculateRiskLevel(
  requestedAmount: number,
  monthlyIncome: number,
  employmentType: string,
  isFuneralSupport: boolean
) {
  if (isFuneralSupport) {
    return "Support Grant";
  }

  if (!requestedAmount || !monthlyIncome || !employmentType) {
    return "Not calculated";
  }

  if (employmentType !== "Permanent") {
    return "High";
  }

  if (requestedAmount > monthlyIncome * 6) {
    return "High";
  }

  if (requestedAmount > monthlyIncome * 3) {
    return "Medium";
  }

  return "Low";
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();
    console.error("NON_JSON_RESPONSE:", text.slice(0, 500));
    throw new Error("API returned non JSON response");
  }

  return response.json();
}

export default function ApplyLoanPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const guarantorLookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [loanSettings, setLoanSettings] =
    useState<LoanSettings>(defaultLoanSettings);

  const [settingsLoading, setSettingsLoading] = useState(true);

  const [loanType, setLoanType] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [preferredPeriodMonths, setPreferredPeriodMonths] = useState("12");
  const [purpose, setPurpose] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [employmentType, setEmploymentType] = useState("");

  const [guarantorEmployeeId, setGuarantorEmployeeId] = useState("");
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [guarantorNic, setGuarantorNic] = useState("");
  const [selectedGuarantor, setSelectedGuarantor] =
    useState<GuarantorDetails | null>(null);
  const [guarantorLoading, setGuarantorLoading] = useState(false);

  const [files, setFiles] = useState<Record<FileKey, File | null>>({
    nicFront: null,
    nicBack: null,
    employeeProof: null,
    salarySlip: null,
    bankStatement: null,
    guarantorNicFront: null,
    guarantorNicBack: null,
    guarantorConsentLetter: null,
    loanPurposeProof: null,
    deathCertificate: null,
    relationshipProof: null,
    funeralExpenseProof: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loanResult, setLoanResult] = useState<LoanResult | null>(null);

  const isFuneralSupport = loanType === "Funeral Support Loan";

  const activeFileLabels = isFuneralSupport
    ? funeralSupportFileLabels
    : normalLoanFileLabels;

  const maxAllowedAmount = isFuneralSupport
    ? loanSettings.funeralSupportMaxAmount
    : loanSettings.maximumLoanAmount;

  useEffect(() => {
    async function loadLoanSettings() {
      try {
        setSettingsLoading(true);

        const response = await fetch("/api/loans/settings", {
          method: "GET",
          cache: "no-store",
        });

        const result =
          (await readJsonResponse(response)) as LoanSettingsResponse;

        if (!result.success || !result.settings) {
          setIsSuccess(false);
          setMessage(result.message || "Failed to load loan settings");
          return;
        }

        const loadedSettings: LoanSettings = {
          interestRate: result.settings.interestRate ?? 12,
          minimumLoanAmount: result.settings.minimumLoanAmount ?? 10000,
          maximumLoanAmount: result.settings.maximumLoanAmount ?? 500000,
          funeralSupportMaxAmount:
            result.settings.funeralSupportMaxAmount ?? 100000,
          allowedRepaymentPeriods:
            result.settings.allowedRepaymentPeriods?.length > 0
              ? result.settings.allowedRepaymentPeriods
              : [6, 12, 18, 24, 30, 36, 42, 48, 54],
          latePaymentPenaltyRate: result.settings.latePaymentPenaltyRate ?? 2,
          monthlyFeeAmount: result.settings.monthlyFeeAmount ?? 1000,
        };

        setLoanSettings(loadedSettings);

        if (
          preferredPeriodMonths !== "0" &&
          !loadedSettings.allowedRepaymentPeriods.includes(
            Number(preferredPeriodMonths)
          )
        ) {
          setPreferredPeriodMonths(
            String(loadedSettings.allowedRepaymentPeriods[0] || 12)
          );
        }
      } catch (error) {
        console.error("LOAD_LOAN_SETTINGS_ERROR", error);
        setIsSuccess(false);
        setMessage("Failed to load loan settings. Default values are used.");
      } finally {
        setSettingsLoading(false);
      }
    }

    const timer = window.setTimeout(() => {
      void loadLoanSettings();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const preview = useMemo(() => {
    const amount = Number(requestedAmount);
    const income = Number(monthlyIncome);
    const selectedPeriod = Number(preferredPeriodMonths);

    if (isFuneralSupport) {
      return {
        recommendedPeriod: 0,
        selectedPeriod: 0,
        monthlyInstallment: 0,
        totalRepayment: 0,
        riskLevel: "Support Grant",
      };
    }

    if (!amount || !selectedPeriod) {
      return {
        recommendedPeriod: 0,
        selectedPeriod,
        monthlyInstallment: 0,
        totalRepayment: 0,
        riskLevel: "Not calculated",
      };
    }

    const interestRate = loanSettings.interestRate;
    const recommendedPeriod = getRecommendedPeriod(amount);
    const monthlyInterestRate = interestRate / 100 / 12;

    let monthlyInstallment = 0;
    let totalRepayment = 0;

    if (monthlyInterestRate === 0) {
      monthlyInstallment = Number((amount / selectedPeriod).toFixed(2));
      totalRepayment = Number(
        (monthlyInstallment * selectedPeriod).toFixed(2)
      );
    } else {
      const emi =
        (amount *
          monthlyInterestRate *
          Math.pow(1 + monthlyInterestRate, selectedPeriod)) /
        (Math.pow(1 + monthlyInterestRate, selectedPeriod) - 1);

      monthlyInstallment = Number(emi.toFixed(2));
      totalRepayment = Number(
        (monthlyInstallment * selectedPeriod).toFixed(2)
      );
    }

    return {
      recommendedPeriod,
      selectedPeriod,
      monthlyInstallment,
      totalRepayment,
      riskLevel: calculateRiskLevel(
        amount,
        income,
        employmentType,
        isFuneralSupport
      ),
    };
  }, [
    requestedAmount,
    monthlyIncome,
    employmentType,
    preferredPeriodMonths,
    loanSettings.interestRate,
    isFuneralSupport,
  ]);

  async function fetchGuarantor(employeeId: string) {
    try {
      setGuarantorLoading(true);

      const response = await fetch(
        `/api/guarantors/lookup?employeeId=${encodeURIComponent(employeeId)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = (await readJsonResponse(
        response
      )) as GuarantorLookupResponse;

      if (!result.success || !result.guarantor) {
        setSelectedGuarantor(null);
        setGuarantorName("");
        setGuarantorPhone("");
        setGuarantorNic("");
        setIsSuccess(false);
        setMessage(result.message || "Guarantor not found.");
        return;
      }

      setSelectedGuarantor(result.guarantor);
      setGuarantorName(result.guarantor.fullName);
      setGuarantorPhone(result.guarantor.phone);
      setGuarantorNic(result.guarantor.nic);

      setIsSuccess(true);
      setMessage("Guarantor details auto filled successfully.");
    } catch (error) {
      console.error("LOOKUP_GUARANTOR_ERROR", error);
      setSelectedGuarantor(null);
      setGuarantorName("");
      setGuarantorPhone("");
      setGuarantorNic("");
      setIsSuccess(false);
      setMessage("Failed to auto fill guarantor details.");
    } finally {
      setGuarantorLoading(false);
    }
  }

  function handleGuarantorEmployeeIdChange(value: string) {
    setGuarantorEmployeeId(value);
    setSelectedGuarantor(null);
    setGuarantorName("");
    setGuarantorPhone("");
    setGuarantorNic("");
    setMessage("");
    setIsSuccess(false);

    if (guarantorLookupTimerRef.current) {
      clearTimeout(guarantorLookupTimerRef.current);
    }

    const employeeId = value.trim();

    if (employeeId.length < 2) {
      return;
    }

    guarantorLookupTimerRef.current = setTimeout(() => {
      void fetchGuarantor(employeeId);
    }, 450);
  }

  const handleLoanTypeChange = (value: string) => {
    setLoanType(value);
    setMessage("");
    setLoanResult(null);

    if (value === "Funeral Support Loan") {
      setPreferredPeriodMonths("0");
      setGuarantorEmployeeId("");
      setSelectedGuarantor(null);
      setGuarantorName("");
      setGuarantorPhone("");
      setGuarantorNic("");
      return;
    }

    if (preferredPeriodMonths === "0") {
      setPreferredPeriodMonths(
        String(loanSettings.allowedRepaymentPeriods[0] || 12)
      );
    }
  };

  const handleFileChange = (key: FileKey, file: File | null) => {
    setFiles((prev) => ({
      ...prev,
      [key]: file,
    }));
  };

  const validateFiles = () => {
    for (const item of activeFileLabels) {
      if (!files[item.key]) {
        return `${item.label} is required`;
      }
    }
    return "";
  };

  const validateLoanAmount = () => {
    const amount = Number(requestedAmount);

    if (!amount) {
      return "Requested amount is required";
    }

    if (amount < loanSettings.minimumLoanAmount) {
      return `Minimum amount is LKR ${loanSettings.minimumLoanAmount.toLocaleString()}`;
    }

    if (amount > maxAllowedAmount) {
      return isFuneralSupport
        ? `Maximum Funeral Support amount is LKR ${maxAllowedAmount.toLocaleString()}`
        : `Maximum loan amount is LKR ${maxAllowedAmount.toLocaleString()}`;
    }

    return "";
  };

  const resetForm = () => {
    setLoanType("");
    setRequestedAmount("");
    setPreferredPeriodMonths(
      String(loanSettings.allowedRepaymentPeriods[0] || 12)
    );
    setPurpose("");
    setMonthlyIncome("");
    setEmploymentType("");

    setGuarantorEmployeeId("");
    setSelectedGuarantor(null);
    setGuarantorName("");
    setGuarantorPhone("");
    setGuarantorNic("");

    setFiles({
      nicFront: null,
      nicBack: null,
      employeeProof: null,
      salarySlip: null,
      bankStatement: null,
      guarantorNicFront: null,
      guarantorNicBack: null,
      guarantorConsentLetter: null,
      loanPurposeProof: null,
      deathCertificate: null,
      relationshipProof: null,
      funeralExpenseProof: null,
    });

    formRef.current?.reset();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setLoanResult(null);

      if (
        !loanType ||
        !requestedAmount ||
        !purpose ||
        !monthlyIncome ||
        !employmentType
      ) {
        setIsSuccess(false);
        setMessage("Please complete all loan/support details.");
        return;
      }

      if (
        !isFuneralSupport &&
        (!guarantorEmployeeId ||
          !selectedGuarantor ||
          !guarantorName ||
          !guarantorPhone ||
          !guarantorNic)
      ) {
        setIsSuccess(false);
        setMessage(
          "Please enter a valid guarantor Employee ID. Guarantor must be a registered active member."
        );
        return;
      }

      const amountError = validateLoanAmount();
      if (amountError) {
        setIsSuccess(false);
        setMessage(amountError);
        return;
      }

      if (
        !isFuneralSupport &&
        !loanSettings.allowedRepaymentPeriods.includes(
          Number(preferredPeriodMonths)
        )
      ) {
        setIsSuccess(false);
        setMessage("Invalid repayment period selected.");
        return;
      }

      const fileError = validateFiles();
      if (fileError) {
        setIsSuccess(false);
        setMessage(fileError);
        return;
      }

      const formData = new FormData();

      formData.append("loanType", loanType);
      formData.append("requestedAmount", requestedAmount);
      formData.append(
        "preferredPeriodMonths",
        isFuneralSupport ? "0" : preferredPeriodMonths
      );
      formData.append("purpose", purpose);
      formData.append("monthlyIncome", monthlyIncome);
      formData.append("employmentType", employmentType);

      formData.append(
        "guarantorId",
        isFuneralSupport ? "N/A" : selectedGuarantor?.id || ""
      );
      formData.append(
        "guarantorEmployeeId",
        isFuneralSupport ? "N/A" : guarantorEmployeeId
      );
      formData.append(
        "guarantorName",
        isFuneralSupport ? "N/A" : guarantorName
      );
      formData.append(
        "guarantorPhone",
        isFuneralSupport ? "N/A" : guarantorPhone
      );
      formData.append("guarantorNic", isFuneralSupport ? "N/A" : guarantorNic);

      formData.append(
        "supportType",
        isFuneralSupport ? "non_repayable_grant" : "repayable_loan"
      );
      formData.append("isRepayable", String(!isFuneralSupport));

      formData.append(
        "systemInterestRate",
        isFuneralSupport ? "0" : String(loanSettings.interestRate)
      );
      formData.append(
        "monthlyInstallment",
        isFuneralSupport ? "0" : String(preview.monthlyInstallment)
      );
      formData.append(
        "totalRepayment",
        isFuneralSupport ? "0" : String(preview.totalRepayment)
      );

      for (const item of activeFileLabels) {
        const file = files[item.key];
        if (file) {
          formData.append(item.key, file);
        }
      }

      const response = await fetch("/api/loans/apply", {
        method: "POST",
        body: formData,
      });

      const result = (await readJsonResponse(response)) as LoanApplyResponse;

      if (!result.success) {
        setIsSuccess(false);
        setMessage(result.message || "Failed to submit loan application.");
        return;
      }

      setIsSuccess(true);
      setMessage(result.message);
      setLoanResult(result.loan || null);
      resetForm();
    } catch (error) {
      console.error("LOAN_FORM_ERROR", error);
      setIsSuccess(false);
      setMessage("Something went wrong while submitting loan application.");
    } finally {
      setLoading(false);
    }
  };

  const FileUploadCard = ({ item }: { item: FileLabelItem }) => {
    const selectedFile = files[item.key];

    return (
      <div className="flex h-full flex-col justify-between rounded-[24px] border border-[#d9c8b8] bg-[#f8f1e8]/80 p-4 transition hover:border-[#9b6f45]/45 hover:bg-[#fffaf3]">
        <div>
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                selectedFile
                  ? "border-emerald-300/25 bg-emerald-500/20 text-emerald-700"
                  : "border-orange-300/20 bg-orange-500/15 text-orange-700"
              }`}
            >
              {selectedFile ? (
                <CheckCircle2 size={20} />
              ) : (
                <UploadCloud size={20} />
              )}
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
        </div>

        <div className="mt-4 space-y-3">
          <Input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              handleFileChange(item.key, file);
            }}
            className="h-12 cursor-pointer rounded-2xl border-[#d9c8b8] bg-[#f8f1e8]/85 text-sm text-[#2b241f] file:mr-4 file:h-9 file:rounded-xl file:border-0 file:bg-[#9b6f45] file:px-4 file:text-sm file:font-bold file:text-white hover:file:bg-[#835c38]"
          />

          <div className="flex min-h-[24px] items-center">
            {selectedFile ? (
              <p className="max-w-full truncate text-xs font-semibold text-emerald-700">
                Selected: {selectedFile.name}
              </p>
            ) : (
              <p className="text-xs text-[#8a7a6b]">
                JPG, PNG or PDF accepted
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (settingsLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-[#2b241f]">
        <Loader2 className="mr-2 animate-spin text-[#9b6f45]" />
        Loading loan settings...
      </div>
    );
  }

  return (
    <div className="relative min-h-full space-y-6 overflow-hidden bg-[#eee6da] text-[#2b241f]">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-[#c99b69]/25 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-20 h-[480px] w-[480px] rounded-full bg-[#d8ad80]/25 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[360px] w-[360px] rounded-full bg-[#9b6f45]/15 blur-[130px]" />

      <section className="relative overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 p-6 shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl transition-all duration-300 hover:border-[#9b6f45]/45 hover:bg-[#fffaf3] md:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d8ad80]/25 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#9b6f45]">
              Welfare
            </p>

            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#2b241f] md:text-5xl">
              Apply for Loan
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6b5e54]">
              Submit your loan request or funeral support request with required
              verification documents.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
            <div className="rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/80 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#79695d]">
                Min Amount
              </p>
              <p className="mt-1 text-lg font-extrabold text-[#2b241f]">
                LKR {loanSettings.minimumLoanAmount.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/80 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#79695d]">
                Max Amount
              </p>
              <p className="mt-1 text-lg font-extrabold text-[#9b6f45]">
                LKR {maxAllowedAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </section>

      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="relative grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_410px]">
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
              <CardContent className="relative p-5 md:p-6">
                <div className="relative mb-6 flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#f1e5d8] text-[#9b6f45] shadow-lg shadow-[#9b6f45]/10">
                    <Landmark size={22} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold text-[#2b241f]">
                      Loan / Support Details
                    </h2>
                    <p className="text-sm leading-6 text-[#6b5e54]">
                      Select loan type and enter financial details.
                    </p>
                  </div>
                </div>

                <div className="relative grid gap-5 md:grid-cols-2">
                  <div>
                    <Label className="text-[#2b241f]">Loan Type</Label>

                    <Select
                      value={loanType}
                      onValueChange={handleLoanTypeChange}
                    >
                      <SelectTrigger className={selectTriggerClassName}>
                        <SelectValue placeholder="Select loan type" />
                      </SelectTrigger>

                      <SelectContent className="border-[#d9c8b8] bg-[#fbf7ef] text-[#2b241f]">
                        <SelectItem value="Personal Loan">
                          Personal Loan
                        </SelectItem>
                        <SelectItem value="Emergency Loan">
                          Emergency Loan
                        </SelectItem>
                        <SelectItem value="Medical Loan">
                          Medical Loan
                        </SelectItem>
                        <SelectItem value="Education Loan">
                          Education Loan
                        </SelectItem>
                        <SelectItem value="Funeral Support Loan">
                          Funeral Support
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[#2b241f]">
                      {isFuneralSupport
                        ? "Requested Support Amount"
                        : "Requested Amount"}
                    </Label>

                    <Input
                      type="number"
                      placeholder={`LKR ${loanSettings.minimumLoanAmount} - ${maxAllowedAmount}`}
                      value={requestedAmount}
                      onChange={(event) => setRequestedAmount(event.target.value)}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <Label className="text-[#2b241f]">
                      Preferred Repayment Period
                    </Label>

                    <Select
                      value={preferredPeriodMonths}
                      onValueChange={setPreferredPeriodMonths}
                      disabled={isFuneralSupport}
                    >
                      <SelectTrigger className={selectTriggerClassName}>
                        <SelectValue placeholder="Select repayment period" />
                      </SelectTrigger>

                      <SelectContent className="border-[#d9c8b8] bg-[#fbf7ef] text-[#2b241f]">
                        {loanSettings.allowedRepaymentPeriods.map((months) => (
                          <SelectItem key={months} value={String(months)}>
                            {months} Months
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[#2b241f]">Monthly Income</Label>

                    <Input
                      type="number"
                      placeholder="Example: 85000"
                      value={monthlyIncome}
                      onChange={(event) => setMonthlyIncome(event.target.value)}
                      className={inputClassName}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-[#2b241f]">Employment Type</Label>

                    <Select
                      value={employmentType}
                      onValueChange={setEmploymentType}
                    >
                      <SelectTrigger className={selectTriggerClassName}>
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>

                      <SelectContent className="border-[#d9c8b8] bg-[#fbf7ef] text-[#2b241f]">
                        <SelectItem value="Permanent">Permanent</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Temporary">Temporary</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="relative mt-5">
                  <Label className="text-[#2b241f]">
                    {isFuneralSupport ? "Support Reason" : "Loan Purpose"}
                  </Label>

                  <textarea
                    placeholder={
                      isFuneralSupport
                        ? "Explain funeral support reason"
                        : "Explain why you need this loan"
                    }
                    value={purpose}
                    onChange={(event) => setPurpose(event.target.value)}
                    className="mt-2 min-h-[130px] w-full resize-none rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/80 p-4 text-sm text-[#2b241f] outline-none placeholder:text-[#8a7a6b] focus:border-[#9b6f45] focus:ring-2 focus:ring-[#9b6f45]/25"
                  />
                </div>
              </CardContent>
            </Card>

            {!isFuneralSupport ? (
              <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
                <CardContent className="relative p-5 md:p-6">
                  <div className="relative mb-6 flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/20 text-emerald-700">
                      <ShieldCheck size={22} />
                    </div>

                    <div>
                      <h2 className="text-2xl font-extrabold text-[#2b241f]">
                        Guarantor Details
                      </h2>

                      <p className="text-sm leading-6 text-[#6b5e54]">
                        Enter guarantor Employee ID. Guarantor must be a
                        registered active member.
                      </p>
                    </div>
                  </div>

                  {guarantorLoading ? (
                    <div className="mb-5 rounded-[24px] border border-orange-500/20 bg-orange-500/10 p-4 text-sm font-semibold text-orange-700">
                      <div className="flex items-center gap-2">
                        <Loader2 size={17} className="animate-spin" />
                        Finding guarantor details...
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-5 md:grid-cols-4">
                    <div>
                      <Label className="text-[#2b241f]">
                        Guarantor Employee ID
                      </Label>

                      <Input
                        value={guarantorEmployeeId}
                        onChange={(event) =>
                          handleGuarantorEmployeeIdChange(event.target.value)
                        }
                        placeholder="Example: EMP002"
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <Label className="text-[#2b241f]">Guarantor Name</Label>
                      <Input
                        value={guarantorName}
                        readOnly
                        placeholder="Auto filled"
                        className={readonlyInputClassName}
                      />
                    </div>

                    <div>
                      <Label className="text-[#2b241f]">Guarantor Phone</Label>
                      <Input
                        value={guarantorPhone}
                        readOnly
                        placeholder="Auto filled"
                        className={readonlyInputClassName}
                      />
                    </div>

                    <div>
                      <Label className="text-[#2b241f]">Guarantor NIC</Label>
                      <Input
                        value={guarantorNic}
                        readOnly
                        placeholder="Auto filled"
                        className={readonlyInputClassName}
                      />
                    </div>
                  </div>

                  {selectedGuarantor ? (
                    <div className="mt-5 rounded-[24px] border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-700">
                      <p className="font-extrabold">
                        Guarantor selected successfully
                      </p>
                      <p className="mt-1">
                        {selectedGuarantor.employeeId} •{" "}
                        {selectedGuarantor.fullName} •{" "}
                        {selectedGuarantor.department || "No Department"}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-[24px] border border-orange-500/20 bg-orange-500/10 p-4 text-sm font-semibold text-orange-700">
                      Enter a valid Employee ID of an active member.
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
              <CardContent className="relative p-5 md:p-6">
                <div className="relative mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/20 text-orange-700">
                      <FileUp size={22} />
                    </div>

                    <div>
                      <h2 className="text-2xl font-extrabold text-[#2b241f]">
                        Required Documents
                      </h2>
                      <p className="text-sm leading-6 text-[#6b5e54]">
                        Upload all required documents for officer verification.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#d9c8b8] bg-[#f8f1e8]/80 px-4 py-3 text-sm font-bold text-[#9b6f45]">
                    {activeFileLabels.filter((item) => files[item.key]).length}/
                    {activeFileLabels.length} Uploaded
                  </div>
                </div>

                <div className="relative grid auto-rows-fr gap-5 md:grid-cols-2">
                  {activeFileLabels.map((item) => (
                    <FileUploadCard key={item.key} item={item} />
                  ))}
                </div>
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

            <Button
              type="submit"
              disabled={loading || guarantorLoading}
              className="h-14 w-full rounded-2xl bg-[#9b6f45] text-base font-extrabold text-white shadow-lg shadow-[#9b6f45]/25 transition hover:bg-[#835c38] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" />
                  {isFuneralSupport
                    ? "Submitting Support Request..."
                    : "Submitting Loan Application..."}
                </>
              ) : isFuneralSupport ? (
                "Submit Funeral Support Request"
              ) : (
                "Submit Loan Application"
              )}
            </Button>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24">
            <Card className="overflow-hidden rounded-[32px] border border-[#3c332d] bg-gradient-to-br from-[#2c241f] via-[#3a3029] to-[#211b17] text-white shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
              <CardContent className="relative p-6">
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d8ad80]/25 blur-3xl" />

                <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#9b6f45]">
                  <BadgeDollarSign size={24} />
                </div>

                <p className="relative text-sm text-[#ead9c8]/70">
                  Estimated Monthly Installment
                </p>

                <h2 className="relative mt-3 text-4xl font-extrabold text-white">
                  {isFuneralSupport
                    ? "No EMI"
                    : `LKR ${preview.monthlyInstallment.toLocaleString()}`}
                </h2>

                <p className="relative mt-3 text-sm leading-6 text-[#ead9c8]/70">
                  {isFuneralSupport
                    ? "This support amount is not repayable."
                    : `Calculated using ${loanSettings.interestRate}% annual interest.`}
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
              <CardContent className="p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/20 text-orange-700">
                  <CalendarClock size={24} />
                </div>

                <p className="text-sm text-[#6b5e54]">
                  Selected Repayment Period
                </p>

                <h2 className="mt-3 text-3xl font-extrabold">
                  {isFuneralSupport
                    ? "Not Required"
                    : `${
                        preview.selectedPeriod || Number(preferredPeriodMonths)
                      } Months`}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#6b5e54]">
                  {isFuneralSupport
                    ? "No installment schedule for funeral support."
                    : `System recommended: ${preview.recommendedPeriod} months`}
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
              <CardContent className="p-6">
                <p className="text-sm text-[#6b5e54]">Total Repayment</p>

                <h2 className="mt-3 text-3xl font-extrabold">
                  {isFuneralSupport
                    ? "Not Required"
                    : `LKR ${preview.totalRepayment.toLocaleString()}`}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#6b5e54]">
                  {isFuneralSupport
                    ? "Funeral support is a welfare grant."
                    : "Including interest amount."}
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[32px] border border-[#d9c8b8] bg-[#fbf7ef]/90 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
              <CardContent className="p-6">
                <p className="text-sm text-[#6b5e54]">
                  {isFuneralSupport ? "Support Type" : "Risk Level"}
                </p>

                <h2 className="mt-3 text-3xl font-extrabold capitalize">
                  {preview.riskLevel}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#6b5e54]">
                  {isFuneralSupport
                    ? "Non-repayable welfare support."
                    : "Based on income, loan amount and employment type."}
                </p>
              </CardContent>
            </Card>

            {loanResult && (
              <Card className="overflow-hidden rounded-[32px] border border-emerald-500/25 bg-emerald-500/10 text-[#2b241f] shadow-[0_30px_100px_rgba(44,36,31,0.16)] backdrop-blur-2xl">
                <CardContent className="p-6">
                  <h2 className="text-xl font-extrabold text-emerald-700">
                    {isFuneralSupport
                      ? "Support Request Submitted"
                      : "Loan Offer Generated"}
                  </h2>

                  <div className="mt-4 space-y-2 text-sm text-[#6b5e54]">
                    <p>
                      Amount: LKR {loanResult.approvedAmount.toLocaleString()}
                    </p>
                    <p>Interest Rate: {loanResult.systemInterestRate}%</p>
                    <p>
                      Preferred Period: {loanResult.preferredPeriodMonths}{" "}
                      months
                    </p>
                    <p>
                      Monthly Installment: LKR{" "}
                      {loanResult.monthlyInstallment.toLocaleString()}
                    </p>
                    <p>Status: {loanResult.status}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </form>
    </div>
  );
}