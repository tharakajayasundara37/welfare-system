import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import Document from "@/models/Document";
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
    const body = await request.json().catch(() => ({}));
    const { remark } = body;

    const document = await Document.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          message: "Document not found.",
        },
        { status: 404 }
      );
    }

    document.status = "rejected";
    document.verifiedBy = currentUser._id;
    document.verifiedAt = new Date();
    document.remark = remark || "Document rejected by welfare officer.";

    await document.save();

    await Loan.findByIdAndUpdate(document.loanId, {
      documentStatus: "rejected",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Document rejected successfully.",
        document,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("REJECT_DOCUMENT_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to reject document.",
      },
      { status: 500 }
    );
  }
}