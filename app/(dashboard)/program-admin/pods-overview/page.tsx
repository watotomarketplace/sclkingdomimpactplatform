import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/badge";
import { MONTH_TITLES } from "@/lib/utils";
import { Building2, Users, AlertTriangle, TrendingUp } from "lucide-react";

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

export default async function PodsOverviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.PROGRAM_ADMIN)) redirect("/");

  const pods = await db.pod.findMany({
    include: {
      facilitator: true,
      cohort: true,
      members: {
        include: {
          user: {
            include: {
              participantProfile: true,
              scorecards: { orderBy: { month: "desc" }, take: 1 },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalParticipants = pods.reduce((sum, p) => sum + p.members.length, 0);
  const escalateCount = pods
    .flatMap((p) => p.members)
    .filter(({ user }) => {
      const sc = user.scorecards[0];
      return sc && getOverallStatus(sc) === "ESCALATE";
    }).length;
  const avgMonth =
    totalParticipants > 0
      ? (
          pods
            .flatMap((p) => p.members)
            .reduce(
              (sum, { user }) =>
                sum + (user.participantProfile?.currentMonth ?? 1),
              0
            ) / totalParticipants
        ).toFixed(1)
      : "0";

  return (
    <div className="px-6 py-6 max-w-[900px]">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-text-primary">
          Pods Overview
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          All pods across the program
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card padding="sm">
          <CardLabel className="flex items-center gap-1">
            <Building2 size={11} />
            PODS
          </CardLabel>
          <p className="text-[26px] font-semibold text-text-primary font-mono">
            {pods.length}
          </p>
          <p className="text-xs text-text-secondary">total pods</p>
        </Card>
        <Card padding="sm">
          <CardLabel className="flex items-center gap-1">
            <Users size={11} />
            PARTICIPANTS
          </CardLabel>
          <p className="text-[26px] font-semibold text-text-primary font-mono">
            {totalParticipants}
          </p>
          <p className="text-xs text-text-secondary">across all pods</p>
        </Card>
        <Card padding="sm">
          <CardLabel className="flex items-center gap-1">
            <TrendingUp size={11} />
            AVG MONTH
          </CardLabel>
          <p className="text-[26px] font-semibold text-accent-primary font-mono">
            {avgMonth}
          </p>
          <p className="text-xs text-text-secondary">average progress</p>
        </Card>
        <Card padding="sm">
          <CardLabel className="flex items-center gap-1">
            <AlertTriangle size={11} />
            ESCALATE
          </CardLabel>
          <p className="text-[26px] font-semibold text-accent-danger font-mono">
            {escalateCount}
          </p>
          <p className="text-xs text-text-secondary">need attention</p>
        </Card>
      </div>

      {/* Pods */}
      {pods.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-text-secondary text-sm">No pods created yet.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {pods.map((pod) => (
            <div key={pod.id}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-[16px] font-semibold text-text-primary">
                    {pod.name}
                  </h2>
                  <p className="text-xs text-text-secondary">
                    {pod.cohort.name} · Facilitator:{" "}
                    {pod.facilitator?.name ?? "Unassigned"}
                  </p>
                </div>
                <Badge variant="pending">{pod.members.length} members</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pod.members.map(({ user }) => {
                  const sc = user.scorecards[0];
                  const status = sc ? getOverallStatus(sc) : "ON_TRACK";
                  const dotStatus =
                    status === "ESCALATE"
                      ? "escalate"
                      : status === "NEEDS_ATTENTION"
                      ? "needs-attention"
                      : "on-track";
                  const currentMonth =
                    user.participantProfile?.currentMonth ?? 1;
                  return (
                    <Card key={user.id} padding="sm">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusDot status={dotStatus} />
                        <p className="text-[14px] font-medium text-text-primary">
                          {user.name}
                        </p>
                      </div>
                      <p className="text-xs text-text-secondary">
                        Month {currentMonth} — {MONTH_TITLES[currentMonth]}
                      </p>
                    </Card>
                  );
                })}
                {pod.members.length === 0 && (
                  <Card padding="sm" className="col-span-3">
                    <p className="text-sm text-text-secondary text-center py-2">
                      No members in this pod.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
