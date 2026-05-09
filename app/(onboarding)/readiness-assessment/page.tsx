"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

const QUESTIONS = [
  {
    number: 1,
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
    number: 2,
    title: "Am I growing as an entrepreneur, or just working as a technician?",
    framing:
      "A technician asks, \u201cWhat can I build with my own hands?\u201d An entrepreneur also asks, \u201cWho must I learn from, partner with, or involve?\u201d",
    prompts: [
      "What can I personally do well right now?",
      "What do I not yet know how to do?",
      "Whose help, skill, credibility, or network do I need?",
      "What kind of team or support ecosystem might strengthen this venture?",
    ],
  },
  {
    number: 3,
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
    number: 4,
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
    number: 5,
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
    number: 6,
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

const TOTAL = QUESTIONS.length;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnswerState {
  currentAnswer: string;
  actionToTake: string;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ReadinessAssessmentPage() {
  const router = useRouter();
  const { update } = useSession();

  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [currentQ, setCurrentQ] = useState(1);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [triedAdvance, setTriedAdvance] = useState(false);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const getAnswer = (n: number): AnswerState =>
    answers[n] ?? { currentAnswer: "", actionToTake: "" };

  const currentAnswer = getAnswer(currentQ);
  const isAnswerValid = currentAnswer.currentAnswer.trim().length >= 20;

  // -------------------------------------------------------------------------
  // Load existing answers on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/readiness-assessment");
        if (!res.ok) return;
        const data = await res.json();

        // data is expected to be an array or object keyed by question number
        // Normalise to Record<number, AnswerState>
        const normalised: Record<number, AnswerState> = {};
        const list: Array<{ questionNumber: number; currentAnswer: string; actionToTake: string }> =
          Array.isArray(data) ? data : data.answers ?? [];

        for (const item of list) {
          normalised[item.questionNumber] = {
            currentAnswer: item.currentAnswer ?? "",
            actionToTake: item.actionToTake ?? "",
          };
        }
        setAnswers(normalised);

        // Find first unanswered question (currentAnswer empty or < 20 chars)
        let firstUnanswered = 1;
        for (let i = 1; i <= TOTAL; i++) {
          const a = normalised[i];
          if (!a || (a.currentAnswer ?? "").trim().length < 20) {
            firstUnanswered = i;
            break;
          }
          // If all answered, default to last
          if (i === TOTAL) firstUnanswered = TOTAL;
        }
        setCurrentQ(firstUnanswered);
      } catch {
        // Non-blocking — continue with empty state
      }
    })();
  }, []);

  // -------------------------------------------------------------------------
  // Auto-save on blur
  // -------------------------------------------------------------------------

  const saveQuestion = useCallback(
    async (questionNumber: number) => {
      const ans = answers[questionNumber] ?? { currentAnswer: "", actionToTake: "" };
      setSaving(true);
      try {
        await fetch("/api/readiness-assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionNumber,
            currentAnswer: ans.currentAnswer,
            actionToTake: ans.actionToTake,
          }),
        });
        setSavedAt(Date.now());
      } finally {
        setSaving(false);
      }
    },
    [answers]
  );

  // Fade-out timer for "Saved" indicator
  useEffect(() => {
    if (savedAt === null) return;
    const timer = setTimeout(() => setSavedAt(null), 2000);
    return () => clearTimeout(timer);
  }, [savedAt]);

  // -------------------------------------------------------------------------
  // Navigation handlers
  // -------------------------------------------------------------------------

  const handleBack = () => {
    if (currentQ <= 1) return;
    setTriedAdvance(false);
    setCurrentQ((q) => q - 1);
  };

  const handleNext = async () => {
    if (!isAnswerValid) {
      setTriedAdvance(true);
      return;
    }

    setTriedAdvance(false);

    // Save current question first
    await saveQuestion(currentQ);

    if (currentQ < TOTAL) {
      setCurrentQ((q) => q + 1);
      return;
    }

    // Final submission — Q6
    setSubmitting(true);
    try {
      const ans = getAnswer(TOTAL);
      await fetch("/api/readiness-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionNumber: TOTAL,
          currentAnswer: ans.currentAnswer,
          actionToTake: ans.actionToTake,
          submit: true,
        }),
      });
      await update({ readinessComplete: true });
      setShowModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Field change handler
  // -------------------------------------------------------------------------

  const handleChange = (
    field: "currentAnswer" | "actionToTake",
    value: string
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ]: {
        ...getAnswer(currentQ),
        [field]: value,
      },
    }));
    if (field === "currentAnswer" && triedAdvance && value.trim().length >= 20) {
      setTriedAdvance(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const question = QUESTIONS[currentQ - 1];

  return (
    <div className="min-h-screen flex">
      {/* ------------------------------------------------------------------ */}
      {/* Left panel — form                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="w-full md:w-[45%] flex flex-col bg-white overflow-y-auto">
        {/* Saved indicator */}
        <div className="sticky top-0 z-10 bg-white">
          <div className="flex justify-end px-8 pt-4 h-8">
            {(saving || savedAt !== null) && (
              <span
                className="text-xs text-accent-primary font-medium transition-opacity duration-500"
                style={{ opacity: saving ? 1 : savedAt !== null ? 1 : 0 }}
              >
                {saving ? "Saving…" : "Saved"}
              </span>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 px-8 py-6 md:px-12 lg:px-16">
          <div className="max-w-[480px] mx-auto w-full">

            {/* Header */}
            <p className="section-label mb-3">ENTREPRENEUR READINESS ASSESSMENT</p>
            <h1 className="font-display text-2xl font-semibold text-text-primary mb-2 leading-tight">
              Before you begin
            </h1>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              These 6 questions are not a test. They are a mirror. Answer honestly — not impressively. You can return to refine your answers at any time.
            </p>

            {/* Progress bar */}
            <div className="mb-8">
              <p className="text-xs text-text-secondary mb-2">Question {currentQ} of {TOTAL}</p>
              <div className="flex items-center gap-2">
                {QUESTIONS.map((q) => {
                  const isCompleted = q.number < currentQ;
                  const isCurrent = q.number === currentQ;
                  return (
                    <div
                      key={q.number}
                      className={[
                        "h-2 rounded-full flex-1 transition-all duration-300",
                        isCompleted
                          ? "bg-accent-primary"
                          : isCurrent
                          ? "bg-accent-gold"
                          : "bg-bg-base border border-border",
                      ].join(" ")}
                    />
                  );
                })}
              </div>
            </div>

            {/* Question card */}
            <div className="space-y-5">
              {/* Title */}
              <h2 className="font-display text-[20px] font-bold text-text-primary leading-snug">
                {question.title}
              </h2>

              {/* Framing */}
              <p className="text-sm text-text-secondary leading-relaxed">
                {question.framing}
              </p>

              {/* Prompts callout */}
              <div className="bg-[rgba(200,151,58,0.06)] border-l-[3px] border-accent-gold pl-4 pr-4 py-3 rounded-r-md">
                <ul className="space-y-1.5">
                  {question.prompts.map((prompt, i) => (
                    <li key={i} className="text-sm text-text-secondary leading-relaxed flex gap-2">
                      <span className="text-accent-gold mt-0.5 shrink-0">—</span>
                      <span>{prompt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* My current answer */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">
                  My current answer
                </label>
                <textarea
                  className="w-full min-h-[120px] resize-none rounded-lg border border-border bg-bg-base px-3.5 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary transition-colors"
                  placeholder="Write honestly. You can refine this later."
                  value={currentAnswer.currentAnswer}
                  onChange={(e) => handleChange("currentAnswer", e.target.value)}
                  onBlur={() => saveQuestion(currentQ)}
                  rows={5}
                />
                {triedAdvance && !isAnswerValid && (
                  <p className="text-xs text-accent-danger mt-1">
                    Please write a response before continuing — even a rough one.
                  </p>
                )}
              </div>

              {/* Action to take */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">
                  Action I need to take{" "}
                  <span className="text-text-tertiary font-normal">(optional)</span>
                </label>
                <textarea
                  className="w-full min-h-[80px] resize-none rounded-lg border border-border bg-bg-base px-3.5 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary transition-colors"
                  placeholder="What is one concrete step you can take based on your answer above?"
                  value={currentAnswer.actionToTake}
                  onChange={(e) => handleChange("actionToTake", e.target.value)}
                  onBlur={() => saveQuestion(currentQ)}
                  rows={3}
                />
              </div>

              {/* Identity affirmation — Q6 only */}
              {currentQ === 6 && (
                <div className="bg-[#1C1C1A] rounded-lg px-5 py-4 space-y-2">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-accent-gold">
                    Identity in Christ
                  </p>
                  <p className="font-display text-[14px] text-text-primary leading-relaxed italic">
                    &ldquo;I am a child of God before I am a founder, leader, or innovator. My calling is faithfulness and fruitfulness, not self-made identity. I can learn from failure without being defined by it. My work is service and stewardship, not the source of my worth.&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Navigation row */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={currentQ <= 1}
              >
                ← Back
              </Button>

              <span className="text-xs text-text-secondary">
                {currentQ} / {TOTAL}
              </span>

              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                loading={submitting}
                disabled={submitting}
              >
                {currentQ < TOTAL ? "Next →" : "Complete Assessment →"}
              </Button>
            </div>

          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right panel — atmospheric                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="hidden md:flex md:w-[55%] flex-col justify-end p-12 relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/white-blossoms.jpg" alt="White cherry blossoms" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 max-w-sm">
          <div className="mb-6 inline-flex items-center gap-2 bg-bg-base border border-border rounded-full px-3.5 py-1.5">
            <span className="text-accent-gold text-xs">✦</span>
            <span className="text-text-secondary text-[11px] font-medium uppercase tracking-widest">Readiness Assessment</span>
          </div>
          <blockquote className="font-display text-[22px] text-text-primary font-normal leading-[1.4] mb-4 italic">
            &ldquo;Readiness does not mean certainty. You need enough humility to listen, enough courage to act, and enough honesty to name what you don&rsquo;t yet know.&rdquo;
          </blockquote>
          <p className="text-text-secondary text-sm">
            Entrepreneur Readiness Assessment
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Confirmation modal                                                  */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        open={showModal}
        onClose={() => {}}
        title="You're ready to begin."
        size="sm"
      >
        <p className="text-sm text-text-secondary leading-relaxed mb-6">
          Your readiness assessment has been saved. You can revisit and update your answers at any time from your dashboard.
        </p>
        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            window.location.href = "/participant";
          }}
        >
          Go to my dashboard →
        </Button>
      </Modal>
    </div>
  );
}
