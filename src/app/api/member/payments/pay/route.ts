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

function generateTransactionReference() {
  return `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateReceiptNumber() {
  return `WFX-RCP-${new Date().getFullYear()}-${Math.floor(
    100000 + Math.random() * 900000
  )}`;
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const paymentId = body.paymentId;

    if (!paymentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment ID is required.",
        },
        { status: 400 }
      );
    }

    const payment = await Payment.findOne({
      _id: paymentId,
      userId,
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment record not found.",
        },
        { status: 404 }
      );
    }

    if (payment.status === "paid") {
      return NextResponse.json({
        success: true,
        message: "Payment already completed.",
        payment: {
          id: payment._id.toString(),
          amount: payment.amount,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          transactionReference: payment.transactionReference,
          receiptNumber: payment.receiptNumber,
          paidAt: payment.paidAt,
        },
      });
    }

    payment.status = "paid";
    payment.paymentMethod = "mock_card";
    payment.transactionReference = generateTransactionReference();
    payment.receiptNumber = generateReceiptNumber();
    payment.paidAt = new Date();

    await payment.save();

    return NextResponse.json({
      success: true,
      message: "Payment completed successfully.",
      payment: {
        id: payment._id.toString(),
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        transactionReference: payment.transactionReference,
        receiptNumber: payment.receiptNumber,
        paidAt: payment.paidAt,
      },
    });
  } catch (error) {
    console.error("MOCK PAYMENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Payment failed. Please try again.",
      },
      { status: 500 }
    );
  }
}