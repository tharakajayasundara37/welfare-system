import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/getCurrentUser";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const url = request.nextUrl.searchParams.get("url");
    if (!url) return new NextResponse("Missing file URL", { status: 400 });

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    // මෙතනදී ලොග් එකක් දානවා, Vercel Logs වලදී Token එකක් තියෙනවද කියලා බලන්න පුළුවන්
    if (!token) {
      console.error("CRITICAL: BLOB_READ_WRITE_TOKEN is undefined in Vercel!");
      return new NextResponse("Server Configuration Error: Token missing", { status: 500 });
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const err = await response.text();
      return new NextResponse(`Blob Error: ${err}`, { status: response.status });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}