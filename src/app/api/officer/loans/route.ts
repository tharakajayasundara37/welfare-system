import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import Loan from "@/models/Loan";

export async function GET() {
  try {
    await dbConnect();

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login first.",
        },
        { status: 401 }
      );
    }

    if (user.role !== "welfare_officer" && user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Welfare officer only.",
        },
        { status: 403 }
      );
    }

    const loans = await Loan.find({
      status: "under_welfare_review",
      isDeleted: { $ne: true },
    })
      .populate("userId", "fullName email phone nic employeeId department jobRole")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        loans,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_OFFICER_LOANS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load welfare officer loans.",
      },
      { status: 500 }
    );
  }
}