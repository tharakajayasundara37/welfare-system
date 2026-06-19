import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import Loan from "@/models/Loan";

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

    if (currentUser.role !== "member" && currentUser.role !== "admin") {
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
      isDeleted: { $ne: true },
    });

    if (!loan) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan offer not found.",
        },
        { status: 404 }
      );
    }

    if (
      currentUser.role !== "admin" &&
      loan.userId.toString() !== currentUser._id.toString()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only accept your own loan offer.",
        },
        { status: 403 }
      );
    }

    if (loan.status !== "user_offer_pending") {
      return NextResponse.json(
        {
          success: false,
          message: `This loan offer cannot be accepted from current status: ${loan.status}`,
        },
        { status: 400 }
      );
    }

    if (!loan.approvalLetterUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Approval letter PDF is missing. Please contact admin.",
        },
        { status: 400 }
      );
    }

    loan.status = "pending_finance_processing";
    loan.userAcceptanceStatus = "accepted";
    loan.userAcceptedAt = new Date();

    await loan.save();

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
        message:
          "Loan offer accepted successfully. Your loan has been forwarded to finance processing.",
        loan: updatedLoan,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ACCEPT_LOAN_OFFER_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to accept loan offer.",
      },
      { status: 500 }
    );
  }
}