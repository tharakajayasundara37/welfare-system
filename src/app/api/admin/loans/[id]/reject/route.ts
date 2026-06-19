import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import Loan from "@/models/Loan";
import Notification from "@/models/Notification";

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
    const body = await request.json().catch(() => ({}));
    const { adminRemark } = body;

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
    });

    if (!loan) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan application not found.",
        },
        { status: 404 }
      );
    }

    if (loan.status !== "pending_admin_approval") {
      return NextResponse.json(
        {
          success: false,
          message: `This loan cannot be rejected from current status: ${loan.status}`,
        },
        { status: 400 }
      );
    }

    loan.status = "admin_rejected";
    loan.adminId = currentUser._id;
    loan.adminRemark =
      adminRemark || "Main Admin rejected this loan application.";
    loan.rejectionReason =
      adminRemark || "Main Admin rejected this loan application.";

    await loan.save();

    await Notification.create({
      userId: loan.userId,
      type: "loan",
      title: "Loan Rejected",
      message:
        loan.rejectionReason || "Your loan application has been rejected.",
      priority: "high",
      link: "/dashboard/loans",
      metadata: {
        loanId: loan._id.toString(),
        rejectionReason: loan.rejectionReason,
      },
    });

    const updatedLoan = await Loan.findById(loan._id)
      .populate(
        "userId",
        "fullName email phone nic employeeId department jobRole companyName salaryRange accountStatus"
      )
      .populate(
        "welfareOfficerId",
        "fullName email phone nic employeeId department jobRole role"
      )
      .populate("adminId", "fullName email role employeeId")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Loan rejected by Main Admin.",
        loan: updatedLoan,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ADMIN_REJECT_LOAN_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to reject loan by admin.",
      },
      { status: 500 }
    );
  }
}