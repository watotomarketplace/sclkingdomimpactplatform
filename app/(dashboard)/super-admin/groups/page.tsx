import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/enums";
import { UserCheck, Users } from "lucide-react";

export default async function GroupAssignmentPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.SUPER_ADMIN)) redirect("/");

  const [pods, unassignedUsers] = await Promise.all([
    db.pod.findMany({
      include: {
        facilitator: { select: { name: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: {
        role: { in: [Role.PARTICIPANT, Role.GROUP_LEADER] },
        podMembership: null,
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[820px]">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-bg-base border border-border flex items-center justify-center shrink-0">
          <UserCheck size={22} className="text-text-secondary" />
        </div>
        <div>
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary">Group Assignment</h1>
          <p className="text-text-secondary text-[13px] mt-1">
            {unassignedUsers.length} unassigned · {pods.length} groups
          </p>
        </div>
      </div>

      {/* Unassigned participants */}
      {unassignedUsers.length > 0 && (
        <div className="glass-2 overflow-hidden mb-5">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Users size={14} className="text-[#FCA5A5]" />
            <span className="text-[13px] font-semibold text-text-primary">Unassigned Participants ({unassignedUsers.length})</span>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {unassignedUsers.map((u) => (
              <div key={u.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-text-primary">{u.name ?? u.email}</p>
                  <p className="text-[11px] text-[#A3A3A3]">{u.email} · {u.role.replace("_", " ")}</p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[rgba(220,38,38,0.15)] border border-red-500/20 text-red-400">
                  Unassigned
                </span>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-border">
            <p className="text-[12px] text-[#A3A3A3]">
              Assign participants to groups by editing pods in{" "}
              <a href="/super-admin/all-users" className="text-[#C8973A] hover:underline">User Management</a>.
            </p>
          </div>
        </div>
      )}

      {/* Groups */}
      <div className="space-y-3">
        <p className="section-label">ALL GROUPS</p>
        {pods.length === 0 && (
          <div className="glass-2 p-8 text-center">
            <Users size={28} className="text-[#A3A3A3] mx-auto mb-3" />
            <p className="text-text-secondary text-[14px]">No groups created yet.</p>
          </div>
        )}
        {pods.map((pod) => (
          <div key={pod.id} className="glass-2 overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-[13px] font-semibold text-text-primary">{pod.name}</span>
                <span className="text-[11px] text-[#A3A3A3] ml-2">
                  Facilitator: {pod.facilitator?.name ?? "Unassigned"}
                </span>
              </div>
              <span className="text-[11px] text-[#A3A3A3]">{pod.members.length} members</span>
            </div>
            {pod.members.length > 0 ? (
              <div className="px-4 py-3 flex flex-wrap gap-2">
                {pod.members.map((m) => (
                  <span key={m.user.id} className="text-[12px] px-2.5 py-1 rounded-full bg-bg-base border border-border text-text-secondary">
                    {m.user.name ?? m.user.email}
                  </span>
                ))}
              </div>
            ) : (
              <p className="px-4 py-3 text-[13px] text-[#A3A3A3]">No members yet.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
