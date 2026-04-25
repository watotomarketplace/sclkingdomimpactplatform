import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getGreeting, formatDateTime, formatDate, MONTH_TITLES } from "@/lib/utils";
import { Card, CardLabel, CardTitle } from "@/components/ui/card";
import { JourneyProgress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RightPanel, type Widget } from "@/components/layout/right-panel";
import { OnboardingChecklist } from "@/components/participant/onboarding-checklist";
import { BookOpen, FileCheck, Clock } from "lucide-react";
import Link from "next/link";

export default async function ParticipantDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      participantProfile: true,
      submissions: {
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) redirect("/api/auth/force-signout");

  const currentMonth = user.participantProfile?.currentMonth ?? 1;
  const completedMonths: number[] = [];

  // Find completed months (months with approved gate reviews)
  const approvedGates = await db.gateReview.findMany({
    where: { reviewerId: { not: null }, decision: "APPROVED" },
    include: { submission: { select: { userId: true, month: true } } },
  });

  approvedGates
    .filter((g) => g.submission.userId === user.id)
    .forEach((g) => completedMonths.push(g.submission.month));

  const totalDeliverables = 3; // Month 1 has 3 phases
  const submittedDeliverables = user.submissions.filter(
    (s) => s.month === currentMonth && s.status === "SUBMITTED"
  ).length;

  // Build right panel widgets
  const MONTHLY_RHYTHM: Record<number, { week: string; focus: string }[]> = {
    1: [
      { week: "Wk 1", focus: "Identify a real problem you've observed in your context" },
      { week: "Wk 2", focus: "Research & validate the problem with at least 5 people" },
      { week: "Wk 3", focus: "Define your target user and draft your problem statement" },
      { week: "Wk 4", focus: "Complete Phase A, B & C submissions for gate review" },
    ],
    2: [
      { week: "Wk 1", focus: "Define your MVP scope — least effort, most learning" },
      { week: "Wk 2", focus: "Sketch core features and user flows" },
      { week: "Wk 3", focus: "Build a simple prototype or mockup" },
      { week: "Wk 4", focus: "Get feedback from 3+ potential users" },
    ],
    3: [
      { week: "Wk 1", focus: "Refine prototype based on feedback received" },
      { week: "Wk 2", focus: "Run a structured usability test with real users" },
      { week: "Wk 3", focus: "Iterate on key pain points identified in testing" },
      { week: "Wk 4", focus: "Prepare pilot plan and gate submission" },
    ],
    4: [
      { week: "Wk 1", focus: "Launch pilot with a small group of real users" },
      { week: "Wk 2", focus: "Monitor, track usage, and collect feedback daily" },
      { week: "Wk 3", focus: "Identify what's working and what needs fixing" },
      { week: "Wk 4", focus: "Document learnings and refine for launch" },
    ],
    5: [
      { week: "Wk 1", focus: "Prepare launch materials and communication plan" },
      { week: "Wk 2", focus: "Official launch — go to your target audience" },
      { week: "Wk 3", focus: "Drive adoption and track key metrics" },
      { week: "Wk 4", focus: "Review launch performance and submit gate" },
    ],
    6: [
      { week: "Wk 1", focus: "Measure Kingdom impact — lives, livelihoods, community" },
      { week: "Wk 2", focus: "Write your Impact Story" },
      { week: "Wk 3", focus: "Prepare final presentation for cohort showcase" },
      { week: "Wk 4", focus: "Celebrate, reflect and plan your next season" },
    ],
  };

  const widgets: Widget[] = [
    {
      id: "monthly-rhythm",
      type: "monthly-rhythm" as const,
      title: "Monthly Rhythm",
      content: `Your focus for Month ${currentMonth}:`,
      rhythm: MONTHLY_RHYTHM[currentMonth] ?? [],
    },
    {
      id: "journal-prompt",
      type: "journal-prompt" as const,
      title: "Monthly Journal",
      content: `Month ${currentMonth} journal is ready. Take a moment to reflect on your journey.`,
      action: { label: "Open journal", href: "/participant/journal" },
    },
  ];

  const coachingNote = await db.coachingNote.findFirst({
    where: { recipientId: user.id },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  if (coachingNote) {
    widgets.push({
      id: "coaching-note",
      type: "coaching-note" as const,
      title: "Facilitator Note",
      content: coachingNote.content.slice(0, 120) + (coachingNote.content.length > 120 ? "…" : ""),
    });
  }

  const lastReadiness = await db.readinessAssessment.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  widgets.push({
    id: "readiness-assessment",
    type: "readiness-assessment" as const,
    title: "Readiness Assessment",
    content: lastReadiness
      ? `Last updated: ${formatDate(lastReadiness.updatedAt)}`
      : "Complete your readiness assessment.",
    action: { label: "Review my answers →", href: "/participant/readiness-assessment" },
  });

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 max-w-[780px]">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="font-display text-[28px] font-semibold text-text-primary">
            {getGreeting(user.name)}
          </h1>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <p className="text-text-secondary text-sm">
              Month {currentMonth} · {MONTH_TITLES[currentMonth]}
            </p>
            {user.participantProfile?.category && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                user.participantProfile.category === "ENTREPRENEUR"
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-sky-700 bg-sky-50 border-sky-200"
              }`}>
                {user.participantProfile.category === "ENTREPRENEUR" ? "🌱" : "🏢"}
                {user.participantProfile.category === "ENTREPRENEUR" ? "Entrepreneur" : "Intrapreneur"}
              </span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-5 md:mb-6">
          <Card padding="sm">
            <CardLabel>CURRENT PHASE</CardLabel>
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-accent-primary" />
              <span className="text-[15px] font-semibold text-text-primary">Month {currentMonth}</span>
            </div>
            <p className="text-xs text-text-secondary mt-1">{MONTH_TITLES[currentMonth]}</p>
          </Card>

          <Card padding="sm">
            <CardLabel>DELIVERABLES</CardLabel>
            <p className="text-[22px] font-semibold text-text-primary font-mono">
              {submittedDeliverables}<span className="text-text-secondary text-sm font-sans"> / {totalDeliverables}</span>
            </p>
            <p className="text-xs text-text-secondary mt-1">submitted this month</p>
          </Card>

          <Card padding="sm" className="col-span-2 md:col-span-1">
            <CardLabel>JOURNEY</CardLabel>
            <p className="text-[22px] font-semibold text-text-primary font-mono">
              {Math.round(((currentMonth - 1) / 6) * 100)}<span className="text-text-secondary text-sm font-sans">%</span>
            </p>
            <p className="text-xs text-text-secondary mt-1">program complete</p>
          </Card>
        </div>

        {/* Journey Progress */}
        <Card className="mb-6">
          <CardLabel>6-MONTH JOURNEY</CardLabel>
          <JourneyProgress currentMonth={currentMonth} completedMonths={completedMonths} />
        </Card>

        {/* Quick access to current month */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Month {currentMonth} — {MONTH_TITLES[currentMonth]}</CardTitle>
            <Link
              href={`/participant/journey/month-${currentMonth}`}
              className="text-[13px] text-accent-primary hover:underline font-medium"
            >
              Continue →
            </Link>
          </div>
          <div className="space-y-2">
            {["A", "B", "C"].map((phase) => {
              const sub = user.submissions.find((s) => s.month === currentMonth && s.phase === phase);
              const status = sub?.status ?? "LOCKED";
              return (
                <div key={phase} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <FileCheck size={14} className={status === "SUBMITTED" ? "text-accent-primary" : "text-border-strong"} />
                    <span className="text-sm text-text-primary">Phase {phase}</span>
                  </div>
                  <Badge variant={
                    status === "SUBMITTED" ? "submitted" :
                    status === "DRAFT" ? "pending" :
                    status === "AVAILABLE" ? "on-track" : "locked"
                  }>
                    {status === "SUBMITTED" ? "Submitted" :
                     status === "DRAFT" ? "Draft saved" :
                     status === "AVAILABLE" ? "In progress" : "Locked"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent activity */}
        {user.submissions.length > 0 && (
          <Card>
            <CardLabel>RECENT ACTIVITY</CardLabel>
            <div className="space-y-3">
              {user.submissions.slice(0, 5).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-text-secondary" />
                    <span className="text-sm text-text-primary">
                      Month {sub.month} Phase {sub.phase} {sub.status === "SUBMITTED" ? "submitted" : "updated"}
                    </span>
                  </div>
                  <span className="text-xs text-text-secondary">{formatDateTime(sub.updatedAt)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Workbook export */}
        <div className="mt-4">
          <a
            href="/participant/workbook"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-bg-base border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <line x1="10" y1="9" x2="8" y2="9"/>
            </svg>
            Download Workbook (PDF)
          </a>
        </div>
      </div>

      <RightPanel widgets={widgets} />
      <OnboardingChecklist currentMonth={currentMonth} submissions={user.submissions} />
    </div>
  );
}
