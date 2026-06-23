import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import User from "@/models/User";

const allowedThemeModes = ["light", "dark"];

const allowedThemeColors = [
  "#9b6f45",
  "#2563eb",
  "#047857",
  "#7c3aed",
  "#dc2626",
  "#0f766e",
];

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

    const themeMode = String(body.themeMode || "light").trim();
    const themeColor = String(body.themeColor || "#9b6f45").trim();

    if (!allowedThemeModes.includes(themeMode)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid theme mode.",
        },
        { status: 400 }
      );
    }

    if (!allowedThemeColors.includes(themeColor)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid theme color.",
        },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      currentUser._id,
      {
        $set: {
          themeMode,
          themeColor,
        },
      },
      {
        new: true,
      }
    ).select("themeMode themeColor");

    return NextResponse.json(
      {
        success: true,
        message: "Theme updated successfully.",
        themeMode: user?.themeMode || themeMode,
        themeColor: user?.themeColor || themeColor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE_THEME_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update theme.",
      },
      { status: 500 }
    );
  }
}