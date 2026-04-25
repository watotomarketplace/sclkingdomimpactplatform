import "dotenv/config";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString =
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  console.log("🌱 Seeding Super Admin accounts...");

  const superAdmins = [
    {
      email: process.env.SUPER_ADMIN_EMAIL_1 ?? "admin1@scl-platform.org",
      name: process.env.SUPER_ADMIN_NAME_1 ?? "Super Admin 1",
      password: process.env.SUPER_ADMIN_PASSWORD_1 ?? "SCLAdmin2026!",
    },
    {
      email: process.env.SUPER_ADMIN_EMAIL_2 ?? "admin2@scl-platform.org",
      name: process.env.SUPER_ADMIN_NAME_2 ?? "Super Admin 2",
      password: process.env.SUPER_ADMIN_PASSWORD_2 ?? "SCLAdmin2026!",
    },
  ];

  for (const admin of superAdmins) {
    const existing = await db.user.findUnique({ where: { email: admin.email } });
    if (existing) {
      console.log(`  ✓ Super Admin ${admin.email} already exists — skipping`);
      continue;
    }

    const passwordHash = await bcrypt.hash(admin.password, 12);
    await db.user.create({
      data: {
        email: admin.email,
        name: admin.name,
        passwordHash,
        role: "SUPER_ADMIN",
        emailVerified: new Date(),
        isActive: true,
      },
    });
    console.log(`  ✓ Created Super Admin: ${admin.email}`);
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
