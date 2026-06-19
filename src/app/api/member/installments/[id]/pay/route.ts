import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { createNotification } from "@/lib/notifications/createNotification";

import Installment from "@/models/Installment";
import Loan from "@/models/Loan";

function maskCardNumber(cardNumber: string) {
  const digits = cardNumber.replace(/\D/g, "");
  return digits ? `**** **** **** ${digits.slice(-4)}` : "";
}

function getPaymentOpenDate(dueDate: Date) {
  const paymentOpenDate = new Date(dueDate);
  paymentOpenDate.setDate(paymentOpenDate.getDate() - 1);
  paymentOpenDate.setHours(0, 0, 0, 0);
  return paymentOpenDate;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "member") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const cardHolderName = String(body.cardHolderName || "").trim();
    const cardNumber = String(body.cardNumber || "").replace(/\D/g, "");
    const expiry = String(body.expiry || "").trim();
    const cvv = String(body.cvv || "").trim();

    if (!cardHolderName || cardNumber.length < 12 || !expiry || cvv.length < 3) {
      return NextResponse.json(
        { success: false, message: "Invalid mock card details." },
        { status: 400 }
      );
    }

    const installment = await Installment.findOne({
      _id: id,
      userId: currentUser._id,
      isDeleted: { $ne: true },
    });

    if (!installment) {
      return NextResponse.json(
        { success: false, message: "Installment not found." },
        { status: 404 }
      );
    }

    if (installment.status === "paid") {
      return NextResponse.json(
        { success: false, message: "Installment already paid." },
        { status: 400 }
      );
    }

    const paymentOpenDate = getPaymentOpenDate(new Date(installment.dueDate));

    if (new Date() < paymentOpenDate) {
      return NextResponse.json(
        {
          success: false,
          message: `Payment will open on ${paymentOpenDate.toLocaleDateString(
            "en-LK"
          )}.`,
        },
        { status: 400 }
      );
    }

    const paymentReference = `INS-PAY-${Date.now()}`;
    const paidAmount = Number(installment.amount || 0);

    installment.status = "paid";
    installment.paidAt = new Date();
    installment.paidAmount = paidAmount;
    installment.paymentReference = paymentReference;

    await installment.save();

    const loan = await Loan.findById(installment.loanId);

    if (loan) {
      loan.paidAmount = Number(loan.paidAmount || 0) + paidAmount;
      loan.remainingBalance = Math.max(
        Number(loan.remainingBalance || 0) - paidAmount,
        0
      );
      loan.totalPaidInstallments = Number(loan.totalPaidInstallments || 0) + 1;
      loan.lastPaymentDate = new Date();

      const nextPendingInstallment = await Installment.findOne({
        loanId: loan._id,
        userId: currentUser._id,
        status: "pending",
        isDeleted: { $ne: true },
      }).sort({ dueDate: 1 });

      loan.nextEMIDueDate = nextPendingInstallment?.dueDate || null;

      if (
        Number(loan.totalPaidInstallments || 0) >=
          Number(loan.totalInstallments || 0) ||
        Number(loan.remainingBalance || 0) <= 0
      ) {
        loan.status = "completed";
        loan.loanCompletedAt = new Date();
        loan.remainingBalance = 0;
        loan.nextEMIDueDate = null;
      }

      await loan.save();
    }

    await createNotification({
      userId: currentUser._id,
      type: "payment",
      title: "Installment Paid",
      message: `Your installment payment of Rs. ${paidAmount.toLocaleString()} has been paid successfully.`,
      priority: "normal",
      link: "/dashboard/installments",
      metadata: {
        installmentId: installment._id.toString(),
        loanId: installment.loanId.toString(),
        paymentReference,
        maskedCardNumber: maskCardNumber(cardNumber),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Installment paid successfully.",
      installment,
      paymentReference,
    });
  } catch (error) {
    console.error("MEMBER_INSTALLMENT_PAY_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Failed to pay installment." },
      { status: 500 }
    );
  }
}