import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import bcrypt from "bcryptjs";

const VALID_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.PROGRAM_ADMIN,
  Role.FACILITATOR,
  Role.PARTICIPANT,
];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.SUPER_ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, role, password } = body;

  // Validate required fields
  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!email?.trim()) return NextResponse.json({ error: "Email is required." }, { status: 400 });
  if (!password || password.length < 8)
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  if (!role || !VALID_ROLES.includes(role as Role))
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });

  // Check for duplicate email
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role as Role,
      isActive: true,
      emailVerified: new Date(), // Super Admin created accounts are pre-verified
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "USER_CREATED",
      targetId: user.id,
      details: { name: user.name, email: user.email, role: user.role, method: "direct" },
    },
  });

  return NextResponse.json(user, { status: 201 });
}
