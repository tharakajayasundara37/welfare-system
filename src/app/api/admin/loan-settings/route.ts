import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";

import LoanSetting from "@/models/LoanSettings";

const defaultLoanSettings = {
  interestRate: 12,
  minimumLoanAmount: 10000,
  maximumLoanAmount: 500000,
  funeralSupportMaxAmount: 100000,
  allowedRepaymentPeriods: [6, 12, 18, 24, 30, 36, 42, 48, 54],
  latePaymentPenaltyRate: 2,
  monthlyFeeAmount: 1000,
  isActive: true,
};

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
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    let settings = await LoanSetting.findOne({
      isActive: true,
    });

    if (!settings) {
      settings = await LoanSetting.create({
        ...defaultLoanSettings,
        updatedBy: currentUser._id,
      });
    }

    return NextResponse.json(
      {
        success: true,
        settings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_LOAN_SETTINGS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch loan settings.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      interestRate,
      minimumLoanAmount,
      maximumLoanAmount,
      funeralSupportMaxAmount,
      allowedRepaymentPeriods,
      latePaymentPenaltyRate,
      monthlyFeeAmount,
    } = body;

    if (
      interestRate === undefined ||
      minimumLoanAmount === undefined ||
      maximumLoanAmount === undefined ||
      funeralSupportMaxAmount === undefined ||
      allowedRepaymentPeriods === undefined ||
      latePaymentPenaltyRate === undefined ||
      monthlyFeeAmount === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All loan setting fields are required.",
        },
        { status: 400 }
      );
    }

    const parsedInterestRate = Number(interestRate);
    const parsedMinimumLoanAmount = Number(minimumLoanAmount);
    const parsedMaximumLoanAmount = Number(maximumLoanAmount);
    const parsedFuneralSupportMaxAmount = Number(funeralSupportMaxAmount);
    const parsedLatePaymentPenaltyRate = Number(latePaymentPenaltyRate);
    const parsedMonthlyFeeAmount = Number(monthlyFeeAmount);

    if (
      Number.isNaN(parsedInterestRate) ||
      Number.isNaN(parsedMinimumLoanAmount) ||
      Number.isNaN(parsedMaximumLoanAmount) ||
      Number.isNaN(parsedFuneralSupportMaxAmount) ||
      Number.isNaN(parsedLatePaymentPenaltyRate) ||
      Number.isNaN(parsedMonthlyFeeAmount)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan settings must be valid numbers.",
        },
        { status: 400 }
      );
    }

    if (
      parsedInterestRate < 0 ||
      parsedMinimumLoanAmount < 0 ||
      parsedMaximumLoanAmount < 0 ||
      parsedFuneralSupportMaxAmount < 0 ||
      parsedLatePaymentPenaltyRate < 0 ||
      parsedMonthlyFeeAmount < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan settings cannot contain negative values.",
        },
        { status: 400 }
      );
    }

    if (parsedMinimumLoanAmount > parsedMaximumLoanAmount) {
      return NextResponse.json(
        {
          success: false,
          message: "Minimum loan amount cannot be greater than maximum amount.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(allowedRepaymentPeriods) ||
      allowedRepaymentPeriods.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Allowed repayment periods must be a non-empty array.",
        },
        { status: 400 }
      );
    }

    const parsedAllowedRepaymentPeriods = allowedRepaymentPeriods
      .map((period) => Number(period))
      .filter((period) => !Number.isNaN(period) && period > 0);

    if (parsedAllowedRepaymentPeriods.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Allowed repayment periods must contain valid numbers.",
        },
        { status: 400 }
      );
    }

    const uniqueAllowedRepaymentPeriods = Array.from(
      new Set(parsedAllowedRepaymentPeriods)
    ).sort((a, b) => a - b);

    const settings = await LoanSetting.findOneAndUpdate(
      {
        isActive: true,
      },
      {
        interestRate: parsedInterestRate,
        minimumLoanAmount: parsedMinimumLoanAmount,
        maximumLoanAmount: parsedMaximumLoanAmount,
        funeralSupportMaxAmount: parsedFuneralSupportMaxAmount,
        allowedRepaymentPeriods: uniqueAllowedRepaymentPeriods,
        latePaymentPenaltyRate: parsedLatePaymentPenaltyRate,
        monthlyFeeAmount: parsedMonthlyFeeAmount,
        updatedBy: currentUser._id,
        isActive: true,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Loan settings updated successfully.",
        settings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE_LOAN_SETTINGS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update loan settings.",
      },
      { status: 500 }
    );
  }
}