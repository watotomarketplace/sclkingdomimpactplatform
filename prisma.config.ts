import "dotenv/config";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { defineConfig } from "prisma/config";

// Vercel Postgres injects POSTGRES_PRISMA_URL (pgbouncer-compatible) or POSTGRES_URL.
// Fall back to DATABASE_URL for local / non-Vercel environments.
const databaseUrl =
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "No database URL found. Set DATABASE_URL (or POSTGRES_PRISMA_URL / POSTGRES_URL on Vercel)."
  );
}

export default defineConfig({
  // earlyAccess required for prisma-client generator in Prisma v7
  ...(({ earlyAccess: true } as unknown) as object),
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
} as Parameters<typeof defineConfig>[0]);
