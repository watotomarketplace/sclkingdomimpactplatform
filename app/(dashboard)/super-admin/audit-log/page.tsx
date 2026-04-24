import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { AuditLogTable } from "@/app/(dashboard)/super-admin/audit-log/audit-log-table";

export default async function AuditLogPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.SUPER_ADMIN)) redirect("/");

  const logs = await db.auditLog.findMany({
    include: { actor: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // Serialize dates to strings for client component
  const serializedLogs = logs.map(log => ({
    id: log.id,
    actorId: log.actorId,
    action: log.action,
    targetId: log.targetId,
    details: log.details as Record<string, unknown> | null,
    createdAt: log.createdAt.toISOString(),
    actor: {
      id: log.actor.id,
      name: log.actor.name,
      role: log.actor.role as string,
    },
  }));

  return (
    <div className="px-6 py-6 max-w-[1100px]">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-text-primary">Audit Log</h1>
        <p className="text-text-secondary text-sm mt-1">{logs.length} entries — immutable record of all sensitive actions</p>
      </div>
      <AuditLogTable logs={serializedLogs} />
    </div>
  );
}
