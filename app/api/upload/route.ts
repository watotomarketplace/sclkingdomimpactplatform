import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "audio/mpeg": ".mp3",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
};

/**
 * POST /api/upload
 * Accepts multipart/form-data with a "file" field.
 * Uploads to Vercel Blob and returns { url, filename, size }.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 25 MB." },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json(
      { error: "File type not allowed. Please upload PDF, Word, PPT, image, or audio files." },
      { status: 400 }
    );
  }

  // Scope the blob path to the user for organisation
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const pathname = `submissions/${session.user.id}/${Date.now()}_${safeName}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
    });
    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
    });
  } catch (err) {
    console.error("Blob upload error:", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
