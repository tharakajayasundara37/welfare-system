import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

type UserRole = "member" | "admin" | "welfare_officer" | "finance_officer";

function normalizeRole(role?: string): UserRole {
  const normalizedRole = String(role || "member")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_")
    .replaceAll("-", "_");

  if (normalizedRole === "admin") return "admin";
  if (normalizedRole === "welfare_officer") return "welfare_officer";
  if (normalizedRole === "finance_officer") return "finance_officer";

  return "member";
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const role = normalizeRole(user.role);

    if (
      user.accountStatus &&
      user.accountStatus !== "active" &&
      role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            user.accountStatus === "pending_admin_approval"
              ? "Your account is pending admin approval."
              : "Your account is not active. Please contact admin.",
        },
        { status: 403 }
      );
    }

    const jwtSecret = process.env.JWT_ACCESS_SECRET;

    if (!jwtSecret) {
      return NextResponse.json(
        {
          success: false,
          message: "JWT_ACCESS_SECRET is missing in .env.local.",
        },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role,
        email: user.email,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful.",
        user: {
          _id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          role,
          accountStatus: user.accountStatus,
          phone: user.phone,
          nic: user.nic,
          companyName: user.companyName,
          department: user.department,
          jobRole: user.jobRole,
          employeeId: user.employeeId,
          salaryRange: user.salaryRange,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("LOGIN_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Login failed. Try again.",
      },
      { status: 500 }
    );
  }
}