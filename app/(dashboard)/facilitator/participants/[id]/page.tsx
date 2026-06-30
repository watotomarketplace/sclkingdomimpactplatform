import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/badge";
import { formatDateTime, MONTH_TITLES } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft, Paperclip, FileText } from "lucide-react";
import { CoachingNoteForm } from "@/components/facilitator/coaching-note-form";
import { ScorecardAnnotationForm } from "@/components/facilitator/scorecard-annotation-form";
import { AttendanceToggle } from "@/components/facilitator/attendance-toggle";
import { MilestoneReviewPanel } from "@/components/facilitator/milestone-review-panel";
import { MilestoneUnlockButton } from "@/components/facilitator/milestone-unlock-button";
import { hasAccess, isAdmin } from "@/lib/roles";
import { Role, MilestoneType } from "@/app/generated/prisma/client";
import { MILESTONE_TITLES, MILESTONE_ORDER, computeUnlocked, statusLabel, statusChipClass } from "@/lib/milestones";

// Field label maps — mirrors the milestone page definitions so the review panel shows human labels.
const MILESTONE_FIELDS: Record<MilestoneType, { key: string; label: string }[]> = {
  ONBOARDING: [
    { key: "initiativeName",    label: "Initiative name" },
    { key: "problemStatement",  label: "Problem statement" },
    { key: "healingHoped",      label: "The healing hoped for" },
    { key: "beneficiaries",     label: "Beneficiaries" },
    { key: "mviSummary",        label: "MVI summary" },
    { key: "singleAssumption",  label: "Single assumption to test" },
    { key: "buyInNeeded",       label: "Buy-in needed" },
    { key: "resourcesRequired", label: "Resources required" },
    { key: "realisticTimeline", label: "Realistic timeline" },
    { key: "likelyResistance",  label: "Likely resistance" },
    { key: "evidencePlan",      label: "Evidence plan" },
    { key: "firstTestDate",     label: "First test date" },
  ],
  MILESTONE_1: [
    { key: "initiativeType",           label: "Initiative type" },
    { key: "refinedProblemStatement",  label: "Refined problem statement" },
    { key: "conversationsSummary",     label: "Conversations with beneficiaries (min 3)" },
    { key: "whatIsNowClearer",         label: "What is now clearer" },
    { key: "whatTheyHadWrong",         label: "What they had wrong" },
    { key: "changesToMVI",             label: "Changes to MVI" },
    { key: "mviBuildProgress",         label: "MVI build progress" },
    { key: "supportingFile",           label: "Supporting evidence" },
  ],
  MILESTONE_2: [
    { key: "testCycle1Date",       label: "Test cycle 1 — date" },
    { key: "testCycle1Assumption", label: "Test cycle 1 — assumption" },
    { key: "testCycle1WhatBuilt",  label: "Test cycle 1 — what was built" },
    { key: "testCycle1WhoTested",  label: "Test cycle 1 — who tested" },
    { key: "testCycle1WhatTheyDid",   label: "Test cycle 1 — what they did" },
    { key: "testCycle1WhatLearned",   label: "Test cycle 1 — what was learned" },
    { key: "testCycle2",           label: "Test cycle 2 (optional)" },
    { key: "behaviouralEvidence",  label: "Behavioural evidence" },
    { key: "mviStatus",            label: "MVI status after testing" },
    { key: "supportingFile",       label: "Supporting file" },
    { key: "audioNote",            label: "Audio note" },
  ],
  MILESTONE_3: [
    { key: "whereRunningNow",          label: "Where initiative is running" },
    { key: "frequencyRhythm",          label: "Frequency and rhythm" },
    { key: "numbersReached",           label: "Numbers reached" },
    { key: "specificImpactStory",      label: "Specific impact story" },
    { key: "resistanceWhatPushedBack", label: "Resistance — what pushed back" },
    { key: "resistanceFromWhom",       label: "Resistance — from whom" },
    { key: "resistanceHowResponded",   label: "Resistance — how you responded" },
    { key: "whatIsBecomingClearer",    label: "What is becoming clearer" },
    { key: "artefact",                 label: "Artefact / evidence file" },
  ],
  MILESTONE_4: [
    { key: "initiativeNameFinal",          label: "Initiative name (final)" },
    { key: "brokennessAddressed",          label: "Brokenness addressed" },
    { key: "whatWasBuilt",                 label: "What was built" },
    { key: "whatChangedWithEvidence",      label: "What changed (with evidence)" },
    { key: "whatDidntWork",                label: "What didn't work" },
    { key: "whatTheyWouldDoDifferently",   label: "What you'd do differently" },
    { key: "whatHappensNext",              label: "What happens next" },
    { key: "dedication",                   label: "Dedication" },
    { key: "presentationFile",             label: "Final presentation file" },
  ],
};

