import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { generateLoanApprovalLetter } from "@/lib/generateLoanApprovalLetter";

import Loan from "@/models/Loan";
import Notification from "@/models/Notification";

export const dynamic = "force-dynamic";

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

  userId: PopulatedUser | string;
  adminId?: PopulatedAdmin | string | null;

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

  createdAt?: Date;
  adminApprovedAt?: Date | null;
};

function getLoanId(id: unknown) {
  if (!id) return "";
  return String(id);
}

function normalizeUser(user: PopulatedUser | string) {
  if (typeof user === "string") {
    return {
      _id: user,
    };
  }

  return {
    _id: user._id?.toString(),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    nic: user.nic,
    employeeId: user.employeeId,
    department: user.department,
    jobRole: user.jobRole,
  };
}

function normalizeAdmin(admin?: PopulatedAdmin | string | null) {
  if (!admin) {
    return undefined;
  }

  if (typeof admin === "string") {
    return {
      _id: admin,
    };
  }

  return {
    _id: admin._id?.toString(),
    fullName: admin.fullName,
    email: admin.email,
    role: admin.role,
    employeeId: admin.employeeId,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Admin only.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const loanId = getLoanId(id);

    if (!loanId) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan ID is required.",
        },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const adminRemark =
      typeof body.adminRemark === "string" && body.adminRemark.trim()
        ? body.adminRemark.trim()
        : "Loan approved by admin. Waiting for member decision.";

    const existingLoan = await Loan.findOne({
      _id: loanId,
      isDeleted: { $ne: true },
    })
      .populate(
        "userId",
        "fullName email phone nic employeeId department jobRole"
      )
      .lean<LeanLoan | null>();

    if (!existingLoan) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan application not found.",
        },
        { status: 404 }
      );
    }

    const allowedStatuses = [
      "pending_admin_approval",
      "pending_admin",
      "under_admin_review",
    ];

    if (!allowedStatuses.includes(existingLoan.status || "")) {
      return NextResponse.json(
        {
          success: false,
          message: `This loan cannot be approved from current status: ${existingLoan.status}`,
        },
        { status: 400 }
      );
    }

    const approvedAmount =
      Number(body.approvedAmount) ||
      existingLoan.approvedAmount ||
      existingLoan.requestedAmount ||
      0;

    const approvedPeriodMonths =
      Number(body.approvedPeriodMonths) ||
      existingLoan.approvedPeriodMonths ||
      existingLoan.preferredPeriodMonths ||
      0;

    const updatedLoan = await Loan.findByIdAndUpdate(
      loanId,
      {
        $set: {
          status: "user_offer_pending",
          userAcceptanceStatus: "pending",

          approvedAmount,
          approvedPeriodMonths,

          adminRemark,
          adminId: currentUser._id,
          adminApprovedAt: new Date(),

          updatedAt: new Date(),
        },
      },
      { new: true }
    )
      .populate(
        "userId",
        "fullName email phone nic employeeId department jobRole"
      )
      .populate("adminId", "fullName email role employeeId")
      .lean<LeanLoan | null>();

    if (!updatedLoan) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to approve loan.",
        },
        { status: 500 }
      );
    }

    const { letterUrl } = await generateLoanApprovalLetter({
      loan: {
        _id: updatedLoan._id.toString(),

        userId: normalizeUser(updatedLoan.userId),
        adminId: normalizeAdmin(updatedLoan.adminId),

        loanType: updatedLoan.loanType,
        supportType: updatedLoan.supportType,
        isRepayable: updatedLoan.isRepayable,

        requestedAmount: updatedLoan.requestedAmount,
        approvedAmount: updatedLoan.approvedAmount,
        purpose: updatedLoan.purpose,

        systemInterestRate: updatedLoan.systemInterestRate,
        preferredPeriodMonths: updatedLoan.preferredPeriodMonths,
        approvedPeriodMonths: updatedLoan.approvedPeriodMonths,
        monthlyInstallment: updatedLoan.monthlyInstallment,
        totalRepayment: updatedLoan.totalRepayment,
        remainingBalance: updatedLoan.remainingBalance,

        riskLevel: updatedLoan.riskLevel,
        eligibilityStatus: updatedLoan.eligibilityStatus,
        status: updatedLoan.status,

        officerRemark: updatedLoan.officerRemark,
        adminRemark: updatedLoan.adminRemark,

        createdAt: updatedLoan.createdAt,
        adminApprovedAt: updatedLoan.adminApprovedAt,
      },

      admin: {
        _id: currentUser._id?.toString(),
        fullName: currentUser.fullName,
        email: currentUser.email,
        role: currentUser.role,
        employeeId: currentUser.employeeId,
      },
    });

    const finalLoan = await Loan.findByIdAndUpdate(
      loanId,
      {
        $set: {
          approvalLetterUrl: letterUrl,
          approvalLetterGeneratedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { new: true }
    )
      .populate(
        "userId",
        "fullName email phone nic employeeId department jobRole companyName salaryRange accountStatus"
      )
      .populate("adminId", "fullName email role employeeId")
      .lean();

    const member = normalizeUser(updatedLoan.userId);

    if (member._id) {
      await Notification.create({
        userId: member._id,
        type: "loan",
        title: "Loan Approved",
        message:
          "Your loan application has been approved. Please review the loan offer.",
        priority: "high",
        link: "/dashboard/loans/offers",
        metadata: {
          loanId: updatedLoan._id.toString(),
          approvedAmount,
          approvedPeriodMonths,
          approvalLetterUrl: letterUrl,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Loan approved successfully. PDF approval letter generated and sent to member offers.",
        loan: finalLoan,
        approvalLetterUrl: letterUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ADMIN_APPROVE_LOAN_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to approve loan.",
      },
      { status: 500 }
    );
  }
}