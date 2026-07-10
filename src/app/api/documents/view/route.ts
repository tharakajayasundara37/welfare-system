import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/getCurrentUser";

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

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      return new NextResponse("File access denied", { status: response.status });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
        "Content-Disposition": "inline",
      },
    });

  } catch (error) {
    console.error("DOCUMENT_VIEW_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}