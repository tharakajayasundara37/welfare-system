import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Loan from "@/models/Loan";
import Document from "@/models/Document";
import Notification from "@/models/Notification"; // Aluthin add kala
import User from "@/models/User"; // Aluthin add kala

type LoanUser = {
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
  companyName?: string;
  salaryRange?: string;
};

type LeanLoan = {
  _id: {
    toString: () => string;
  };
  userId?: LoanUser;
  referenceId?: string;
  loanReference?: string;
  loanType?: string;
  requestedAmount?: number;
  approvedAmount?: number;
  purpose?: string;
  monthlyIncome?: number;
  employmentType?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorNic?: string;
  guarantorEmployeeId?: string;
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
  adminRemark?: string;
  financeRemark?: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

type LeanDocument = {
  _id: {
    toString: () => string;
  };
  documentType?: string;
  label?: string;
  fileName?: string;
  originalName?: string;
  fileUrl?: string;
  mimeType?: string;
  size?: number;
  status?: string;
  remark?: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

function makeReference(loanId: string) {
  return `LN-${loanId.slice(-6).toUpperCase()}`;
}

function formatDocumentType(type?: string) {
  return String(type || "document")
    .replaceAll("_", " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

export async function GET(
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

    if (currentUser.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Member only.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan ID is required.",
        },
        { status: 400 }
      );
    }

    const loan = await Loan.findOne({
      _id: id,
      userId: currentUser._id,
      isDeleted: { $ne: true },
    })
      .populate(
        "userId",
        "fullName email phone nic employeeId department jobRole companyName salaryRange"
      )
      .lean<LeanLoan | null>();

    if (!loan) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan application not found.",
        },
        { status: 404 }
      );
    }

    const documents = await Document.find({
      loanId: id,
      userId: currentUser._id,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: 1 })
      .lean<LeanDocument[]>();

    const loanId = loan._id.toString();

    const formattedDocuments = documents.map((document) => {
      const documentType = document.documentType || "document";

      return {
        id: document._id.toString(),
        documentType,
        title: document.label || formatDocumentType(documentType),
        fileName: document.fileName || "",
        originalName:
          document.originalName || document.fileName || "Uploaded file",
        fileUrl: document.fileUrl || "",
        mimeType: document.mimeType || "",
        size: document.size || 0,
        status: document.status || "uploaded",
        remark: document.remark || "",
        createdAt: document.createdAt || null,
        updatedAt: document.updatedAt || null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        loan: {
          id: loanId,
          reference:
            loan.referenceId || loan.loanReference || makeReference(loanId),

          member: loan.userId || null,

          loanType: loan.loanType || "Welfare Loan",
          requestedAmount: loan.requestedAmount || 0,
          approvedAmount: loan.approvedAmount || 0,
          purpose: loan.purpose || "",
          monthlyIncome: loan.monthlyIncome || 0,
          employmentType: loan.employmentType || "",

          guarantorName: loan.guarantorName || "",
          guarantorPhone: loan.guarantorPhone || "",
          guarantorNic: loan.guarantorNic || "",
          guarantorEmployeeId: loan.guarantorEmployeeId || "",

          systemInterestRate: loan.systemInterestRate || 0,
          preferredPeriodMonths: loan.preferredPeriodMonths || 0,
          recommendedPeriodMonths: loan.recommendedPeriodMonths || 0,
          monthlyInstallment: loan.monthlyInstallment || 0,
          totalRepayment: loan.totalRepayment || 0,
          remainingBalance: loan.remainingBalance || 0,

          riskLevel: loan.riskLevel || "",
          eligibilityStatus: loan.eligibilityStatus || "",
          userAcceptanceStatus: loan.userAcceptanceStatus || "",
          documentStatus: loan.documentStatus || "",
          status: loan.status || "pending_officer",

          officerRemark: loan.officerRemark || "",
          adminRemark: loan.adminRemark || "",
          financeRemark: loan.financeRemark || "",

          createdAt: loan.createdAt || null,
          updatedAt: loan.updatedAt || null,

          documents: formattedDocuments,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_MEMBER_LOAN_DETAIL_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load loan details.",
      },
      { status: 500 }
    );
  }
}

// =================================================================================
// ALUTHIN ADD KARAPU FUNCTION EKA: MEMBER LOAN EKA ACCEPT KARADDI NOTIFICATION YAWANNA
// =================================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const currentUser = await getCurrentUser();

    // Security check
    if (!currentUser || currentUser.role !== "member") {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ success: false, message: "Loan ID is required." }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const { status } = body; 

    const loan = await Loan.findOne({ _id: id, userId: currentUser._id });

    if (!loan) {
      return NextResponse.json({ success: false, message: "Loan not found." }, { status: 404 });
    }

    // Update loan status to accepted
    loan.status = status || "user_accepted";
    loan.userAcceptanceStatus = "accepted";
    loan.updatedAt = new Date();
    await loan.save();

    // ===================================================================
    // MEMBER ACCEPT KALAMA ADMIN/FINANCE LATA NOTIFICATION YAWANA KALLA
    // ===================================================================
    if (loan.status === "user_accepted") {
      // Find Admin and Finance officers from User collection
      const staffMembers = await User.find({
        role: { $in: ["admin", "finance_officer"] }
      }).select("_id");

      // Loop through staff and create notifications
      for (const staff of staffMembers) {
        try {
          await Notification.create({
            userId: staff._id,
            type: "loan",
            title: "Member Accepted Loan Offer",
            message: `${currentUser.fullName || "A member"} has accepted the loan offer (Ref: ${loan.referenceId || loan.loanReference || "Loan"}). Ready for finance processing.`,
            isRead: false,
            status: "active",
            isDeleted: false,
          });
        } catch (notiError) {
          console.error("Staff Notification Error:", notiError);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Loan accepted successfully." });

  } catch (error) {
    console.error("MEMBER_ACCEPT_LOAN_ERROR", error);
    return NextResponse.json({ success: false, message: "Failed to update loan." }, { status: 500 });
  }
}