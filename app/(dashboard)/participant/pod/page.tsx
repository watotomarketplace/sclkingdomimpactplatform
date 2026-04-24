import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/badge";
import { MONTH_TITLES } from "@/lib/utils";
import { Users } from "lucide-react";

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function getOverallStatus(scorecard: { problemClarity: string; researchEffort: string; executionDiscipline: string } | undefined) {
  if (!scorecard) return "on-track" as const;
  const statuses = [scorecard.problemClarity, scorecard.researchEffort, scorecard.executionDiscipline];
  if (statuses.some(s => s === "ESCALATE")) return "escalate" as const;
  if (statuses.some(s => s === "NEEDS_ATTENTION")) return "needs-attention" as const;
  return "on-track" as const;
}

export default async function PodAccountabilityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const podMember = await db.podMember.findUnique({
    where: { userId: session.user.id },
    include: {
      pod: {
        include: {
          facilitator: true,
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
      },
    },
  });

  return (
    <div className="px-6 py-6 max-w-[900px]">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-text-primary">Pod Accountability</h1>
        <p className="text-text-secondary text-sm mt-1">Your accountability group</p>
      </div>

      {!podMember ? (
        <Card className="py-16 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-10 h-10 rounded-full bg-bg-base border border-border flex items-center justify-center">
              <Users size={18} className="text-text-secondary" />
            </div>
          </div>
          <p className="text-[15px] font-semibold text-text-primary mb-1">Not in a pod yet</p>
          <p className="text-sm text-text-secondary">You haven&apos;t been assigned to a pod. Contact your facilitator.</p>
        </Card>
      ) : (
        <div>
          {/* Pod header */}
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{podMember.pod.name}</CardTitle>
                <p className="text-sm text-text-secondary mt-0.5">
                  Facilitated by {podMember.pod.facilitator?.name ?? "Unassigned"}
                </p>
              </div>
              <Badge variant="on-track">{podMember.pod.members.length} members</Badge>
            </div>
          </Card>

          {/* Members grid */}
          <p className="text-[10px] uppercase tracking-wider font-medium text-text-secondary mb-3">MEMBERS</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {podMember.pod.members.map(({ user }) => {
              const isCurrentUser = user.id === session.user!.id;
              const scorecard = user.scorecards[0];
              const status = getOverallStatus(scorecard);
              const currentMonth = user.participantProfile?.currentMonth ?? 1;

              return (
                <Card key={user.id} padding="sm">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-[rgba(45,90,61,0.12)] flex items-center justify-center shrink-0">
                      <span className="text-[12px] font-semibold text-accent-primary">{getInitials(user.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[14px] font-medium text-text-primary truncate">{user.name}</p>
                        {isCurrentUser && (
                          <span className="text-[11px] text-text-secondary">(You)</span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">Month {currentMonth} — {MONTH_TITLES[currentMonth]}</p>
                    </div>
                    <div className="shrink-0">
                      <Badge variant={status === "on-track" ? "on-track" : status === "needs-attention" ? "needs-attention" : "escalate"}>
                        {status === "on-track" ? "On Track" : status === "needs-attention" ? "Attention" : "Escalate"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
