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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.PROGRAM_ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const isSuperAdmin = session.user.role === Role.SUPER_ADMIN;

  const targetUser = await db.user.findUnique({ where: { id }, select: { role: true } });
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Only Super Admin can modify Super Admin accounts (and only their own or other SAs)
  if (targetUser.role === "SUPER_ADMIN" && !isSuperAdmin) {
    return NextResponse.json({ error: "Cannot modify Super Admin accounts" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};

  // isActive toggle — available to PROGRAM_ADMIN+
  if (typeof body.isActive === "boolean") {
    updateData.isActive = body.isActive;
  }

  // Full profile edit — Super Admin only
  if (isSuperAdmin) {
    if (body.name?.trim()) updateData.name = body.name.trim();
    if (body.email?.trim()) {
      const normalised = body.email.toLowerCase().trim();
      // Check duplicate only if email is actually changing
      const current = await db.user.findUnique({ where: { id }, select: { email: true } });
      if (current?.email !== normalised) {
        const conflict = await db.user.findUnique({ where: { email: normalised } });
        if (conflict) {
          return NextResponse.json({ error: "Email already in use." }, { status: 409 });
        }
      }
      updateData.email = normalised;
    }
    if (body.role && VALID_ROLES.includes(body.role as Role)) {
      updateData.role = body.role as Role;
    }
    if (body.password) {
      if (body.password.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
      }
      updateData.passwordHash = await bcrypt.hash(body.password, 12);
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, isActive: true, emailVerified: true, createdAt: true },
  });

  // Determine audit action
  let action = "USER_UPDATED";
  if ("isActive" in updateData && Object.keys(updateData).length === 1) {
    action = updateData.isActive === false ? "USER_SUSPENDED" : "USER_REACTIVATED";
  }

  const auditDetails: Record<string, unknown> = {};
  if ("name" in updateData) auditDetails.name = updateData.name;
  if ("email" in updateData) auditDetails.email = updateData.email;
  if ("role" in updateData) auditDetails.role = updateData.role;
  if ("isActive" in updateData) auditDetails.isActive = updateData.isActive;
  if ("passwordHash" in updateData) auditDetails.passwordChanged = true;

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action,
      targetId: id,
      details: JSON.parse(JSON.stringify(auditDetails)),
    },
  });

  return NextResponse.json(user);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.SUPER_ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  // Cannot delete yourself
  if (id === session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  // Cannot delete other Super Admins
  const targetUser = await db.user.findUnique({ where: { id }, select: { role: true, name: true } });
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (targetUser.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cannot delete Super Admin accounts." }, { status: 403 });
  }

  // Hard delete with manual cascade (in transaction order: dependents first)
  await db.$transaction(async (tx) => {
    // Set facilitatorId null on pods they facilitated
    await tx.pod.updateMany({ where: { facilitatorId: id }, data: { facilitatorId: null } });
    // Set reviewerId null on gate reviews they made
    await tx.gateReview.updateMany({ where: { reviewerId: id }, data: { reviewerId: null } });
    // Delete coaching notes they sent/received
    await tx.coachingNote.deleteMany({ where: { OR: [{ authorId: id }, { recipientId: id }] } });
    // Delete notifications
    await tx.notification.deleteMany({ where: { userId: id } });
    // Delete gate reviews for their submissions
    await tx.gateReview.deleteMany({ where: { submission: { userId: id } } });
    // Delete submissions
    await tx.submission.deleteMany({ where: { userId: id } });
    // Delete scorecards
    await tx.scorecard.deleteMany({ where: { userId: id } });
    // Delete journal entries
    await tx.journalEntry.deleteMany({ where: { userId: id } });
    // Delete pod membership
    await tx.podMember.deleteMany({ where: { userId: id } });
    // Delete invitations they sent
    await tx.invitation.updateMany({ where: { invitedById: id }, data: { status: "EXPIRED" } });
    // Delete invitation linked to this user
    await tx.invitation.deleteMany({ where: { userId: id } });
    // Delete participant profile (cascades automatically but be explicit)
    await tx.participantProfile.deleteMany({ where: { userId: id } });
    // Finally delete the user
    await tx.user.delete({ where: { id } });
  });

  // The audit log is written by the session user (still exists)
  try {
    await db.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "USER_HARD_DELETED",
        targetId: id,
        details: { deletedUser: targetUser.name, role: targetUser.role },
      },
    });
  } catch {
    // Audit log creation can fail silently — deletion already succeeded
  }

  return NextResponse.json({ success: true });
}
