import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.PROGRAM_ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cohorts = await db.cohort.findMany({
    include: { participants: true, pods: true },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(cohorts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.PROGRAM_ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, startDate, endDate } = await req.json();
  if (!name?.trim() || !startDate || !endDate) {
    return NextResponse.json({ error: "name, startDate, and endDate are required" }, { status: 400 });
  }
  if (new Date(endDate) <= new Date(startDate)) {
    return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
  }
  const cohort = await db.cohort.create({
    data: {
      name: name.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: true,
    },
  });
  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "COHORT_CREATED",
      targetId: cohort.id,
      details: { name, startDate, endDate },
    },
  });
  return NextResponse.json(cohort, { status: 201 });
}
