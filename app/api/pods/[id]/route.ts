import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.PROGRAM_ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { name, cohortId, facilitatorId } = await req.json();
  const pod = await db.pod.update({
    where: { id },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      ...(cohortId && { cohortId }),
      facilitatorId: facilitatorId ?? null,
    },
  });
  await db.auditLog.create({
    data: { actorId: session.user.id, action: "POD_UPDATED", targetId: id, details: { name, cohortId, facilitatorId } },
  });
  return NextResponse.json(pod);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.PROGRAM_ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const memberCount = await db.podMember.count({ where: { podId: id } });
  if (memberCount > 0) {
    return NextResponse.json({ error: "Cannot delete a pod with members. Remove members first." }, { status: 400 });
  }
  await db.pod.delete({ where: { id } });
  await db.auditLog.create({
    data: { actorId: session.user.id, action: "POD_DELETED", targetId: id },
  });
  return NextResponse.json({ success: true });
}
