"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { ChevronRight, CheckCircle2, Upload, Paperclip, X } from "lucide-react";
import { MilestoneType } from "@/app/generated/prisma/enums";
import { parseUploadedFiles, filesToValue, type UploadedFile } from "@/lib/files";

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB per file

export interface MilestoneField {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "radio" | "file" | "audio";
  helper: string;
  required?: boolean;
  /** For radio fields — list of selectable options */
  options?: { value: string; label: string }[];
  /** For file/audio fields — overrides default accept string */
  accept?: string;
}

interface MilestoneFormProps {
  milestoneType: MilestoneType;
  fields: MilestoneField[];
  initialValues?: Record<string, string>;
  isSubmitted?: boolean;
  onSubmitSuccess?: () => void;
}

/**
 * Addendum 3 — Reusable milestone submission form.
 * Handles draft auto-save + final submit via /api/milestone-submissions.
 * Supports text, textarea, number, date, radio, file, audio field types.
 */
export function MilestoneForm({
  milestoneType,
  fields,
  initialValues = {},
  isSubmitted = false,
  onSubmitSuccess,
}: MilestoneFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState(isSubmitted);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const requiredFields = fields.filter((f) => f.required !== false);
  const filledCount = requiredFields.filter((f) => {
    const v = values[f.key];
    return v != null && String(v).trim().length > 0;
  }).length;
  const progress = requiredFields.length > 0
    ? Math.round((filledCount / requiredFields.length) * 100)
    : 100;

  const setField = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setDraftSaved(false);
  };

  const saveDraft = useCallback(async () => {
    if (Object.keys(values).length === 0) return;
    setSavingDraft(true);
    try {
      const res = await fetch("/api/milestone-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneType, formData: values, draft: true }),
      });
      if (res.ok) setDraftSaved(true);
    } finally {
      setSavingDraft(false);
    }
  }, [values, milestoneType]);

  useEffect(() => {
    if (!draftSaved && Object.keys(values).length > 0 && !submitted) {
      const t = setTimeout(saveDraft, 30000);
      return () => clearTimeout(t);
    }
  }, [values, draftSaved, saveDraft, submitted]);

  const handleFileUpload = async (key: string, fileList: FileList) => {
    const list = Array.from(fileList);
    if (list.length === 0) return;

    const tooBig = list.find((f) => f.size > MAX_FILE_BYTES);
    if (tooBig) {
      setServerError(`"${tooBig.name}" is too large. Maximum size is 50 MB per file.`);
      return;
    }

    setUploadingField(key);
    setServerError("");
    try {
      const existing = parseUploadedFiles(values[key]);
      const uploaded: UploadedFile[] = [];
      for (const file of list) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const blob = await upload(`submissions/${safeName}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          contentType: file.type || undefined,
        });
        uploaded.push({ url: blob.url, name: file.name });
      }
      setField(key, filesToValue([...existing, ...uploaded]));
    } catch (err) {
      setServerError(
        err instanceof Error && err.message
          ? `Upload failed: ${err.message}`
          : "Upload failed — check your connection and try again."
      );
    } finally {
      setUploadingField(null);
    }
  };

  const removeFile = (key: string, url: string) => {
    const remaining = parseUploadedFiles(values[key]).filter((f) => f.url !== url);
    setField(key, filesToValue(remaining));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const missing = requiredFields.filter((f) => !values[f.key]?.trim());
    if (missing.length > 0) {
      setServerError(
        `Please complete all required fields. ${missing.length} field${missing.length === 1 ? "" : "s"} remaining.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/milestone-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneType, formData: values, draft: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      onSubmitSuccess?.();
      router.refresh();
    } catch {
      setServerError("Network error — try again.");
      setSubmitting(false);
    }
  };

  // ── Submitted view ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="glass-2 p-8 text-center fade-in">
        <div className="w-14 h-14 rounded-full bg-[rgba(45,90,61,0.6)] border border-[rgba(134,239,172,0.5)] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} className="text-[#86EFAC]" />
        </div>
        <h2 className="font-display text-[22px] font-semibold text-text-primary mb-2">
          Milestone submitted!
        </h2>
        <p className="text-text-secondary text-[14px] mb-5">
          Your submission has been recorded. The next milestone will unlock automatically.
        </p>
        <div className="space-y-3 text-left">
          {fields.map((field) => {
            const val = values[field.key];
            return (
              <div key={field.key} className="glass-3 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1">
                  {field.label}
                </p>
                {field.type === "file" || field.type === "audio" ? (
                  (() => {
                    const files = parseUploadedFiles(val);
                    return files.length > 0 ? (
                      <div className="space-y-1">
                        {files.map((f) => (
                          <a
                            key={f.url}
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[13px] text-[#86EFAC] underline flex items-center gap-1.5"
                          >
                            <Paperclip size={12} className="shrink-0" />
                            <span className="truncate">{f.name}</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#A3A3A3] italic text-[13px]">—</span>
                    );
                  })()
                ) : field.type === "radio" ? (
                  <p className="text-[13px] text-text-primary">
                    {field.options?.find((o) => o.value === val)?.label ?? val ?? "—"}
                  </p>
                ) : (
                  <p className="text-[13px] text-text-primary whitespace-pre-wrap">
                    {val || <span className="text-[#A3A3A3] italic">—</span>}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Edit view ───────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Progress bar */}
      <div className="glass-2 px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-medium text-text-secondary">
            {filledCount} of {requiredFields.length} required fields complete
          </span>
          <span className="text-[12px] font-mono text-[#FCD34D]">{progress}%</span>
        </div>
        <div className="h-1.5 bg-bg-base rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2D5A3D] to-[#86EFAC] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Fields */}
      {fields.map((field, i) => (
        <div
          key={field.key}
          className="glass-2 p-5 fade-in-up"
          style={{ animationDelay: `${Math.min(i * 30, 240)}ms` }}
        >
          <label className="block mb-1">
            <span className="text-[14px] font-semibold text-text-primary">{field.label}</span>
            {field.required !== false && (
              <span className="text-[#FCA5A5] ml-1">*</span>
            )}
          </label>
          <p className="text-[12px] text-text-secondary mb-3">{field.helper}</p>

          {/* Radio */}
          {field.type === "radio" && (
            <div className="space-y-2">
              {(field.options ?? []).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    values[field.key] === opt.value
                      ? "border-[#C8973A]/60 bg-[rgba(200,151,58,0.12)]"
                      : "border-border bg-bg-base hover:border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name={field.key}
                    value={opt.value}
                    checked={values[field.key] === opt.value}
                    onChange={() => setField(field.key, opt.value)}
                    className="hidden"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      values[field.key] === opt.value
                        ? "border-[#C8973A]"
                        : "border-border"
                    }`}
                  >
                    {values[field.key] === opt.value && (
                      <div className="w-2 h-2 rounded-full bg-[#C8973A]" />
                    )}
                  </div>
                  <span className="text-[13px] text-text-primary leading-snug">{opt.label}</span>
                </label>
              ))}
            </div>
          )}

          {/* File / Audio — supports multiple mixed-type files */}
          {(field.type === "file" || field.type === "audio") && (() => {
            const files = parseUploadedFiles(values[field.key]);
            const isUploading = uploadingField === field.key;
            return (
              <div className="space-y-2">
                {files.map((f) => (
                  <div
                    key={f.url}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[rgba(134,239,172,0.3)] bg-[rgba(45,90,61,0.15)]"
                  >
                    <Paperclip size={14} className="text-[#86EFAC] shrink-0" />
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-[#86EFAC] underline truncate flex-1"
                    >
                      {f.name}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeFile(field.key, f.url)}
                      className="text-[#A3A3A3] hover:text-text-primary transition-colors shrink-0"
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <label
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border border-dashed transition-colors ${
                    isUploading
                      ? "border-[#C8973A]/40 opacity-60 cursor-not-allowed"
                      : "border-border hover:border-border cursor-pointer"
                  }`}
                >
                  {isUploading ? (
                    <span className="text-[13px] text-text-secondary">Uploading…</span>
                  ) : (
                    <>
                      <Upload size={15} className="text-text-secondary shrink-0" />
                      <span className="text-[13px] text-text-secondary">
                        {files.length > 0
                          ? "Add more files"
                          : field.type === "audio"
                            ? "Choose audio file(s) — mp3, m4a, wav (max 50MB each)"
                            : "Choose file(s) — PDF, Word, PPT, image, audio (max 50MB each)"}
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    multiple
                    accept={
                      field.accept ??
                      (field.type === "audio"
                        ? "audio/*"
                        : ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,image/*,audio/*,video/mp4")
                    }
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      if (e.target.files?.length) handleFileUpload(field.key, e.target.files);
                      // Reset input so the same file can be re-selected
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            );
          })()}

          {/* Textarea */}
          {field.type === "textarea" && (
            <textarea
              id={field.key}
              rows={3}
              value={values[field.key] ?? ""}
              onChange={(e) => setField(field.key, e.target.value)}
              className="input-on-glass w-full px-3 py-2.5 text-[14px] resize-y min-h-[80px]"
            />
          )}

          {/* Text / Number / Date */}
          {(field.type === "text" || field.type === "number" || field.type === "date") && (
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
            <button
              type="button"
              onClick={saveDraft}
              className="hover:text-text-primary underline"
            >
              Save draft
            </button>
          )}
        </div>
        <Button
          type="submit"
          variant="gold"
          loading={submitting}
          disabled={progress < 100 || uploadingField !== null}
        >
          Submit Milestone
          <ChevronRight size={16} />
        </Button>
      </div>
    </form>
  );
}
