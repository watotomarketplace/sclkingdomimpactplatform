import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { ensureDefaultCohort } from "@/lib/cohorts";
import { Role } from "@/app/generated/prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.PROGRAM_ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pods = await db.pod.findMany({
    include: { facilitator: true, cohort: true, members: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(pods);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.PROGRAM_ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, cohortId, facilitatorId } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  // Cohort is optional from the caller's perspective — fall back to the default cohort.
  const resolvedCohortId = cohortId || (await ensureDefaultCohort());
  const pod = await db.pod.create({
    data: { name: name.trim(), cohortId: resolvedCohortId, facilitatorId: facilitatorId || null },
  });
  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "POD_CREATED",
      targetId: pod.id,
      details: { name, cohortId, facilitatorId },
    },
  });
  return NextResponse.json(pod, { status: 201 });
}
