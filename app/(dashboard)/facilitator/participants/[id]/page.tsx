import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardLabel, CardTitle } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, MONTH_TITLES } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CoachingNoteForm } from "@/components/facilitator/coaching-note-form";
import { ScorecardAnnotationForm } from "@/components/facilitator/scorecard-annotation-form";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";

export default async function ParticipantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.FACILITATOR)) redirect("/");

  const { id } = await params;

  const participant = await db.user.findUnique({
    where: { id },
    include: {
      participantProfile: { include: { cohort: true } },
      podMembership: { include: { pod: true } },
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

  const currentMonth = participant.participantProfile?.currentMonth ?? 1;

  return (
    <div className="px-6 py-6 max-w-[780px]">
      <Link href="/facilitator" className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm mb-4 transition-colors">
        <ChevronLeft size={16} /> Pod Overview
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-[26px] font-semibold text-text-primary">{participant.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-text-secondary text-sm">{participant.podMembership?.pod.name ?? "No pod"}</span>
            <span className="text-text-secondary">·</span>
            <span className="text-text-secondary text-sm">Month {currentMonth} — {MONTH_TITLES[currentMonth]}</span>
          </div>
        </div>
        <Badge variant="on-track">Active</Badge>
      </div>

      {/* Tabs as anchor sections */}
      <div className="flex gap-4 border-b border-border mb-6 text-sm">
        {["Submissions", "Scorecard", "Journal", "Coaching Notes", "Readiness Assessment"].map((tab) => (
          <a key={tab} href={`#${tab.toLowerCase().replace(/ /g, "-")}`}
            className="pb-2 text-text-secondary hover:text-text-primary border-b-2 border-transparent hover:border-accent-gold transition-colors">
            {tab}
          </a>
        ))}
      </div>

      {/* Submissions */}
      <section id="submissions" className="mb-8">
        <h2 className="text-[16px] font-semibold text-text-primary mb-3">Submissions</h2>
        {participant.submissions.length === 0 ? (
          <Card className="py-8 text-center">
            <p className="text-text-secondary text-sm">No submissions yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {participant.submissions.map((sub) => (
              <Card key={sub.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium text-text-primary">
                      Month {sub.month} Phase {sub.phase}
                    </p>
                    {sub.submittedAt && (
                      <p className="text-xs text-text-secondary mt-0.5">Submitted {formatDateTime(sub.submittedAt)}</p>
                    )}
                  </div>
                  <Badge variant={sub.status === "SUBMITTED" ? "submitted" : sub.status === "DRAFT" ? "gold" : "locked"}>
                    {sub.status}
                  </Badge>
                </div>
                {sub.status === "SUBMITTED" && (
                  <details className="mt-3">
                    <summary className="text-xs text-accent-primary cursor-pointer hover:underline">View content</summary>
                    <div className="mt-2 space-y-2">
                      {Object.entries(sub.formData as Record<string, string>)
                        .filter(([, v]) => v)
                        .slice(0, 6)
                        .map(([k, v]) => (
                          <div key={k}>
                            <p className="text-[10px] uppercase font-medium text-text-secondary">{k.replace(/_/g, " ")}</p>
                            <p className="text-[13px] text-text-primary">{v}</p>
                          </div>
                        ))}
                    </div>
                  </details>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Scorecard */}
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
                      <p className="text-text-secondary">{label as string}</p>
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

      {/* Journal */}
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
                  <p className="text-sm text-text-primary">{j.prompt1?.slice(0, 120)}{(j.prompt1?.length ?? 0) > 120 ? "…" : ""}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Coaching Notes */}
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

      {/* Readiness Assessment */}
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
          const isInProgress = completedCount < 6;
          const lastUpdated = participant.readinessAssessments.reduce(
            (latest, a) => a.updatedAt > latest ? a.updatedAt : latest,
            participant.readinessAssessments[0].updatedAt
          );
          return (
            <div className="space-y-4">
              {isInProgress && (
                <Card padding="sm" className="border-l-4 border-accent-gold">
                  <p className="text-sm text-text-secondary">
                    Assessment in progress — {completedCount} of 6 questions completed.
                  </p>
                </Card>
              )}
              <p className="text-xs text-text-secondary">Last updated: {formatDateTime(lastUpdated)}</p>
              {participant.readinessAssessments.map((answer) => (
                <Card key={answer.id} padding="sm">
                  <CardLabel>QUESTION {answer.questionNumber}</CardLabel>
                  <p className="text-[14px] font-medium text-text-primary mb-3">
                    {QUESTION_TITLES[answer.questionNumber]}
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
