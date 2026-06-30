import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * POST /api/upload
 * Issues a client-upload token (onBeforeGenerateToken) and handles the
 * completion callback (onUploadCompleted) from Vercel Blob.
 * Files go browser → Vercel Blob directly, bypassing the 4.5 MB serverless
 * function body limit that would otherwise silently cap uploads.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "audio/mpeg",
          "audio/mp4",
          "audio/x-m4a",
          "image/jpeg",
          "image/png",
          "image/gif",
          "video/mp4",
        ],
        maximumSizeInBytes: 25 * 1024 * 1024,
        tokenPayload: JSON.stringify({ userId: session!.user.id }),
      }),
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("[upload] completed", blob.url, tokenPayload);
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("[upload] handleUpload error:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 400 });
  }
}
