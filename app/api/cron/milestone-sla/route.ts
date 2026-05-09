import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  MILESTONE_DEADLINES,
  MILESTONE_ORDER,
  MILESTONE_TITLES,
  MILESTONE_GRACE_DAYS,
  AT_RISK_DAYS,
  computeUnlocked,
} from "@/lib/milestones";
import { MilestoneStatus, MilestoneType, Role } from "@/app/generated/prisma/enums";

/**
 * GET /api/cron/milestone-sla
 * Escalation ladder per PRD Addendum 3 §5.2:
 *  - 3 days past deadline  → notify Group Leader
 *  - 5 days past deadline  → notify Facilitator
 *  - 10 days past deadline → flag participant AT_RISK
 *
 * Triggered daily by Vercel cron. Also callable manually with ?secret=CRON_SECRET.
 */
export async function GET(req: Request) {
  // Auth: Vercel cron sets Authorization header; also accept query secret for manual runs
  const authHeader = req.headers.get("authorization");
  const { searchParams } = new URL(req.url);
  const querySecret = searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const bearerMatch = authHeader === `Bearer ${cronSecret}`;
    const queryMatch = querySecret === cronSecret;
    if (!bearerMatch && !queryMatch) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const results = {
    processed: 0,
    groupLeaderNotifications: 0,
    facilitatorNotifications: 0,
    atRiskFlagged: 0,
    errors: [] as string[],
  };

  // Build a list of milestones whose deadlines have passed
  const pastMilestones = MILESTONE_ORDER.filter((m) => MILESTONE_DEADLINES[m] < now);
  if (pastMilestones.length === 0) {
    return NextResponse.json({ ...results, message: "No past deadlines yet." });
  }

  // Fetch all active participants with their submissions and pod membership
  const participants = await db.user.findMany({
    where: {
      role: { in: [Role.PARTICIPANT, Role.GROUP_LEADER] },
      isActive: true,
    },
    include: {
      milestoneSubmissions: {
        select: { milestoneType: true, status: true, submittedAt: true, updatedAt: true },
      },
      podMembership: {
        include: {
          pod: {
            include: {
              members: {
                where: { isLeader: true },
                include: { user: { select: { id: true } } },
              },
              facilitator: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  for (const participant of participants) {
    try {
      const subs = participant.milestoneSubmissions;
      const unlocked = computeUnlocked(subs);
      const pod = participant.podMembership?.pod ?? null;
      const groupLeaderId = pod?.members[0]?.user?.id ?? null;
      const facilitatorId = pod?.facilitator?.id ?? null;

      for (const milestone of pastMilestones) {
        if (!unlocked.includes(milestone)) continue; // not yet unlocked for this participant

        // Already submitted — skip
        const subRecord = subs.find((s) => s.milestoneType === milestone);
        if (subRecord?.submittedAt || subRecord?.status === MilestoneStatus.SUBMITTED) continue;

        const deadline = MILESTONE_DEADLINES[milestone];
        const daysLate = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
        const gracePeriod = MILESTONE_GRACE_DAYS[milestone];

        if (daysLate <= gracePeriod) continue; // still within grace period

        const milestoneTitle = MILESTONE_TITLES[milestone];
        const participantName = participant.name ?? participant.email;

        results.processed++;

        // ── 10+ days past → flag AT_RISK ────────────────────────────────
        if (daysLate >= AT_RISK_DAYS) {
          await db.milestoneSubmission.upsert({
            where: {
              userId_milestoneType: {
                userId: participant.id,
                milestoneType: milestone,
              },
            },
            update: { status: MilestoneStatus.AT_RISK },
            create: {
              userId: participant.id,
              milestoneType: milestone,
              status: MilestoneStatus.AT_RISK,
              formData: {},
            },
          });
          results.atRiskFlagged++;
        }

        // ── 5+ days past → notify Facilitator ───────────────────────────
        if (daysLate >= 5 && facilitatorId) {
          const notifType = `MILESTONE_LATE_FACILITATOR_${milestone}`;
          const existing = await db.notification.findFirst({
            where: {
              userId: facilitatorId,
              type: notifType,
              isRead: false,
              message: { contains: participant.id },
            },
          });
          if (!existing) {
            await db.notification.create({
              data: {
                userId: facilitatorId,
                type: notifType,
                message: `${participantName} needs coaching support — no submission for ${milestoneTitle} (${daysLate} days overdue). Reach out and ask what is blocking them.`,
                link: `/facilitator/participants/${participant.id}`,
              },
            });
            results.facilitatorNotifications++;
          }
        }

        // ── 3+ days past → notify Group Leader ──────────────────────────
        if (daysLate >= 3 && groupLeaderId && groupLeaderId !== participant.id) {
          const notifType = `MILESTONE_LATE_GL_${milestone}`;
          const existing = await db.notification.findFirst({
            where: {
              userId: groupLeaderId,
              type: notifType,
              isRead: false,
              message: { contains: participant.id },
            },
          });
          if (!existing) {
            await db.notification.create({
              data: {
                userId: groupLeaderId,
                type: notifType,
                message: `${participantName} has not submitted ${milestoneTitle}. Please follow up with them this week.`,
                link: `/group-leader`,
              },
            });
            results.groupLeaderNotifications++;
          }
        }
      }
    } catch (err) {
      results.errors.push(`User ${participant.id}: ${String(err)}`);
    }
  }

  return NextResponse.json(results);
}
