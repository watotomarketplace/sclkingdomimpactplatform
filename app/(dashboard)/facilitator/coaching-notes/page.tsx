import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess, isAdmin } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/enums";
import { SessionLogPanel } from "@/components/facilitator/session-log-panel";
import { ClipboardList } from "lucide-react";

export default async function FacilitatorSessionLogPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role as Role, Role.FACILITATOR)) redirect("/");

  const adminView = isAdmin(session.user.role as Role);

  const pods = await db.pod.findMany({
    where: adminView ? {} : { facilitatorId: session.user.id },
    include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });

  const notes = await db.coachingNote.findMany({
    where: adminView ? {} : { authorId: session.user.id },
    include: {
      recipient: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const participants = pods
    .flatMap((p) => p.members.map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email })))
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email));

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[820px]">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(200,151,58,0.15)] border border-[#C8973A]/30 flex items-center justify-center shrink-0">
          <ClipboardList size={22} className="text-[#FCD34D]" />
        </div>
        <div>
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary">
            Coaching Session Log
          </h1>
          <p className="text-text-secondary text-[13px] mt-1">
            {notes.length} session{notes.length !== 1 ? "s" : ""} logged
          </p>
        </div>
      </div>

      <SessionLogPanel
        participants={participants}
        notes={notes.map((n) => ({
          id: n.id,
          content: n.content,
          createdAt: n.createdAt,
          recipient: { id: n.recipient.id, name: n.recipient.name, email: n.recipient.email },
        }))}
      />
    </div>
  );
}
