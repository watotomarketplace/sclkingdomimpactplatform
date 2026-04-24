import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { UserManagement } from "@/components/program-admin/user-management";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.PROGRAM_ADMIN)) redirect("/");

  const [users, pods] = await Promise.all([
    db.user.findMany({
      where: { role: { in: ["PARTICIPANT", "FACILITATOR"] } },
      include: {
        participantProfile: { include: { cohort: true } },
        podMembership: { include: { pod: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.pod.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="px-6 py-6 max-w-[1100px]">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-text-primary">
          Manage Users
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {users.length} user{users.length !== 1 ? "s" : ""}
        </p>
      </div>

      <UserManagement users={users} pods={pods} />
    </div>
  );
}
