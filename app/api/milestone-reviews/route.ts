import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/enums";

/**
 * Addendum 3 — Facilitator milestone review API.
 * POST /api/milestone-reviews → add/update review notes on a submission
 */

const schema = z.object({
  submissionId: z.string().min(1),
  reviewNotes: z.string().min(1, "Please add a note before saving."),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAccess(session.user.role, Role.FACILITATOR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const { submissionId, reviewNotes } = parsed.data;

    const updated = await db.milestoneSubmission.update({
      where: { id: submissionId },
      data: {
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        reviewNotes,
      },
    });

    // Create a notification for the participant
    await db.notification.create({
      data: {
        userId: updated.userId,
        type: "MILESTONE_REVIEW",
        message: `Your ${updated.milestoneType.replace("_", " ")} submission has been reviewed by your facilitator.`,
        link: `/participant/journey/${updated.milestoneType.toLowerCase().replace("_", "-")}`,
      },
    }).catch(() => undefined); // notifications are best-effort

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Milestone review error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
