import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PHASES = [
  { phase: "A", label: "Discovery", description: "Map your world and name your burden" },
  { phase: "B", label: "Validation", description: "Prove the problem is real" },
  { phase: "C", label: "Ideation", description: "From many ideas to one focused concept" },
];

export default async function Month1Page() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const submissions = await db.submission.findMany({
    where: { userId: session.user.id, month: 1 },
  });

  const getStatus = (phase: string) =>
    submissions.find((s) => s.phase === phase)?.status ?? "AVAILABLE";

  const isPhaseUnlocked = (phase: string) => {
    if (phase === "A") return true;
    if (phase === "B") return getStatus("A") === "SUBMITTED";
    if (phase === "C") return getStatus("B") === "SUBMITTED";
    return false;
  };

  // Check if gate 1 can be submitted (all phases submitted)
  const allPhasesSubmitted = PHASES.every((p) => getStatus(p.phase) === "SUBMITTED");
  const gateReview = await db.gateReview.findFirst({
    where: {
      submission: { userId: session.user.id, month: 1 },
    },
    include: { submission: true },
  });

  return (
    <div className="px-6 py-6 max-w-[780px]">
      <div className="mb-6">
        <p className="section-label mb-1">MONTH 1</p>
        <h1 className="font-display text-[32px] font-semibold text-text-primary leading-tight">Discovery</h1>
        <p className="text-text-secondary italic mt-1">Mapping your world, naming your burden</p>

        {/* Phase progress chips */}
        <div className="flex gap-2 mt-4">
          {PHASES.map((p) => {
            const status = getStatus(p.phase);
            return (
              <span key={p.phase} className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-md",
                status === "SUBMITTED" ? "bg-bg-sidebar text-text-inverse" : "bg-border text-text-secondary"
              )}>
                Phase {p.phase}: {status === "SUBMITTED" ? "✓" : status === "DRAFT" ? "Draft" : "Pending"}
              </span>
            );
          })}
        </div>
      </div>

      {/* Month emphasis callout */}
      <Card className="mb-6 border-l-4 border-l-accent-gold bg-[rgba(200,151,58,0.04)]">
        <p className="section-label mb-2">MONTH EMPHASIS</p>
        <p className="text-[14px] text-text-primary leading-relaxed">
          This month is about seeing clearly before acting. You are not building anything yet. You are observing, questioning, and documenting a real problem in a community you are genuinely close to. Evidence is everything.
        </p>
      </Card>

      {/* Phase cards */}
      <div className="space-y-3 mb-6">
        {PHASES.map((p) => {
          const status = getStatus(p.phase);
          const unlocked = isPhaseUnlocked(p.phase);

          return (
            <Card key={p.phase} className={cn(!unlocked && "opacity-60")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {status === "SUBMITTED" ? (
                    <CheckCircle2 size={20} className="text-accent-primary shrink-0" />
                  ) : !unlocked ? (
                    <Lock size={20} className="text-border-strong shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-accent-gold shrink-0" />
                  )}
                  <div>
                    <p className="text-[15px] font-medium text-text-primary">
                      Phase {p.phase} — {p.label}
                    </p>
                    <p className="text-xs text-text-secondary">{p.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={
                    status === "SUBMITTED" ? "submitted" :
                    status === "DRAFT" ? "gold" :
                    unlocked ? "on-track" : "locked"
                  }>
                    {status === "SUBMITTED" ? "Submitted" :
                     status === "DRAFT" ? "Draft saved" :
                     unlocked ? "Available" : "Locked"}
                  </Badge>
                  {unlocked && (
                    <Link href={`/participant/journey/month-1/phase-${p.phase}`}>
                      <Button size="sm" variant={status === "SUBMITTED" ? "secondary" : "primary"}>
                        {status === "SUBMITTED" ? "Review" : status === "DRAFT" ? "Continue" : "Start"}
                        <ChevronRight size={14} />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Gate 1 submission */}
      <Card className={cn(!allPhasesSubmitted && "opacity-60")}>
        <CardLabel>GATE 1 REVIEW</CardLabel>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-medium text-text-primary">Submit Month 1 for Review</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {allPhasesSubmitted
                ? "All phases complete. Your facilitator will review your work."
                : "Complete all three phases before submitting."}
            </p>
          </div>
          {!gateReview ? (
            <Link href={allPhasesSubmitted ? "/participant/journey/month-1/gate" : "#"}>
              <Button disabled={!allPhasesSubmitted} size="sm">
                Submit for review
              </Button>
            </Link>
          ) : (
            <Badge variant={
              gateReview.decision === "APPROVED" ? "approved" :
              gateReview.decision === "REVISION_REQUESTED" ? "needs-attention" :
              "pending"
            }>
              {gateReview.decision === "APPROVED" ? "Approved" :
               gateReview.decision === "REVISION_REQUESTED" ? "Revision requested" :
               gateReview.decision === "REDIRECTED" ? "Redirected" : "Under review"}
            </Badge>
          )}
        </div>
        {gateReview?.feedback && (
          <div className="mt-3 p-3 bg-[rgba(200,151,58,0.08)] border border-[rgba(200,151,58,0.2)] rounded-lg">
            <p className="text-xs font-medium text-accent-gold mb-1">FACILITATOR FEEDBACK</p>
            <p className="text-sm text-text-primary">{gateReview.feedback}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
