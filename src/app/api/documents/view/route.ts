import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getCurrentUser } from "@/lib/getCurrentUser";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const url = request.nextUrl.searchParams.get("url");
    if (!url) return new NextResponse("Missing file URL", { status: 400 });

    // 1. If it's a Base64 string (Grant Document)
    if (url.startsWith("data:")) {
      const base64Data = url.split(",")[1];
      const contentType = url.split(";")[0].split(":")[1];
      const buffer = Buffer.from(base64Data, "base64");

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType || "application/octet-stream",
          "Cache-Control": "no-store",
        },
      });
    }

    // 2. If it's a Vercel Blob URL (Loan Document)
    const result = await get(url, { access: "private" });

    if (!result || result.statusCode !== 200) {
      return new NextResponse("File not found in storage", { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || "application/octet-stream",
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
    
  } catch (error) {
    console.error("DOCUMENT_VIEW_ERROR:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}