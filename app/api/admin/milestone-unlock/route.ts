import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MilestoneType, MilestoneStatus, Role } from "@/app/generated/prisma/enums";
import { isAdmin } from "@/lib/roles";
import { MILESTONE_ORDER, MILESTONE_DEADLINES } from "@/lib/milestones";
import { Prisma } from "@/app/generated/prisma/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role as Role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { participantId, targetMilestone } = body as {
    participantId: string;
    targetMilestone: MilestoneType;
  };

  if (!participantId || !targetMilestone) {
    return NextResponse.json(
      { error: "participantId and targetMilestone are required." },
      { status: 400 }
    );
  }

  const targetIdx = MILESTONE_ORDER.indexOf(targetMilestone);
  if (targetIdx <= 0) {
    return NextResponse.json(
      { error: "Invalid or non-unlockable milestone." },
      { status: 400 }
    );
  }

  const now = new Date();

  // Cascade: mark each prerequisite as SUBMITTED if not already.
  // Never overwrite a record that the participant genuinely submitted.
  for (let i = 0; i < targetIdx; i++) {
    const prereq = MILESTONE_ORDER[i];
    const existing = await db.milestoneSubmission.findUnique({
      where: { userId_milestoneType: { userId: participantId, milestoneType: prereq } },
    });

    if (!existing) {
      await db.milestoneSubmission.create({
        data: {
          userId: participantId,
          milestoneType: prereq,
          formData: {} as Prisma.InputJsonValue,
          status: MilestoneStatus.SUBMITTED,
          submittedAt: now,
          deadline: MILESTONE_DEADLINES[prereq],
          reviewedById: session.user.id,
          reviewNotes: "Admin force-unlocked",
        },
      });
    } else if (existing.status !== MilestoneStatus.SUBMITTED && !existing.submittedAt) {
      await db.milestoneSubmission.update({
        where: { userId_milestoneType: { userId: participantId, milestoneType: prereq } },
        data: {
          status: MilestoneStatus.SUBMITTED,
          submittedAt: now,
          reviewedById: session.user.id,
          reviewNotes: "Admin force-unlocked",
        },
      });
    }
    // Already SUBMITTED → leave untouched
  }

  // Seed the target milestone as NOT_STARTED (preserve any existing draft).
  await db.milestoneSubmission.upsert({
    where: { userId_milestoneType: { userId: participantId, milestoneType: targetMilestone } },
    update: {},
    create: {
      userId: participantId,
      milestoneType: targetMilestone,
      formData: {} as Prisma.InputJsonValue,
      status: MilestoneStatus.NOT_STARTED,
      deadline: MILESTONE_DEADLINES[targetMilestone],
    },
  });

  return NextResponse.json({ success: true });
}
