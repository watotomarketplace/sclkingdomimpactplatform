"use client";

import { useState, useCallback } from "react";
import type { ReadinessAssessment } from "@/app/generated/prisma/client";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface QuestionData {
  questionNumber: number;
  title: string;
  framing: string;
  prompts: string[];
}

const QUESTIONS: QuestionData[] = [
  {
    questionNumber: 1,
    title: "What value am I creating, and for whom?",
    framing:
      "This question keeps you grounded in value creation rather than activity for its own sake.",
    prompts: [
      "What exact problem am I trying to solve?",
      "Who feels this pain most directly?",
      "What have I heard from the people affected?",
      "What change would be valuable to them, not just impressive to me?",
    ],
  },
  {
    questionNumber: 2,
    title: "Am I growing as an entrepreneur, or just working as a technician?",
    framing:
      "A technician asks, \"What can I build with my own hands?\" An entrepreneur also asks, \"Who must I learn from, partner with, or involve?\"",
    prompts: [
      "What can I personally do well right now?",
      "What do I not yet know how to do?",
      "Whose help, skill, credibility, or network do I need?",
      "What kind of team or support ecosystem might strengthen this venture?",
    ],
  },
  {
    questionNumber: 3,
    title: "Do the numbers make sense?",
    framing:
      "You need stewardship, realism, and freedom from vague assumptions.",
    prompts: [
      "What is the lowest-cost way to test this idea?",
      "What resources do I already have?",
      "What costs are unavoidable?",
      "Will this remain a side venture, an internal innovation, or grow into something larger?",
    ],
  },
  {
    questionNumber: 4,
    title: "Have I talked with the people this journey will affect?",
    framing:
      "Mature participants seek understanding and alignment before creating avoidable chaos at home, at work, or in ministry.",
    prompts: [
      "Who will be affected by the time, attention, and risk this journey requires?",
      "What alignment do I need with family, supervisors, mentors, or ministry leaders?",
      "What support do I need from them?",
      "What concerns are they raising that I should take seriously?",
    ],
  },
  {
    questionNumber: 5,
    title: "What is my why?",
    framing:
      "A strong why protects you from quitting too early or pursuing the wrong reward.",
    prompts: [
      "Why does this problem matter to me?",
      "What burden or calling is connected to it?",
      "What human flourishing or kingdom impact do I long to see?",
      "If this becomes difficult, what deeper reason will keep me faithful?",
    ],
  },
  {
    questionNumber: 6,
    title: "Where is my identity rooted?",
    framing:
      "Participants who tie identity to venture performance become either defensive when challenged or crushed when things go wrong.",
    prompts: [
      "If this idea struggles, fails, or pivots, who am I still?",
      "What fears am I carrying about success, approval, or visible progress?",
      "How is God forming my character through this journey?",
      "What scriptures or truths will anchor me when outcomes are uncertain?",
    ],
  },
];

interface DraftAnswers {
  [questionNumber: number]: {
    currentAnswer: string;
    actionToTake: string;
  };
}

interface Props {
  initialAnswers: ReadinessAssessment[];
  lastUpdated: Date | null;
}

