import { Role } from "@/app/generated/prisma/enums";

// Hierarchy: PARTICIPANT < GROUP_LEADER < FACILITATOR < PROGRAM_ADMIN ≡ SUPER_ADMIN
const ROLE_HIERARCHY: Record<Role, number> = {
  PARTICIPANT: 0,
  GROUP_LEADER: 1,
  FACILITATOR: 2,
  PROGRAM_ADMIN: 3, // legacy — treated equivalent to SUPER_ADMIN
  SUPER_ADMIN: 3,
};

export function hasAccess(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Returns true for SUPER_ADMIN and PROGRAM_ADMIN.
 * Use to decide whether to remove cohort/pod scoping from data queries —
 * admins have universal visibility across all cohorts by PRD design.
 */
export function isAdmin(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.PROGRAM_ADMIN;
}

/**
 * Where to send a user after login.
 * Addendum 3: Participants who haven't completed the MVI Brief go to /onboarding.
 */
export function getDashboardPath(role: Role, onboardingComplete: boolean): string {
  if ((role === Role.PARTICIPANT || role === Role.GROUP_LEADER) && !onboardingComplete) {
    return "/onboarding";
  }
  switch (role) {
    case Role.SUPER_ADMIN:
      return "/super-admin";
    case Role.PROGRAM_ADMIN:
      return "/super-admin"; // merged in Addendum 3
    case Role.FACILITATOR:
      return "/facilitator";
    case Role.GROUP_LEADER:
      return "/group-leader";
    case Role.PARTICIPANT:
      return "/participant";
    default:
      return "/login";
  }
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  PROGRAM_ADMIN: "Program Admin",
  FACILITATOR: "Facilitator",
  GROUP_LEADER: "Group Leader",
  PARTICIPANT: "Participant",
};
