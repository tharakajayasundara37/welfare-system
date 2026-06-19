import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/getCurrentUser";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login again.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          _id: currentUser._id,
          fullName: currentUser.fullName,
          email: currentUser.email,
          phone: currentUser.phone,
          nic: currentUser.nic,
          role: currentUser.role,
          accountStatus: currentUser.accountStatus,
          companyName: currentUser.companyName,
          department: currentUser.department,
          jobRole: currentUser.jobRole,
          employeeId: currentUser.employeeId,
          salaryRange: currentUser.salaryRange,
          isVerified: currentUser.isVerified,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("AUTH_ME_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load current user.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}