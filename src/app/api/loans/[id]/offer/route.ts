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

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

type LoanOfferAction = "accept" | "reject";

export async function PATCH(request: NextRequest, context: RouteParams) {
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
          message: "Unauthorized. Please login again.",
        },
        { status: 401 }
      );
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired token. Please login again.",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const loanId = id;

    if (!loanId) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan ID is required",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const action = body.action as LoanOfferAction;

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid action. Use accept or reject.",
        },
        { status: 400 }
      );
    }

    const loan = await Loan.findOne({
      _id: loanId,
      userId: decoded.userId,
      isDeleted: false,
    });

    if (!loan) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan not found",
        },
        { status: 404 }
      );
    }

    if (loan.status !== "user_offer_pending") {
      return NextResponse.json(
        {
          success: false,
          message: "This loan offer is no longer pending",
        },
        { status: 400 }
      );
    }

    if (loan.userAcceptanceStatus !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message: "This loan offer has already been responded to",
        },
        { status: 400 }
      );
    }

    if (!loan.preferredPeriodMonths) {
      loan.preferredPeriodMonths =
        loan.approvedPeriodMonths || loan.recommendedPeriodMonths || 12;
    }

    if (!loan.recommendedPeriodMonths) {
      loan.recommendedPeriodMonths = loan.preferredPeriodMonths || 12;
    }

    if (!loan.approvedPeriodMonths) {
      loan.approvedPeriodMonths = loan.preferredPeriodMonths || 12;
    }

    if (action === "accept") {
      loan.userAcceptanceStatus = "accepted";
      loan.status = "under_welfare_review";
    }

    if (action === "reject") {
      loan.userAcceptanceStatus = "rejected";
      loan.status = "user_rejected";
    }

    await loan.save();

    return NextResponse.json(
      {
        success: true,
        message:
          action === "accept"
            ? "Loan offer accepted successfully. Your application is now under welfare officer review."
            : "Loan offer rejected successfully.",
        loan,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("RESPOND_LOAN_OFFER_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to respond to loan offer",
      },
      { status: 500 }
    );
  }
}