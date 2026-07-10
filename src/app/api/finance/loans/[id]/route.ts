import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import Loan from "@/models/Loan";
import Document from "@/models/Document";

// SMS functions deka import kireema (Aluthin add kala)
import { sendSms, buildLoanIssuedSms }  from "@/lib/sms/sendSms";

type LoanStatusColor = "pending" | "approved" | "rejected" | "completed";

function getStatusLabel(status?: string) {
  if (status === "pending_finance_processing") {
    return "Pending Finance Processing";
  }

  if (status === "pending_finance") {
    return "Pending Finance Review";
  }

  if (status === "user_accepted") {
    return "Member Accepted";
  }

  if (status === "approved") {
    return "Finance Approved";
  }

  if (status === "disbursed") {
    return "Disbursed";
  }

  if (status === "finance_rejected") {
    return "Finance Rejected";
  }

  if (status === "completed") {
    return "Completed";
  }

  return status?.replaceAll("_", " ") || "Unknown";
}

function getStatusColor(status?: string): LoanStatusColor {
  if (
    status === "pending_finance_processing" ||
    status === "pending_finance" ||
    status === "user_accepted"
  ) {
    return "pending";
  }

  if (status === "approved" || status === "disbursed") {
    return "approved";
  }

  if (status === "finance_rejected") {
    return "rejected";
  }

  if (status === "completed") {
    return "completed";
  }

  return "pending";
}

function getShortReference(id: unknown) {
  const value = String(id || "");

  if (!value) return "-";

  if (value.length <= 8) {
    return `LN-${value.toUpperCase()}`;
  }

  return `LN-${value.slice(-6).toUpperCase()}`;
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

    if (
      currentUser.role !== "finance_officer" &&
      currentUser.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Finance officer only.",
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
      isDeleted: { $ne: true },
    })
      .populate(
        "userId",
        "fullName email phone nic employeeId department jobRole companyName salaryRange accountStatus"
      )
      .populate("welfareOfficerId", "fullName email phone role employeeId")
      .populate("adminId", "fullName email phone role employeeId")
      .populate("financeOfficerId", "fullName email phone role employeeId")
      .lean();

    if (!loan) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan not found.",
        },
        { status: 404 }
      );
    }

    const member =
      typeof loan.userId === "object" && loan.userId ? loan.userId : null;

    const welfareOfficer =
      typeof loan.welfareOfficerId === "object" && loan.welfareOfficerId
        ? loan.welfareOfficerId
        : null;

    const admin =
      typeof loan.adminId === "object" && loan.adminId ? loan.adminId : null;

    const financeOfficer =
      typeof loan.financeOfficerId === "object" && loan.financeOfficerId
        ? loan.financeOfficerId
        : null;

    const documents = await Document.find({
      loanId: loan._id,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .lean();

    const mappedLoan = {
      id: loan._id.toString(),
      reference: getShortReference(loan._id),

      member: {
        fullName: member?.fullName || "Member",
        email: member?.email || "",
        phone: member?.phone || "",
        nic: member?.nic || "",
        employeeId: member?.employeeId || "",
        department: member?.department || "",
        jobRole: member?.jobRole || "",
        companyName: member?.companyName || "",
        salaryRange: member?.salaryRange || "",
        accountStatus: member?.accountStatus || "",
      },

      welfareOfficer: {
        fullName: welfareOfficer?.fullName || "",
        email: welfareOfficer?.email || "",
        phone: welfareOfficer?.phone || "",
        role: welfareOfficer?.role || "",
        employeeId: welfareOfficer?.employeeId || "",
      },

      admin: {
        fullName: admin?.fullName || "",
        email: admin?.email || "",
        phone: admin?.phone || "",
        role: admin?.role || "",
        employeeId: admin?.employeeId || "",
      },

      financeOfficer: {
        fullName: financeOfficer?.fullName || "",
        email: financeOfficer?.email || "",
        phone: financeOfficer?.phone || "",
        role: financeOfficer?.role || "",
        employeeId: financeOfficer?.employeeId || "",
      },

      loanType: loan.loanType || "Welfare Loan",
      purpose: loan.purpose || "",

      requestedAmount: loan.requestedAmount || 0,
      approvedAmount: loan.approvedAmount || loan.requestedAmount || 0,
      monthlyIncome: loan.monthlyIncome || 0,
      employmentType: loan.employmentType || "",

      systemInterestRate: loan.systemInterestRate || 0,
      preferredPeriodMonths: loan.preferredPeriodMonths || 0,
      approvedPeriodMonths:
        loan.approvedPeriodMonths || loan.preferredPeriodMonths || 0,
      recommendedPeriodMonths: loan.recommendedPeriodMonths || 0,

      monthlyInstallment: loan.monthlyInstallment || 0,
      totalRepayment: loan.totalRepayment || 0,
      remainingBalance: loan.remainingBalance || 0,

      guarantorEmployeeId: loan.guarantorEmployeeId || "",
      guarantorName: loan.guarantorName || "",
      guarantorPhone: loan.guarantorPhone || "",
      guarantorNic: loan.guarantorNic || "",

      riskLevel: loan.riskLevel || "",
      eligibilityStatus: loan.eligibilityStatus || "",
      documentStatus: loan.documentStatus || "",

      status: loan.status || "",
      statusLabel: getStatusLabel(loan.status),
      statusColor: getStatusColor(loan.status),

      officerRemark: loan.officerRemark || "",
      adminRemark: loan.adminRemark || "",
      financeRemark: loan.financeRemark || "",

      officerApprovedAt: loan.officerApprovedAt || null,
      adminApprovedAt: loan.adminApprovedAt || null,
      financeApprovedAt: loan.financeApprovedAt || null,
      financeRejectedAt: loan.financeRejectedAt || null,

      disbursementDate: loan.disbursementDate || null,
      nextEMIDueDate: loan.nextEMIDueDate || null,

      approvalLetterUrl: loan.approvalLetterUrl || "",
      officerReportUrl: loan.officerReportUrl || "",

      createdAt: loan.createdAt || null,
      updatedAt: loan.updatedAt || null,
    };

    const mappedDocuments = documents.map((document) => ({
      id: document._id.toString(),
      documentType: document.documentType || "",
      label: document.label || "",
      originalName: document.originalName || "",
      fileName: document.fileName || "",
      fileUrl: document.fileUrl || "",
      status: document.status || "",
      remark: document.remark || "",
      verifiedAt: document.verifiedAt || null,
      createdAt: document.createdAt || null,
    }));

    return NextResponse.json(
      {
        success: true,
        loan: mappedLoan,
        documents: mappedDocuments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_FINANCE_LOAN_DETAIL_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load finance loan detail.",
      },
      { status: 500 }
    );
  }
}

