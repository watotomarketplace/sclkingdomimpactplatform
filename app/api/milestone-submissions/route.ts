import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";
import { MILESTONE_DEADLINES, computeUnlocked } from "@/lib/milestones";
import { Prisma } from "@/app/generated/prisma/client";

/**
 * Addendum 3 — Milestone Submission API
 * GET  /api/milestone-submissions         → list all submissions for the current user
 * POST /api/milestone-submissions         → create or update a milestone submission
 *
 * Auto-unlock: when a milestone is submitted (draft=false), the next milestone
 * in the sequence is automatically unlocked (its record is created at NOT_STARTED).
 */

// Schema for each milestone type — validated server-side
const baseSchema = z.object({
  milestoneType: z.nativeEnum(MilestoneType),
  draft: z.boolean().optional().default(false),
  formData: z.record(z.string(), z.unknown()),
});

// Milestone-specific required fields
const REQUIRED_FIELDS: Record<MilestoneType, string[]> = {
  ONBOARDING: [], // handled by onboarding route
  MILESTONE_1: [
    "validationQuestion",
    "interviewCount",
    "keyFindings",
    "assumptionResult",
    "pivotOrPersist",
    "evidenceSummary",
  ],
  MILESTONE_2: [
    "mviDescription",
    "testPlan",
    "participantCount",
    "feedbackReceived",
    "iterationsMAde",
    "keyLearning",
    "nextStep",
  ],
  MILESTONE_3: [
    "implementationSummary",
    "challengesFaced",
    "adaptationsMade",
    "communityResponse",
    "healingEvidence",
    "monthlyReflection",
  ],
  MILESTONE_4: [
    "finalImpactSummary",
    "healingAchieved",
    "beneficiariesServed",
    "sustainabilityPlan",
    "lessonsLearned",
    "futureVision",
    "testimonial",
  ],
};

const MILESTONE_ORDER: MilestoneType[] = [
  MilestoneType.ONBOARDING,
  MilestoneType.MILESTONE_1,
  MilestoneType.MILESTONE_2,
  MilestoneType.MILESTONE_3,
  MilestoneType.MILESTONE_4,
];

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    // Validate required fields if not a draft
    if (!isDraft) {
      const required = REQUIRED_FIELDS[milestoneType];
      const missing = required.filter(
        (field) => !formData[field] || String(formData[field]).trim() === ""
      );
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Please complete all required fields. Missing: ${missing.join(", ")}.` },
          { status: 400 }
        );
      }
    }

    // Check milestone is unlocked for this user
    const existingSubmissions = await db.milestoneSubmission.findMany({
      where: { userId: session.user.id },
      select: { milestoneType: true, status: true, submittedAt: true },
    });
    const unlocked = computeUnlocked(existingSubmissions);
    if (!unlocked.includes(milestoneType) && milestoneType !== MilestoneType.ONBOARDING) {
      return NextResponse.json({ error: "This milestone is not yet unlocked." }, { status: 403 });
    }

    const deadline = MILESTONE_DEADLINES[milestoneType];
    const jsonData = formData as Prisma.InputJsonValue;

    // Upsert the submission
    const submission = await db.milestoneSubmission.upsert({
      where: {
        userId_milestoneType: {
          userId: session.user.id,
          milestoneType,
        },
      },
      update: {
        formData: jsonData,
        status: isDraft ? MilestoneStatus.IN_PROGRESS : MilestoneStatus.SUBMITTED,
        submittedAt: isDraft ? null : now,
        updatedAt: now,
      },
      create: {
        userId: session.user.id,
        milestoneType,
        formData: jsonData,
        status: isDraft ? MilestoneStatus.IN_PROGRESS : MilestoneStatus.SUBMITTED,
        submittedAt: isDraft ? null : now,
        deadline,
      },
    });

    // Auto-unlock: if submitted, ensure the next milestone record exists at NOT_STARTED
    if (!isDraft) {
      const currentIndex = MILESTONE_ORDER.indexOf(milestoneType);
      const nextMilestone = MILESTONE_ORDER[currentIndex + 1];
      if (nextMilestone) {
        await db.milestoneSubmission.upsert({
          where: {
            userId_milestoneType: {
              userId: session.user.id,
              milestoneType: nextMilestone,
            },
          },
          update: {}, // don't overwrite existing progress
          create: {
            userId: session.user.id,
            milestoneType: nextMilestone,
            formData: {} as Prisma.InputJsonValue,
            status: MilestoneStatus.NOT_STARTED,
            deadline: MILESTONE_DEADLINES[nextMilestone],
          },
        });
      }
    }

    return NextResponse.json({ success: true, submission, complete: !isDraft });
  } catch (err) {
    console.error("Milestone submission error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
