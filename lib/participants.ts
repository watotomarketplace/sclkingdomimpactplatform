import { db } from "@/lib/db";
import { isAdmin } from "@/lib/roles";
import { Role, MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";
import { computeStatus, computeUnlocked } from "@/lib/milestones";

export interface ParticipantSub {
  milestoneType: MilestoneType;
  status: MilestoneStatus;
  submittedAt: Date | null;
  updatedAt: Date;
}

export interface VisibleParticipant {
  id: string;
  name: string | null;
  email: string;
  podId: string | null;
  podName: string | null;
  subs: ParticipantSub[];
}

const SUB_SELECT = {
  milestoneType: true,
  status: true,
  submittedAt: true,
  updatedAt: true,
} as const;

/**
 * Participants visible to the current viewer.
 *  - Admins (SUPER_ADMIN / PROGRAM_ADMIN): every active participant, whether or
 *    not they belong to a group (ungrouped participants have podId/podName null).
 *  - Facilitators: only members of the pods they facilitate.
 */
export async function getVisibleParticipants(user: {
  id: string;
  role: Role;
}): Promise<VisibleParticipant[]> {
  if (isAdmin(user.role)) {
    const users = await db.user.findMany({
      where: { role: { in: [Role.PARTICIPANT, Role.GROUP_LEADER] }, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        milestoneSubmissions: { select: SUB_SELECT },
        podMembership: { select: { pod: { select: { id: true, name: true } } } },
      },
      orderBy: { name: "asc" },
    });
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      podId: u.podMembership?.pod.id ?? null,
      podName: u.podMembership?.pod.name ?? null,
      subs: u.milestoneSubmissions,
    }));
  }

  const pods = await db.pod.findMany({
    where: { facilitatorId: user.id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              milestoneSubmissions: { select: SUB_SELECT },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return pods.flatMap((pod) =>
    pod.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      podId: pod.id,
      podName: pod.name,
      subs: m.user.milestoneSubmissions,
    }))
  );
}

export interface DerivedActive {
  activeMilestone: MilestoneType;
  activeStatus: MilestoneStatus;
  submittedCount: number;
  lastActivityAt: Date | null;
  daysSinceActive: number | null;
}

/**
 * The participant's "current" milestone (last unlocked) and its live status.
 * Because milestones unlock linearly, the only unlocked-but-unsubmitted
 * milestone is the active one — so its status represents late/at-risk state.
 */
export function deriveActive(subs: ParticipantSub[], now: Date = new Date()): DerivedActive {
  const unlocked = computeUnlocked(subs);
  const activeMilestone = unlocked[unlocked.length - 1] ?? MilestoneType.ONBOARDING;
  const subRecord = subs.find((s) => s.milestoneType === activeMilestone) ?? null;
  const activeStatus = computeStatus(activeMilestone, subRecord, now);
  const submittedCount = subs.filter(
    (s) => s.status === MilestoneStatus.SUBMITTED || s.submittedAt
  ).length;
  const lastActivityAt =
    subs.length > 0
      ? subs.reduce((latest, s) => (s.updatedAt > latest ? s.updatedAt : latest), subs[0].updatedAt)
      : null;
  const daysSinceActive = lastActivityAt
    ? Math.floor((now.getTime() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  return { activeMilestone, activeStatus, submittedCount, lastActivityAt, daysSinceActive };
}

/** True when a milestone status counts as late or at-risk. */
export function isFlaggedStatus(status: MilestoneStatus): boolean {
  return status === MilestoneStatus.LATE || status === MilestoneStatus.AT_RISK;
}

/**
 * Count participants (not submission rows) currently late or at-risk on their
 * active milestone — used for the sidebar badge so it matches the Late & At
 * Risk page exactly.
 */
export async function countAtRiskParticipants(user: { id: string; role: Role }): Promise<number> {
  const rows = await getVisibleParticipants(user);
  const now = new Date();
  return rows.filter((r) => isFlaggedStatus(deriveActive(r.subs, now).activeStatus)).length;
}
