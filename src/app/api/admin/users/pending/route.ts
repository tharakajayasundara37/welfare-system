import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();

    const pendingUsers = await User.find({
      role: "member",
      accountStatus: "pending_admin_approval",
      isDeleted: false,
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users: pendingUsers,
    });
  } catch (error) {
    console.error("GET_PENDING_USERS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch pending users",
      },
      { status: 500 }
    );
  }
}