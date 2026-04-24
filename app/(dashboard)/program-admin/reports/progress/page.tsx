import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MONTH_TITLES } from "@/lib/utils";
import { ExportButton } from "@/components/shared/export-button";
import { Users, TrendingUp, ClipboardCheck } from "lucide-react";

export default async function ProgressReportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.PROGRAM_ADMIN)) redirect("/");

  const participants = await db.user.findMany({
    where: { role: "PARTICIPANT" },
    include: {
      participantProfile: { include: { cohort: true } },
      podMembership: { include: { pod: true } },
      submissions: true,
    },
    orderBy: { name: "asc" },
  });

  const approvedGates = await db.gateReview.findMany({
    where: { decision: "APPROVED" },
    include: { submission: { select: { userId: true, month: true } } },
  });

  const approvedByUser = new Map<string, number>();
  approvedGates.forEach((gr) => {
    const count = approvedByUser.get(gr.submission.userId) ?? 0;
    approvedByUser.set(gr.submission.userId, count + 1);
  });

  const totalParticipants = participants.length;
  const avgMonth =
    totalParticipants > 0
      ? (
          participants.reduce(
            (sum, p) => sum + (p.participantProfile?.currentMonth ?? 1),
            0
          ) / totalParticipants
        ).toFixed(1)
      : "0";
  const totalApproved = approvedGates.length;
  const allGates = await db.gateReview.count({
    where: { decision: { not: null } },
  });
  const gatePassRate =
    allGates > 0 ? Math.round((totalApproved / allGates) * 100) : 0;

  return (
    <div className="px-6 py-6 max-w-[1100px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[28px] font-semibold text-text-primary">
            Progress Report
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Participant progress across the cohort
          </p>
        </div>
        <ExportButton
          endpoint="/api/reports/progress?format=csv"
          filename="progress-report.csv"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card padding="sm">
          <CardLabel className="flex items-center gap-1">
            <Users size={11} />
            PARTICIPANTS
          </CardLabel>
          <p className="text-[26px] font-semibold text-text-primary font-mono">
            {totalParticipants}
          </p>
        </Card>
        <Card padding="sm">
          <CardLabel className="flex items-center gap-1">
            <TrendingUp size={11} />
            AVG MONTH
          </CardLabel>
          <p className="text-[26px] font-semibold text-accent-primary font-mono">
            {avgMonth}
          </p>
        </Card>
        <Card padding="sm">
          <CardLabel className="flex items-center gap-1">
            <ClipboardCheck size={11} />
            GATE PASS RATE
          </CardLabel>
          <p className="text-[26px] font-semibold text-accent-primary font-mono">
            {gatePassRate}%
          </p>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="px-5 py-3 border-b border-border grid grid-cols-12 gap-3">
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-3">
            NAME
          </span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-2">
            COHORT
          </span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-2">
            POD
          </span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-2">
            CURRENT MONTH
          </span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-1">
            PHASES
          </span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-2">
            GATES APPROVED
          </span>
        </div>
        {participants.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-text-secondary text-sm">
              No participants yet.
            </p>
          </div>
        ) : (
          participants.map((p) => {
            const month = p.participantProfile?.currentMonth ?? 1;
            const phasesSubmitted = p.submissions.filter(
              (s) => s.status === "SUBMITTED"
            ).length;
            const gatesApproved = approvedByUser.get(p.id) ?? 0;
            return (
              <div
                key={p.id}
                className="px-5 py-3 border-b border-border last:border-0 grid grid-cols-12 gap-3 items-center"
              >
                <div className="col-span-3">
                  <p className="text-[14px] font-medium text-text-primary">
                    {p.name}
                  </p>
                  <p className="text-xs text-text-secondary">{p.email}</p>
                </div>
                <p className="text-sm text-text-secondary col-span-2">
                  {p.participantProfile?.cohort?.name ?? "—"}
                </p>
                <p className="text-sm text-text-secondary col-span-2">
                  {p.podMembership?.pod.name ?? "—"}
                </p>
                <p className="text-sm text-text-secondary col-span-2">
                  Month {month} · {MONTH_TITLES[month]}
                </p>
                <p className="text-sm text-text-primary font-mono col-span-1">
                  {phasesSubmitted}
                </p>
                <div className="col-span-2">
                  <Badge
                    variant={gatesApproved > 0 ? "approved" : "pending"}
                  >
                    {gatesApproved} approved
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
