import "dotenv/config";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { defineConfig } from "prisma/config";

// Database URLs are declared in prisma/schema.prisma via env():
//   url       = env("POSTGRES_PRISMA_URL")      — pooled, used at runtime
//   directUrl = env("POSTGRES_URL_NON_POOLING") — direct, used for migrations
//
// Locally:  copy .env.local from Neon dashboard into the project root.
// On Vercel: these vars are auto-injected when Neon is connected to the project.

export default defineConfig({
  // earlyAccess required for prisma-client generator in Prisma v7
  ...(({ earlyAccess: true } as unknown) as object),
  schema: "prisma/schema.prisma",
} as Parameters<typeof defineConfig>[0]);
