import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import User from "@/models/User";

// To prevent caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

const allowedStaffRoles = ["admin", "welfare_officer", "finance_officer"];

async function generateEmployeeId() {
  const lastStaff = await User.findOne({
    role: { $in: allowedStaffRoles },
    employeeId: { $regex: /^E\d{3}$/ },
  })
    .sort({ employeeId: -1 })
    .select("employeeId")
    .lean();

  if (!lastStaff?.employeeId) {
    return "E001";
  }

  const lastNumber = Number(lastStaff.employeeId.replace("E", ""));
  const nextNumber = lastNumber + 1;

  return `E${String(nextNumber).padStart(3, "0")}`;
}

export async function POST(request: NextRequest) {
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

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Admin only.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const { fullName, nic, email, phone, password, role, department, jobRole } = body;

    if (!fullName || !nic || !email || !phone || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: "Full name, NIC, email, phone, password and role are required.",
        },
        { status: 400 }
      );
    }

    if (!allowedStaffRoles.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid staff role.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedNic = String(nic).trim();
    const normalizedPhone = String(phone).trim();

    const existingEmail = await User.findOne({ email: normalizedEmail });

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "A user with this email already exists.",
        },
        { status: 409 }
      );
    }

    const existingNic = await User.findOne({ nic: normalizedNic });

    if (existingNic) {
      return NextResponse.json(
        {
          success: false,
          message: "A user with this NIC already exists.",
        },
        { status: 409 }
      );
    }

    const existingPhone = await User.findOne({ phone: normalizedPhone });

    if (existingPhone) {
      return NextResponse.json(
        {
          success: false,
          message: "A user with this phone number already exists.",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const employeeId = await generateEmployeeId();

    const staffUser = await User.create({
      fullName: String(fullName).trim(),
      nic: normalizedNic,
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,

      role,
      accountStatus: "active",
      isVerified: true,
      otpVerified: true,

      department: department || "",
      jobRole: jobRole || role.replaceAll("_", " "),
      employeeId,

      companyName: "Welfare",
      salaryRange: "Prefer not to say",
      isDeleted: false,
    });

    const safeUser = {
      _id: staffUser._id.toString(),
      fullName: staffUser.fullName,
      nic: staffUser.nic,
      email: staffUser.email,
      phone: staffUser.phone,
      role: staffUser.role,
      accountStatus: staffUser.accountStatus,
      department: staffUser.department,
      jobRole: staffUser.jobRole,
      employeeId: staffUser.employeeId,
      createdAt: staffUser.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: `Staff account created successfully. Employee ID: ${employeeId}`,
        user: safeUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE_STAFF_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create staff account.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
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

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Admin only.",
        },
        { status: 403 }
      );
    }

    const staffUsers = await User.find({
      role: { $in: allowedStaffRoles },
      isDeleted: { $ne: true },
    })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        staff: staffUsers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_STAFF_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to load staff accounts.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Admin only.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = request.nextUrl;
    const staffId = searchParams.get("id");

    if (!staffId) {
      return NextResponse.json(
        {
          success: false,
          message: "Staff ID is required.",
        },
        { status: 400 }
      );
    }

    if (staffId === currentUser._id.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot delete your own admin account.",
        },
        { status: 400 }
      );
    }

    const staffUser = await User.findById(staffId);

    if (!staffUser || staffUser.isDeleted) {
      return NextResponse.json(
        {
          success: false,
          message: "Staff user not found.",
        },
        { status: 404 }
      );
    }

    if (!allowedStaffRoles.includes(staffUser.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only staff accounts can be deleted here.",
        },
        { status: 400 }
      );
    }

    // Forcefully update the database using strict: false
    const updatedUser = await User.findByIdAndUpdate(
      staffId,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          accountStatus: "suspended",
        },
      },
      { new: true, strict: false }
    );

    if (!updatedUser) {
       return NextResponse.json(
        {
          success: false,
          message: "Failed to update database.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Staff account deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE_STAFF_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete staff account.",
      },
      { status: 500 }
    );
  }
}