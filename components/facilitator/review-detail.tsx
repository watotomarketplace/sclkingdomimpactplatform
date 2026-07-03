"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MessageSquare, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { statusChipClass, statusLabel } from "@/lib/milestones";
import { isFileValue, parseUploadedFiles } from "@/lib/files";
import type { ReviewSubmission } from "@/components/facilitator/milestone-review-panel";

interface FieldDef { key: string; label: string }

/**
 * Right-hand detail pane for the review master-detail view: full submission
 * fields + facilitator note editor. Remounted (via key) when the selected
 * student changes, so note state resets automatically.
 */
export function ReviewDetail({
  submission,
  fields,
}: {
  submission: ReviewSubmission;
  fields: FieldDef[];
}) {
  const router = useRouter();
  const [note, setNote] = useState(submission.reviewNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const isReviewed = !!submission.reviewedById;
  const formData = submission.formData as Record<string, unknown>;

  const handleSaveNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/milestone-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission.id, reviewNotes: note }),
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
    <div className="glass-2 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[rgba(200,151,58,0.20)] border border-[#C8973A]/30 flex items-center justify-center shrink-0">
            <span className="text-[13px] font-semibold text-[#FCD34D]">
              {(submission.userName ?? submission.userEmail).charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-text-primary truncate">
              {submission.userName ?? submission.userEmail}
            </p>
            <p className="text-[12px] text-[#A3A3A3] truncate">{submission.userEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={statusChipClass(submission.status)}>{statusLabel(submission.status)}</span>
          {submission.submittedAt && (
            <span className="text-[11px] text-[#A3A3A3] hidden sm:block">
              {new Date(submission.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          )}
          {isReviewed && <CheckCircle2 size={15} className="text-[#86EFAC]" />}
        </div>
      </div>

      {/* Fields — two columns on wider screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {fields.map((f) => {
          const val = formData[f.key];
          const files = isFileValue(val) ? parseUploadedFiles(val) : [];
          return (
            <div key={f.key}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A3A3A3] mb-0.5">
                {f.label}
              </p>
              {files.length > 0 ? (
                <div className="space-y-1">
                  {files.map((file) => (
                    <a
                      key={file.url}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[13px] text-[#86EFAC] hover:underline"
                    >
                      <Paperclip size={12} className="shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">
                  {(typeof val === "string" ? val : "") || <span className="text-[#A3A3A3] italic">Not provided</span>}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Facilitator note */}
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
    </div>
  );
}
