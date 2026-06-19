import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        accountStatus: "active",
        isVerified: true,
      },
      {
        new: true,
      }
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User approved successfully",
      user,
    });
  } catch (error) {
    console.error("APPROVE_USER_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to approve user",
      },
      { status: 500 }
    );
  }
}