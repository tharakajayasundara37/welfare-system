import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Document from "@/models/Document";
import "@/models/Loan";

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
  grantId?: {
    toString: () => string;
  } | null;
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

function getId(value: unknown) {
  if (!value) return null;

  if (typeof value === "string") return value;

  if (
    typeof value === "object" &&
    value !== null &&
    "toString" in value &&
    typeof value.toString === "function"
  ) {
    return value.toString();
  }

  return null;
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

    const query =
      currentUser.role === "admin" || currentUser.role === "welfare_officer"
        ? { isDeleted: { $ne: true } }
        : { userId: currentUser._id, isDeleted: { $ne: true } };

    const documents = await Document.find(query)
      .populate(
        "userId",
        "fullName email phone nic employeeId department jobRole"
      )
      .populate({
        path: "loanId",
        select: "userId loanType requestedAmount purpose status createdAt",
        populate: {
          path: "userId",
          select: "fullName email phone nic employeeId department jobRole",
        },
      })
      .sort({ createdAt: -1 })
      .lean<LeanDocument[]>();

    const formattedDocuments = documents.map((document) => {
      const documentType = document.documentType || "document";

      const loan = document.loanId;
      const loanApplicant = loan?.userId || document.userId;

      const loanId =
        loan && loan._id ? loan._id.toString() : getId(document.loanId);

      const grantId = document.grantId ? document.grantId.toString() : null;

      return {
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

        loanId,
        grantId,

        loanType: loan?.loanType || "",
        loanStatus: loan?.status || "",
        loanAmount: loan?.requestedAmount || 0,
        loanPurpose: loan?.purpose || "",

        applicantName: loanApplicant?.fullName || "Unknown Member",
        applicantEmail: loanApplicant?.email || "",
        applicantPhone: loanApplicant?.phone || "",
        applicantNic: loanApplicant?.nic || "",
        applicantEmployeeId: loanApplicant?.employeeId || "",
        applicantDepartment: loanApplicant?.department || "",
        applicantJobRole: loanApplicant?.jobRole || "",

        createdAt: document.createdAt || null,
        updatedAt: document.updatedAt || null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        documents: formattedDocuments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_DOCUMENTS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to load documents.",
      },
      { status: 500 }
    );
  }
}