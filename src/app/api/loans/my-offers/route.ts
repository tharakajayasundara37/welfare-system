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

    if (currentUser.role !== "member" && currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Member only.",
        },
        { status: 403 }
      );
    }

    const query =
      currentUser.role === "admin"
        ? {
            status: {
              $in: [
                "user_offer_pending",
                "user_accepted",
                "user_rejected",
                "pending_finance_processing",
              ],
            },
            isDeleted: { $ne: true },
          }
        : {
            userId: currentUser._id,
            status: {
              $in: [
                "user_offer_pending",
                "user_accepted",
                "user_rejected",
                "pending_finance_processing",
              ],
            },
            isDeleted: { $ne: true },
          };

    const loans = await Loan.find(query)
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
    console.error("GET_MY_LOAN_OFFERS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load your loan offers.",
      },
      { status: 500 }
    );
  }
}