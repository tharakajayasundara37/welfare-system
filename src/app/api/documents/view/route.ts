import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getCurrentUser } from "@/lib/getCurrentUser";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
      return new NextResponse("Missing file URL", { status: 400 });
    }

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
    console.error("FINAL_DOCUMENT_VIEW_ERROR:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}