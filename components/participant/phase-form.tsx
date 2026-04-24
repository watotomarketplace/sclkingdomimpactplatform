"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardLabel } from "@/components/ui/card";
import type { PhaseContent } from "@/lib/form-content";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info } from "lucide-react";
import { useRouter } from "next/navigation";

interface PhaseFormProps {
  month: number;
  phase: string;
  content: PhaseContent;
  initialData?: Record<string, string>;
  isSubmitted?: boolean;
  submissionId?: string;
}

export function PhaseForm({ month, phase, content, initialData = {}, isSubmitted, submissionId }: PhaseFormProps) {
  const router = useRouter();
  const [draftSaved, setDraftSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSubId = useRef(submissionId);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: initialData,
  });

  const watchedValues = watch();

  const saveDraft = useCallback(async (values: Record<string, string>) => {
    try {
      const res = await fetch("/api/submissions/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, phase, draftData: values, submissionId: currentSubId.current }),
      });
      if (res.ok) {
        const data = await res.json();
        currentSubId.current = data.submissionId;
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2500);
      }
    } catch { /* ignore draft save errors */ }
  }, [month, phase]);

  // Auto-save on change with 1.5s debounce
  useEffect(() => {
    if (isSubmitted) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDraft(watchedValues);
    }, 1500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedValues)]);

  const onSubmit = async (values: Record<string, string>) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/submissions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, phase, formData: values, submissionId: currentSubId.current }),
      });
      if (!res.ok) {
        const err = await res.json();
        setSubmitError(err.error || "Submission failed.");
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])}>
      <div className="space-y-6">
        {content.sections.map((section) => (
          <Card key={section.id}>
            <CardLabel className="flex items-center gap-1.5 mb-3">
              {section.icon && <span className="text-sm">{section.icon}</span>}
              {section.label}
            </CardLabel>

            {section.note && (
              <div className={cn(
                "flex gap-2 p-3 rounded-lg mb-4 text-[13px] leading-relaxed",
                section.noteType === "warning"
                  ? "bg-[rgba(217,119,6,0.08)] border border-[rgba(217,119,6,0.2)] text-accent-warning"
                  : "bg-bg-base border border-border text-text-secondary"
              )}>
                {section.noteType === "warning"
                  ? <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  : <Info size={14} className="shrink-0 mt-0.5" />
                }
                <span>{section.note}</span>
              </div>
            )}

            <div className="space-y-4">
              {section.fields.map((field) => {
                if (field.type === "textarea") {
                  return (
                    <div key={field.key} className={field.highlighted ? "field-highlighted px-3 py-1 rounded-r-lg" : ""}>
                      <Textarea
                        label={field.label}
                        highlighted={field.highlighted}
                        disabled={isSubmitted}
                        {...register(field.key)}
                      />
                      {field.hint && <p className="text-xs text-text-secondary mt-1">{field.hint}</p>}
                    </div>
                  );
                }
                if (field.type === "select" && field.options) {
                  return (
                    <div key={field.key}>
                      <label className="section-label block mb-1">{field.label}</label>
                      <select
                        disabled={isSubmitted}
                        className="w-full h-12 px-4 bg-white border-[1.5px] border-border rounded-lg text-[15px] text-text-primary outline-none focus:border-accent-primary"
                        {...register(field.key)}
                      >
                        <option value="">— Select —</option>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  );
                }
                return (
                  <div key={field.key} className={field.highlighted ? "field-highlighted px-3 py-1 rounded-r-lg" : ""}>
                    <Input
                      label={field.label}
                      type="text"
                      disabled={isSubmitted}
                      {...register(field.key)}
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      {!isSubmitted && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            {draftSaved && (
              <span className="text-xs text-text-secondary draft-saved">Draft saved</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => saveDraft(watchedValues)}
            >
              Save Draft
            </Button>
            <Button type="submit" loading={submitting}>
              Submit Phase
            </Button>
          </div>
        </div>
      )}

      {isSubmitted && (
        <div className="mt-6 p-4 bg-[rgba(45,90,61,0.08)] border border-[rgba(45,90,61,0.2)] rounded-lg flex items-center gap-3">
          <span className="text-accent-primary text-lg">✓</span>
          <p className="text-sm text-accent-primary font-medium">This phase has been submitted. Fields are now read-only.</p>
        </div>
      )}

      {submitError && (
        <p className="mt-3 text-sm text-accent-danger">{submitError}</p>
      )}
    </form>
  );
}