export default async function ParticipantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role as Role, Role.FACILITATOR)) redirect("/");

  const { id } = await params;

  // Facilitators can only view participants in their own pods; admins have unrestricted access
  if (!isAdmin(session.user.role as Role)) {
    const membership = await db.podMember.findFirst({
      where: { userId: id, pod: { facilitatorId: session.user.id } },
    });
    if (!membership) notFound();
  }

  const participant = await db.user.findUnique({
    where: { id },
    include: {
      participantProfile: { include: { cohort: true } },
      podMembership: { include: { pod: true } },
      // Addendum 3 primary model
      milestoneSubmissions: { orderBy: { milestoneType: "asc" } },
      // Legacy model (kept for historical visibility)
      submissions: { orderBy: [{ month: "asc" }, { phase: "asc" }] },
      scorecards: { orderBy: { month: "asc" } },
      journals: { orderBy: { month: "asc" } },
      receivedCoachingNotes: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      readinessAssessments: { orderBy: { questionNumber: "asc" } },
    },
  });

  if (!participant) notFound();

  const adminView = isAdmin(session.user.role as Role);
  const lockedMilestones = MILESTONE_ORDER.filter(
    (m) => !computeUnlocked(participant.milestoneSubmissions).includes(m)
  );

  const currentMonth = participant.participantProfile?.currentMonth ?? 1;

  return (
    <div className="px-6 py-6 max-w-[820px]">
      <Link href="/facilitator" className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm mb-4 transition-colors">
        <ChevronLeft size={16} /> Pod Overview
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="font-display text-[26px] font-semibold text-text-primary">{participant.name}</h1>
            {participant.participantProfile?.category && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                participant.participantProfile.category === "ENTREPRENEUR"
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-sky-700 bg-sky-50 border-sky-200"
              }`}>
                {participant.participantProfile.category === "ENTREPRENEUR" ? "Entrepreneur" : "Intrapreneur"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-text-secondary text-sm">{participant.email}</span>
            <span className="text-text-secondary">·</span>
            <span className="text-text-secondary text-sm">{participant.podMembership?.pod.name ?? "No pod assigned"}</span>
            {participant.participantProfile?.cohort && (
              <>
                <span className="text-text-secondary">·</span>
                <span className="text-text-secondary text-sm">{participant.participantProfile.cohort.name}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AttendanceToggle
            participantId={participant.id}
            initialConfirmed={participant.participantProfile?.attendanceConfirmed ?? false}
          />
          <Badge variant="on-track">Active</Badge>
        </div>
      </div>

      {/* Tab anchors */}
      <div className="flex gap-4 border-b border-border mb-6 text-sm overflow-x-auto">
        {["Milestone Submissions", "Scorecard", "Journal", "Coaching Notes", "Readiness Assessment"].map((tab) => (
          <a key={tab} href={`#${tab.toLowerCase().replace(/ /g, "-")}`}
            className="pb-2 whitespace-nowrap text-text-secondary hover:text-text-primary border-b-2 border-transparent hover:border-accent-gold transition-colors">
            {tab}
          </a>
        ))}
      </div>

      {/* ── Milestone Submissions (Addendum 3) ──────────────────────────── */}
      <section id="milestone-submissions" className="mb-10">
        <h2 className="text-[16px] font-semibold text-text-primary mb-3">Milestone Submissions</h2>

        {participant.milestoneSubmissions.length === 0 ? (
          <Card className="py-8 text-center">
            <FileText size={24} className="text-text-secondary mx-auto mb-2" />
            <p className="text-text-secondary text-sm">No milestone submissions yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {participant.milestoneSubmissions.map((sub) => {
              const fields = MILESTONE_FIELDS[sub.milestoneType] ?? [];
              const formData = (sub.formData ?? {}) as Record<string, string>;
              const fileUrls = Array.isArray(sub.fileUrls) ? (sub.fileUrls as string[]) : [];

              // Collect file-type field URLs from formData as a fallback
              const fileFieldUrls = fields
                .filter((f) => f.key.toLowerCase().includes("file") || f.key === "audioNote" || f.key === "artefact")
                .map((f) => ({ label: f.label, url: formData[f.key] ?? "" }))
                .filter((f) => f.url.startsWith("https://"));

              const allFiles = [
                ...fileUrls.map((url) => ({ label: "Uploaded file", url })),
                ...fileFieldUrls,
              ].filter((f, i, arr) => arr.findIndex((x) => x.url === f.url) === i); // dedup

              return (
                <div key={sub.id} className="space-y-1">
                  <MilestoneReviewPanel
                    submission={{
                      id: sub.id,
                      userId: sub.userId,
                      userName: participant.name,
                      userEmail: participant.email,
                      milestoneType: sub.milestoneType,
                      status: sub.status,
                      formData: formData as Record<string, unknown>,
                      submittedAt: sub.submittedAt,
                      reviewedById: sub.reviewedById,
                      reviewNotes: sub.reviewNotes,
                    }}
                    fields={fields}
                    canReview={true}
                  />
                  {allFiles.length > 0 && (
                    <div className="px-4 py-2 bg-bg-base border border-border rounded-b-xl -mt-1 space-y-1">
                      <p className="text-[10px] uppercase font-semibold text-text-secondary tracking-wider">Uploaded files</p>
                      {allFiles.map((f, i) => (
                        <a
                          key={i}
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[13px] text-accent-primary hover:underline"
                        >
                          <Paperclip size={12} />
                          {f.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {adminView && lockedMilestones.length > 0 && (
          <div className="mt-4 glass-2 px-4 py-3">
            <p className="section-label mb-2">ADMIN — LOCKED MILESTONES</p>
            <div className="space-y-2">
              {lockedMilestones.map((m) => (
                <div key={m} className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-text-secondary">{MILESTONE_TITLES[m]}</span>
                  <MilestoneUnlockButton participantId={id} targetMilestone={m} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Scorecard ───────────────────────────────────────────────────── */}
      <section id="scorecard" className="mb-8">
        <h2 className="text-[16px] font-semibold text-text-primary mb-3">Scorecards</h2>
        {participant.scorecards.length === 0 ? (
          <Card className="py-8 text-center">
            <p className="text-text-secondary text-sm">No scorecards submitted yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {participant.scorecards.map((sc) => (
              <Card key={sc.id} padding="sm">
                <p className="text-[14px] font-medium text-text-primary mb-2">Month {sc.month}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    ["Problem Clarity", sc.problemClarity],
                    ["Research Effort", sc.researchEffort],
                    ["Execution", sc.executionDiscipline],
                    ["MVP Progress", sc.mvpProgress],
                    ["Kingdom Alignment", sc.kingdomAlignment],
                    ["Peer Engagement", sc.peerEngagement],
                  ].map(([label, val]) => (
                    <div key={label as string}>
                      <p className="text-text-secondary mb-0.5">{label as string}</p>
                      <Badge variant={
                        val === "ON_TRACK" ? "on-track" :
                        val === "NEEDS_ATTENTION" ? "needs-attention" : "escalate"
                      }>
                        {val === "ON_TRACK" ? "On Track" : val === "NEEDS_ATTENTION" ? "Attention" : "Escalate"}
                      </Badge>
                    </div>
                  ))}
                </div>
                <ScorecardAnnotationForm
                  scorecardUserId={participant.id}
                  month={sc.month}
                  existingNotes={sc.facilitatorNotes}
                />
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Journal ─────────────────────────────────────────────────────── */}
      <section id="journal" className="mb-8">
        <h2 className="text-[16px] font-semibold text-text-primary mb-3">Journal Entries</h2>
        {participant.journals.length === 0 ? (
          <Card className="py-8 text-center">
            <p className="text-text-secondary text-sm">No journal entries yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {participant.journals.map((j) => (
              <Card key={j.id} padding="sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[14px] font-medium text-text-primary">Month {j.month}</p>
                  {j.isPrivate && <Badge variant="pending">Private</Badge>}
                </div>
                {j.isPrivate ? (
                  <p className="text-text-secondary text-sm italic">This entry is marked private.</p>
                ) : (
                  <p className="text-sm text-text-primary">{j.prompt1?.slice(0, 140)}{(j.prompt1?.length ?? 0) > 140 ? "…" : ""}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Coaching Notes ───────────────────────────────────────────────── */}
      <section id="coaching-notes" className="mb-8">
        <h2 className="text-[16px] font-semibold text-text-primary mb-3">Coaching Notes</h2>
        <CoachingNoteForm recipientId={id} recipientName={participant.name} />
        {participant.receivedCoachingNotes.length > 0 && (
          <div className="space-y-3 mt-4">
            {participant.receivedCoachingNotes.map((note) => (
              <Card key={note.id} padding="sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-text-secondary">{note.author.name}</p>
                  <p className="text-xs text-text-secondary">{formatDateTime(note.createdAt)}</p>
                </div>
                <p className="text-sm text-text-primary">{note.content}</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Readiness Assessment ─────────────────────────────────────────── */}
      <section id="readiness-assessment" className="mb-8">
        <h2 className="text-[16px] font-semibold text-text-primary mb-3">Readiness Assessment</h2>
        {participant.readinessAssessments.length === 0 ? (
          <Card className="py-6 text-center">
            <p className="text-text-secondary text-sm">This participant has not yet completed their Readiness Assessment.</p>
          </Card>
        ) : (() => {
          const QUESTION_TITLES: Record<number, string> = {
            1: "What value am I creating, and for whom?",
            2: "Am I growing as an entrepreneur, or just working as a technician?",
            3: "Do the numbers make sense?",
            4: "Have I talked with the people this journey will affect?",
            5: "What is my why?",
            6: "Where is my identity rooted?",
          };
          const completedCount = participant.readinessAssessments.filter(
            (a) => a.currentAnswer && a.currentAnswer.trim().length > 0
          ).length;
          const lastUpdated = participant.readinessAssessments.reduce(
            (latest, a) => a.updatedAt > latest ? a.updatedAt : latest,
            participant.readinessAssessments[0].updatedAt
          );
          return (
            <div className="space-y-4">
              {completedCount < 6 && (
                <Card padding="sm" className="border-l-4 border-accent-gold">
                  <p className="text-sm text-text-secondary">
                    Assessment in progress — {completedCount} of 6 questions answered.
                  </p>
                </Card>
              )}
              <p className="text-xs text-text-secondary">Last updated: {formatDateTime(lastUpdated)}</p>
              {participant.readinessAssessments.map((answer) => (
                <Card key={answer.id} padding="sm">
                  <CardLabel>QUESTION {answer.questionNumber}</CardLabel>
                  <p className="text-[14px] font-medium text-text-primary mb-3">
                    {QUESTION_TITLES[answer.questionNumber] ?? `Question ${answer.questionNumber}`}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] uppercase font-medium text-text-secondary mb-1">Current answer</p>
                      {answer.currentAnswer ? (
                        <p className="text-sm text-text-primary whitespace-pre-wrap">{answer.currentAnswer}</p>
                      ) : (
                        <p className="text-sm text-text-secondary italic">No answer provided.</p>
                      )}
                    </div>
                    {answer.actionToTake && (
                      <div>
                        <p className="text-[11px] uppercase font-medium text-text-secondary mb-1">Action to take</p>
                        <p className="text-sm text-text-primary whitespace-pre-wrap">{answer.actionToTake}</p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          );
        })()}
      </section>
    </div>
  );
}
