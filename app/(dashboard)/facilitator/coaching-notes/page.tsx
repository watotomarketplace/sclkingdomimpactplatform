import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { CoachingNotesView } from "@/components/shared/coaching-notes-view";

export default async function FacilitatorCoachingNotesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.FACILITATOR)) redirect("/");

  const pods = await db.pod.findMany({
    where: { facilitatorId: session.user.id },
    include: { members: { include: { user: { select: { id: true, name: true } } } } },
  });

  const notes = await db.coachingNote.findMany({
    where: { authorId: session.user.id },
    include: {
      recipient: { select: { id: true, name: true } },
      author: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const participants = pods.flatMap(p =>
    p.members.map(m => ({ id: m.user.id, name: m.user.name }))
  );
  // deduplicate by id
  const uniqueParticipants = participants.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);

  return (
    <div className="px-6 py-6 max-w-[780px]">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-text-primary">Coaching Notes</h1>
        <p className="text-text-secondary text-sm mt-1">{notes.length} note{notes.length !== 1 ? "s" : ""} across your pod participants</p>
      </div>

      <CoachingNotesView
        notes={notes}
        participants={uniqueParticipants}
        facilitatorId={session.user.id}
      />
    </div>
  );
}
