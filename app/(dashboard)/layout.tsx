import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
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
  // If they don't (e.g. after a DB reset), redirect to the force-signout route
  // handler which clears the JWT cookie. A plain redirect("/login") keeps the
  // stale cookie and causes an infinite proxy redirect loop.
  const dbUser = await db.user.findUnique({ where: { id }, select: { id: true } });
  if (!dbUser) redirect("/api/auth/force-signout");

  // Get participant-specific data
  let currentMonth = 1;
  let unlockedMonths = [1];
  let pendingGates = 0;
  let redFlags = 0;
  let notificationCount = 0;

  if (role === "PARTICIPANT") {
    const profile = await db.participantProfile.findUnique({
      where: { userId: id },
    });
    currentMonth = profile?.currentMonth ?? 1;
    unlockedMonths = Array.from({ length: currentMonth }, (_, i) => i + 1);
  }

  if (role === "FACILITATOR" || role === "PROGRAM_ADMIN" || role === "SUPER_ADMIN") {
    const pending = await db.gateReview.count({
      where: { decision: null },
    });
    pendingGates = pending;
  }

  const unread = await db.notification.count({
    where: { userId: id, isRead: false },
  });
  notificationCount = unread;

  return (
    <div className="h-full flex flex-col">
      <Topbar
        userName={name ?? ""}
        userRole={ROLE_LABELS[role]}
        notificationCount={notificationCount}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          role={role}
          currentMonth={currentMonth}
          unlockedMonths={unlockedMonths}
          pendingGates={pendingGates}
          redFlags={redFlags}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
