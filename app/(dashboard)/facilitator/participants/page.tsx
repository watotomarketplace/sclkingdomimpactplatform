import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role, MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";
import {
  computeStatus,
  computeUnlocked,
  MILESTONE_SHORT,
  MILESTONE_TITLES,
  statusLabel,
  statusChipClass,
} from "@/lib/milestones";
import Link from "next/link";
import { Users } from "lucide-react";

export default async function FacilitatorParticipantsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.FACILITATOR)) redirect("/");

  const pods = await db.pod.findMany({
    where: { facilitatorId: session.user.id },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
            include: {
              milestoneSubmissions: {
                select: {
                  milestoneType: true,
                  status: true,
                  submittedAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  type Row = {
    id: string;
    name: string | null;
    email: string;
    podId: string;
    podName: string;
    activeMilestone: MilestoneType;
    activeStatus: MilestoneStatus;
    submittedCount: number;
    lastActivityAt: Date | null;
  };

  const rows: Row[] = pods.flatMap((pod) =>
    pod.members.map(({ user }) => {
      const subs = user.milestoneSubmissions;
      const unlocked = computeUnlocked(subs);
      const activeMilestone = unlocked[unlocked.length - 1] ?? MilestoneType.ONBOARDING;
      const subRecord = subs.find((s) => s.milestoneType === activeMilestone) ?? null;
      const activeStatus = computeStatus(activeMilestone, subRecord);
      const submittedCount = subs.filter(
        (s) => s.status === MilestoneStatus.SUBMITTED || s.submittedAt
      ).length;
      const lastActivityAt =
        subs.length > 0
          ? subs.reduce((latest, s) =>
              s.updatedAt > latest ? s.updatedAt : latest,
              subs[0].updatedAt
            )
          : null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        podId: pod.id,
        podName: pod.name,
        activeMilestone,
        activeStatus,
        submittedCount,
        lastActivityAt,
      };
    })
  );

  // Sort: at-risk first → late → in-progress → not-started → submitted
  const statusOrder: Record<MilestoneStatus, number> = {
    AT_RISK: 0,
    LATE: 1,
    IN_PROGRESS: 2,
    NOT_STARTED: 3,
    SUBMITTED: 4,
  };
  rows.sort((a, b) => statusOrder[a.activeStatus] - statusOrder[b.activeStatus]);

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[900px]">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-bg-base border border-border flex items-center justify-center shrink-0">
          <Users size={22} className="text-text-secondary" />
        </div>
        <div>
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary">
            Participant List
          </h1>
          <p className="text-text-secondary text-[13px] mt-1">
            {rows.length} participant{rows.length !== 1 ? "s" : ""} across {pods.length} group{pods.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="glass-2 overflow-hidden">
        {/* Header row */}
        <div className="hidden md:grid grid-cols-[1fr_140px_180px_90px_90px] gap-3 px-4 py-2.5 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A3A3A3]">Name</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A3A3A3]">Group</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A3A3A3]">Active Milestone</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A3A3A3]">Status</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A3A3A3]">Last Active</p>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Users size={24} className="text-[#A3A3A3] mx-auto mb-2" />
            <p className="text-[13px] text-[#A3A3A3]">No participants yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {rows.map((row) => {
              const chipClass = statusChipClass(row.activeStatus);
              const daysAgo = row.lastActivityAt
                ? Math.floor((Date.now() - row.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24))
                : null;
              return (
                <Link
                  key={row.id}
                  href={`/facilitator/participants/${row.id}`}
                  className="flex md:grid md:grid-cols-[1fr_140px_180px_90px_90px] items-center gap-3 px-4 py-3 hover:bg-bg-base transition-colors"
                >
                  {/* Name + email */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-bg-base border border-border flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold text-text-secondary">
                        {(row.name ?? row.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-text-primary truncate">
                        {row.name ?? row.email}
                      </p>
                      <p className="text-[11px] text-[#A3A3A3] truncate hidden md:block">{row.email}</p>
                    </div>
                  </div>

                  {/* Group */}
                  <p className="text-[12px] text-text-secondary truncate hidden md:block">{row.podName}</p>

                  {/* Active milestone */}
                  <div className="hidden md:block">
                    <p className="text-[12px] text-text-secondary">{MILESTONE_SHORT[row.activeMilestone]}</p>
                    <p className="text-[10px] text-[#A3A3A3] mt-0.5">
                      {row.submittedCount} / 5 submitted
                    </p>
                  </div>

                  {/* Status */}
                  <div className="ml-auto md:ml-0">
                    <span className={`${chipClass} text-[10px]`}>
                      {statusLabel(row.activeStatus)}
                    </span>
                  </div>

                  {/* Last active */}
                  <p className="text-[11px] text-[#A3A3A3] hidden md:block">
                    {daysAgo === null ? "—" : daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Group breakdown */}
      {pods.length > 1 && (
        <div className="mt-6">
          <p className="section-label mb-3">BY GROUP</p>
          <div className="space-y-2">
            {pods.map((pod) => {
              const podRows = rows.filter((r) => r.podId === pod.id);
              const lateCount = podRows.filter(
                (r) => r.activeStatus === MilestoneStatus.LATE || r.activeStatus === MilestoneStatus.AT_RISK
              ).length;
              return (
                <div key={pod.id} className="glass-2 px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-text-primary">{pod.name}</p>
                    <p className="text-[11px] text-[#A3A3A3]">{podRows.length} members</p>
                  </div>
                  {lateCount > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[rgba(252,163,77,0.15)] border border-[#FCD34D]/20 text-[#FCD34D]">
                      {lateCount} late/at-risk
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
