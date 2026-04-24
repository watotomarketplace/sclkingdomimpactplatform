import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { Card, CardLabel, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Users, ClipboardCheck, AlertTriangle, Building2 } from "lucide-react";
import Link from "next/link";

export default async function ProgramAdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.PROGRAM_ADMIN)) redirect("/");

  const [totalParticipants, totalFacilitators, totalPods, pendingGates, activeCohorts, recentActivity] =
    await Promise.all([
      db.user.count({ where: { role: "PARTICIPANT" } }),
      db.user.count({ where: { role: "FACILITATOR" } }),
      db.pod.count(),
      db.gateReview.count({ where: { decision: null } }),
      db.cohort.count({ where: { isActive: true } }),
      db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { actor: { select: { name: true, role: true } } },
      }),
    ]);

  const facilitators = await db.user.findMany({
    where: { role: "FACILITATOR" },
    include: {
      facilitatedPods: { include: { members: true } },
    },
    take: 10,
  });

  return (
    <div className="px-6 py-6 max-w-[900px]">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-text-primary">Cohort Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Program overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "PARTICIPANTS", value: totalParticipants, icon: Users, href: "/program-admin/participants" },
          { label: "FACILITATORS", value: totalFacilitators, icon: Users, href: "/program-admin/facilitators" },
          { label: "ACTIVE PODS", value: totalPods, icon: Building2, href: "/program-admin/pods" },
          { label: "PENDING GATES", value: pendingGates, icon: ClipboardCheck, href: "/program-admin/gate-reviews" },
        ].map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card padding="sm" className="hover:border-border-strong transition-colors cursor-pointer">
              <CardLabel className="flex items-center gap-1"><Icon size={11} />{label}</CardLabel>
              <p className="text-[26px] font-semibold text-text-primary font-mono">{value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Facilitator snapshot */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Facilitators</CardTitle>
            <Link href="/program-admin/facilitators" className="text-xs text-accent-primary hover:underline">View all</Link>
          </div>
          {facilitators.length === 0 ? (
            <p className="text-sm text-text-secondary py-4 text-center">No facilitators yet.</p>
          ) : (
            <div className="space-y-3">
              {facilitators.map((f) => (
                <div key={f.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium text-text-primary">{f.name}</p>
                    <p className="text-xs text-text-secondary">{f.facilitatedPods.length} pod(s) · {f.facilitatedPods.reduce((sum, p) => sum + p.members.length, 0)} participants</p>
                  </div>
                  <Badge variant="on-track">Active</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent activity */}
        <Card>
          <CardTitle className="mb-4">Recent Activity</CardTitle>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-text-secondary py-4 text-center">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-border-strong mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-text-primary truncate">
                      <span className="font-medium">{log.actor.name}</span> {log.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-text-secondary">{formatDateTime(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
