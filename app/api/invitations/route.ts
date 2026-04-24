import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { createInvitationToken } from "@/lib/tokens";
import { sendInvitationEmail } from "@/lib/email";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, role } = await req.json();

  // Validate permissions
  if (role === "PROGRAM_ADMIN" && !hasAccess(session.user.role, Role.SUPER_ADMIN)) {
    return NextResponse.json({ error: "Only Super Admins can create Program Admins." }, { status: 403 });
  }
  if (role === "FACILITATOR" && !hasAccess(session.user.role, Role.PROGRAM_ADMIN)) {
    return NextResponse.json({ error: "Only Program Admins can create Facilitators." }, { status: 403 });
  }

  // Program Admin cap
  if (role === "PROGRAM_ADMIN") {
    const count = await db.user.count({ where: { role: "PROGRAM_ADMIN" } });
    if (count >= 5) {
      return NextResponse.json({ error: "Maximum of 5 Program Admin accounts reached." }, { status: 400 });
    }
  }

  // Check if email is already registered
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "This email already has an account." }, { status: 400 });
  }

  const invitation = await createInvitationToken(email, name, role, session.user.id);
  const { devUrl } = await sendInvitationEmail(
    email,
    name,
    role,
    invitation.token,
    session.user.name ?? "SCL"
  );

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: `invitation_sent_${role.toLowerCase()}`,
      details: { email, name, role },
    },
  });

  return NextResponse.json({ success: true, ...(devUrl ? { devUrl } : {}) });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAccess(session.user.role, Role.PROGRAM_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invitations = await db.invitation.findMany({
    include: { invitedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}
