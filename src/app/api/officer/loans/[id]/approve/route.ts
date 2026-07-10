import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { generateOfficerLoanReport } from "@/lib/generateOfficerLoanReport";
import { createNotification } from "@/lib/notifications/createNotification";

import Loan from "@/models/Loan";
import Document from "@/models/Document";

// 1. Types defined to resolve ESLint (TypeScript) errors
interface PopulatedUser {
  _id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  nic?: string;
  employeeId?: string;
  department?: string;
  jobRole?: string;
  role?: string;
  companyName?: string;
  salaryRange?: string;
  accountStatus?: string;
}

interface PopulatedLoanData {
  _id: { toString: () => string };
  userId: PopulatedUser;
  welfareOfficerId: PopulatedUser;
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
  riskLevel?: string;
  eligibilityStatus?: string;
  documentStatus?: string;
  status?: string;
  officerRemark?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    if (currentUser.role !== "welfare_officer" && currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied. Welfare officer only." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { officerRemark } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Loan ID is required." },
        { status: 400 }
      );
    }

    const loan = await Loan.findOne({
      _id: id,
      isDeleted: { $ne: true },
    })
      .populate(
        "userId",
        "fullName email phone nic employeeId department jobRole companyName salaryRange accountStatus"
      )
      .populate("welfareOfficerId", "fullName email role employeeId");

    if (!loan) {
      return NextResponse.json(
        { success: false, message: "Loan application not found." },
        { status: 404 }
      );
    }

    if (loan.status !== "under_welfare_review") {
      return NextResponse.json(
        {
          success: false,
          message: `This loan cannot be approved from current status: ${loan.status}`,
        },
        { status: 400 }
      );
    }

    const documents = await Document.find({
      loanId: loan._id,
      isDeleted: { $ne: true },
    }).sort({ createdAt: 1 });

    if (documents.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No uploaded documents found. Please verify documents before approving.",
        },
        { status: 400 }
      );
    }

    const allDocumentsVerified = documents.every(
      (document) => document.status === "verified"
    );

    if (!allDocumentsVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "All documents must be verified before approving this loan.",
        },
        { status: 400 }
      );
    }

    loan.status = "pending_admin_approval";
    loan.documentStatus = "verified";
    loan.welfareOfficerId = currentUser._id;
    loan.officerRemark =
      officerRemark || "Welfare officer approved after document verification.";
    loan.approvedAt = new Date();

    await loan.save();

    // 2. Using the 'PopulatedLoanData' type instead of 'any'
    const populatedLoan = (await Loan.findById(loan._id)
      .populate(
        "userId",
        "fullName email phone nic employeeId department jobRole companyName salaryRange accountStatus"
      )
      .populate("welfareOfficerId", "fullName email role employeeId")
      .lean()) as unknown as PopulatedLoanData; 

    if (!populatedLoan) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan approved, but failed to load loan for PDF report.",
        },
        { status: 500 }
      );
    }

    // 3. Removed 'as any' assertions and strictly typed the payload
    const { reportUrl } = await generateOfficerLoanReport({
      loan: {
        _id: populatedLoan._id.toString(),
        userId: populatedLoan.userId, 
        welfareOfficerId: populatedLoan.welfareOfficerId, 
        loanType: populatedLoan.loanType,
        requestedAmount: populatedLoan.requestedAmount,
        approvedAmount: populatedLoan.approvedAmount,
        purpose: populatedLoan.purpose,
        monthlyIncome: populatedLoan.monthlyIncome,
        employmentType: populatedLoan.employmentType,
        guarantorName: populatedLoan.guarantorName,
        guarantorPhone: populatedLoan.guarantorPhone,
        guarantorNic: populatedLoan.guarantorNic,
        systemInterestRate: populatedLoan.systemInterestRate,
        preferredPeriodMonths: populatedLoan.preferredPeriodMonths,
        recommendedPeriodMonths: populatedLoan.recommendedPeriodMonths,
        monthlyInstallment: populatedLoan.monthlyInstallment,
        totalRepayment: populatedLoan.totalRepayment,
        riskLevel: populatedLoan.riskLevel,
        eligibilityStatus: populatedLoan.eligibilityStatus,
        documentStatus: populatedLoan.documentStatus,
        status: populatedLoan.status,
        officerRemark: populatedLoan.officerRemark,
        createdAt: populatedLoan.createdAt,
        updatedAt: populatedLoan.updatedAt,
      },
      documents: documents.map((document) => ({
        label: document.label,
        documentType: document.documentType,
        originalName: document.originalName,
        fileName: document.fileName,
        status: document.status,
        verifiedAt: document.verifiedAt,
        remark: document.remark,
      })),
      officer: {
        _id: currentUser._id?.toString(),
        fullName: currentUser.fullName,
        email: currentUser.email,
        phone: currentUser.phone,
        nic: currentUser.nic,
        employeeId: currentUser.employeeId,
        department: currentUser.department,
        jobRole: currentUser.jobRole,
        role: currentUser.role,
      },
    });

    const updatedLoan = await Loan.findByIdAndUpdate(
      loan._id,
      {
        officerReportUrl: reportUrl,
        officerReportGeneratedAt: new Date(),
      },
      { new: true }
    )
      .populate(
        "userId",
        "fullName email phone nic employeeId department jobRole companyName salaryRange accountStatus"
      )
      .populate("welfareOfficerId", "fullName email role employeeId")
      .lean();

    await createNotification({
      userId: loan.userId._id || loan.userId,
      type: "loan",
      title: "Loan Forwarded to Admin",
      message:
        "Your loan application has been approved by the welfare officer and forwarded to admin approval.",
      priority: "normal",
      link: "/dashboard/loans",
      metadata: {
        loanId: loan._id.toString(),
        officerId: currentUser._id,
        officerReportUrl: reportUrl,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Loan approved by welfare officer, report generated, and forwarded to admin.",
        loan: updatedLoan,
        officerReportUrl: reportUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OFFICER_APPROVE_LOAN_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to approve loan by welfare officer.",
      },
      { status: 500 }
    );
  }
}