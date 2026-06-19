import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import User from "@/models/User";

type LeanUser = {
  _id: {
    toString: () => string;
  };
  fullName?: string;
  email?: string;
  phone?: string;
  nic?: string;
  employeeId?: string;
  department?: string;
  jobRole?: string;
  role?: string;
  accountStatus?: string;
};

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const employeeId = String(searchParams.get("employeeId") || "").trim();

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          message: "Guarantor Employee ID is required.",
        },
        { status: 400 }
      );
    }

    const guarantor = await User.findOne({
      employeeId,
      role: "member",
      accountStatus: "active",
      _id: { $ne: currentUser._id },
    })
      .select("fullName email phone nic employeeId department jobRole role accountStatus")
      .lean<LeanUser>();

    if (!guarantor) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No active member found for this Employee ID. Guarantor must be a registered active member.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        guarantor: {
          id: guarantor._id.toString(),
          fullName: guarantor.fullName || "",
          email: guarantor.email || "",
          phone: guarantor.phone || "",
          nic: guarantor.nic || "",
          employeeId: guarantor.employeeId || "",
          department: guarantor.department || "",
          jobRole: guarantor.jobRole || "",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GUARANTOR_LOOKUP_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load guarantor details.",
      },
      { status: 500 }
    );
  }
}