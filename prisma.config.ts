import "dotenv/config";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { defineConfig } from "prisma/config";

export default defineConfig({
  // earlyAccess required for prisma-client generator in Prisma v7
  ...(({ earlyAccess: true } as unknown) as object),
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
} as Parameters<typeof defineConfig>[0]);
