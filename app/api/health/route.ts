import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/health
 * Public health-check endpoint for Vercel uptime monitoring and manual verification.
 * Returns { status, db, timestamp } — safe to expose publicly (no sensitive data).
 */
export async function GET() {
  let dbStatus: "connected" | "error" = "error";
  let dbLatencyMs: number | null = null;

  try {
    const t0 = Date.now();
    await db.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
    dbStatus = "connected";
  } catch (err) {
    console.error("[health] DB check failed:", err);
  }

  const ok = dbStatus === "connected";

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      db: dbStatus,
      dbLatencyMs,
      timestamp: new Date().toISOString(),
      env: {
        blobConfigured: !!process.env.BLOB_READ_WRITE_TOKEN,
        emailConfigured: !!process.env.RESEND_API_KEY,
        cronSecretSet: !!process.env.CRON_SECRET,
      },
    },
    { status: ok ? 200 : 503 }
  );
}
