import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getGreeting } from "@/lib/utils";
import {
  computeStatus,
  computeUnlocked,
  MILESTONE_ORDER,
  MILESTONE_SHORT,
  statusLabel,
  statusChipClass,
} from "@/lib/milestones";
import { MilestoneStatus, MilestoneType, Role } from "@/app/generated/prisma/enums";
import { hasAccess, isAdmin } from "@/lib/roles";
import Link from "next/link";
import { Users, TrendingUp, AlertTriangle, AlertOctagon } from "lucide-react";

export default async function FacilitatorDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role as Role, Role.FACILITATOR)) redirect("/");

  const adminView = isAdmin(session.user.role as Role);

  const pods = await db.pod.findMany({
    where: adminView ? {} : { facilitatorId: session.user.id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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
  });

  type ParticipantRow = {
    id: string;
    name: string | null;
    email: string;
    podName: string;
    activeMilestone: MilestoneType;
    activeStatus: MilestoneStatus;
    lastActivityAt: Date | null;
  };

  const rows: ParticipantRow[] = pods.flatMap((pod) =>
    pod.members.map(({ user }) => {
      const subs = user.milestoneSubmissions;
      const unlocked = computeUnlocked(subs);
      // Active milestone = last unlocked
      const activeMilestone = unlocked[unlocked.length - 1] ?? MilestoneType.ONBOARDING;
      const subRecord = subs.find((s) => s.milestoneType === activeMilestone) ?? null;
      const activeStatus = computeStatus(activeMilestone, subRecord);
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
        podName: pod.name,
        activeMilestone,
        activeStatus,
        lastActivityAt,
      };
    })
  );

  const totalCount = rows.length;
  const submittedAll = rows.filter(
    (r) => r.activeMilestone === MilestoneType.MILESTONE_4 && r.activeStatus === MilestoneStatus.SUBMITTED
  ).length;
  const lateCount = rows.filter((r) => r.activeStatus === MilestoneStatus.LATE).length;
  const atRiskCount = rows.filter((r) => r.activeStatus === MilestoneStatus.AT_RISK).length;

  // Sort: at-risk → late → in-progress → submitted → not-started
  const statusOrder: Record<MilestoneStatus, number> = {
    AT_RISK: 0,
    LATE: 1,
    IN_PROGRESS: 2,
    NOT_STARTED: 3,
    SUBMITTED: 4,
  };
  const sorted = [...rows].sort((a, b) => statusOrder[a.activeStatus] - statusOrder[b.activeStatus]);

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[900px]">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="font-display text-[26px] font-semibold text-text-primary">
          {getGreeting(session.user.name ?? "Facilitator")}
        </h1>
        <p className="text-text-secondary text-[13px] mt-1">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="glass-2 px-4 py-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Users size={11} className="text-[#A3A3A3]" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A3A3A3]">Total</p>
          </div>
          <p className="text-[28px] font-semibold text-text-primary font-mono leading-none">{totalCount}</p>
          <p className="text-[11px] text-[#A3A3A3] mt-0.5">participants</p>
        </div>
        <div className="glass-2 px-4 py-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp size={11} className="text-[#86EFAC]" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A3A3A3]">Completed</p>
          </div>
          <p className="text-[28px] font-semibold text-[#86EFAC] font-mono leading-none">{submittedAll}</p>
          <p className="text-[11px] text-[#A3A3A3] mt-0.5">all milestones</p>
        </div>
        <div className="glass-2 px-4 py-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle size={11} className="text-[#FCD34D]" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A3A3A3]">Late</p>
          </div>
          <p className="text-[28px] font-semibold text-[#FCD34D] font-mono leading-none">{lateCount}</p>
          <p className="text-[11px] text-[#A3A3A3] mt-0.5">past deadline</p>
        </div>
        <Link href="/facilitator/red-flags">
          <div className="glass-2 px-4 py-4 hover:bg-bg-base transition-colors cursor-pointer">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertOctagon size={11} className="text-[#FCA5A5]" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A3A3A3]">At Risk</p>
            </div>
            <p className="text-[28px] font-semibold text-[#FCA5A5] font-mono leading-none">{atRiskCount}</p>
            <p className="text-[11px] text-[#A3A3A3] mt-0.5">need support</p>
          </div>
        </Link>
      </div>

      {/* Participant list */}
      <div className="glass-2 overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="section-label">ALL PARTICIPANTS</p>
          <Link
            href="/facilitator/participants"
            className="text-[12px] text-[#C8973A] hover:text-[#FCD34D] transition-colors"
          >
            View full list →
          </Link>
        </div>

        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Users size={24} className="text-[#A3A3A3] mx-auto mb-2" />
            <p className="text-[13px] text-[#A3A3A3]">No participants assigned yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {sorted.slice(0, 20).map((row) => {
              const chipClass = statusChipClass(row.activeStatus);
              const daysAgo = row.lastActivityAt
                ? Math.floor((Date.now() - row.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24))
                : null;
              return (
                <Link
                  key={row.id}
                  href={`/facilitator/participants/${row.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-bg-base transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-bg-base border border-border flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-semibold text-text-secondary">
                      {(row.name ?? row.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Name + pod */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-text-primary truncate">
                      {row.name ?? row.email}
                    </p>
                    <p className="text-[11px] text-[#A3A3A3]">{row.podName}</p>
                  </div>
                  {/* Milestone */}
                  <div className="hidden sm:block text-right shrink-0">
                    <p className="text-[11px] text-text-secondary">{MILESTONE_SHORT[row.activeMilestone]}</p>
                  </div>
                  {/* Status chip */}
                  <span className={`${chipClass} text-[10px] shrink-0`}>
                    {statusLabel(row.activeStatus)}
                  </span>
                  {/* Last activity */}
                  <span className="text-[11px] text-[#A3A3A3] shrink-0 hidden md:block">
                    {daysAgo === null ? "—" : daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {sorted.length > 20 && (
          <div className="px-4 py-3 border-t border-border text-center">
            <Link
              href="/facilitator/participants"
              className="text-[12px] text-[#C8973A] hover:text-[#FCD34D] transition-colors"
            >
              View all {sorted.length} participants →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
