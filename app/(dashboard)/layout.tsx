import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ROLE_LABELS } from "@/lib/roles";
import { db } from "@/lib/db";

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

  // Participant-specific data
  let currentMonth = 1;
  let unlockedMonths = [1];
  let pendingGates = 0;
  let redFlags = 0;
  let notificationCount = 0;

  if (role === "PARTICIPANT") {
    const profile = await db.participantProfile.findUnique({ where: { userId: id } });
    currentMonth = profile?.currentMonth ?? 1;
    unlockedMonths = Array.from({ length: currentMonth }, (_, i) => i + 1);
  }

  if (role === "FACILITATOR" || role === "PROGRAM_ADMIN" || role === "SUPER_ADMIN") {
    pendingGates = await db.gateReview.count({ where: { decision: null } });
  }

  const unread = await db.notification.count({ where: { userId: id, isRead: false } });
  notificationCount = unread;

  return (
    <DashboardShell
      userName={name ?? ""}
      userRole={ROLE_LABELS[role]}
      notificationCount={notificationCount}
      role={role}
      currentMonth={currentMonth}
      unlockedMonths={unlockedMonths}
      pendingGates={pendingGates}
      redFlags={redFlags}
    >
      {children}
    </DashboardShell>
  );
}
