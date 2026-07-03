import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/enums";
import { GroupManagement } from "@/components/super-admin/group-management";

export default async function GroupAssignmentPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.SUPER_ADMIN)) redirect("/");

  const [pods, unassignedUsers, facilitators] = await Promise.all([
    db.pod.findMany({
      include: {
        facilitator: { select: { name: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { joinedAt: "asc" },
        },
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
    db.user.findMany({
      where: { role: Role.FACILITATOR, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const groups = pods.map((pod) => ({
    id: pod.id,
    name: pod.name,
    facilitatorName: pod.facilitator?.name ?? null,
    members: pod.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      isLeader: m.isLeader,
    })),
  }));

  return (
    <GroupManagement
      groups={groups}
      unassigned={unassignedUsers}
      facilitators={facilitators}
    />
  );
}
