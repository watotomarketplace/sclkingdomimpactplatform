import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role, MilestoneStatus } from "@/app/generated/prisma/enums";
import { CalendarDays, Sparkles } from "lucide-react";
import { formatDeadline, MILESTONE_DEADLINES, MILESTONE_TITLES } from "@/lib/milestones";
import { MilestoneType } from "@/app/generated/prisma/enums";

export default async function PresentationSchedulePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.SUPER_ADMIN)) redirect("/");

  // Participants who have completed all milestones (Milestone 4 submitted)
  const finalists = await db.milestoneSubmission.findMany({
    where: {
      milestoneType: MilestoneType.MILESTONE_4,
      status: MilestoneStatus.SUBMITTED,
    },
    include: {
      user: {
        select: { name: true, email: true },
        include: { podMembership: { include: { pod: { select: { name: true } } } } },
      },
    },
    orderBy: { submittedAt: "asc" },
  });

  // Programme key dates
  const keyDates = [
    { label: "Onboarding (MVI Brief)", date: MILESTONE_DEADLINES[MilestoneType.ONBOARDING] },
    { label: "Milestone 1 Deadline", date: MILESTONE_DEADLINES[MilestoneType.MILESTONE_1] },
    { label: "Milestone 2 Deadline", date: MILESTONE_DEADLINES[MilestoneType.MILESTONE_2] },
    { label: "Milestone 3 Deadline", date: MILESTONE_DEADLINES[MilestoneType.MILESTONE_3] },
    { label: "Final Submission Deadline", date: MILESTONE_DEADLINES[MilestoneType.MILESTONE_4] },
  ];

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[820px]">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-bg-base border border-border flex items-center justify-center shrink-0">
          <CalendarDays size={22} className="text-text-secondary" />
        </div>
        <div>
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary">Presentation Schedule</h1>
          <p className="text-text-secondary text-[13px] mt-1">Programme timeline and graduation showcase</p>
        </div>
      </div>

      {/* Programme timeline */}
      <div className="glass-2 overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-border">
          <p className="section-label">PROGRAMME TIMELINE — 2026</p>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {keyDates.map((d, i) => {
            const isPast = d.date < new Date();
            return (
              <div key={i} className={`px-4 py-3 flex items-center justify-between gap-3 ${isPast ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isPast ? "bg-[#86EFAC]" : "bg-[#C8973A]"}`} />
                  <span className="text-[13px] text-text-primary">{d.label}</span>
                </div>
                <span className="text-[12px] font-mono text-text-secondary shrink-0">
                  {d.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            );
          })}
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sparkles size={12} className="text-[#FCD34D] shrink-0" />
              <span className="text-[13px] font-semibold text-[#FCD34D]">Graduation Showcase</span>
            </div>
            <span className="text-[12px] font-mono text-[#FCD34D]/70 shrink-0">TBC — Sept / Oct 2026</span>
          </div>
        </div>
      </div>

      {/* Finalists */}
      <div className="glass-2 overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="section-label">PROGRAMME COMPLETERS</p>
          <span className="text-[12px] text-[#A3A3A3]">{finalists.length} participants</span>
        </div>

        {finalists.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Sparkles size={24} className="text-[#A3A3A3] mx-auto mb-2" />
            <p className="text-[13px] text-[#A3A3A3]">No participants have completed all milestones yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {finalists.map((s, i) => {
              const pod = s.user.podMembership?.pod;
              return (
                <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-[12px] font-mono text-[#A3A3A3] w-6 shrink-0">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-[rgba(45,90,61,0.5)] border border-[rgba(134,239,172,0.4)] flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-semibold text-[#86EFAC]">
                      {(s.user.name ?? s.user.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-text-primary truncate">{s.user.name ?? s.user.email}</p>
                    <p className="text-[11px] text-[#A3A3A3]">{pod?.name ?? "No group"}</p>
                  </div>
                  <span className="text-[11px] text-[#A3A3A3] shrink-0">
                    {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
