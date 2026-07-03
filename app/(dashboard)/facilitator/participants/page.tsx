import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasAccess, isAdmin } from "@/lib/roles";
import { Role, MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";
import { MILESTONE_SHORT, statusLabel, statusChipClass } from "@/lib/milestones";
import { getVisibleParticipants, deriveActive } from "@/lib/participants";
import Link from "next/link";
import { Users, UserX } from "lucide-react";

type Row = {
  id: string;
  name: string | null;
  email: string;
  podId: string | null;
  podName: string | null;
  activeMilestone: MilestoneType;
  activeStatus: MilestoneStatus;
  submittedCount: number;
  daysSinceActive: number | null;
};

const statusOrder: Record<MilestoneStatus, number> = {
  AT_RISK: 0,
  LATE: 1,
  IN_PROGRESS: 2,
  NOT_STARTED: 3,
  SUBMITTED: 4,
};

function ParticipantRow({ row }: { row: Row }) {
  const chipClass = statusChipClass(row.activeStatus);
  const daysAgo = row.daysSinceActive;
  return (
    <Link
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
          <p className="text-[13px] font-semibold text-text-primary truncate">{row.name ?? row.email}</p>
          <p className="text-[11px] text-[#A3A3A3] truncate hidden md:block">{row.email}</p>
        </div>
      </div>

      {/* Group */}
      <p className="text-[12px] text-text-secondary truncate hidden md:block">
        {row.podName ?? <span className="text-[#A3A3A3] italic">No group</span>}
      </p>

      {/* Active milestone */}
      <div className="hidden md:block">
        <p className="text-[12px] text-text-secondary">{MILESTONE_SHORT[row.activeMilestone]}</p>
        <p className="text-[10px] text-[#A3A3A3] mt-0.5">{row.submittedCount} / 5 submitted</p>
      </div>

      {/* Status */}
      <div className="ml-auto md:ml-0">
        <span className={`${chipClass} text-[10px]`}>{statusLabel(row.activeStatus)}</span>
      </div>

      {/* Last active */}
      <p className="text-[11px] text-[#A3A3A3] hidden md:block">
        {daysAgo === null ? "—" : daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
      </p>
    </Link>
  );
}

function TableHeader() {
  return (
    <div className="hidden md:grid grid-cols-[1fr_140px_180px_90px_90px] gap-3 px-4 py-2.5 border-b border-border">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A3A3A3]">Name</p>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A3A3A3]">Group</p>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A3A3A3]">Active Milestone</p>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A3A3A3]">Status</p>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A3A3A3]">Last Active</p>
    </div>
  );
}

export default async function FacilitatorParticipantsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role as Role, Role.FACILITATOR)) redirect("/");

  const adminView = isAdmin(session.user.role as Role);
  const participants = await getVisibleParticipants({
    id: session.user.id,
    role: session.user.role as Role,
  });

  const rows: Row[] = participants.map((p) => {
    const { activeMilestone, activeStatus, submittedCount, daysSinceActive } = deriveActive(p.subs);
    return {
      id: p.id,
      name: p.name,
      email: p.email,
      podId: p.podId,
      podName: p.podName,
      activeMilestone,
      activeStatus,
      submittedCount,
      daysSinceActive,
    };
  });

  const sortRows = (list: Row[]) =>
    [...list].sort((a, b) => statusOrder[a.activeStatus] - statusOrder[b.activeStatus]);

  const grouped = sortRows(rows.filter((r) => r.podId));
  const ungrouped = sortRows(rows.filter((r) => !r.podId));

  // Distinct groups represented
  const groupCount = new Set(grouped.map((r) => r.podId)).size;

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
            {rows.length} participant{rows.length !== 1 ? "s" : ""} · {grouped.length} in {groupCount} group
            {groupCount !== 1 ? "s" : ""} · {ungrouped.length} ungrouped
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="glass-2 px-4 py-8 text-center">
          <Users size={24} className="text-[#A3A3A3] mx-auto mb-2" />
          <p className="text-[13px] text-[#A3A3A3]">No participants yet.</p>
        </div>
      ) : (
        <>
          {/* Ungrouped — surfaced first so admins can assign them */}
          {adminView && ungrouped.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="section-label flex items-center gap-1.5">
                  <UserX size={12} className="text-[#FCA5A5]" /> NOT IN A GROUP ({ungrouped.length})
                </p>
                <Link
                  href="/super-admin/groups"
                  className="text-[12px] text-[#C8973A] hover:text-[#FCD34D] transition-colors"
                >
                  Assign to groups →
                </Link>
              </div>
              <div className="glass-2 overflow-hidden">
                <TableHeader />
                <div className="divide-y divide-white/[0.05]">
                  {ungrouped.map((row) => (
                    <ParticipantRow key={row.id} row={row} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Grouped participants */}
          <div>
            {adminView && ungrouped.length > 0 && (
              <p className="section-label mb-2">IN A GROUP ({grouped.length})</p>
            )}
            <div className="glass-2 overflow-hidden">
              <TableHeader />
              {(adminView ? grouped : rows).length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-[13px] text-[#A3A3A3]">No participants in a group yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {(adminView ? grouped : sortRows(rows)).map((row) => (
                    <ParticipantRow key={row.id} row={row} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
