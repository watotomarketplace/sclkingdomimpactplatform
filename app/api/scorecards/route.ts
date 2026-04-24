import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") ?? "1");
  const userId = searchParams.get("userId") ?? session.user.id;

  // Only admins/facilitators can view other users' scorecards
  if (userId !== session.user.id && session.user.role === "PARTICIPANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scorecard = await db.scorecard.findUnique({
    where: { userId_month: { userId, month } },
  });

  return NextResponse.json({ scorecard });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // If only updating facilitator notes, allow facilitators and above
  if (body.updateNotesOnly) {
    if (session.user.role !== "FACILITATOR" && session.user.role !== "PROGRAM_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const updated = await db.scorecard.updateMany({
      where: { userId: body.userId, month: body.month },
      data: { facilitatorNotes: body.facilitatorNotes ?? null },
    });
    return NextResponse.json({ success: true, updated });
  }

  if (session.user.role !== "PARTICIPANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { month, ...fields } = body;

  const scorecard = await db.scorecard.upsert({
    where: { userId_month: { userId: session.user.id, month } },
    create: { userId: session.user.id, month, ...fields },
    update: { ...fields },
  });

  // Escalation detection: check last 3 scorecards
  const recentScorecards = await db.scorecard.findMany({
    where: { userId: session.user.id },
    orderBy: { month: "desc" },
    take: 3,
  });

  function getScorecardOverallStatus(sc: {
    problemClarity: string;
    researchEffort: string;
    executionDiscipline: string;
    mvpProgress: string;
    kingdomAlignment: string;
    peerEngagement: string;
  }) {
    const statuses = [sc.problemClarity, sc.researchEffort, sc.executionDiscipline, sc.mvpProgress, sc.kingdomAlignment, sc.peerEngagement];
    if (statuses.some(s => s === "ESCALATE")) return "ESCALATE";
    if (statuses.some(s => s === "NEEDS_ATTENTION")) return "NEEDS_ATTENTION";
    return "ON_TRACK";
  }

  const escalateCount = recentScorecards.filter(sc => getScorecardOverallStatus(sc) === "ESCALATE").length;

  if (escalateCount >= 2) {
    const podMembership = await db.podMember.findUnique({
      where: { userId: session.user.id },
      include: { pod: true },
    });

    if (podMembership?.pod.facilitatorId) {
      const notifType = escalateCount >= 3 ? "RED_FLAG" : "AMBER_ALERT";
      const existingNotif = await db.notification.findFirst({
        where: {
          userId: podMembership.pod.facilitatorId,
          type: notifType,
          isRead: false,
        },
      });
      if (!existingNotif) {
        await db.notification.create({
          data: {
            userId: podMembership.pod.facilitatorId,
            type: notifType,
            message: escalateCount >= 3
              ? `Red flag: participant has ${escalateCount} consecutive Escalate scorecards`
              : `Attention needed: participant has 2 consecutive Escalate scorecards`,
            link: `/facilitator/participants/${session.user.id}`,
          },
        });
      }

      if (escalateCount >= 3) {
        await db.auditLog.create({
          data: {
            actorId: session.user.id,
            action: "SCORECARD_RED_FLAG",
            targetId: session.user.id,
            details: { escalateCount },
          },
        });
      }
    }
  }

  return NextResponse.json({ scorecard });
}
