import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MONTH_TITLES } from "@/lib/utils";
import Link from "next/link";

export default async function ParticipantsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.PROGRAM_ADMIN)) redirect("/");

  const participants = await db.user.findMany({
    where: { role: "PARTICIPANT" },
    include: {
      participantProfile: { include: { cohort: true } },
      podMembership: { include: { pod: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="px-6 py-6 max-w-[900px]">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-text-primary">Participants</h1>
        <p className="text-text-secondary text-sm mt-1">{participants.length} total participants</p>
      </div>

      <Card padding="none">
        <div className="px-5 py-3 border-b border-border grid grid-cols-12 gap-3">
          <span className="section-label col-span-4">NAME</span>
          <span className="section-label col-span-2">POD</span>
          <span className="section-label col-span-2">MONTH</span>
          <span className="section-label col-span-2">COHORT</span>
          <span className="section-label col-span-2">STATUS</span>
        </div>
        {participants.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-text-secondary text-sm">No participants yet.</p>
          </div>
        ) : (
          participants.map((p) => {
            const month = p.participantProfile?.currentMonth ?? 1;
            return (
              <Link
                key={p.id}
                href={`/facilitator/participants/${p.id}`}
                className="px-5 py-3 border-b border-border last:border-0 grid grid-cols-12 gap-3 hover:bg-bg-base transition-colors items-center"
              >
                <div className="col-span-4">
                  <p className="text-[14px] font-medium text-text-primary">{p.name}</p>
                  <p className="text-xs text-text-secondary">{p.email}</p>
                </div>
                <p className="text-sm text-text-secondary col-span-2">{p.podMembership?.pod.name ?? "—"}</p>
                <p className="text-sm text-text-secondary col-span-2">Month {month} · {MONTH_TITLES[month]}</p>
                <p className="text-sm text-text-secondary col-span-2">{p.participantProfile?.cohort?.name ?? "—"}</p>
                <div className="col-span-2">
                  <Badge variant={p.isActive ? "on-track" : "locked"}>
                    {p.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </Link>
            );
          })
        )}
      </Card>
    </div>
  );
}
