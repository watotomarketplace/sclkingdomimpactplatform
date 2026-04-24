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
  const { name, startDate, endDate, isActive } = await req.json();
  const cohort = await db.cohort.update({
    where: { id },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(typeof isActive === "boolean" && { isActive }),
    },
  });
  await db.auditLog.create({
    data: { actorId: session.user.id, action: "COHORT_UPDATED", targetId: id },
  });
  return NextResponse.json(cohort);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.PROGRAM_ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  // Can't delete cohort with participants or pods
  const [participantCount, podCount] = await Promise.all([
    db.participantProfile.count({ where: { cohortId: id } }),
    db.pod.count({ where: { cohortId: id } }),
  ]);
  if (participantCount > 0 || podCount > 0) {
    return NextResponse.json({ error: "Cannot delete a cohort that has participants or pods." }, { status: 400 });
  }
  await db.cohort.delete({ where: { id } });
  await db.auditLog.create({
    data: { actorId: session.user.id, action: "COHORT_DELETED", targetId: id },
  });
  return NextResponse.json({ success: true });
}
