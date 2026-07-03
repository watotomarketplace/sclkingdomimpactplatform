import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";

/**
 * POST   /api/pods/[id]/members   { userId }  → assign a participant to this group
 * DELETE /api/pods/[id]/members   { userId }  → remove a participant from this group
 *
 * A user belongs to exactly one group (PodMember.userId is unique), so assigning
 * moves them from any previous group.
 */

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.PROGRAM_ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: podId } = await params;
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const [pod, user] = await Promise.all([
    db.pod.findUnique({ where: { id: podId }, select: { id: true } }),
    db.user.findUnique({ where: { id: userId }, select: { id: true, role: true } }),
  ]);
  if (!pod) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role !== Role.PARTICIPANT && user.role !== Role.GROUP_LEADER) {
    return NextResponse.json({ error: "Only participants can be added to a group." }, { status: 400 });
  }

  // userId is unique on PodMember → upsert moves them if already assigned elsewhere.
  await db.podMember.upsert({
    where: { userId },
    create: { userId, podId },
    update: { podId },
  });

  await db.auditLog.create({
    data: { actorId: session.user.id, action: "POD_MEMBER_ADDED", targetId: userId, details: { podId } },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.PROGRAM_ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: podId } = await params;
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  await db.podMember.deleteMany({ where: { userId, podId } });

  await db.auditLog.create({
    data: { actorId: session.user.id, action: "POD_MEMBER_REMOVED", targetId: userId, details: { podId } },
  });

  return NextResponse.json({ success: true });
}
