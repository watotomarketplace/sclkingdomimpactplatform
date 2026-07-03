import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ROLE_LABELS } from "@/lib/roles";
import { db } from "@/lib/db";
import { computeUnlocked } from "@/lib/milestones";
import { countAtRiskParticipants } from "@/lib/participants";
import { MilestoneType } from "@/app/generated/prisma/enums";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { name, id } = session.user;
  const role = session.user.role;

  // Guard: malformed token with no role — sign out cleanly rather than crash
  if (!role) redirect("/api/auth/force-signout");

  // Validate the user still exists in the DB.
  const dbUser = await db.user.findUnique({ where: { id }, select: { id: true } });
  if (!dbUser) redirect("/api/auth/force-signout");

  // Milestone unlocking for participants and group leaders
  let unlockedMilestones: MilestoneType[] = [MilestoneType.ONBOARDING];
  const pendingGates = 0;
  let redFlags = 0;

  if (role === "PARTICIPANT" || role === "GROUP_LEADER") {
    const submissions = await db.milestoneSubmission.findMany({
      where: { userId: id },
      select: { milestoneType: true, status: true, submittedAt: true },
    });
    unlockedMilestones = computeUnlocked(submissions);
  }

  if (role === "FACILITATOR" || role === "PROGRAM_ADMIN" || role === "SUPER_ADMIN") {
    // Count participants (not submission rows) currently late/at-risk on their
    // active milestone — matches the Late & At Risk page exactly.
    redFlags = await countAtRiskParticipants({ id, role });
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
