import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { PodManagement } from "@/components/program-admin/pod-management";

export default async function PodsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.PROGRAM_ADMIN)) redirect("/");

  const [pods, facilitators, cohorts] = await Promise.all([
    db.pod.findMany({
      include: {
        facilitator: true,
        cohort: true,
        members: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({
      where: { role: "FACILITATOR", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.cohort.findMany({
      where: { isActive: true },
      orderBy: { startDate: "desc" },
    }),
  ]);

  return (
    <div className="px-6 py-6 max-w-[900px]">
      <PodManagement pods={pods} facilitators={facilitators} cohorts={cohorts} />
    </div>
  );
}
