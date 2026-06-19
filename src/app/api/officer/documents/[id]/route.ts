import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Document from "@/models/Document";

type PopulatedUser = {
  _id?: {
    toString: () => string;
  };
  fullName?: string;
  email?: string;
  phone?: string;
  nic?: string;
  employeeId?: string;
  department?: string;
  jobRole?: string;
};

type PopulatedLoan = {
  _id?: {
    toString: () => string;
  };
  userId?: PopulatedUser;
  loanType?: string;
  requestedAmount?: number;
  approvedAmount?: number;
  purpose?: string;
  status?: string;
  createdAt?: Date;
};

type LeanDocument = {
  _id: {
    toString: () => string;
  };
  userId?: PopulatedUser;
  loanId?: PopulatedLoan | null;
  grantId?:
    | {
        toString: () => string;
      }
    | null;
  documentType?: string;
  label?: string;
  fileName?: string;
  originalName?: string;
  fileUrl?: string;
  mimeType?: string;
  size?: number;
  status?: string;
  remark?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function formatDocumentType(type?: string) {
  return String(type || "document")
    .replaceAll("_", " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (
      currentUser.role !== "welfare_officer" &&
      currentUser.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Welfare officer only.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const documentId = id;

    if (!documentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Document ID is required.",
        },
        { status: 400 }
      );
    }

    const document = await Document.findOne({
      _id: documentId,
      isDeleted: { $ne: true },
    })
      .populate(
        "userId",
        "fullName email phone nic employeeId department jobRole"
      )
      .populate({
        path: "loanId",
        select:
          "userId loanType requestedAmount approvedAmount purpose status createdAt",
        populate: {
          path: "userId",
          select: "fullName email phone nic employeeId department jobRole",
        },
      })
      .lean<LeanDocument | null>();

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          message: "Document not found.",
        },
        { status: 404 }
      );
    }

    const loan = document.loanId;
    const applicant = loan?.userId || document.userId;
    const documentType = document.documentType || "document";

    return NextResponse.json(
      {
        success: true,
        document: {
          id: document._id.toString(),

          documentType,
          title: document.label || formatDocumentType(documentType),
          fileName: document.fileName || "",
          originalName:
            document.originalName || document.fileName || "Uploaded file",
          fileUrl: document.fileUrl || "",
          mimeType: document.mimeType || "",
          size: document.size || 0,
          status: document.status || "uploaded",
          remark: document.remark || "",
          createdAt: document.createdAt || null,
          updatedAt: document.updatedAt || null,

          applicant: {
            name: applicant?.fullName || "Unknown Member",
            email: applicant?.email || "",
            phone: applicant?.phone || "",
            nic: applicant?.nic || "",
            employeeId: applicant?.employeeId || "",
            department: applicant?.department || "",
            jobRole: applicant?.jobRole || "",
          },

          loan: loan
            ? {
                id: loan._id?.toString() || "",
                loanType: loan.loanType || "",
                requestedAmount: loan.requestedAmount || 0,
                approvedAmount: loan.approvedAmount || 0,
                purpose: loan.purpose || "",
                status: loan.status || "",
                createdAt: loan.createdAt || null,
              }
            : null,

          grantId: document.grantId ? document.grantId.toString() : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_OFFICER_DOCUMENT_DETAIL_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load document details.",
      },
      { status: 500 }
    );
  }
}