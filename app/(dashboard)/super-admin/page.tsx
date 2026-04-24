import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { Card, CardLabel, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Shield, Users, UserCheck, Building2 } from "lucide-react";
import Link from "next/link";

export default async function SuperAdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.SUPER_ADMIN)) redirect("/");

  const [
    totalParticipants,
    totalFacilitators,
    programAdminCount,
    totalPods,
    recentAuditLogs,
  ] = await Promise.all([
    db.user.count({ where: { role: "PARTICIPANT" } }),
    db.user.count({ where: { role: "FACILITATOR" } }),
    db.user.count({ where: { role: "PROGRAM_ADMIN" } }),
    db.pod.count(),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { actor: { select: { name: true, role: true } } },
    }),
  ]);

  return (
    <div className="px-6 py-6 max-w-[900px]">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={20} className="text-accent-gold" />
          <h1 className="font-display text-[28px] font-semibold text-text-primary">Platform Overview</h1>
        </div>
        <p className="text-text-secondary text-sm">Super Admin — full platform access</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "PARTICIPANTS", value: totalParticipants, href: "/super-admin/all-users", icon: Users },
          { label: "FACILITATORS", value: totalFacilitators, href: "/super-admin/all-users", icon: UserCheck },
          { label: "PROGRAM ADMINS", value: `${programAdminCount} / 5`, href: "/super-admin/program-admins", icon: Shield },
          { label: "PODS", value: totalPods, href: "/program-admin/pods", icon: Building2 },
        ].map(({ label, value, href, icon: Icon }) => (
          <Link key={label} href={href}>
            <Card padding="sm" className="hover:border-border-strong transition-colors cursor-pointer">
              <CardLabel className="flex items-center gap-1"><Icon size={11} />{label}</CardLabel>
              <p className="text-[26px] font-semibold text-text-primary font-mono">{value}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {[
          { label: "Manage Program Admins", href: "/super-admin/program-admins", desc: `${programAdminCount} of 5 used` },
          { label: "All Users", href: "/super-admin/all-users", desc: "Search and manage all accounts" },
          { label: "Audit Log", href: "/super-admin/audit-log", desc: "Full activity log" },
          { label: "System Settings", href: "/super-admin/settings", desc: "Platform configuration" },
          { label: "Gate Reviews", href: "/program-admin/gate-reviews", desc: "Review pending gates" },
          { label: "All Participants", href: "/program-admin/participants", desc: "View all participant records" },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card padding="sm" className="hover:border-border-strong transition-colors cursor-pointer h-full">
              <p className="text-[14px] font-medium text-text-primary mb-0.5">{item.label}</p>
              <p className="text-xs text-text-secondary">{item.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent audit activity */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Recent Activity</CardTitle>
          <Link href="/super-admin/audit-log" className="text-xs text-accent-primary hover:underline">View full log</Link>
        </div>
        {recentAuditLogs.length === 0 ? (
          <p className="text-sm text-text-secondary py-4 text-center">No activity logged yet.</p>
        ) : (
          <div className="space-y-2">
            {recentAuditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-border-strong mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-text-primary">
                    <span className="font-medium">{log.actor.name}</span>{" "}
                    <span className="text-text-secondary">({log.actor.role.replace("_", " ")})</span>{" "}
                    {log.action.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-text-secondary">{formatDateTime(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
