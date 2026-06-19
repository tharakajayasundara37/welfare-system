import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Loan from "@/models/Loan";
import { generateLoanApprovalLetter } from "@/lib/generateLoanApprovalLetter";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

type PopulatedUser = {
  _id?: {
    toString: () => string;
  };
  fullName?: string;
  email?: string;
  phone?: string;
  nic?: string;
  employeeId?: string;
  department?: string;
  jobRole?: string;
};

type PopulatedAdmin = {
  _id?: {
    toString: () => string;
  };
  fullName?: string;
  email?: string;
  role?: string;
  employeeId?: string;
};

type LeanLoan = {
  _id: {
    toString: () => string;
  };

  userId?: PopulatedUser;
  adminId?: PopulatedAdmin | null;

  loanType?: string;
  supportType?: string;
  isRepayable?: boolean;

  requestedAmount?: number;
  approvedAmount?: number;
  purpose?: string;

  systemInterestRate?: number;
  preferredPeriodMonths?: number;
  approvedPeriodMonths?: number;
  monthlyInstallment?: number;
  totalRepayment?: number;
  remainingBalance?: number;

  riskLevel?: string;
  eligibilityStatus?: string;
  status?: string;

  officerRemark?: string;
  adminRemark?: string;

  approvalLetterUrl?: string;
  approvalLetterGeneratedAt?: Date | string | null;

  createdAt?: Date | string;
  adminApprovedAt?: Date | string | null;

  isDeleted?: boolean;
};

function isSameId(a: unknown, b: unknown) {
  if (!a || !b) return false;
  return String(a) === String(b);
}

function normalizeUser(user?: PopulatedUser) {
  if (!user) return undefined;

  return {
    _id: user._id?.toString() || "",
    fullName: user.fullName || "",
    email: user.email || "",
    phone: user.phone || "",
    nic: user.nic || "",
    employeeId: user.employeeId || "",
    department: user.department || "",
    jobRole: user.jobRole || "",
  };
}

function normalizeAdmin(admin?: PopulatedAdmin | null) {
  if (!admin) return undefined;

  return {
    _id: admin._id?.toString() || "",
    fullName: admin.fullName || "",
    email: admin.email || "",
    role: admin.role || "",
    employeeId: admin.employeeId || "",
  };
}

function isValidPdfLetterUrl(url?: string) {
  if (!url) return false;

  return (
    url.startsWith("/reports/loan-approval-letters/") &&
    url.endsWith(".pdf")
  );
}

export async function GET(_req: NextRequest, context: RouteParams) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login first.",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const loanId = id;

    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid loan ID.",
        },
        { status: 400 }
      );
    }

    const loan = (await Loan.findOne({
      _id: loanId,
      isDeleted: { $ne: true },
    })
      .populate(
        "userId",
        "fullName email phone nic employeeId department jobRole"
      )
      .populate("adminId", "fullName email role employeeId")
      .lean()) as LeanLoan | null;

    if (!loan) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan not found.",
        },
        { status: 404 }
      );
    }

    const allowedLoanStatuses = [
      "user_offer_pending",
      "user_accepted",
      "pending_finance_processing",
      "pending_finance",
      "under_finance_review",
      "approved",
      "disbursed",
      "completed",
    ];

    if (!allowedLoanStatuses.includes(String(loan.status))) {
      return NextResponse.json(
        {
          success: false,
          message: "Approval letter can be generated only after admin approval.",
          currentStatus: loan.status,
        },
        { status: 400 }
      );
    }

    const role = String(currentUser.role);

    const isAdminOrFinance = [
      "admin",
      "main_admin",
      "super_admin",
      "finance_officer",
    ].includes(role);

    const loanUser = loan.userId;
    const loanAdmin = loan.adminId || null;

    const isOwnerMember =
      role === "member" &&
      loanUser?._id &&
      currentUser._id &&
      isSameId(loanUser._id.toString(), currentUser._id.toString());

    if (!isAdminOrFinance && !isOwnerMember) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. You can only view your own approval letter.",
          currentRole: role,
        },
        { status: 403 }
      );
    }

    /*
      Correct saved PDF URL තියෙනවා නම් ඒකම return කරනවා.
      වැරදි /api/... URL එකක් save වෙලා තියෙනවා නම් regenerate කරනවා.
    */
    if (isValidPdfLetterUrl(loan.approvalLetterUrl)) {
      return NextResponse.json(
        {
          success: true,
          message: "Approval letter already generated.",
          approvalLetterUrl: loan.approvalLetterUrl,
          alreadyGenerated: true,
        },
        { status: 200 }
      );
    }

    const normalizedUser = normalizeUser(loanUser);
    const normalizedLoanAdmin = normalizeAdmin(loanAdmin);

    const admin = {
      _id: normalizedLoanAdmin?._id || currentUser._id?.toString() || "",
      fullName:
        normalizedLoanAdmin?.fullName ||
        currentUser.fullName ||
        "WelfareX Admin",
      email: normalizedLoanAdmin?.email || currentUser.email || "",
      role: normalizedLoanAdmin?.role || role || "admin",
      employeeId:
        normalizedLoanAdmin?.employeeId || currentUser.employeeId || "",
    };

    const generated = await generateLoanApprovalLetter({
      loan: {
        _id: loan._id.toString(),

        userId: normalizedUser,
        adminId: admin,

        loanType: loan.loanType,
        supportType: loan.supportType,
        isRepayable: loan.isRepayable,

        requestedAmount: loan.requestedAmount,
        approvedAmount: loan.approvedAmount,
        purpose: loan.purpose,

        systemInterestRate: loan.systemInterestRate,
        preferredPeriodMonths: loan.preferredPeriodMonths,
        approvedPeriodMonths: loan.approvedPeriodMonths,
        monthlyInstallment: loan.monthlyInstallment,
        totalRepayment: loan.totalRepayment,
        remainingBalance: loan.remainingBalance,

        riskLevel: loan.riskLevel,
        eligibilityStatus: loan.eligibilityStatus,
        status: loan.status,

        officerRemark: loan.officerRemark,
        adminRemark: loan.adminRemark,

        createdAt: loan.createdAt,
        adminApprovedAt: loan.adminApprovedAt,
      },
      admin,
    });

    await Loan.findByIdAndUpdate(loanId, {
      approvalLetterUrl: generated.letterUrl,
      approvalLetterGeneratedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Approval letter generated and saved successfully.",
        approvalLetterUrl: generated.letterUrl,
        filePath: generated.filePath,
        alreadyGenerated: false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GENERATE_APPROVAL_LETTER_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate approval letter.",
      },
      { status: 500 }
    );
  }
}