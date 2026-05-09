/**
 * Addendum 3 — Milestone constants, deadlines, and helpers.
 * Single source of truth for milestone metadata.
 */

import { MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";

/** 5-Stage Healing Framework (Addendum 3 §2.1) */
export const HEALING_STAGES = [
  { key: "SEE", name: "SEE", question: "What brokenness exists in my sphere of influence?" },
  { key: "UNDERSTAND", name: "UNDERSTAND", question: "What is the real problem beneath the symptoms?" },
  { key: "ENVISION", name: "ENVISION", question: "What does healing look like, and what solution could bring it?" },
  { key: "BUILD", name: "BUILD", question: "What is the smallest version I can create and test with real people?" },
  { key: "LAUNCH", name: "LAUNCH & MEASURE", question: "What evidence shows this is working, and what healing has begun?" },
] as const;

export type HealingStageKey = typeof HEALING_STAGES[number]["key"];

/** Map each milestone to its primary healing stage */
export const MILESTONE_TO_STAGE: Record<MilestoneType, HealingStageKey> = {
  ONBOARDING: "SEE",
  MILESTONE_1: "UNDERSTAND",
  MILESTONE_2: "BUILD",
  MILESTONE_3: "BUILD",
  MILESTONE_4: "LAUNCH",
};

/** Display titles for each milestone */
export const MILESTONE_TITLES: Record<MilestoneType, string> = {
  ONBOARDING: "Onboarding — MVI Brief",
  MILESTONE_1: "Milestone 1 — External Validation",
  MILESTONE_2: "Milestone 2 — Build & Test",
  MILESTONE_3: "Milestone 3 — Implementation",
  MILESTONE_4: "Milestone 4 — Final Submission",
};

/** Short labels for cards/sidebars */
export const MILESTONE_SHORT: Record<MilestoneType, string> = {
  ONBOARDING: "Onboarding",
  MILESTONE_1: "Validation",
  MILESTONE_2: "Build & Test",
  MILESTONE_3: "Implementation",
  MILESTONE_4: "Final",
};

/** URL slug for each milestone (used in /participant/journey/<slug>) */
export const MILESTONE_SLUG: Record<MilestoneType, string> = {
  ONBOARDING: "onboarding",
  MILESTONE_1: "milestone-1",
  MILESTONE_2: "milestone-2",
  MILESTONE_3: "milestone-3",
  MILESTONE_4: "milestone-4",
};

export const SLUG_TO_MILESTONE: Record<string, MilestoneType> = {
  "onboarding": MilestoneType.ONBOARDING,
  "milestone-1": MilestoneType.MILESTONE_1,
  "milestone-2": MilestoneType.MILESTONE_2,
  "milestone-3": MilestoneType.MILESTONE_3,
  "milestone-4": MilestoneType.MILESTONE_4,
};

/** Ordered list of milestones (linear sequence) */
export const MILESTONE_ORDER: MilestoneType[] = [
  MilestoneType.ONBOARDING,
  MilestoneType.MILESTONE_1,
  MilestoneType.MILESTONE_2,
  MilestoneType.MILESTONE_3,
  MilestoneType.MILESTONE_4,
];

/** Real deadlines (Addendum 3 §2.3) */
export const MILESTONE_DEADLINES: Record<MilestoneType, Date> = {
  ONBOARDING: new Date("2026-05-30T23:59:59Z"), // Day 3 Saturday
  MILESTONE_1: new Date("2026-06-15T23:59:59Z"),
  MILESTONE_2: new Date("2026-07-15T23:59:59Z"),
  MILESTONE_3: new Date("2026-08-15T23:59:59Z"),
  MILESTONE_4: new Date("2026-09-12T23:59:59Z"),
};

/** Grace period in days before "Late" flag (Addendum 3 §2.3) */
export const MILESTONE_GRACE_DAYS: Record<MilestoneType, number> = {
  ONBOARDING: 3,
  MILESTONE_1: 5,
  MILESTONE_2: 5,
  MILESTONE_3: 5,
  MILESTONE_4: 3,
};

/** "At Risk" threshold — days past deadline */
export const AT_RISK_DAYS = 10;

/** Human-readable deadline ("15 June 2026") */
export function formatDeadline(milestone: MilestoneType): string {
  const d = MILESTONE_DEADLINES[milestone];
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Compute the live status for a milestone given its submission record.
 * Auto-derives LATE / AT_RISK from deadlines if not yet submitted.
 */
export function computeStatus(
  milestone: MilestoneType,
  submission: { status: MilestoneStatus; submittedAt: Date | null } | null,
  now: Date = new Date()
): MilestoneStatus {
  if (submission?.status === MilestoneStatus.SUBMITTED || submission?.submittedAt) {
    return MilestoneStatus.SUBMITTED;
  }
  const deadline = MILESTONE_DEADLINES[milestone];
  const grace = MILESTONE_GRACE_DAYS[milestone];
  const daysLate = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLate >= AT_RISK_DAYS) return MilestoneStatus.AT_RISK;
  if (daysLate > grace) return MilestoneStatus.LATE;
  if (submission?.status === MilestoneStatus.IN_PROGRESS) return MilestoneStatus.IN_PROGRESS;
  return MilestoneStatus.NOT_STARTED;
}

/**
 * Determine which milestones a participant has unlocked,
 * based on completed (SUBMITTED) milestones in linear order.
 */
export function computeUnlocked(
  submissions: { milestoneType: MilestoneType; status: MilestoneStatus; submittedAt: Date | null }[]
): MilestoneType[] {
  const submittedSet = new Set(
    submissions
      .filter((s) => s.status === MilestoneStatus.SUBMITTED || s.submittedAt)
      .map((s) => s.milestoneType)
  );

  // Onboarding always unlocked. Each subsequent milestone unlocks when prior is submitted.
  const unlocked: MilestoneType[] = [MilestoneType.ONBOARDING];
  for (let i = 1; i < MILESTONE_ORDER.length; i++) {
    if (submittedSet.has(MILESTONE_ORDER[i - 1])) {
      unlocked.push(MILESTONE_ORDER[i]);
    } else {
      break;
    }
  }
  return unlocked;
}

/** Status chip CSS class + label */
export function statusChipClass(status: MilestoneStatus): string {
  switch (status) {
    case MilestoneStatus.SUBMITTED:    return "chip-submitted";
    case MilestoneStatus.IN_PROGRESS:  return "chip-in-progress";
    case MilestoneStatus.LATE:         return "chip-late";
    case MilestoneStatus.AT_RISK:      return "chip-at-risk";
    default:                           return "chip-not-started";
  }
}

export function statusLabel(status: MilestoneStatus): string {
  switch (status) {
    case MilestoneStatus.SUBMITTED:    return "Submitted";
    case MilestoneStatus.IN_PROGRESS:  return "In Progress";
    case MilestoneStatus.LATE:         return "Late";
    case MilestoneStatus.AT_RISK:      return "At Risk";
    default:                           return "Not Started";
  }
}
