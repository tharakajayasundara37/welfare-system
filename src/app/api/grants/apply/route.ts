import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Grant from "@/models/Grant";
import User from "@/models/User";
import Notification from "@/models/Notification";

type GrantDocument = {
  documentType: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
};

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

async function convertFileToBase64(file: File, documentType: string): Promise<GrantDocument> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const mimeType = file.type || "application/octet-stream";
  const base64Data = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  return {
    documentType,
    fileName: file.name,
    fileUrl: dataUrl, 
    mimeType,
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

  if (requestedAmount >= 100000) {
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
    const emergencyPhoneNumber = normalizeText(formData.get("emergencyPhoneNumber"));
    const grantType = normalizeText(formData.get("grantType"));
    const requestedAmount = Number(formData.get("requestedAmount") || 0);
    const reason = normalizeText(formData.get("reason"));
    const relationshipWithDeceased = normalizeText(formData.get("relationshipWithDeceased"));

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
      "Funeral Support Grant",
      "Disaster Relief Grant",
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
      "deathCertificate",
      "relationshipProof",
      "disasterProof",
      "bankStatement",
    ];

    for (const key of documentKeys) {
      const file = formData.get(key);

      if (file instanceof File && file.size > 0) {
        const savedFile = await convertFileToBase64(file, key);
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

    const welfareOfficers = await User.find({ role: "welfare_officer" }).select("_id").lean();

    if (welfareOfficers.length > 0) {
      const notifications = welfareOfficers.map((officer) => ({
        userId: officer._id,
        type: "grant",
        title: "New Grant Application",
        message: `${currentUser.fullName || "A member"} has applied for a ${grantType}.`,
        priority: grant.priorityLevel === "emergency" ? "high" : "normal",
        link: "/dashboard/officer/loans",
        metadata: {
          grantId: grant._id.toString(),
          memberId: currentUser._id,
        },
      }));

      await Notification.insertMany(notifications);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Grant application submitted successfully and sent to Welfare Officers.",
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