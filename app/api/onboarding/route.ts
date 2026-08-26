import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";
import { MILESTONE_DEADLINES } from "@/lib/milestones";

/**
 * Addendum 3: MVI Brief onboarding submission.
 * 12-field intake captured on first login (replaces covenant + readiness).
 */

const briefSchema = z.object({
  initiativeName:    z.string().min(2, "Initiative name is required"),
  problemStatement:  z.string().min(10, "Please describe the problem"),
  healingHoped:      z.string().min(10, "Describe the healing you hope to see"),
  beneficiaries:     z.string().min(5),
  mviSummary:        z.string().min(10),
  singleAssumption:  z.string().min(5),
  buyInNeeded:       z.string().min(5),
  resourcesRequired: z.string().min(5),
  realisticTimeline: z.string().min(5),
  likelyResistance:  z.string().min(5),
  evidencePlan:      z.string().min(5),
  firstTestDate:     z.string().min(1, "Pick a date"),
  // Optional: save as draft (skip strict validation by setting `draft: true`)
});

const draftSchema = briefSchema.partial();

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { mviBriefData: true, onboardingComplete: true, onboardingCompletedAt: true },
  });

  return NextResponse.json({
    brief: user?.mviBriefData ?? null,
    complete: user?.onboardingComplete ?? false,
    completedAt: user?.onboardingCompletedAt ?? null,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const isDraft = !!body.draft;
    const parsed = isDraft ? draftSchema.safeParse(body) : briefSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const now = new Date();

    // Update user — store brief and (if final) mark onboarding complete
    await db.user.update({
      where: { id: session.user.id },
      data: {
        mviBriefData: data,
        ...(isDraft
          ? {}
          : {
              onboardingComplete: true,
              onboardingCompletedAt: now,
              // Legacy back-compat for old proxy/check
              covenantSigned: true,
              covenantSignedAt: now,
            }),
      },
    });

    // If onboarding was already reviewed and this is a genuine re-submission (not a draft
    // save), the old review no longer applies to the new answers.
    const existingOnboarding = await db.milestoneSubmission.findUnique({
      where: {
        userId_milestoneType: {
          userId: session.user.id,
          milestoneType: MilestoneType.ONBOARDING,
        },
      },
    });
    const clearsStaleReview = !isDraft && existingOnboarding?.reviewedAt != null;

    // Create or update the ONBOARDING milestone submission record
    await db.milestoneSubmission.upsert({
      where: {
        userId_milestoneType: {
          userId: session.user.id,
          milestoneType: MilestoneType.ONBOARDING,
        },
      },
      update: {
        formData: data,
        status: isDraft ? MilestoneStatus.IN_PROGRESS : MilestoneStatus.SUBMITTED,
        submittedAt: isDraft ? null : now,
        ...(clearsStaleReview
          ? { reviewedAt: null, reviewedById: null, reviewNotes: null }
          : {}),
      },
      create: {
        userId: session.user.id,
        milestoneType: MilestoneType.ONBOARDING,
        formData: data,
        status: isDraft ? MilestoneStatus.IN_PROGRESS : MilestoneStatus.SUBMITTED,
        submittedAt: isDraft ? null : now,
        deadline: new Date("2026-05-30T23:59:59Z"),
      },
    });

    if (clearsStaleReview && existingOnboarding?.reviewedById) {
      await db.notification.create({
        data: {
          userId: existingOnboarding.reviewedById,
          type: "MILESTONE_RESUBMITTED",
          message: `${session.user.name} updated their Onboarding submission after your review — please take another look.`,
          link: `/facilitator/reviews/onboarding`,
        },
      }).catch(() => undefined); // notifications are best-effort
    }

    if (!isDraft) {
      await db.milestoneSubmission.upsert({
        where: { userId_milestoneType: { userId: session.user.id, milestoneType: MilestoneType.MILESTONE_1 } },
        update: {},
        create: {
          userId: session.user.id,
          milestoneType: MilestoneType.MILESTONE_1,
          formData: {},
          status: MilestoneStatus.NOT_STARTED,
          deadline: MILESTONE_DEADLINES[MilestoneType.MILESTONE_1],
        },
      });
    }

    return NextResponse.json({ success: true, complete: !isDraft });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    console.error("Onboarding submit error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
