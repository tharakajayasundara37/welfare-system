import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { getCurrentUser } from "@/lib/getCurrentUser";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    if (!currentUser?._id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "Image is required.",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "profile-images"
    );

    await mkdir(uploadDir, { recursive: true });

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${currentUser._id}-${Date.now()}.${extension}`;

    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/profile-images/${fileName}`;

    await User.findByIdAndUpdate(currentUser._id, {
      profileImage: imageUrl,
    });

    return NextResponse.json({
      success: true,
      imageUrl,
      message: "Profile image updated successfully.",
    });
  } catch (error) {
    console.error("UPLOAD_PROFILE_IMAGE_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload image.",
      },
      { status: 500 }
    );
  }
}