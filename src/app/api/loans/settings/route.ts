import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import LoanSetting from "@/models/LoanSettings";

const defaultLoanSettings = {
  interestRate: 12,
  minimumLoanAmount: 10000,
  maximumLoanAmount: 500000,
  allowedRepaymentPeriods: [6, 12, 18, 24, 30, 36, 42, 48, 54],
  latePaymentPenaltyRate: 2,
  monthlyFeeAmount: 1000,
  isActive: true,
};

export async function GET() {
  try {
    await dbConnect();

    let settings = await LoanSetting.findOne({
      isActive: true,
    });

    if (!settings) {
      settings = await LoanSetting.create(defaultLoanSettings);
    }

    return NextResponse.json(
      {
        success: true,
        settings: {
          interestRate: settings.interestRate,
          minimumLoanAmount: settings.minimumLoanAmount,
          maximumLoanAmount: settings.maximumLoanAmount,
          allowedRepaymentPeriods: settings.allowedRepaymentPeriods,
          latePaymentPenaltyRate: settings.latePaymentPenaltyRate,
          monthlyFeeAmount: settings.monthlyFeeAmount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_PUBLIC_LOAN_SETTINGS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch loan settings",
      },
      { status: 500 }
    );
  }
}