import { db } from "@/lib/db";

export const DEFAULT_COHORT_NAME = "Default Cohort";

/**
 * Find-or-create the single fallback cohort used when groups are created
 * without an explicit cohort. Keeps group creation frictionless while still
 * satisfying the Pod.cohortId requirement.
 */
export async function ensureDefaultCohort(): Promise<string> {
  const existing = await db.cohort.findFirst({
    where: { name: DEFAULT_COHORT_NAME },
    select: { id: true },
  });
  if (existing) return existing.id;

  const now = new Date();
  const oneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const created = await db.cohort.create({
    data: { name: DEFAULT_COHORT_NAME, startDate: now, endDate: oneYear, isActive: true },
    select: { id: true },
  });
  return created.id;
}
