import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import dbConnect from "@/lib/dbConnect";
import Payment from "@/models/Payment";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

function getTokenFromRequest(req: NextRequest) {
  const cookieToken =
    req.cookies.get("token")?.value ||
    req.cookies.get("authToken")?.value ||
    req.cookies.get("auth-token")?.value ||
    req.cookies.get("welfare_token")?.value ||
    req.cookies.get("welfarex_token")?.value ||
    req.cookies.get("jwt")?.value;

  const authHeader = req.headers.get("authorization");

  if (cookieToken) return cookieToken;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }

  return null;
}

function getUserIdFromToken(req: NextRequest) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return null;
  }

  const decoded = jwt.verify(token, JWT_SECRET) as {
    id?: string;
    userId?: string;
    _id?: string;
    role?: string;
  };

  return decoded.id || decoded.userId || decoded._id || null;
}

function getMonthName(month: number) {
  return new Date(2026, month - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
}

function getCurrentMonthDueDate() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    7,
    23,
    59,
    59,
    999
  );
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const userId = getUserIdFromToken(req);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login first.",
        },
        { status: 401 }
      );
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const dueDate = getCurrentMonthDueDate();

    let payment = await Payment.findOne({
      userId,
      paymentType: "monthly_fee",
      month,
      year,
    });

    if (!payment) {
      payment = await Payment.create({
        userId,
        paymentType: "monthly_fee",
        month,
        year,
        amount: 500,
        status: now > dueDate ? "overdue" : "pending",
        dueDate,
      });
    }

    const isOverdue =
      payment.status !== "paid" && new Date(payment.dueDate) < new Date();

    if (isOverdue && payment.status !== "overdue") {
      payment.status = "overdue";
      await payment.save();
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment._id.toString(),
        month: payment.month,
        year: payment.year,
        monthName: getMonthName(payment.month),
        amount: payment.amount,
        status: payment.status,
        dueDate: payment.dueDate,
        paidAt: payment.paidAt,
        paymentMethod: payment.paymentMethod,
        transactionReference: payment.transactionReference,
        receiptNumber: payment.receiptNumber,
        isOverdue: payment.status === "overdue",
      },
    });
  } catch (error) {
    console.error("GET MEMBER PAYMENTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load payment details.",
      },
      { status: 500 }
    );
  }
}