import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import Loan from "@/models/Loan";

export async function GET() {
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

    const loans = await Loan.find({
      status: {
        $in: ["pending_admin_approval", "admin_approved", "admin_rejected"],
      },
      isDeleted: { $ne: true },
    })
      .populate(
        "userId",
        "fullName email phone nic employeeId department jobRole companyName salaryRange accountStatus"
      )
      .populate(
        "welfareOfficerId",
        "fullName email phone nic employeeId department jobRole role"
      )
      .populate("adminId", "fullName email role employeeId")
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        loans,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_ADMIN_LOANS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load admin loan approvals.",
      },
      { status: 500 }
    );
  }
}