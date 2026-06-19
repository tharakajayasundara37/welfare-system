import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import Loan from "@/models/Loan";

type Params = {
  id: string;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
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

    const body = await request.json().catch(() => ({}));

    const financeRemark =
      typeof body.financeRemark === "string" && body.financeRemark.trim()
        ? body.financeRemark.trim()
        : "";

    if (!financeRemark) {
      return NextResponse.json(
        {
          success: false,
          message: "Finance reject remark is required.",
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
          message: "Loan not found.",
        },
        { status: 404 }
      );
    }

    const allowedStatuses = [
      "pending_finance_processing",
      "pending_finance",
      "user_accepted",
      "approved",
    ];

    if (!allowedStatuses.includes(loan.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `This loan cannot be rejected from current status: ${loan.status}`,
        },
        { status: 400 }
      );
    }

    loan.status = "finance_rejected";
    loan.financeOfficerId = currentUser._id;
    loan.financeRejectedAt = new Date();
    loan.financeApprovedAt = null;
    loan.financeRemark = financeRemark;

    loan.disbursementDate = null;
    loan.nextEMIDueDate = null;
    loan.disbursementMethod = "";
    loan.disbursementReference = "";

    await loan.save();

    const updatedLoan = await Loan.findById(loan._id)
      .populate(
        "userId",
        "fullName email phone nic employeeId department jobRole"
      )
      .populate("financeOfficerId", "fullName email role employeeId")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Loan rejected by finance officer successfully.",
        loan: updatedLoan,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("FINANCE_REJECT_LOAN_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to reject loan by finance officer.",
      },
      { status: 500 }
    );
  }
}