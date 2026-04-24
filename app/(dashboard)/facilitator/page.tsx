import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getGreeting, formatDate } from "@/lib/utils";
import { Card, CardLabel, CardTitle } from "@/components/ui/card";
import { StatusDot, Badge } from "@/components/ui/badge";
import { MONTH_TITLES } from "@/lib/utils";
import Link from "next/link";
import { Users, ClipboardCheck, AlertTriangle, TrendingUp } from "lucide-react";

export default async function FacilitatorDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const pods = await db.pod.findMany({
    where: { facilitatorId: session.user.id },
    include: {
      members: {
        include: {
          user: {
            include: {
              participantProfile: true,
              scorecards: { orderBy: { month: "desc" }, take: 1 },
              submissions: { orderBy: { updatedAt: "desc" }, take: 1 },
            },
          },
        },
      },
    },
  });

  const allParticipants = pods.flatMap((p) => p.members.map((m) => m.user));
  const totalCount = allParticipants.length;

  const getParticipantStatus = (user: typeof allParticipants[0]) => {
    const latestScore = user.scorecards[0];
    if (!latestScore) return "on-track" as const;
    const statuses = [
      latestScore.problemClarity,
      latestScore.researchEffort,
      latestScore.executionDiscipline,
    ];
    if (statuses.some((s) => s === "ESCALATE")) return "escalate" as const;
    if (statuses.some((s) => s === "NEEDS_ATTENTION")) return "needs-attention" as const;
    return "on-track" as const;
  };

  const onTrackCount = allParticipants.filter((p) => getParticipantStatus(p) === "on-track").length;
  const needsAttentionCount = allParticipants.filter((p) => getParticipantStatus(p) === "needs-attention").length;
  const escalateCount = allParticipants.filter((p) => getParticipantStatus(p) === "escalate").length;

  const pendingGates = await db.gateReview.count({ where: { decision: null } });

  return (
    <div className="px-6 py-6 max-w-[900px]">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-text-primary">
          {getGreeting(session.user.name ?? "Facilitator")}
        </h1>
        <p className="text-text-secondary text-sm mt-1">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card padding="sm">
          <CardLabel className="flex items-center gap-1"><Users size={11} />TOTAL</CardLabel>
          <p className="text-[26px] font-semibold text-text-primary font-mono">{totalCount}</p>
          <p className="text-xs text-text-secondary">participants</p>
        </Card>
        <Card padding="sm">
          <CardLabel className="flex items-center gap-1"><TrendingUp size={11} />ON TRACK</CardLabel>
          <p className="text-[26px] font-semibold text-accent-primary font-mono">{onTrackCount}</p>
          <p className="text-xs text-text-secondary">participants</p>
        </Card>
        <Card padding="sm">
          <CardLabel className="flex items-center gap-1"><AlertTriangle size={11} />ATTENTION</CardLabel>
          <p className="text-[26px] font-semibold text-accent-warning font-mono">{needsAttentionCount}</p>
          <p className="text-xs text-text-secondary">participants</p>
        </Card>
        <Card padding="sm">
          <CardLabel className="flex items-center gap-1"><ClipboardCheck size={11} />PENDING GATES</CardLabel>
          <p className="text-[26px] font-semibold text-accent-sky font-mono">{pendingGates}</p>
          <p className="text-xs text-text-secondary">awaiting review</p>
        </Card>
      </div>

      {/* Pods */}
      {pods.length === 0 && (
        <Card className="py-12 text-center">
          <p className="text-text-secondary text-sm">No pods assigned yet. Contact your Program Admin.</p>
        </Card>
      )}

      {pods.map((pod) => (
        <div key={pod.id} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-semibold text-text-primary">{pod.name}</h2>
            <span className="text-xs text-text-secondary">{pod.members.length} members</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pod.members.map(({ user }) => {
              const status = getParticipantStatus(user);
              const currentMonth = user.participantProfile?.currentMonth ?? 1;
              const lastSub = user.submissions[0];

              return (
                <Link key={user.id} href={`/facilitator/participants/${user.id}`}>
                  <Card className="hover:border-border-strong transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusDot status={status} />
                        <span className="text-[14px] font-medium text-text-primary">{user.name}</span>
                      </div>
                      <Badge variant={status === "on-track" ? "on-track" : status === "needs-attention" ? "needs-attention" : "escalate"}>
                        {status === "on-track" ? "On Track" : status === "needs-attention" ? "Attention" : "Escalate"}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-secondary">Month {currentMonth} — {MONTH_TITLES[currentMonth]}</p>
                    {lastSub && (
                      <p className="text-xs text-text-secondary mt-1">
                        Last activity: {formatDate(lastSub.updatedAt)}
                      </p>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
