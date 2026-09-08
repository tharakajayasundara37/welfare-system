import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Installment from "@/models/Installment";
import Loan from "@/models/Loan";
import MonthlyPayment from "@/models/MonthlyPayment";

void Loan;

function monthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
}

export async function GET() {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "member") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const [monthlyPayments, installments] = await Promise.all([
      MonthlyPayment.find({
        userId: currentUser._id,
        isDeleted: { $ne: true },
      })
        .sort({ year: -1, month: -1 })
        .lean(),
      Installment.find({
        userId: currentUser._id,
        isDeleted: { $ne: true },
      })
        .populate("loanId", "loanType")
        .sort({ dueDate: -1 })
        .lean(),
    ]);

    const monthlyRecords = monthlyPayments.map((payment) => ({
      id: payment._id.toString(),
      paymentType: "monthly_fee" as const,
      title: `${monthName(Number(payment.month))} ${payment.year} Welfare Fee`,
      amount: Number(payment.amount || 0),
      status: String(payment.status || "pending"),
      dueDate: payment.dueDate || null,
      paidAt: payment.paidAt || null,
      paymentMethod: String(payment.paymentMethod || ""),
      transactionReference: String(payment.transactionReference || ""),
      receiptNumber: String(payment.receiptNumber || ""),
      maskedCardNumber: String(payment.maskedCardNumber || ""),
    }));

    const installmentRecords = installments.map((installment) => {
      const loan = installment.loanId as
        | { loanType?: string }
        | null
        | undefined;
      const paidAt = installment.paidAt
        ? new Date(installment.paidAt)
        : null;
      const fallbackReceipt = paidAt
        ? `WF-INS-${paidAt.getFullYear()}-${installment._id
            .toString()
            .slice(-6)
            .toUpperCase()}`
        : "";

      return {
        id: installment._id.toString(),
        paymentType: "loan_installment" as const,
        title: `${loan?.loanType || "Loan"} — Installment #${
          installment.installmentNumber
        }`,
        amount:
          installment.status === "paid" && Number(installment.paidAmount) > 0
            ? Number(installment.paidAmount)
            : Number(installment.amount || 0) +
              Number(installment.penaltyAmount || 0),
        status: String(installment.status || "pending"),
        dueDate: installment.dueDate || null,
        paidAt: installment.paidAt || null,
        paymentMethod: String(installment.paymentMethod || ""),
        transactionReference: String(installment.paymentReference || ""),
        receiptNumber: String(
          installment.receiptNumber || fallbackReceipt
        ),
        maskedCardNumber: String(installment.maskedCardNumber || ""),
      };
    });

    const records = [...monthlyRecords, ...installmentRecords].sort(
      (left, right) => {
        const leftDate = new Date(left.paidAt || left.dueDate || 0).getTime();
        const rightDate = new Date(
          right.paidAt || right.dueDate || 0
        ).getTime();
        return rightDate - leftDate;
      }
    );

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error("GET_MEMBER_PAYMENT_HISTORY_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Failed to load payment history." },
      { status: 500 }
    );
  }
}
