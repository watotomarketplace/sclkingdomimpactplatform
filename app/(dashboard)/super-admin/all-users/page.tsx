import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess, ROLE_LABELS } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { AllUsersClient } from "@/components/super-admin/all-users-client";

export default async function AllUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.SUPER_ADMIN)) redirect("/");

  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  const roleOrder: Role[] = [Role.SUPER_ADMIN, Role.PROGRAM_ADMIN, Role.FACILITATOR, Role.GROUP_LEADER, Role.PARTICIPANT];
  const grouped = roleOrder.map((role) => ({
    role,
    label: ROLE_LABELS[role],
    users: users.filter((u) => u.role === role),
  }));

  return <AllUsersClient grouped={grouped} totalCount={users.length} />;
}
