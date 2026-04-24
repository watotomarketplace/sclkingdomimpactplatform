import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { CoachingNotesView } from "@/components/shared/coaching-notes-view";

export default async function ProgramAdminCoachingNotesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.PROGRAM_ADMIN)) redirect("/");

  const [notes, participants] = await Promise.all([
    db.coachingNote.findMany({
      include: {
        author: { select: { name: true } },
        recipient: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({
      where: { role: "PARTICIPANT" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="px-6 py-6 max-w-[780px]">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-text-primary">
          Coaching Notes
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {notes.length} note{notes.length !== 1 ? "s" : ""} across all
          participants
        </p>
      </div>

      <CoachingNotesView
        notes={notes}
        participants={participants}
        showAuthorColumn={true}
      />
    </div>
  );
}