// ALUTHIN ADD KARAPU FUNCTION EKA: LOAN EKA UPDATE WEDI SMS YAWANNA (Real-time SMS)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const currentUser = await getCurrentUser();

    if (!currentUser || (currentUser.role !== "finance_officer" && currentUser.role !== "admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized access." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, approvedAmount } = body;

    const updatedLoan = await Loan.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true }
    ).populate("userId", "phone");

    if (!updatedLoan) {
      return NextResponse.json({ success: false, message: "Loan not found." }, { status: 404 });
    }

    // Status eka 'disbursed' natham 'approved' unoth witharak real-time SMS eka yawanna
    if (status === "disbursed" || status === "approved") {
      
      const memberPhone = updatedLoan.userId && typeof updatedLoan.userId === 'object' 
        ? (updatedLoan.userId as { phone?: string }).phone 
        : null;

      if (memberPhone) {
        const smsMessage = buildLoanIssuedSms({
          loanType: updatedLoan.loanType || "Welfare Loan",
          amount: approvedAmount || updatedLoan.approvedAmount || 0,
        });

        const smsResult = await sendSms({
          to: memberPhone,
          message: smsMessage,
        });

        if (!smsResult.success) {
          console.error("REALTIME SMS SENDING FAILED:", smsResult.message);
        } else {
          console.log("REALTIME SMS SENT SUCCESSFULLY TO:", smsResult.to);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Loan updated successfully", 
      loan: updatedLoan 
    }, { status: 200 });

  } catch (error) {
    console.error("UPDATE_FINANCE_LOAN_ERROR", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to update loan." 
    }, { status: 500 });
  }
}