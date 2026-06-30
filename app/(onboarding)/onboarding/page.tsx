"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Compass, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const FIELDS: { key: string; label: string; type: "text" | "textarea" | "date"; helper: string }[] = [
  { key: "initiativeName",    label: "Initiative name",                            type: "text",     helper: "Working title for your Kingdom Impact Initiative." },
  { key: "problemStatement",  label: "Problem statement",                          type: "textarea", helper: "The brokenness you are addressing — in one sentence." },
  { key: "healingHoped",      label: "The healing you hope to see",                type: "textarea", helper: "What does the solution look like?" },
  { key: "beneficiaries",     label: "Beneficiaries",                              type: "textarea", helper: "Who specifically benefits?" },
  { key: "mviSummary",        label: "MVI summary",                                type: "textarea", helper: "One paragraph describing your Minimum Viable Initiative." },
  { key: "singleAssumption",  label: "Single assumption to test",                  type: "textarea", helper: "The one thing you need to prove first." },
  { key: "buyInNeeded",       label: "Buy-in needed",                              type: "textarea", helper: "Whose support is required, and by when?" },
  { key: "resourcesRequired", label: "Resources required",                         type: "textarea", helper: "Money, time, people." },
  { key: "realisticTimeline", label: "Realistic timeline",                         type: "textarea", helper: "Six-month implementation plan." },
  { key: "likelyResistance",  label: "Likely resistance",                          type: "textarea", helper: "What will push back, and how you'll respond." },
  { key: "evidencePlan",      label: "Evidence plan",                              type: "textarea", helper: "How will you know it's working?" },
  { key: "firstTestDate",     label: "First test date",                            type: "date",     helper: "When you plan to run your first test." },
];

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const [values, setValues] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Load existing draft if any
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((d) => {
        if (d.brief) setValues(d.brief);
        if (d.complete) {
          window.location.href = "/participant";
        }
      })
      .catch(() => undefined);
  }, [status]);

  const setField = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setDraftSaved(false);
  };

  const saveDraft = useCallback(async () => {
    if (Object.keys(values).length === 0) return;
    setSavingDraft(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, draft: true }),
      });
      if (res.ok) setDraftSaved(true);
    } finally {
      setSavingDraft(false);
    }
  }, [values]);

  // Auto-save draft every 30 seconds when there are changes
  useEffect(() => {
    if (!draftSaved && Object.keys(values).length > 0) {
      const t = setTimeout(saveDraft, 30000);
      return () => clearTimeout(t);
    }
  }, [values, draftSaved, saveDraft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    // Client-side check: all fields filled
    const missing = FIELDS.filter((f) => !values[f.key]?.trim());
    if (missing.length > 0) {
      setServerError(`Please complete all ${missing.length} remaining field${missing.length === 1 ? "" : "s"}.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      // Refresh JWT so onboardingComplete = true is reflected
      await update?.({ onboardingComplete: true, covenantSigned: true });
      window.location.href = "/participant";
    } catch {
      setServerError("Network error — try again.");
      setSubmitting(false);
    }
  };

  const filledCount = FIELDS.filter((f) => values[f.key]?.trim()).length;
  const progress = Math.round((filledCount / FIELDS.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-participant">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[rgba(200,151,58,0.20)] border border-[#C8973A]/40 mb-4">
            <Compass size={26} className="text-[#FCD34D]" />
          </div>
          <h1 className="font-display text-[28px] md:text-[34px] font-semibold text-text-primary leading-tight">
            Welcome to your Kingdom Impact Work journey.
          </h1>
          <p className="text-text-secondary text-sm md:text-base mt-3 max-w-xl mx-auto leading-relaxed">
            Transfer your MVI Brief from your workbook into the platform. This is your starting point.
          </p>
          <p className="section-label mt-5">STEP 1 OF 1 — MVI BRIEF</p>
        </div>

        {/* Progress */}
        <div className="glass-2 px-5 py-4 mb-6 fade-in-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-text-secondary">{filledCount} of {FIELDS.length} fields complete</span>
            <span className="text-[12px] font-mono text-[#FCD34D]">{progress}%</span>
          </div>
          <div className="h-1.5 bg-bg-base rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2D5A3D] to-[#86EFAC] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {FIELDS.map((field, i) => (
            <div
              key={field.key}
              className="glass-2 p-5 fade-in-up"
              style={{ animationDelay: `${Math.min(i * 30, 240)}ms` }}
            >
              <label htmlFor={field.key} className="block mb-1">
                <span className="text-[14px] font-semibold text-text-primary">{field.label}</span>
                <span className="text-[#FCA5A5] ml-1">*</span>
              </label>
              <p className="text-[12px] text-text-secondary mb-3">{field.helper}</p>

              {field.type === "textarea" ? (
                <textarea
                  id={field.key}
                  rows={3}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setField(field.key, e.target.value)}
                  className="input-on-glass w-full px-3 py-2.5 text-[14px] resize-y min-h-[80px]"
                />
              ) : (
                <input
                  id={field.key}
                  type={field.type}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setField(field.key, e.target.value)}
                  className="input-on-glass w-full px-3 h-10 text-[14px]"
                />
              )}
            </div>
          ))}

          {serverError && (
            <div className="callout-warning fade-in">
              <p className="text-[14px] font-medium">{serverError}</p>
            </div>
          )}

          {/* Sticky footer */}
          <div className="sticky bottom-4 glass-3 px-4 py-3 flex items-center justify-between gap-3 mt-8">
            <div className="text-[12px] text-text-secondary">
              {savingDraft ? (
                "Saving draft…"
              ) : draftSaved ? (
                <span className="text-[#86EFAC]">✓ Draft saved</span>
              ) : (
                <button type="button" onClick={saveDraft} className="hover:text-text-primary underline">
                  Save draft
                </button>
              )}
            </div>
            <Button type="submit" variant="gold" loading={submitting} disabled={progress < 100}>
              Submit MVI Brief
              <ChevronRight size={16} />
            </Button>
          </div>
        </form>

        <p className="text-center text-[11px] text-[#A3A3A3] mt-6">
          Your facilitator will review this brief during the Day 3 onboarding slot.
        </p>
      </div>
    </div>
  );
}
