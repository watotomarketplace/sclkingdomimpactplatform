import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { sendGateApprovedEmail, sendGateRevisionEmail } from "@/lib/email";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.FACILITATOR)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId, decision, feedback } = await req.json();

  const review = await db.gateReview.update({
    where: { id: reviewId },
    data: {
      decision,
      feedback,
      reviewerId: session.user.id,
      reviewedAt: new Date(),
    },
    include: {
      submission: {
        include: { user: true },
      },
    },
  });

  const participant = review.submission.user;
  const month = review.submission.month;

  // Log audit
  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: `gate_${decision.toLowerCase()}`,
      targetId: participant.id,
      details: { month, feedback, reviewId },
    },
  });

  // If approved: unlock next month
  if (decision === "APPROVED") {
    const nextMonth = month + 1;
    if (nextMonth <= 6) {
      await db.participantProfile.update({
        where: { userId: participant.id },
        data: { currentMonth: nextMonth },
      });
    }

    // Notify participant
    await db.notification.create({
      data: {
        userId: participant.id,
        type: "gate_approved",
        message: `Your Gate ${month} has been approved! Month ${nextMonth} is now unlocked.`,
        link: `/participant/journey/month-${nextMonth}`,
      },
    });

    if (participant.email) {
      await sendGateApprovedEmail(participant.email, participant.name, month).catch(console.error);
    }
  }

  // If revision requested
  if (decision === "REVISION_REQUESTED" && participant.email && feedback) {
    await db.notification.create({
      data: {
        userId: participant.id,
        type: "gate_revision",
        message: `Revision requested for Gate ${month}.`,
        link: `/participant/journey/month-${month}`,
      },
    });

    await sendGateRevisionEmail(participant.email, participant.name, month, feedback).catch(console.error);
  }

  return NextResponse.json({ review });
}
