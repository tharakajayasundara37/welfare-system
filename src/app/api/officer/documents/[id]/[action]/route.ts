import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Grant from "@/models/Grant";
import { Types } from "mongoose";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const { id, action } = await params;
    const body = await request.json();
    const { remark } = body;

    if (!id || id === "undefined") {
      return NextResponse.json(
        { success: false, message: "Invalid Document ID" },
        { status: 400 }
      );
    }

    await dbConnect();
    const user = await getCurrentUser();

    if (!user || (user.role !== "welfare_officer" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    const newStatus = action === "verify" ? "verified" : "rejected";

    const grant = await Grant.findOneAndUpdate(
      { "documents._id": new Types.ObjectId(id) },
      {
        $set: {
          "documents.$.status": newStatus,
          "documents.$.remark": remark || "Officer updated status",
        },
      },
      { new: true }
    );

    if (!grant) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Document ${newStatus} successfully.`,
    });
  } catch (error) {
    console.error("DOCUMENT_ACTION_ERROR", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}