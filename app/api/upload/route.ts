import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

/**
 * POST /api/upload
 *
 * Token endpoint for Vercel Blob **client uploads**. The browser calls
 * `upload()` from `@vercel/blob/client`, which posts here to obtain a
 * short-lived client token, then streams the file directly to Blob storage.
 *
 * This bypasses Vercel's 4.5 MB serverless request-body limit, so large
 * files (up to 50 MB) can be uploaded.
 */

// Content types participants are allowed to upload (PDF, Office docs, images, audio, video).
const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: Request): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        const session = await auth();
        if (!session?.user) throw new Error("Unauthorized");
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          throw new Error("File storage is not configured. Please contact support.");
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_SIZE_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      // No server-side post-processing needed; the client stores the returned URL.
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
