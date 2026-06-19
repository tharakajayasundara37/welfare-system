import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import MonthlyPayment from "@/models/MonthlyPayment";

function getMonthInfo() {
  const now = new Date();

  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const dueDate = new Date(year, month - 1, 7, 23, 59, 59, 999);

  const monthName = now.toLocaleString("en-US", {
    month: "long",
  });

  return {
    now,
    month,
    year,
    dueDate,
    monthName,
  };
}

function getDefaultMonthlyFeeAmount() {
  return 500;
}

function maskCardNumber(cardNumber: string) {
  const clean = cardNumber.replace(/\D/g, "");

  if (clean.length < 4) {
    return "****";
  }

  return `**** **** **** ${clean.slice(-4)}`;
}

function generateReceiptNumber(year: number, month: number) {
  const monthText = String(month).padStart(2, "0");
  const random = Math.floor(100000 + Math.random() * 900000);

  return `WF-FEE-${year}${monthText}-${random}`;
}

function generateTransactionReference(year: number, month: number) {
  const monthText = String(month).padStart(2, "0");
  const random = Math.floor(100000 + Math.random() * 900000);

  return `MOCK-FEE-${year}${monthText}-${random}`;
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

    if (currentUser.role !== "member" && currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Member only.",
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const cardHolderName =
      typeof body.cardHolderName === "string"
        ? body.cardHolderName.trim()
        : "";

    const cardNumber =
      typeof body.cardNumber === "string" ? body.cardNumber.trim() : "";

    const expiry = typeof body.expiry === "string" ? body.expiry.trim() : "";

    const cvv = typeof body.cvv === "string" ? body.cvv.trim() : "";

    if (!cardHolderName) {
      return NextResponse.json(
        {
          success: false,
          message: "Card holder name is required.",
        },
        { status: 400 }
      );
    }

    if (!cardNumber || cardNumber.replace(/\D/g, "").length < 12) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid card number is required.",
        },
        { status: 400 }
      );
    }

    if (!expiry) {
      return NextResponse.json(
        {
          success: false,
          message: "Expiry date is required.",
        },
        { status: 400 }
      );
    }

    if (!cvv || cvv.length < 3) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid CVV is required.",
        },
        { status: 400 }
      );
    }

    const { month, year, dueDate, monthName } = getMonthInfo();

    const amount = getDefaultMonthlyFeeAmount();

    const existingPayment = await MonthlyPayment.findOne({
      userId: currentUser._id,
      month,
      year,
      isDeleted: { $ne: true },
    });

    if (existingPayment?.status === "paid") {
      return NextResponse.json(
        {
          success: true,
          message: "Monthly welfare fee already paid for this month.",
          payment: {
            id: existingPayment._id.toString(),
            month,
            year,
            monthName,
            amount: existingPayment.amount,
            status: existingPayment.status,
            paidAt: existingPayment.paidAt,
            receiptNumber: existingPayment.receiptNumber,
            transactionReference: existingPayment.transactionReference,
          },
        },
        { status: 200 }
      );
    }

    const receiptNumber = generateReceiptNumber(year, month);
    const transactionReference = generateTransactionReference(year, month);
    const maskedCardNumber = maskCardNumber(cardNumber);

    const paidPayment = await MonthlyPayment.findOneAndUpdate(
      {
        userId: currentUser._id,
        month,
        year,
        isDeleted: { $ne: true },
      },
      {
        $set: {
          userId: currentUser._id,
          month,
          year,
          amount,
          status: "paid",
          paymentMethod: "mock_card",
          transactionReference,
          receiptNumber,
          cardHolderName,
          maskedCardNumber,
          dueDate,
          overdueAt: null,
          paidAt: new Date(),
          remark: "Monthly welfare fee paid using mock card payment.",
          isDeleted: false,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Monthly welfare fee paid successfully.",
        payment: {
          id: paidPayment._id.toString(),
          month,
          year,
          monthName,
          amount: paidPayment.amount,
          status: paidPayment.status,
          paymentMethod: paidPayment.paymentMethod,
          transactionReference: paidPayment.transactionReference,
          receiptNumber: paidPayment.receiptNumber,
          maskedCardNumber: paidPayment.maskedCardNumber,
          paidAt: paidPayment.paidAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PAY_MONTHLY_FEE_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to pay monthly welfare fee.",
      },
      { status: 500 }
    );
  }
}