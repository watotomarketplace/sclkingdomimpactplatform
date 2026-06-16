import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { MilestoneType, MilestoneStatus, Role, InitiativeType } from "@/app/generated/prisma/enums";
import { MILESTONE_DEADLINES, computeUnlocked } from "@/lib/milestones";
import { hasAccess } from "@/lib/roles";
import { Prisma } from "@/app/generated/prisma/client";

/**
 * Addendum 3 — Milestone Submission API
 * GET  /api/milestone-submissions                     → current user's submissions
 * GET  /api/milestone-submissions?participantId=<id>  → facilitators/admins view a specific participant
 * POST /api/milestone-submissions                     → create or update a submission
 *
 * Auto-unlock: when a milestone is submitted the next record is seeded at NOT_STARTED.
 */

const baseSchema = z.object({
  milestoneType: z.nativeEnum(MilestoneType),
  draft: z.boolean().optional().default(false),
  formData: z.record(z.string(), z.unknown()),
});

// Required fields keyed to the ACTUAL form field keys used by each milestone page.
const REQUIRED_FIELDS: Record<MilestoneType, string[]> = {
  ONBOARDING: [], // handled by /api/onboarding
  MILESTONE_1: [
    "initiativeType",
    "refinedProblemStatement",
    "conversationsSummary",
    "whatIsNowClearer",
    "whatTheyHadWrong",
    "changesToMVI",
  ],
  MILESTONE_2: [
    "testCycle1Date",
    "testCycle1Assumption",
    "testCycle1WhatBuilt",
    "testCycle1WhoTested",
    "testCycle1WhatTheyDid",
    "testCycle1WhatLearned",
    "behaviouralEvidence",
    "mviStatus",
  ],
  MILESTONE_3: [
    "whereRunningNow",
    "frequencyRhythm",
    "numbersReached",
    "specificImpactStory",
    "resistanceWhatPushedBack",
    "resistanceFromWhom",
    "resistanceHowResponded",
    "whatIsBecomingClearer",
  ],
  MILESTONE_4: [
    "initiativeNameFinal",
    "brokennessAddressed",
    "whatWasBuilt",
    "whatChangedWithEvidence",
    "whatDidntWork",
    "whatTheyWouldDoDifferently",
    "whatHappensNext",
    "presentationFile",
  ],
};

const MILESTONE_ORDER: MilestoneType[] = [
  MilestoneType.ONBOARDING,
  MilestoneType.MILESTONE_1,
  MilestoneType.MILESTONE_2,
  MilestoneType.MILESTONE_3,
  MilestoneType.MILESTONE_4,
];

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const participantId = searchParams.get("participantId");

  // Facilitators and admins can fetch another participant's submissions.
  if (participantId && participantId !== session.user.id) {
    if (!hasAccess(session.user.role as Role, Role.FACILITATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const submissions = await db.milestoneSubmission.findMany({
      where: { userId: participantId },
      orderBy: { milestoneType: "asc" },
    });
    return NextResponse.json({ submissions });
  }

  // Default: return the current user's own submissions.
  const submissions = await db.milestoneSubmission.findMany({
    where: { userId: session.user.id },
    orderBy: { milestoneType: "asc" },
  });
  return NextResponse.json({ submissions });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = baseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const { milestoneType, draft, formData } = parsed.data;
    const isDraft = !!draft;
    const now = new Date();

    // Server-side required-field validation on final submit.
    if (!isDraft) {
      const required = REQUIRED_FIELDS[milestoneType];
      const missing = required.filter(
        (field) => !formData[field] || String(formData[field]).trim() === ""
      );
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Please complete all required fields before submitting. ${missing.length} field(s) incomplete.` },
          { status: 400 }
        );
      }
    }

    // Milestone must be unlocked for this user (except ONBOARDING which is always open).
    const existingSubmissions = await db.milestoneSubmission.findMany({
      where: { userId: session.user.id },
      select: { milestoneType: true, status: true, submittedAt: true },
    });
    const unlocked = computeUnlocked(existingSubmissions);
    if (milestoneType !== MilestoneType.ONBOARDING && !unlocked.includes(milestoneType)) {
      return NextResponse.json({ error: "This milestone is not yet unlocked." }, { status: 403 });
    }

    const deadline = MILESTONE_DEADLINES[milestoneType];
    const jsonData = formData as Prisma.InputJsonValue;

    // Extract any file URL fields so we can also persist them to fileUrls[] for easy retrieval.
    const fileUrls = Object.entries(formData)
      .filter(([, v]) => typeof v === "string" && (v as string).startsWith("https://"))
      .map(([, v]) => v as string);

    const submission = await db.milestoneSubmission.upsert({
      where: { userId_milestoneType: { userId: session.user.id, milestoneType } },
      update: {
        formData: jsonData,
        fileUrls: fileUrls.length > 0 ? (fileUrls as unknown as Prisma.InputJsonValue) : undefined,
        status: isDraft ? MilestoneStatus.IN_PROGRESS : MilestoneStatus.SUBMITTED,
        submittedAt: isDraft ? undefined : now,
        updatedAt: now,
      },
      create: {
        userId: session.user.id,
        milestoneType,
        formData: jsonData,
        fileUrls: fileUrls.length > 0 ? (fileUrls as unknown as Prisma.InputJsonValue) : undefined,
        status: isDraft ? MilestoneStatus.IN_PROGRESS : MilestoneStatus.SUBMITTED,
        submittedAt: isDraft ? undefined : now,
        deadline,
      },
    });

    // Auto-seed the next milestone at NOT_STARTED so it shows up in the sidebar.
    if (!isDraft) {
      const nextMilestone = MILESTONE_ORDER[MILESTONE_ORDER.indexOf(milestoneType) + 1];
      if (nextMilestone) {
        await db.milestoneSubmission.upsert({
          where: { userId_milestoneType: { userId: session.user.id, milestoneType: nextMilestone } },
          update: {},
          create: {
            userId: session.user.id,
            milestoneType: nextMilestone,
            formData: {} as Prisma.InputJsonValue,
            status: MilestoneStatus.NOT_STARTED,
            deadline: MILESTONE_DEADLINES[nextMilestone],
          },
        });
      }

      // Persist initiativeType to the User record when Milestone 1 is submitted.
      // The User.initiativeType field (InitiativeType?) is captured once here per PRD.
      if (milestoneType === MilestoneType.MILESTONE_1) {
        const itVal = formData.initiativeType;
        if (itVal === InitiativeType.NEW_BUSINESS || itVal === InitiativeType.WORKPLACE_SOLUTION) {
          await db.user.update({
            where: { id: session.user.id },
            data: { initiativeType: itVal as InitiativeType },
          });
        }
      }
    }

    return NextResponse.json({ success: true, submission, complete: !isDraft });
  } catch (err) {
    console.error("Milestone submission error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
