import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ROLE_LABELS } from "@/lib/roles";
import { db } from "@/lib/db";
import { computeUnlocked } from "@/lib/milestones";
import { MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, name, id } = session.user;

  // Validate the user still exists in the DB.
  const dbUser = await db.user.findUnique({ where: { id }, select: { id: true } });
  if (!dbUser) redirect("/api/auth/force-signout");

  // Milestone unlocking for participants and group leaders
  let unlockedMilestones: MilestoneType[] = [MilestoneType.ONBOARDING];
  let pendingGates = 0;
  let redFlags = 0;

  if (role === "PARTICIPANT" || role === "GROUP_LEADER") {
    const submissions = await db.milestoneSubmission.findMany({
      where: { userId: id },
      select: { milestoneType: true, status: true, submittedAt: true },
    });
    unlockedMilestones = computeUnlocked(submissions);
  }

  if (role === "FACILITATOR" || role === "PROGRAM_ADMIN" || role === "SUPER_ADMIN") {
    // Count participants whose latest milestone is late/at-risk
    const atRisk = await db.milestoneSubmission.count({
      where: {
        status: { in: [MilestoneStatus.AT_RISK, MilestoneStatus.LATE] },
      },
    });
    redFlags = atRisk;
  }

  const unread = await db.notification.count({ where: { userId: id, isRead: false } });

  return (
    <DashboardShell
      userName={name ?? ""}
      userRole={ROLE_LABELS[role]}
      notificationCount={unread}
      role={role}
      unlockedMilestones={unlockedMilestones}
      pendingGates={pendingGates}
      redFlags={redFlags}
    >
      {children}
    </DashboardShell>
  );
}
