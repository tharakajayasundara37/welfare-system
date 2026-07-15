import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import dbConnect from "@/lib/dbConnect";

type UserRole = "member" | "admin" | "welfare_officer" | "finance_officer";
type ThemeMode = "light" | "dark";

interface JwtPayload {
  userId: string;
  role?: string;
  email?: string;
}

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

function normalizeThemeMode(themeMode?: string): ThemeMode {
  return themeMode === "dark" ? "dark" : "light";
}

export async function getCurrentUser() {
  try {
    // 1. Establish the database connection first
    await dbConnect();
    
    // 2. Dynamically import the User model after connection (fixes Mongoose buffering/cold start issues)
    const User = (await import("@/models/User")).default;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    const jwtSecret = process.env.JWT_ACCESS_SECRET;

    if (!jwtSecret) {
      console.error("JWT_ACCESS_SECRET is missing in .env.local");
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded.userId) {
      return null;
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return null;
    }

    const role = normalizeRole(user.role);

    return {
      _id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      nic: user.nic,
      role,
      accountStatus: user.accountStatus,
      companyName: user.companyName,
      department: user.department,
      jobRole: user.jobRole,
      employeeId: user.employeeId,
      salaryRange: user.salaryRange,

      profileImage: user.profileImage || "",
      themeMode: normalizeThemeMode(user.themeMode),
      themeColor: user.themeColor || "#9b6f45",

      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error("GET_CURRENT_USER_ERROR", error);
    return null;
  }
}