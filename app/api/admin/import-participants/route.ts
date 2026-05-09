import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/enums";
import bcrypt from "bcryptjs";

/**
 * POST /api/admin/import-participants
 * Bulk-create participant accounts from CSV text.
 * CSV format: name,email,phone,campus (header row required)
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAccess(session.user.role, Role.SUPER_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { csv } = await req.json();
    if (!csv || typeof csv !== "string") {
      return NextResponse.json({ error: "CSV data is required." }, { status: 400 });
    }

    const lines = csv.trim().split("\n").map((l: string) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV must have a header row and at least one data row." }, { status: 400 });
    }

    // Parse header
    const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase());
    const nameIdx = headers.indexOf("name");
    const emailIdx = headers.indexOf("email");
    const phoneIdx = headers.indexOf("phone");
    const campusIdx = headers.indexOf("campus");

    if (nameIdx === -1 || emailIdx === -1) {
      return NextResponse.json({ error: "CSV must have 'name' and 'email' columns." }, { status: 400 });
    }

    let created = 0;
    const errors: string[] = [];
    const tempPassword = await bcrypt.hash("Welcome2026!", 10);

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c: string) => c.trim());
      const name = cols[nameIdx];
      const email = cols[emailIdx]?.toLowerCase();
      const phone = phoneIdx !== -1 ? cols[phoneIdx] : undefined;
      const campus = campusIdx !== -1 ? cols[campusIdx] : undefined;

      if (!name || !email) {
        errors.push(`Row ${i + 1}: missing name or email`);
        continue;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`Row ${i + 1}: invalid email "${email}"`);
        continue;
      }

      try {
        await db.user.upsert({
          where: { email },
          update: {}, // don't overwrite existing accounts
          create: {
            name,
            email,
            passwordHash: tempPassword,
            role: Role.PARTICIPANT,
            phone: phone || null,
            campus: campus || null,
            isActive: true,
          },
        });
        created++;
      } catch {
        errors.push(`Row ${i + 1}: failed to create user "${email}"`);
      }
    }

    return NextResponse.json({ success: true, created, errors });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Import failed." }, { status: 500 });
  }
}
