import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/dbConnect";
import User from "@/models/User";
import Counter from "@/models/Counter";

function formatEmployeeId(sequenceNumber: number) {
  return `E${String(sequenceNumber).padStart(3, "0")}`;
}

async function generateEmployeeId() {
  const counter = await Counter.findOneAndUpdate(
    { name: "employeeId" },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
    }
  );

  return formatEmployeeId(counter.seq);
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      fullName,
      nic,
      email,
      phone,
      password,
      companyName,
      department,
      jobRole,
      salaryRange,
    } = body;

    if (!fullName || !nic || !email || !phone || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Required fields are missing",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedNic = String(nic).trim();
    const normalizedPhone = String(phone).trim();

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { nic: normalizedNic },
        { phone: normalizedPhone },
      ],
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User already exists with this email, NIC or phone number",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    let employeeId = await generateEmployeeId();
    let employeeIdExists = await User.findOne({ employeeId });

    while (employeeIdExists) {
      employeeId = await generateEmployeeId();
      employeeIdExists = await User.findOne({ employeeId });
    }

    const user = await User.create({
      fullName: String(fullName).trim(),
      nic: normalizedNic,
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,

      employeeId,
      companyName: companyName ? String(companyName).trim() : "",
      department: department ? String(department).trim() : "",
      jobRole: jobRole ? String(jobRole).trim() : "",
      salaryRange: salaryRange ? String(salaryRange).trim() : "",

      role: "member",
      accountStatus: "pending_admin_approval",
      isVerified: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful. Pending admin approval.",
        user: {
          id: user._id,
          fullName: user.fullName,
          nic: user.nic,
          email: user.email,
          phone: user.phone,
          employeeId: user.employeeId,
          role: user.role,
          accountStatus: user.accountStatus,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTER_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong during registration",
      },
      { status: 500 }
    );
  }
}