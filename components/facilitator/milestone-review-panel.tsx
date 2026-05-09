"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, CheckCircle2, MessageSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";
import { statusChipClass, statusLabel } from "@/lib/milestones";

export interface ReviewSubmission {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  milestoneType: MilestoneType;
  status: MilestoneStatus;
  formData: Record<string, unknown>;
  submittedAt: Date | string | null;
  reviewedById: string | null;
  reviewNotes: string | null;
}

interface FieldDef { key: string; label: string }

interface MilestoneReviewPanelProps {
  submission: ReviewSubmission;
  fields: FieldDef[];
  /** If true, show approve + feedback controls */
  canReview?: boolean;
}

/**
 * Addendum 3 — Facilitator submission review panel.
 * Expandable card showing all form data + optional approve/feedback actions.
 */
export function MilestoneReviewPanel({
  submission,
  fields,
  canReview = true,
}: MilestoneReviewPanelProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(submission.reviewNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const isReviewed = !!submission.reviewedById;
  const formData = submission.formData as Record<string, string>;

  const handleSaveNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/milestone-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submission.id,
          reviewNotes: note,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to save.");
      } else {
        setSaved(true);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn(
      "glass-2 overflow-hidden transition-all",
      isReviewed && "opacity-80"
    )}>
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-base transition-colors"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-[rgba(200,151,58,0.20)] border border-[#C8973A]/30 flex items-center justify-center shrink-0">
          <span className="text-[12px] font-semibold text-[#FCD34D]">
            {(submission.userName ?? submission.userEmail).charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-text-primary truncate">
            {submission.userName ?? submission.userEmail}
          </p>
          <p className="text-[11px] text-[#A3A3A3] truncate">{submission.userEmail}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={statusChipClass(submission.status)}>
            {statusLabel(submission.status)}
          </span>
          {submission.submittedAt && (
            <span className="text-[10px] text-[#A3A3A3] hidden md:block">
              {new Date(submission.submittedAt).toLocaleDateString("en-GB", {
                day: "numeric", month: "short",
              })}
            </span>
          )}
          {isReviewed && <CheckCircle2 size={14} className="text-[#86EFAC]" />}
          {expanded ? (
            <ChevronUp size={14} className="text-[#A3A3A3]" />
          ) : (
            <ChevronDown size={14} className="text-[#A3A3A3]" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border">
          {/* Form fields */}
          <div className="space-y-3 mt-4">
            {fields.map((f) => (
              <div key={f.key}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A3A3A3] mb-0.5">
                  {f.label}
                </p>
                <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">
                  {formData[f.key] || <span className="text-[#A3A3A3] italic">Not provided</span>}
                </p>
              </div>
            ))}
          </div>

          {/* Review note */}
          {canReview && (
            <div className="mt-5 pt-4 border-t border-border">
              <label className="block mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <MessageSquare size={12} /> Facilitator note
                </span>
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => { setNote(e.target.value); setSaved(false); }}
                placeholder="Add feedback or notes visible to the participant…"
                className="input-on-glass w-full px-3 py-2.5 text-[13px] resize-y min-h-[70px] mb-2"
              />
              {error && <p className="text-[12px] text-[#FCA5A5] mb-2">{error}</p>}
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="gold"
                  size="sm"
                  loading={saving}
                  onClick={handleSaveNote}
                  disabled={!note.trim() || saved}
                >
                  {saved ? "✓ Saved" : "Save note"}
                </Button>
                {isReviewed && (
                  <span className="text-[11px] text-[#86EFAC] flex items-center gap-1">
                    <CheckCircle2 size={11} /> Already reviewed
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Existing review note (read-only display) */}
          {submission.reviewNotes && !canReview && (
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1">
                Facilitator note
              </p>
              <p className="text-[13px] text-text-secondary leading-relaxed">{submission.reviewNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
