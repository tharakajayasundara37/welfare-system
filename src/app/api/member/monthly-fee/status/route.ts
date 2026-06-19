import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import MonthlyPayment from "@/models/MonthlyPayment";

function getMonthInfo() {
  const now = new Date();

  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const dueDate = new Date(year, month - 1, 7, 23, 59, 59, 999);
  const isOverdue = now.getTime() > dueDate.getTime();

  const monthName = now.toLocaleString("en-US", {
    month: "long",
  });

  return {
    now,
    month,
    year,
    dueDate,
    isOverdue,
    monthName,
  };
}

function getDefaultMonthlyFeeAmount() {
  return 500;
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

    if (currentUser.role !== "member" && currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Member only.",
        },
        { status: 403 }
      );
    }

    const { month, year, dueDate, isOverdue, monthName } = getMonthInfo();

    const amount = getDefaultMonthlyFeeAmount();

    let payment = await MonthlyPayment.findOne({
      userId: currentUser._id,
      month,
      year,
      isDeleted: { $ne: true },
    }).lean();

    if (!payment) {
      payment = await MonthlyPayment.create({
        userId: currentUser._id,
        month,
        year,
        amount,
        status: isOverdue ? "overdue" : "pending",
        paymentMethod: "",
        transactionReference: "",
        receiptNumber: "",
        dueDate,
        overdueAt: isOverdue ? dueDate : null,
        paidAt: null,
        remark: "Monthly welfare fee payment record auto-created.",
        isDeleted: false,
      });
    } else if (payment.status !== "paid") {
      const nextStatus = isOverdue ? "overdue" : "pending";

      if (payment.status !== nextStatus) {
        await MonthlyPayment.findByIdAndUpdate(payment._id, {
          $set: {
            status: nextStatus,
            overdueAt: isOverdue ? dueDate : null,
          },
        });

        payment = await MonthlyPayment.findById(payment._id).lean();
      }
    }

    return NextResponse.json(
      {
        success: true,
        payment: {
          id: payment?._id?.toString(),
          month,
          year,
          monthName,
          amount: payment?.amount || amount,
          status: payment?.status || (isOverdue ? "overdue" : "pending"),
          dueDate: payment?.dueDate || dueDate,
          paidAt: payment?.paidAt || null,
          paymentMethod: payment?.paymentMethod || "",
          transactionReference: payment?.transactionReference || "",
          receiptNumber: payment?.receiptNumber || "",
          isOverdue:
            payment?.status === "paid" ? false : isOverdue,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_MONTHLY_FEE_STATUS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load monthly fee status.",
      },
      { status: 500 }
    );
  }
}