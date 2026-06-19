import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import dbConnect from "@/lib/dbConnect";
import Loan from "@/models/Loan";

const JWT_SECRET =
  process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || "";

interface JwtPayload {
  userId: string;
  role?: string;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    if (!JWT_SECRET) {
      return NextResponse.json(
        {
          success: false,
          message: "JWT secret is not configured",
        },
        { status: 500 }
      );
    }

    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const loans = await Loan.find({
      userId: decoded.userId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        loans,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_MY_LOANS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch my loans",
      },
      { status: 500 }
    );
  }
}