import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST() {
  try {
    await dbConnect();

    const existingAdmin = await User.findOne({
      email: "admin@welfarex.com",
    });

    if (existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin already exists",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await User.create({
      fullName: "Main Admin",
      nic: "ADMIN001",
      email: "admin@welfarex.com",
      phone: "0700000000",
      password: hashedPassword,
      role: "admin",
      accountStatus: "active",
      otpVerified: true,
      companyName: "WelfareX",
      department: "Administration",
      jobRole: "Main Admin",
      employeeId: "ADM001",
      salaryRange: "Prefer not to say",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Admin created successfully",
        admin: {
          id: admin._id,
          email: admin.email,
          role: admin.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE_ADMIN_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create admin",
      },
      { status: 500 }
    );
  }
}