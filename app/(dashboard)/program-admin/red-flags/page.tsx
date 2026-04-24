import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { RedFlagsList } from "@/components/shared/red-flags-list";

function getOverallStatus(sc: {
  problemClarity: string;
  researchEffort: string;
  executionDiscipline: string;
  mvpProgress: string;
  kingdomAlignment: string;
  peerEngagement: string;
}) {
  const statuses = [
    sc.problemClarity,
    sc.researchEffort,
    sc.executionDiscipline,
    sc.mvpProgress,
    sc.kingdomAlignment,
    sc.peerEngagement,
  ];
  if (statuses.some((s) => s === "ESCALATE")) return "ESCALATE" as const;
  if (statuses.some((s) => s === "NEEDS_ATTENTION"))
    return "NEEDS_ATTENTION" as const;
  return "ON_TRACK" as const;
}

export default async function ProgramAdminRedFlagsPage() {
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
              scorecards: { orderBy: { month: "desc" }, take: 3 },
            },
          },
        },
      },
    },
  });

  const redFlags = pods
    .flatMap((pod) =>
      pod.members
        .map(({ user }) => {
          const scorecards = user.scorecards;
          const isRedFlag =
            scorecards.length >= 3 &&
            scorecards.every((sc) => getOverallStatus(sc) === "ESCALATE");
          if (!isRedFlag) return null;
          return {
            userId: user.id,
            userName: user.name,
            podName: pod.name,
            facilitatorName: pod.facilitator?.name,
            consecutiveEscalateCount: scorecards.length,
            lastScorecardMonth: scorecards[0]?.month ?? 1,
            lastScorecardDate: scorecards[0]?.updatedAt ?? null,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
    );

  return (
    <div className="px-6 py-6 max-w-[780px]">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-text-primary">
          Red Flags
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Participants with 3+ consecutive Escalate scorecards
        </p>
      </div>

      <RedFlagsList
        redFlags={redFlags}
        showFacilitatorColumn={true}
        participantLinkBase="/facilitator/participants"
      />
    </div>
  );
}
