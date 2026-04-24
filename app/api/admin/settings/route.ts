import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.SUPER_ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Get or create singleton
  const settings = await db.systemSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.SUPER_ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { platformName, supportEmail, sessionTimeoutMin, invitationExpiryH } = body;

  const settings = await db.systemSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      ...(platformName && { platformName }),
      ...(supportEmail && { supportEmail }),
      ...(sessionTimeoutMin && { sessionTimeoutMin: Number(sessionTimeoutMin) }),
      ...(invitationExpiryH && { invitationExpiryH: Number(invitationExpiryH) }),
      updatedById: session.user.id,
    },
    update: {
      ...(platformName && { platformName }),
      ...(supportEmail && { supportEmail }),
      ...(sessionTimeoutMin && { sessionTimeoutMin: Number(sessionTimeoutMin) }),
      ...(invitationExpiryH && { invitationExpiryH: Number(invitationExpiryH) }),
      updatedById: session.user.id,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "SETTINGS_UPDATED",
      details: { platformName, supportEmail, sessionTimeoutMin, invitationExpiryH },
    },
  });

  return NextResponse.json(settings);
}
