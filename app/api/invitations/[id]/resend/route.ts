import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { generateToken } from "@/lib/tokens";
import { sendInvitationEmail } from "@/lib/email";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.PROGRAM_ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const invitation = await db.invitation.findUnique({ where: { id } });
  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  // Only PENDING or EXPIRED invitations can be resent
  if (invitation.status === "ACCEPTED") {
    return NextResponse.json({ error: "This invitation has already been accepted." }, { status: 400 });
  }

  // Check the invitee doesn't already have an account
  const existing = await db.user.findUnique({ where: { email: invitation.email } });
  if (existing) {
    return NextResponse.json({ error: "This email already has an account." }, { status: 400 });
  }

  // Generate a fresh token and reset the 72-hour window
  const newToken = generateToken(48);
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  await db.invitation.update({
    where: { id },
    data: {
      token: newToken,
      expiresAt,
      status: "PENDING",
    },
  });

  await sendInvitationEmail(
    invitation.email,
    invitation.name,
    invitation.role,
    newToken,
    session.user.name ?? "SCL"
  );

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "INVITATION_RESENT",
      targetId: id,
      details: { email: invitation.email, role: invitation.role },
    },
  });

  return NextResponse.json({ success: true });
}
