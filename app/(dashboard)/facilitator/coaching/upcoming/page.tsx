import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/enums";
import { CalendarDays, Video } from "lucide-react";

export default async function FacilitatorCoachingUpcomingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.FACILITATOR)) redirect("/");

  // Get all participants in this facilitator's pods
  const pods = await db.pod.findMany({
    where: { facilitatorId: session.user.id },
    include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });
  const participantIds = pods.flatMap((p) => p.members.map((m) => m.userId));

  // Upcoming sessions (future dates)
  const now = new Date();
  const upcomingSessions = await db.coachingSession.findMany({
    where: {
      participantId: { in: participantIds },
      sessionDate: { gte: now },
    },
    include: { participant: { select: { name: true, email: true } } },
    orderBy: { sessionDate: "asc" },
    take: 50,
  }).catch(() => [] as never[]);

  // Recent past sessions (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentSessions = await db.coachingSession.findMany({
    where: {
      participantId: { in: participantIds },
      sessionDate: { gte: thirtyDaysAgo, lt: now },
    },
    include: { participant: { select: { name: true, email: true } } },
    orderBy: { sessionDate: "desc" },
    take: 20,
  }).catch(() => [] as never[]);

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[820px]">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(200,151,58,0.15)] border border-[#C8973A]/30 flex items-center justify-center shrink-0">
          <CalendarDays size={22} className="text-[#FCD34D]" />
        </div>
        <div>
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary">Upcoming Coaching Sessions</h1>
          <p className="text-text-secondary text-[13px] mt-1">{upcomingSessions.length} scheduled</p>
        </div>
      </div>

      {/* Upcoming */}
      {upcomingSessions.length === 0 ? (
        <div className="glass-2 p-8 text-center mb-5">
          <CalendarDays size={28} className="text-[#A3A3A3] mx-auto mb-3" />
          <p className="text-text-secondary text-[14px] font-medium mb-1">No upcoming sessions</p>
          <p className="text-[#A3A3A3] text-[13px]">Sessions booked by your participants will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          <p className="section-label mb-3">UPCOMING</p>
          {upcomingSessions.map((s: { id: string; sessionDate: Date; notes: string | null; participant: { name: string | null; email: string } }) => (
            <div key={s.id} className="glass-2 px-4 py-3 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[rgba(200,151,58,0.20)] border border-[#C8973A]/30 flex items-center justify-center shrink-0">
                <Video size={14} className="text-[#FCD34D]" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-text-primary">{s.participant.name ?? s.participant.email}</p>
                <p className="text-[12px] text-text-secondary">
                  {new Date(s.sessionDate).toLocaleDateString("en-GB", {
                    weekday: "short", day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
                {s.notes && <p className="text-[12px] text-[#A3A3A3] mt-1">{s.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent */}
      {recentSessions.length > 0 && (
        <div>
          <p className="section-label mb-3">LAST 30 DAYS</p>
          <div className="space-y-2">
            {recentSessions.map((s: { id: string; sessionDate: Date; notes: string | null; participant: { name: string | null; email: string } }) => (
              <div key={s.id} className="glass-2 px-4 py-3 flex items-start gap-3 opacity-70">
                <div className="w-9 h-9 rounded-full bg-bg-base border border-border flex items-center justify-center shrink-0">
                  <Video size={14} className="text-[#A3A3A3]" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-text-primary">{s.participant.name ?? s.participant.email}</p>
                  <p className="text-[12px] text-[#A3A3A3]">
                    {new Date(s.sessionDate).toLocaleDateString("en-GB", {
                      weekday: "short", day: "numeric", month: "short",
                    })}
                  </p>
                  {s.notes && <p className="text-[12px] text-[#A3A3A3] mt-1 truncate">{s.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
