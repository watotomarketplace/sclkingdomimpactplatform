import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Auth — NextAuth v5 uses AUTH_SECRET (also accepts NEXTAUTH_SECRET as fallback)
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),

  // File storage (Vercel Blob) — optional at build time, required at runtime for uploads
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Cron security — optional (if absent, cron endpoints are open to any caller)
  CRON_SECRET: z.string().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),

  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Parse and validate at module load time.
// In production this will surface misconfigurations during build/startup rather than
// at request time when it's too late to diagnose easily.
const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  const missing = _parsed.error.issues
    .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`[env] Missing or invalid environment variables:\n${missing}`);
}

export const env = _parsed.data;

// Warn about optional-but-important vars
if (!env.BLOB_READ_WRITE_TOKEN) {
  console.warn("[env] BLOB_READ_WRITE_TOKEN is not set — file uploads will be disabled.");
}
if (!env.CRON_SECRET) {
  console.warn("[env] CRON_SECRET is not set — cron endpoints are unauthenticated.");
}
if (!env.RESEND_API_KEY) {
  console.warn("[env] RESEND_API_KEY is not set — email delivery will fail.");
}
