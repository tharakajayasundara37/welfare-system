import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Grant from "@/models/Grant";

type GrantDocument = {
  documentType: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
};

const uploadDirectory = path.join(process.cwd(), "public", "uploads", "grants");

async function generateGrantId() {
  const year = new Date().getFullYear();

  const lastGrant = await Grant.findOne({
    grantId: {
      $regex: `^GR-${year}-`,
    },
  })
    .sort({ createdAt: -1 })
    .select("grantId")
    .lean<{ grantId?: string }>();

  let nextNumber = 1;

  if (lastGrant?.grantId) {
    const lastNumber = Number(lastGrant.grantId.split("-")[2]);

    if (!Number.isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `GR-${year}-${String(nextNumber).padStart(4, "0")}`;
}

async function saveGrantFile(file: File, documentType: string) {
  await mkdir(uploadDirectory, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}-${documentType}-${safeOriginalName}`;
  const filePath = path.join(uploadDirectory, fileName);

  await writeFile(filePath, buffer);

  return {
    documentType,
    fileName: file.name,
    fileUrl: `/uploads/grants/${fileName}`,
    mimeType: file.type || "",
    size: file.size || 0,
  };
}

function getPriorityLevel(grantType: string, requestedAmount: number) {
  if (
    grantType === "Funeral Support Grant" ||
    grantType === "Disaster Relief Grant"
  ) {
    return "emergency";
  }

  if (grantType === "Medical Grant" || requestedAmount >= 100000) {
    return "high";
  }

  return "normal";
}

function normalizeText(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login again.",
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const phoneNumber = normalizeText(formData.get("phoneNumber"));
    const emergencyPhoneNumber = normalizeText(
      formData.get("emergencyPhoneNumber")
    );
    const grantType = normalizeText(formData.get("grantType"));
    const requestedAmount = Number(formData.get("requestedAmount") || 0);
    const reason = normalizeText(formData.get("reason"));
    const relationshipWithDeceased = normalizeText(
      formData.get("relationshipWithDeceased")
    );

    if (
      !phoneNumber ||
      !emergencyPhoneNumber ||
      !grantType ||
      !requestedAmount ||
      !reason
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please complete all required grant details.",
        },
        { status: 400 }
      );
    }

    const validGrantTypes = [
      "Medical Grant",
      "Education Grant",
      "Funeral Support Grant",
      "Disaster Relief Grant",
      "Hardship Grant",
    ];

    if (!validGrantTypes.includes(grantType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid grant type selected.",
        },
        { status: 400 }
      );
    }

    if (requestedAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Requested amount must be greater than zero.",
        },
        { status: 400 }
      );
    }

    if (grantType === "Funeral Support Grant" && !relationshipWithDeceased) {
      return NextResponse.json(
        {
          success: false,
          message: "Relationship with deceased person is required.",
        },
        { status: 400 }
      );
    }

    const documents: GrantDocument[] = [];

    const documentKeys = [
      "nicFront",
      "nicBack",
      "employeeProof",
      "medicalDocument",
      "educationDocument",
      "deathCertificate",
      "relationshipProof",
      "disasterProof",
      "hardshipProof",
      "bankStatement",
    ];

    for (const key of documentKeys) {
      const file = formData.get(key);

      if (file instanceof File && file.size > 0) {
        const savedFile = await saveGrantFile(file, key);
        documents.push(savedFile);
      }
    }

    if (documents.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Please upload at least one supporting document.",
        },
        { status: 400 }
      );
    }

    const grantId = await generateGrantId();

    const memberId =
      currentUser.employeeId ||
      currentUser._id ||
      `MEM-${String(currentUser._id).slice(-6).toUpperCase()}`;

    const grant = await Grant.create({
      grantId,
      userId: currentUser._id,
      memberId,
      memberName: currentUser.fullName || currentUser.email,
      memberEmail: currentUser.email,
      phoneNumber,
      emergencyPhoneNumber,
      grantType,
      requestedAmount,
      reason,
      relationshipWithDeceased:
        grantType === "Funeral Support Grant" ? relationshipWithDeceased : "",
      status: "pending_officer",
      priorityLevel: getPriorityLevel(grantType, requestedAmount),
      documents,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Grant application submitted successfully.",
        grant: {
          id: grant._id.toString(),
          grantId: grant.grantId,
          memberId: grant.memberId,
          memberName: grant.memberName,
          grantType: grant.grantType,
          requestedAmount: grant.requestedAmount,
          status: grant.status,
          priorityLevel: grant.priorityLevel,
        },
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GRANT_APPLY_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to submit grant application.",
      },
      { status: 500 }
    );
  }
}