export function ReadinessRevisitClient({ initialAnswers, lastUpdated }: Props) {
  // Build initial draft state from saved answers
  const buildInitialDraft = (): DraftAnswers => {
    const draft: DraftAnswers = {};
    QUESTIONS.forEach((q) => {
      const saved = initialAnswers.find((a) => a.questionNumber === q.questionNumber);
      draft[q.questionNumber] = {
        currentAnswer: saved?.currentAnswer ?? "",
        actionToTake: saved?.actionToTake ?? "",
      };
    });
    return draft;
  };

  const [draft, setDraft] = useState<DraftAnswers>(buildInitialDraft);
  const [saved, setSaved] = useState<DraftAnswers>(buildInitialDraft);
  const [saving, setSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const isDirty = useCallback(() => {
    return QUESTIONS.some((q) => {
      const d = draft[q.questionNumber];
      const s = saved[q.questionNumber];
      return d.currentAnswer !== s.currentAnswer || d.actionToTake !== s.actionToTake;
    });
  }, [draft, saved]);

  const handleChange = (
    questionNumber: number,
    field: "currentAnswer" | "actionToTake",
    value: string
  ) => {
    setDraft((prev) => ({
      ...prev,
      [questionNumber]: {
        ...prev[questionNumber],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorBanner(null);
    try {
      const dirtyQuestions = QUESTIONS.filter((q) => {
        const d = draft[q.questionNumber];
        const s = saved[q.questionNumber];
        return d.currentAnswer !== s.currentAnswer || d.actionToTake !== s.actionToTake;
      });

      await Promise.all(
        dirtyQuestions.map((q) =>
          fetch("/api/readiness-assessment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              questionNumber: q.questionNumber,
              currentAnswer: draft[q.questionNumber].currentAnswer,
              actionToTake: draft[q.questionNumber].actionToTake,
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error ?? "Failed to save");
            }
          })
        )
      );

      setSaved({ ...draft });
      setSuccessBanner(true);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const dirty = isDirty();

  return (
    <div className="px-6 py-6 max-w-[720px] mx-auto pb-24">
      {/* Success banner */}
      {successBanner && (
        <div className="flex items-center justify-between mb-5 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
          <span>Your answers have been saved.</span>
          <button
            onClick={() => setSuccessBanner(false)}
            className="ml-4 text-green-600 hover:text-green-800"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Error banner */}
      {errorBanner && (
        <div className="flex items-center justify-between mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          <span>{errorBanner}</span>
          <button
            onClick={() => setErrorBanner(null)}
            className="ml-4 text-red-600 hover:text-red-800"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Heading */}
      <div className="mb-6">
        <h1 className="font-display text-[26px] font-semibold text-text-primary">
          Your Readiness Assessment
        </h1>
        {lastUpdated ? (
          <p className="text-text-secondary text-sm mt-1">
            Last updated: {formatDate(lastUpdated)}
          </p>
        ) : (
          <p className="text-text-secondary text-sm mt-1">
            You haven&apos;t saved any answers yet.
          </p>
        )}
        <p className="text-text-secondary text-sm mt-2">
          Your facilitator can read these answers. Write with honesty — this is a coaching
          conversation, not an evaluation.
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {QUESTIONS.map((q) => (
          <Card key={q.questionNumber}>
            <CardLabel>QUESTION {q.questionNumber}</CardLabel>
            <h2 className="text-[16px] font-semibold text-text-primary mb-2">{q.title}</h2>
            <p className="text-sm text-text-secondary mb-4">{q.framing}</p>

            {/* Sub-question prompts callout */}
            <div
              className="mb-4 pl-4 py-3 pr-3 rounded-r-lg text-sm text-text-secondary space-y-1"
              style={{
                borderLeft: "3px solid var(--accent-gold, #C9A84C)",
                backgroundColor: "var(--bg-subtle, rgba(201,168,76,0.06))",
              }}
            >
              <p className="text-[11px] uppercase font-medium text-text-secondary opacity-70 mb-2">
                Prompts to consider
              </p>
              <ul className="space-y-1">
                {q.prompts.map((prompt, i) => (
                  <li key={i} className="text-sm text-text-secondary">
                    {prompt}
                  </li>
                ))}
              </ul>
            </div>

            {/* Current Answer */}
            <div className="mb-3">
              <label
                htmlFor={`current-${q.questionNumber}`}
                className="block text-[11px] uppercase font-medium text-text-secondary mb-1"
              >
                Current answer
              </label>
              <textarea
                id={`current-${q.questionNumber}`}
                rows={4}
                value={draft[q.questionNumber].currentAnswer}
                onChange={(e) => handleChange(q.questionNumber, "currentAnswer", e.target.value)}
                placeholder="Write your answer here…"
                className={cn(
                  "w-full rounded-lg border border-border bg-bg-base px-3 py-2.5 text-sm text-text-primary",
                  "placeholder:text-text-secondary resize-y",
                  "focus:outline-none focus:ring-2 focus:ring-accent-gold/40 focus:border-accent-gold",
                  "transition-colors"
                )}
              />
            </div>

            {/* Action to Take */}
            <div className="mb-2">
              <label
                htmlFor={`action-${q.questionNumber}`}
                className="block text-[11px] uppercase font-medium text-text-secondary mb-1"
              >
                Action to take <span className="normal-case opacity-60">(optional)</span>
              </label>
              <textarea
                id={`action-${q.questionNumber}`}
                rows={2}
                value={draft[q.questionNumber].actionToTake}
                onChange={(e) => handleChange(q.questionNumber, "actionToTake", e.target.value)}
                placeholder="One concrete next step…"
                className={cn(
                  "w-full rounded-lg border border-border bg-bg-base px-3 py-2.5 text-sm text-text-primary",
                  "placeholder:text-text-secondary resize-y",
                  "focus:outline-none focus:ring-2 focus:ring-accent-gold/40 focus:border-accent-gold",
                  "transition-colors"
                )}
              />
            </div>

            {/* Identity in Christ callout — Q6 only */}
            {q.questionNumber === 6 && (
              <div
                className="mt-5 px-5 py-4 rounded-lg"
                style={{ backgroundColor: "var(--bg-inverse, #1a1a1a)" }}
              >
                <p
                  className="font-display text-[15px] leading-relaxed"
                  style={{ color: "var(--accent-gold, #C9A84C)" }}
                >
                  &ldquo;I have been crucified with Christ. It is no longer I who live, but Christ
                  who lives in me.&rdquo;
                </p>
                <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Galatians 2:20 — Your identity is not your venture. It is not your results.
                  It is not what others say about you. You are a child of God, called and equipped
                  for this work.
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Save button — sticky at bottom */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-bg-base px-6 py-4 flex justify-end z-10">
        <Button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="w-full max-w-[320px]"
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
