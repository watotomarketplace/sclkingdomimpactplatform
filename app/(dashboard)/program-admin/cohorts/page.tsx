import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { CohortManagement } from "@/components/program-admin/cohort-management";

export default async function CohortsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.PROGRAM_ADMIN)) redirect("/");

  const cohorts = await db.cohort.findMany({
    include: {
      participants: true,
      pods: true,
    },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="px-6 py-6 max-w-[900px]">
      <CohortManagement cohorts={cohorts} />
    </div>
  );
}
