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

    document.status = "verified";
    document.verifiedBy = currentUser._id;
    document.verifiedAt = new Date();
    document.remark = "Document verified by welfare officer.";

    await document.save();

    const documents = await Document.find({
      loanId: document.loanId,
      isDeleted: { $ne: true },
    });

    const allVerified =
      documents.length > 0 &&
      documents.every((item) => item.status === "verified");

    await Loan.findByIdAndUpdate(document.loanId, {
      documentStatus: allVerified ? "verified" : "pending_verification",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Document verified successfully.",
        document,
        allVerified,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("VERIFY_DOCUMENT_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to verify document.",
      },
      { status: 500 }
    );
  }
}