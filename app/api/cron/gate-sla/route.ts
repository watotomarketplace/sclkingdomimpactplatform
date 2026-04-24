import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendGateSlaReminderEmail, sendGateSlaEscalationEmail } from "@/lib/email";

// Protect with a secret token — call with: GET /api/cron/gate-sla?secret=<CRON_SECRET>
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Find all pending gate reviews (no decision yet)
  const pendingReviews = await db.gateReview.findMany({
    where: { decision: null },
    include: {
      submission: {
        include: {
          user: {
            include: {
              podMembership: {
                include: {
                  pod: {
                    include: { facilitator: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const programAdmins = await db.user.findMany({
    where: { role: "PROGRAM_ADMIN", isActive: true },
    select: { id: true, email: true, name: true },
  });

  let reminders = 0;
  let escalations = 0;
  const errors: string[] = [];

  for (const review of pendingReviews) {
    const daysPending = Math.floor((now.getTime() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const participant = review.submission.user;
    const facilitator = participant.podMembership?.pod.facilitator;

    // 5-day reminder to facilitator
    if (review.createdAt <= fiveDaysAgo && review.createdAt > sevenDaysAgo && facilitator) {
      try {
        await sendGateSlaReminderEmail(
          facilitator.email,
          facilitator.name,
          participant.name,
          review.submission.month,
          daysPending
        );
        reminders++;
      } catch (err) {
        errors.push(`Reminder failed for review ${review.id}: ${err}`);
      }
    }

    // 7-day escalation to all program admins
    if (review.createdAt <= sevenDaysAgo) {
      for (const admin of programAdmins) {
        try {
          await sendGateSlaEscalationEmail(
            admin.email,
            admin.name,
            participant.name,
            facilitator?.name ?? "Unassigned",
            review.submission.month,
            daysPending
          );
          escalations++;
        } catch (err) {
          errors.push(`Escalation failed for review ${review.id} to ${admin.email}: ${err}`);
        }
      }

      // Create notification for program admins in-app
      for (const admin of programAdmins) {
        const existing = await db.notification.findFirst({
          where: {
            userId: admin.id,
            type: "GATE_SLA_ESCALATION",
            link: `/program-admin/gate-reviews`,
            isRead: false,
          },
        });
        if (!existing) {
          await db.notification.create({
            data: {
              userId: admin.id,
              type: "GATE_SLA_ESCALATION",
              message: `Gate ${review.submission.month} review for ${participant.name} is overdue (${daysPending} days)`,
              link: `/program-admin/gate-reviews`,
            },
          });
        }
      }
    }
  }

  return NextResponse.json({
    processed: pendingReviews.length,
    reminders,
    escalations,
    errors: errors.length > 0 ? errors : undefined,
  });
}
