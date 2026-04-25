import "dotenv/config";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { defineConfig } from "prisma/config";

// For Prisma Migrate (CLI): use the DIRECT (non-pooling) connection.
// pgbouncer does not support the extended protocol that migrations require.
// On Vercel+Neon: POSTGRES_URL_NON_POOLING is injected automatically.
// Locally: copy .env.local from Neon dashboard.
const migrationUrl =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error(
    "No direct database URL found for migrations. " +
    "Set POSTGRES_URL_NON_POOLING (Neon/Vercel) or DATABASE_URL."
  );
}

export default defineConfig({
  ...(({ earlyAccess: true } as unknown) as object),
  schema: "prisma/schema.prisma",
  datasource: {
    url: migrationUrl,
  },
} as Parameters<typeof defineConfig>[0]);
