import { Role } from "@/app/generated/prisma/enums";

const ROLE_HIERARCHY: Record<Role, number> = {
  PARTICIPANT: 0,
  FACILITATOR: 1,
  PROGRAM_ADMIN: 2,
  SUPER_ADMIN: 3,
};

export function hasAccess(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function getDashboardPath(role: Role, covenantSigned: boolean, readinessComplete = true): string {
  if (role === Role.PARTICIPANT && !covenantSigned) return "/covenant";
  if (role === Role.PARTICIPANT && covenantSigned && !readinessComplete) return "/readiness-assessment";
  switch (role) {
    case Role.SUPER_ADMIN:
      return "/super-admin";
    case Role.PROGRAM_ADMIN:
      return "/program-admin";
    case Role.FACILITATOR:
      return "/facilitator";
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
  PARTICIPANT: "Participant",
};
