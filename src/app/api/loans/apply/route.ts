import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import Loan from "@/models/Loan";
import LoanSetting from "@/models/LoanSettings";
import Document from "@/models/Document";

const normalDocumentLabels: Record<string, string> = {
  nicFront: "NIC Front Photo",
  nicBack: "NIC Back Photo",
  employeeProof: "Employee ID / Employment Proof",
  salarySlip: "Latest Salary Slip",
  bankStatement: "Bank Statement",
  guarantorNicFront: "Guarantor NIC Front",
  guarantorNicBack: "Guarantor NIC Back",
  guarantorConsentLetter: "Guarantor Consent Letter",
  loanPurposeProof: "Loan Purpose Proof",
};

const funeralSupportDocumentLabels: Record<string, string> = {
  nicFront: "NIC Front Photo",
  nicBack: "NIC Back Photo",
  employeeProof: "Employee ID / Employment Proof",
  deathCertificate: "Death Certificate / Funeral Proof",
  relationshipProof: "Relationship Proof",
  funeralExpenseProof: "Funeral Expense Bill / Receipt",
  bankStatement: "Bank Details / Bank Statement",
};

function calculateEMI(
  amount: number,
  annualInterestRate: number,
  months: number
) {
  const monthlyRate = annualInterestRate / 12 / 100;

  if (monthlyRate === 0) {
    return amount / months;
  }

  const emi =
    (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  return emi;
}

function calculateRiskLevel(monthlyIncome: number, monthlyInstallment: number) {
  const emiRatio = monthlyInstallment / monthlyIncome;

  if (emiRatio <= 0.3) {
    return "low";
  }

  if (emiRatio <= 0.5) {
    return "medium";
  }

  return "high";
}

function calculateEligibilityStatus(
  monthlyIncome: number,
  monthlyInstallment: number
) {
  const emiRatio = monthlyInstallment / monthlyIncome;

  if (emiRatio <= 0.4) {
    return "eligible";
  }

  if (emiRatio <= 0.6) {
    return "review_required";
  }

  return "not_eligible";
}

function getRecommendedPeriod(amount: number) {
  if (amount <= 50000) {
    return 6;
  }

  if (amount <= 100000) {
    return 12;
  }

  if (amount <= 250000) {
    return 24;
  }

  if (amount <= 500000) {
    return 36;
  }

  return 48;
}

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function safeFileName(fileName: string) {
  return fileName
    .replaceAll(" ", "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "")
    .toLowerCase();
}

async function saveUploadedFile(
  file: File,
  loanId: string,
  documentType: string
) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "loan-documents",
    loanId
  );

  await mkdir(uploadDir, { recursive: true });

  const timestamp = Date.now();
  const cleanedOriginalName = safeFileName(file.name);
  const fileName = `${documentType}-${timestamp}-${cleanedOriginalName}`;

  const storagePath = path.join(uploadDir, fileName);

  await writeFile(storagePath, buffer);

  const fileUrl = `/uploads/loan-documents/${loanId}/${fileName}`;

  return {
    fileName,
    originalName: file.name,
    fileUrl,
    storagePath,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  };
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login first.",
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const loanType = getStringValue(formData, "loanType");
    const requestedAmount = getStringValue(formData, "requestedAmount");
    const purpose = getStringValue(formData, "purpose");
    const monthlyIncome = getStringValue(formData, "monthlyIncome");
    const employmentType = getStringValue(formData, "employmentType");

    const guarantorName = getStringValue(formData, "guarantorName");
    const guarantorPhone = getStringValue(formData, "guarantorPhone");
    const guarantorNic = getStringValue(formData, "guarantorNic");

    const preferredPeriodMonths = getStringValue(
      formData,
      "preferredPeriodMonths"
    );

    const isFuneralSupport = loanType === "Funeral Support Loan";

    const activeDocumentLabels = isFuneralSupport
      ? funeralSupportDocumentLabels
      : normalDocumentLabels;

    const requiredFiles = Object.keys(activeDocumentLabels);

    if (
      !loanType ||
      !requestedAmount ||
      !purpose ||
      !monthlyIncome ||
      !employmentType
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All required loan/support details must be filled.",
        },
        { status: 400 }
      );
    }

    if (
      !isFuneralSupport &&
      (!guarantorName ||
        !guarantorPhone ||
        !guarantorNic ||
        !preferredPeriodMonths)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All required loan and guarantor details must be filled.",
        },
        { status: 400 }
      );
    }

    for (const fileKey of requiredFiles) {
      const file = formData.get(fileKey);

      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json(
          {
            success: false,
            message: `${activeDocumentLabels[fileKey]} is required.`,
          },
          { status: 400 }
        );
      }
    }

    const loanAmount = Number(requestedAmount);
    const income = Number(monthlyIncome);
    const periodMonths = isFuneralSupport ? 0 : Number(preferredPeriodMonths);

    if (Number.isNaN(loanAmount) || loanAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid loan/support amount.",
        },
        { status: 400 }
      );
    }

    if (Number.isNaN(income) || income <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid monthly income.",
        },
        { status: 400 }
      );
    }

    if (
      !isFuneralSupport &&
      (Number.isNaN(periodMonths) || periodMonths <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid repayment period.",
        },
        { status: 400 }
      );
    }

    let settings = await LoanSetting.findOne({ isActive: true }).sort({
      createdAt: -1,
    });

    if (!settings) {
      settings = await LoanSetting.create({
        interestRate: 12,
        minimumLoanAmount: 10000,
        maximumLoanAmount: 500000,
        funeralSupportMaxAmount: 100000,
        allowedRepaymentPeriods: [6, 12, 18, 24, 30, 36, 42, 48, 54],
        latePaymentPenaltyRate: 2,
        monthlyFeeAmount: 1000,
        isActive: true,
      });
    }

    const minimumLoanAmount = Number(settings.minimumLoanAmount ?? 10000);
    const maximumLoanAmount = Number(settings.maximumLoanAmount ?? 500000);
    const funeralSupportMaxAmount = Number(
      settings.funeralSupportMaxAmount ?? 100000
    );

    const maxAllowedAmount = isFuneralSupport
      ? funeralSupportMaxAmount
      : maximumLoanAmount;

    if (loanAmount < minimumLoanAmount) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum amount is LKR ${minimumLoanAmount.toLocaleString()}.`,
        },
        { status: 400 }
      );
    }

    if (loanAmount > maxAllowedAmount) {
      return NextResponse.json(
        {
          success: false,
          message: isFuneralSupport
            ? `Maximum Funeral Support amount is LKR ${maxAllowedAmount.toLocaleString()}.`
            : `Maximum loan amount is LKR ${maxAllowedAmount.toLocaleString()}.`,
        },
        { status: 400 }
      );
    }

    if (
      !isFuneralSupport &&
      !settings.allowedRepaymentPeriods.includes(periodMonths)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected repayment period is not allowed.",
        },
        { status: 400 }
      );
    }

    const interestRate = isFuneralSupport ? 0 : Number(settings.interestRate);

    const monthlyInstallment = isFuneralSupport
      ? 0
      : calculateEMI(loanAmount, interestRate, periodMonths);

    const roundedMonthlyInstallment = Number(monthlyInstallment.toFixed(2));

    const totalRepayment = isFuneralSupport
      ? 0
      : Number((roundedMonthlyInstallment * periodMonths).toFixed(2));

    const riskLevel = isFuneralSupport
      ? "support_grant"
      : calculateRiskLevel(income, roundedMonthlyInstallment);

    const eligibilityStatus = isFuneralSupport
      ? "review_required"
      : calculateEligibilityStatus(income, roundedMonthlyInstallment);

    const recommendedPeriodMonths = isFuneralSupport
      ? 0
      : getRecommendedPeriod(loanAmount);

    const finalGuarantorName = isFuneralSupport ? "N/A" : guarantorName;
    const finalGuarantorPhone = isFuneralSupport ? "N/A" : guarantorPhone;
    const finalGuarantorNic = isFuneralSupport ? "N/A" : guarantorNic;

    const loan = await Loan.create({
      userId: user._id,

      loanType,
      supportType: isFuneralSupport
        ? "non_repayable_grant"
        : "repayable_loan",
      isRepayable: !isFuneralSupport,

      requestedAmount: loanAmount,
      approvedAmount: loanAmount,

      purpose,
      monthlyIncome: income,
      employmentType,

      guarantorName: finalGuarantorName,
      guarantorPhone: finalGuarantorPhone,
      guarantorNic: finalGuarantorNic,

      systemInterestRate: interestRate,

      recommendedPeriodMonths,
      preferredPeriodMonths: periodMonths,
      approvedPeriodMonths: 0,

      monthlyInstallment: roundedMonthlyInstallment,
      totalRepayment,
      remainingBalance: isFuneralSupport ? 0 : totalRepayment,

      riskLevel,
      eligibilityStatus,

      userAcceptanceStatus: "pending",
      documentStatus: "pending_verification",

      status: "under_welfare_review",

      officerRemark: "",
      adminRemark: "",
      financeRemark: "",

      welfareOfficerId: null,
      adminId: null,
      financeOfficerId: null,

      approvedAt: null,
      disbursedAt: null,

      paidAmount: 0,
      lateFeeAmount: 0,
      missedInstallments: 0,

      isDeleted: false,
    });

    const createdDocuments = [];

    for (const fileKey of requiredFiles) {
      const file = formData.get(fileKey);

      if (file instanceof File) {
        const savedFile = await saveUploadedFile(
          file,
          loan._id.toString(),
          fileKey
        );

        const document = await Document.create({
          userId: user._id,
          loanId: loan._id,

          documentType: fileKey,
          label: activeDocumentLabels[fileKey],

          fileName: savedFile.fileName,
          originalName: savedFile.originalName,
          fileUrl: savedFile.fileUrl,
          storagePath: savedFile.storagePath,
          mimeType: savedFile.mimeType,
          size: savedFile.size,

          status: "uploaded",
          verifiedBy: null,
          verifiedAt: null,
          remark: "",

          isDeleted: false,
        });

        createdDocuments.push(document);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: isFuneralSupport
          ? "Funeral support request submitted for welfare officer review."
          : "Loan application submitted for welfare officer review.",
        loan: {
          _id: loan._id.toString(),
          loanType: loan.loanType,
          supportType: loan.supportType,
          isRepayable: loan.isRepayable,
          requestedAmount: loan.requestedAmount,
          approvedAmount: loan.approvedAmount,
          systemInterestRate: loan.systemInterestRate,
          recommendedPeriodMonths: loan.recommendedPeriodMonths,
          preferredPeriodMonths: loan.preferredPeriodMonths,
          approvedPeriodMonths: loan.approvedPeriodMonths,
          monthlyInstallment: loan.monthlyInstallment,
          totalRepayment: loan.totalRepayment,
          remainingBalance: loan.remainingBalance,
          riskLevel: loan.riskLevel,
          eligibilityStatus: loan.eligibilityStatus,
          documentStatus: loan.documentStatus,
          status: loan.status,
        },
        documents: createdDocuments.map((document) => ({
          _id: document._id.toString(),
          documentType: document.documentType,
          label: document.label,
          fileUrl: document.fileUrl,
          status: document.status,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("APPLY_LOAN_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to submit loan application.",
      },
      { status: 500 }
    );
  }
}