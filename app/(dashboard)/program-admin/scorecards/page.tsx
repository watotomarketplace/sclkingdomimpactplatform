import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { ScorecardsTable } from "@/components/shared/scorecards-table";

export default async function ProgramAdminScorecardsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.PROGRAM_ADMIN)) redirect("/");

  const pods = await db.pod.findMany({
    include: {
      facilitator: true,
      members: {
        include: {
          user: {
            include: {
              scorecards: { orderBy: { month: "desc" } },
            },
          },
        },
      },
    },
  });

  const rows = pods.flatMap((pod) =>
    pod.members.flatMap(({ user }) =>
      user.scorecards.map((sc) => ({
        userId: user.id,
        userName: user.name,
        podName: pod.name,
        facilitatorName: pod.facilitator?.name,
        month: sc.month,
        statuses: {
          problemClarity: sc.problemClarity,
          researchEffort: sc.researchEffort,
          executionDiscipline: sc.executionDiscipline,
          mvpProgress: sc.mvpProgress,
          kingdomAlignment: sc.kingdomAlignment,
          peerEngagement: sc.peerEngagement,
        },
        facilitatorNotes: sc.facilitatorNotes,
        submittedAt: sc.submittedAt,
      }))
    )
  );

  return (
    <div className="px-6 py-6 max-w-[900px]">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-text-primary">
          Scorecards
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {rows.length} scorecard{rows.length !== 1 ? "s" : ""} across all
          participants
        </p>
      </div>

      <ScorecardsTable
        rows={rows}
        showFacilitatorColumn={true}
        participantLinkBase="/facilitator/participants"
      />
    </div>
  );
}
