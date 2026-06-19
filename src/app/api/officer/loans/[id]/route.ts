import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import Loan from "@/models/Loan";
import Document from "@/models/Document";

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

    if (currentUser.role !== "welfare_officer" && currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Welfare officer only.",
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
      .populate("welfareOfficerId", "fullName email role employeeId")
      .populate("adminId", "fullName email role employeeId")
      .populate("financeOfficerId", "fullName email role employeeId")
      .lean();

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
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        loan: {
          ...loan,
          documents,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_OFFICER_LOAN_DETAIL_ERROR", error);

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