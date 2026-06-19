import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    const { status } = body;

    if (!["active", "rejected", "suspended"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid account status",
        },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        accountStatus: status,
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
      message: `User status updated to ${status}`,
      user,
    });
  } catch (error) {
    console.error("UPDATE_USER_STATUS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update user status",
      },
      { status: 500 }
    );
  }
}