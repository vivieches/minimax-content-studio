import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, filename } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "No image data provided" },
        { status: 400 }
      );
    }

    // Validate base64 format
    const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json(
        { error: "Invalid image format. Expected base64 data URL" },
        { status: 400 }
      );
    }

    const [, ext, base64Data] = base64Match;
    const buffer = Buffer.from(base64Data, "base64");

    // Limit file size to 5MB
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large. Maximum size is 5MB" },
        { status: 413 }
      );
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const hash = randomBytes(8).toString("hex");
    const safeFilename = filename
      ? filename.replace(/[^a-zA-Z0-9.-]/g, "_")
      : "image";
    const fileName = `${hash}-${safeFilename}.${ext}`;
    const filePath = join(UPLOAD_DIR, fileName);

    // Write file
    await writeFile(filePath, buffer);

    // Return public URL
    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      url: publicUrl,
      filename: fileName,
      size: buffer.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
