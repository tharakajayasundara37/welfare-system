import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser?._id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login again.",
        },
        { status: 401 }
      );
    }

    const user = await User.findById(currentUser._id)
      .select(
        "fullName email phone nic employeeId companyName department jobRole role accountStatus profileImage themeMode themeColor"
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_PROFILE_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load profile.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser?._id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login again.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();

    if (!fullName) {
      return NextResponse.json(
        {
          success: false,
          message: "Full name is required.",
        },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      currentUser._id,
      {
        $set: {
          fullName,
          phone,
        },
      },
      {
        new: true,
      }
    ).select(
      "fullName email phone nic employeeId companyName department jobRole role accountStatus profileImage themeMode themeColor"
    );

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully.",
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE_PROFILE_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update profile.",
      },
      { status: 500 }
    );
  }
}