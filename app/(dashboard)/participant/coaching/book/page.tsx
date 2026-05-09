import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CalendarDays, ExternalLink, Video, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function CoachingBookPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Get the participant's facilitator via pod membership
  const podMember = await db.podMember.findFirst({
    where: { userId: session.user.id },
    include: {
      pod: {
        include: {
          facilitator: { select: { name: true, email: true } },
        },
      },
    },
  });

  const facilitator = podMember?.pod?.facilitator ?? null;

  // My upcoming sessions
  const now = new Date();
  const upcomingSessions = await db.coachingSession.findMany({
    where: { participantId: session.user.id, sessionDate: { gte: now } },
    orderBy: { sessionDate: "asc" },
    take: 5,
  }).catch(() => [] as never[]);

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[680px]">
      {/* Back */}
      <Link
        href="/participant/coaching"
        className="inline-flex items-center gap-1.5 text-[12px] text-text-secondary hover:text-text-primary transition-colors mb-5"
      >
        <ChevronLeft size={14} /> Back to sessions
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(200,151,58,0.15)] border border-[#C8973A]/30 flex items-center justify-center shrink-0">
          <CalendarDays size={22} className="text-[#FCD34D]" />
        </div>
        <div>
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary">Book a Coaching Session</h1>
          <p className="text-text-secondary text-[13px] mt-1">
            Schedule a 1-on-1 conversation with your facilitator
          </p>
        </div>
      </div>

      {/* Facilitator card */}
      <div className="glass-2 p-5 mb-5">
        <p className="section-label mb-3">YOUR FACILITATOR</p>
        {facilitator ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[rgba(200,151,58,0.20)] border border-[#C8973A]/30 flex items-center justify-center">
              <span className="text-[13px] font-semibold text-[#FCD34D]">
                {facilitator.name?.charAt(0).toUpperCase() ?? "F"}
              </span>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-text-primary">{facilitator.name}</p>
              <p className="text-[12px] text-text-secondary">{facilitator.email}</p>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-[#A3A3A3]">No facilitator assigned yet. Contact your program admin.</p>
        )}
      </div>

      {/* Booking instruction */}
      <div className="glass-2 p-5 mb-5">
        <p className="section-label mb-3">HOW TO BOOK</p>
        <ol className="space-y-3">
          {[
            "Click the booking link below to open your facilitator's calendar.",
            "Choose a time that works for both of you.",
            "Add a brief note about what you want to discuss.",
            "You'll receive a confirmation email with the session details.",
            "After the session, log it in your coaching history.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[rgba(200,151,58,0.20)] border border-[#C8973A]/30 flex items-center justify-center shrink-0 text-[11px] font-semibold text-[#FCD34D] mt-0.5">
                {i + 1}
              </span>
              <p className="text-[13px] text-text-secondary leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>

        <a
          href="mailto:${facilitator?.email ?? ''}"
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[rgba(200,151,58,0.20)] border border-[#C8973A]/40 text-[13px] font-semibold text-[#FCD34D] hover:bg-[rgba(200,151,58,0.30)] transition-all"
          onClick={(e) => {
            // placeholder — in production, link to Calendly or similar
            e.preventDefault();
            alert("Your facilitator's booking calendar link will be shared with you by email.");
          }}
        >
          <CalendarDays size={15} />
          Open Booking Calendar
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Upcoming booked sessions */}
      {upcomingSessions.length > 0 && (
        <div className="glass-2 p-5">
          <p className="section-label mb-3">YOUR UPCOMING SESSIONS</p>
          <div className="space-y-2">
            {upcomingSessions.map((s: { id: string; sessionDate: Date; notes: string | null }) => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <Video size={13} className="text-[#FCD34D] shrink-0" />
                <div className="flex-1">
                  <p className="text-[13px] text-text-primary">
                    {new Date(s.sessionDate).toLocaleDateString("en-GB", {
                      weekday: "short", day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                  {s.notes && <p className="text-[11px] text-[#A3A3A3]">{s.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link back */}
      <div className="mt-5 text-center">
        <Link
          href="/participant/coaching"
          className="text-[12px] text-[#A3A3A3] hover:text-text-primary transition-colors"
        >
          View full session history →
        </Link>
      </div>
    </div>
  );
}
