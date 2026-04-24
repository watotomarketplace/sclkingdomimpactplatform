import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { CohortProgressTable } from "@/components/shared/cohort-progress-table";

function getOverallStatus(sc: { problemClarity: string; researchEffort: string; executionDiscipline: string; mvpProgress: string; kingdomAlignment: string; peerEngagement: string }) {
  const statuses = [sc.problemClarity, sc.researchEffort, sc.executionDiscipline, sc.mvpProgress, sc.kingdomAlignment, sc.peerEngagement];
  if (statuses.some(s => s === "ESCALATE")) return "ESCALATE" as const;
  if (statuses.some(s => s === "NEEDS_ATTENTION")) return "NEEDS_ATTENTION" as const;
  return "ON_TRACK" as const;
}

export default async function FacilitatorCohortProgressPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.FACILITATOR)) redirect("/");

  const pods = await db.pod.findMany({
    where: { facilitatorId: session.user.id },
    include: {
      members: {
        include: {
          user: {
            include: {
              participantProfile: true,
              submissions: { orderBy: { updatedAt: "desc" }, take: 1 },
              scorecards: { orderBy: { month: "desc" }, take: 1 },
            },
          },
        },
      },
    },
  });

  const participants = pods.flatMap(pod =>
    pod.members.map(({ user }) => {
      const scorecard = user.scorecards[0];
      const status = scorecard ? getOverallStatus(scorecard) : undefined;
      const lastSub = user.submissions[0];
      return {
        id: user.id,
        name: user.name,
        podName: pod.name,
        currentMonth: user.participantProfile?.currentMonth ?? 1,
        latestScorecardStatus: status,
        lastActivity: lastSub?.updatedAt ?? null,
        gateStatus: null as string | null,
      };
    })
  );

  return (
    <div className="px-6 py-6 max-w-[900px]">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-text-primary">Cohort Progress</h1>
        <p className="text-text-secondary text-sm mt-1">{participants.length} participant{participants.length !== 1 ? "s" : ""} across your pods</p>
      </div>

      <CohortProgressTable
        participants={participants}
        participantLinkBase="/facilitator/participants"
      />
    </div>
  );
}
