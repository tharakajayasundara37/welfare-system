import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { createNotification } from "@/lib/notifications/createNotification";

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

    const loan = await Loan.findById(id);

    if (!loan || loan.isDeleted) {
      return NextResponse.json(
        { success: false, message: "Loan application not found." },
        { status: 404 }
      );
    }

    if (loan.status !== "under_welfare_review") {
      return NextResponse.json(
        {
          success: false,
          message: `This loan cannot be rejected from current status: ${loan.status}`,
        },
        { status: 400 }
      );
    }

    loan.status = "welfare_rejected";
    loan.documentStatus = "rejected";
    loan.welfareOfficerId = currentUser._id;
    loan.officerRemark =
      officerRemark || "Loan rejected by welfare officer after review.";

    await loan.save();

    await createNotification({
      userId: loan.userId,
      type: "loan",
      title: "Loan Rejected by Welfare Officer",
      message:
        loan.officerRemark ||
        "Your loan application has been rejected by the welfare officer.",
      priority: "high",
      link: "/dashboard/loans",
      metadata: {
        loanId: loan._id.toString(),
        officerId: currentUser._id,
        reason: loan.officerRemark,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Loan rejected by welfare officer.",
        loan,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OFFICER_REJECT_LOAN_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to reject loan by welfare officer.",
      },
      { status: 500 }
    );
  }
}