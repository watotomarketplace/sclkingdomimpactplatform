import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getGreeting } from "@/lib/utils";
import {
  computeUnlocked,
  computeStatus,
  MILESTONE_TITLES,
  MILESTONE_SLUG,
  MILESTONE_ORDER,
  MILESTONE_DEADLINES,
  statusChipClass,
  statusLabel,
  formatDeadline,
} from "@/lib/milestones";
import { HealingProgress } from "@/components/journey/healing-progress";
import { MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";
import { ChevronRight, Compass, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const MILESTONE_DESCRIPTIONS: Record<MilestoneType, string> = {
  ONBOARDING: "Define your Kingdom Impact Initiative through your MVI Brief.",
  MILESTONE_1: "Validate your problem with at least 5 external stakeholders.",
  MILESTONE_2: "Build and test your Minimum Viable Initiative with real people.",
  MILESTONE_3: "Implement, iterate, and document what you have learned.",
  MILESTONE_4: "Submit your final evidence report and impact story.",
};

const MILESTONE_STAGE_LABEL: Record<MilestoneType, string> = {
  ONBOARDING: "SEE",
  MILESTONE_1: "UNDERSTAND",
  MILESTONE_2: "BUILD",
  MILESTONE_3: "BUILD",
  MILESTONE_4: "LAUNCH & MEASURE",
};

export default async function ParticipantDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      milestoneSubmissions: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!user) redirect("/api/auth/force-signout");

  const submissions = user.milestoneSubmissions;
  const unlockedMilestones = computeUnlocked(submissions);

  const submissionMap = new Map(submissions.map((s) => [s.milestoneType, s]));

  // Active milestone: the first unlocked milestone that isn't submitted
  const activeMilestone =
    unlockedMilestones.find((m) => {
      const s = submissionMap.get(m);
      return !s || s.status !== MilestoneStatus.SUBMITTED;
    }) ?? unlockedMilestones[unlockedMilestones.length - 1];

  const submittedMilestones = submissions
    .filter((s) => s.status === MilestoneStatus.SUBMITTED)
    .map((s) => s.milestoneType);

  const totalMilestones = MILESTONE_ORDER.length;
  const completedCount = submittedMilestones.length;
  const progressPct = Math.round((completedCount / totalMilestones) * 100);

  // Latest coaching note
  const coachingNote = await db.coachingNote.findFirst({
    where: { recipientId: user.id },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[820px]">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="font-display text-[28px] md:text-[32px] font-semibold text-text-primary leading-tight">
          {getGreeting(user.name)}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Kingdom Impact Work — your journey to healing your sphere of influence.
        </p>
      </div>

      {/* Progress summary */}
      <div className="glass-2 px-5 py-4 mb-4 fade-in-up">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-medium text-text-secondary">
            {completedCount} of {totalMilestones} milestones complete
          </span>
          <span className="text-[12px] font-mono text-[#FCD34D]">{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-bg-base rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2D5A3D] to-[#86EFAC] transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 5-Stage Healing Framework */}
      <div className="mb-4 fade-in-up" style={{ animationDelay: "60ms" }}>
        <HealingProgress
          submittedMilestones={submittedMilestones}
          currentMilestone={activeMilestone}
        />
      </div>

      {/* Milestone cards */}
      <div className="space-y-3 mb-6">
        {MILESTONE_ORDER.map((milestone, i) => {
          const submission = submissionMap.get(milestone) ?? null;
          const isUnlocked = unlockedMilestones.includes(milestone);
          const isActive = milestone === activeMilestone;
          const status = isUnlocked
            ? computeStatus(milestone, submission)
            : MilestoneStatus.NOT_STARTED;
          const slug = MILESTONE_SLUG[milestone];
          const isSubmitted = status === MilestoneStatus.SUBMITTED;

          return (
            <div
              key={milestone}
              className={`glass-2 p-4 fade-in-up ${isActive ? "ring-1 ring-[#C8973A]/40" : ""}`}
              style={{ animationDelay: `${(i + 2) * 60}ms` }}
            >
              <div className="flex items-start gap-3">
                {/* Stage number */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[13px] font-semibold ${
                    isSubmitted
                      ? "bg-[rgba(45,90,61,0.6)] border border-[rgba(134,239,172,0.5)] text-[#86EFAC]"
                      : isActive
                      ? "bg-[rgba(200,151,58,0.25)] border border-[#C8973A] text-[#FCD34D]"
                      : isUnlocked
                      ? "bg-bg-base border border-border text-text-secondary"
                      : "bg-bg-base border border-border text-[#A3A3A3]"
                  }`}
                >
                  {isSubmitted ? <CheckCircle2 size={16} /> : isUnlocked ? i + 1 : <Lock size={13} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span
                      className={`text-[13px] font-semibold ${
                        isUnlocked ? "text-text-primary" : "text-[#A3A3A3]"
                      }`}
                    >
                      {MILESTONE_TITLES[milestone]}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        isActive
                          ? "bg-[rgba(200,151,58,0.2)] text-[#FCD34D]"
                          : "bg-bg-base text-[#A3A3A3]"
                      }`}
                    >
                      {MILESTONE_STAGE_LABEL[milestone]}
                    </span>
                    {isUnlocked && (
                      <span className={statusChipClass(status)}>
                        {statusLabel(status)}
                      </span>
                    )}
                  </div>

                  <p className={`text-[12px] leading-relaxed ${isUnlocked ? "text-text-secondary" : "text-[#A3A3A3]"}`}>
                    {MILESTONE_DESCRIPTIONS[milestone]}
                  </p>

                  {isUnlocked && !isSubmitted && (
                    <p className="text-[11px] text-[#A3A3A3] mt-1">
                      Due {formatDeadline(milestone)}
                    </p>
                  )}
                </div>

                {isUnlocked ? (
                  <Link
                    href={`/participant/journey/${slug}`}
                    className="shrink-0 flex items-center gap-1 text-[12px] font-medium text-[#C8973A] hover:text-[#FCD34D] transition-colors"
                  >
                    {isSubmitted ? "Review" : isActive ? "Continue" : "Open"}
                    <ChevronRight size={14} />
                  </Link>
                ) : (
                  <div className="shrink-0 flex items-center gap-1 text-[11px] text-[#A3A3A3]">
                    <Lock size={12} />
                    Locked
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Coaching note */}
      {coachingNote && (
        <div className="callout-gold fade-in-up mb-4" style={{ animationDelay: "420ms" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FCD34D]/70 mb-1">
            Note from {coachingNote.author.name}
          </p>
          <p className="text-[13px] text-text-primary leading-relaxed">
            {coachingNote.content.slice(0, 200)}
            {coachingNote.content.length > 200 ? "…" : ""}
          </p>
        </div>
      )}

      {/* Quick links */}
      <div className="glass-2 p-4 fade-in-up" style={{ animationDelay: "480ms" }}>
        <p className="section-label mb-3">QUICK LINKS</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Problem Log", href: "/participant/problem-log", icon: "📋" },
            { label: "My Scorecard", href: "/participant/scorecard", icon: "🎯" },
            { label: "Book Coaching", href: "/participant/coaching/book", icon: "📅" },
            { label: "Kingdom Journal", href: "/participant/journal", icon: "📖" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-bg-base hover:bg-bg-base border border-border text-[12px] font-medium text-text-secondary hover:text-text-primary transition-all"
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
