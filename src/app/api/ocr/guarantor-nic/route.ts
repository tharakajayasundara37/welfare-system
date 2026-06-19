import { NextRequest, NextResponse } from "next/server";
import { createWorker } from "tesseract.js";

function cleanText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[|]/g, "I")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNic(text: string) {
  const cleaned = text.replace(/\s/g, "").toUpperCase();

  const oldNicMatch = cleaned.match(/\b[0-9]{9}[VX]\b/);
  if (oldNicMatch) {
    return oldNicMatch[0];
  }

  const newNicMatch = cleaned.match(/\b[0-9]{12}\b/);
  if (newNicMatch) {
    return newNicMatch[0];
  }

  return "";
}

function extractName(text: string) {
  const lines = text
    .split(/\n| {2,}/)
    .map((line) => line.trim())
    .filter(Boolean);

  const nameKeywords = [
    "NAME",
    "FULL NAME",
    "SURNAME",
    "NAMES",
    "HOLDER",
    "CARD HOLDER",
  ];

  for (let index = 0; index < lines.length; index += 1) {
    const upperLine = lines[index].toUpperCase();

    const hasNameKeyword = nameKeywords.some((keyword) =>
      upperLine.includes(keyword)
    );

    if (hasNameKeyword) {
      const afterColon = lines[index].split(":")[1]?.trim();

      if (afterColon && afterColon.length > 2) {
        return afterColon
          .replace(/[^a-zA-Z .]/g, "")
          .replace(/\s+/g, " ")
          .trim();
      }

      const nextLine = lines[index + 1];

      if (nextLine && nextLine.length > 2) {
        return nextLine
          .replace(/[^a-zA-Z .]/g, "")
          .replace(/\s+/g, " ")
          .trim();
      }
    }
  }

  const possibleName = lines.find((line) => {
    const cleanedLine = line.replace(/[^a-zA-Z .]/g, "").trim();

    return (
      cleanedLine.length >= 6 &&
      /^[A-Za-z .]+$/.test(cleanedLine) &&
      !cleanedLine.toUpperCase().includes("DEMOCRATIC") &&
      !cleanedLine.toUpperCase().includes("REPUBLIC") &&
      !cleanedLine.toUpperCase().includes("IDENTITY") &&
      !cleanedLine.toUpperCase().includes("CARD") &&
      !cleanedLine.toUpperCase().includes("SRI LANKA")
    );
  });

  return possibleName
    ? possibleName.replace(/[^a-zA-Z .]/g, "").replace(/\s+/g, " ").trim()
    : "";
}

async function fileToBuffer(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function runOcr(buffer: Buffer) {
  const worker = await createWorker("eng");

  try {
    const result = await worker.recognize(buffer);
    return result.data.text || "";
  } finally {
    await worker.terminate();
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const frontFile = formData.get("guarantorNicFront");
    const backFile = formData.get("guarantorNicBack");

    if (!(frontFile instanceof File) || frontFile.size === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Guarantor NIC front image is required.",
        },
        { status: 400 }
      );
    }

    if (!(backFile instanceof File) || backFile.size === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Guarantor NIC back image is required.",
        },
        { status: 400 }
      );
    }

    const frontBuffer = await fileToBuffer(frontFile);
    const backBuffer = await fileToBuffer(backFile);

    const [frontText, backText] = await Promise.all([
      runOcr(frontBuffer),
      runOcr(backBuffer),
    ]);

    const combinedText = `${frontText}\n${backText}`;
    const cleanedText = cleanText(combinedText);

    const nic = extractNic(cleanedText);
    const name = extractName(cleanedText);

    if (!nic && !name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Could not read guarantor details clearly. Please upload clear NIC front and back images.",
          extractedText: cleanedText,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Guarantor details extracted successfully.",
        guarantor: {
          name,
          nic,
        },
        extractedText: cleanedText,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GUARANTOR_NIC_OCR_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to extract guarantor NIC details.",
      },
      { status: 500 }
    );
  }
}