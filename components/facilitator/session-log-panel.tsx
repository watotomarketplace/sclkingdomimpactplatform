"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronUp, AlertTriangle, ClipboardList } from "lucide-react";
import { MILESTONE_TITLES } from "@/lib/milestones";
import { MilestoneType } from "@/app/generated/prisma/enums";

interface Participant {
  id: string;
  name: string | null;
  email: string;
}

interface SessionNote {
  id: string;
  content: string;
  createdAt: Date;
  recipient: { id: string; name: string | null; email: string };
}

interface SessionLogPanelProps {
  participants: Participant[];
  notes: SessionNote[];
}

const MILESTONE_OPTIONS = [
  { value: "ONBOARDING", label: MILESTONE_TITLES.ONBOARDING },
  { value: "MILESTONE_1", label: MILESTONE_TITLES.MILESTONE_1 },
  { value: "MILESTONE_2", label: MILESTONE_TITLES.MILESTONE_2 },
  { value: "MILESTONE_3", label: MILESTONE_TITLES.MILESTONE_3 },
  { value: "MILESTONE_4", label: MILESTONE_TITLES.MILESTONE_4 },
];

/** Parse structured session log content stored in CoachingNote.content */
function parseSessionContent(raw: string): {
  sessionDate?: string;
  currentMilestone?: string;
  keyDiscussion?: string;
  commitments?: string;
  escalationNeeded?: boolean;
  rawContent?: string;
} {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && parsed.__sessionLog) {
      return parsed;
    }
  } catch {
    // Legacy plain-text note
  }
  return { rawContent: raw };
}

export function SessionLogPanel({ participants, notes }: SessionLogPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterParticipant, setFilterParticipant] = useState("all");

  // Form state
  const [form, setForm] = useState({
    recipientId: "",
    sessionDate: new Date().toISOString().split("T")[0],
    currentMilestone: "ONBOARDING",
    keyDiscussion: "",
    commitments: "",
    escalationNeeded: false,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const setF = (k: string, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipientId) { setSaveError("Please select a participant."); return; }
    if (!form.keyDiscussion.trim()) { setSaveError("Key discussion is required."); return; }
    if (!form.commitments.trim()) { setSaveError("Commitments field is required."); return; }
    setSaving(true);
    setSaveError("");
    try {
      const content = JSON.stringify({
        __sessionLog: true,
        sessionDate: form.sessionDate,
        currentMilestone: form.currentMilestone,
        keyDiscussion: form.keyDiscussion,
        commitments: form.commitments,
        escalationNeeded: form.escalationNeeded,
      });
      const res = await fetch("/api/coaching-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: form.recipientId, content }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error ?? "Failed to save.");
        return;
      }
      setSaved(true);
      setShowForm(false);
      setForm({
        recipientId: "",
        sessionDate: new Date().toISOString().split("T")[0],
        currentMilestone: "ONBOARDING",
        keyDiscussion: "",
        commitments: "",
        escalationNeeded: false,
      });
      // Reload to show new note
      window.location.reload();
    } finally {
      setSaving(false);
    }
  };

  const filtered = filterParticipant === "all"
    ? notes
    : notes.filter((n) => n.recipient.id === filterParticipant);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={filterParticipant}
          onChange={(e) => setFilterParticipant(e.target.value)}
          className="input-on-glass px-3 h-9 text-[13px] flex-1"
        >
          <option value="all">All participants</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name ?? p.email}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-gold px-4 h-9 text-[13px] flex items-center gap-2 shrink-0"
        >
          <Plus size={14} />
          Log session
        </button>
      </div>

      {/* Session form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-2 p-5 space-y-4">
          <p className="text-[13px] font-semibold text-text-primary mb-1">Log a coaching session</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Participant */}
            <div>
              <label className="block text-[12px] text-text-secondary mb-1">Participant *</label>
              <select
                value={form.recipientId}
                onChange={(e) => setF("recipientId", e.target.value)}
                className="input-on-glass w-full px-3 h-9 text-[13px]"
                required
              >
                <option value="">Select participant…</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name ?? p.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Session date */}
            <div>
              <label className="block text-[12px] text-text-secondary mb-1">Session date *</label>
              <input
                type="date"
                value={form.sessionDate}
                onChange={(e) => setF("sessionDate", e.target.value)}
                className="input-on-glass w-full px-3 h-9 text-[13px]"
                required
              />
            </div>
          </div>

          {/* Current milestone */}
          <div>
            <label className="block text-[12px] text-text-secondary mb-1">Current milestone *</label>
            <select
              value={form.currentMilestone}
              onChange={(e) => setF("currentMilestone", e.target.value)}
              className="input-on-glass w-full px-3 h-9 text-[13px]"
            >
              {MILESTONE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Key discussion */}
          <div>
            <label className="block text-[12px] text-text-secondary mb-1">Key discussion *</label>
            <textarea
              value={form.keyDiscussion}
              onChange={(e) => setF("keyDiscussion", e.target.value)}
              rows={3}
              placeholder="Summary of what was discussed in this session…"
              className="input-on-glass w-full px-3 py-2 text-[13px] resize-y"
              required
            />
          </div>

          {/* Commitments */}
          <div>
            <label className="block text-[12px] text-text-secondary mb-1">Commitments *</label>
            <textarea
              value={form.commitments}
              onChange={(e) => setF("commitments", e.target.value)}
              rows={2}
              placeholder="What did the participant commit to do before next contact?"
              className="input-on-glass w-full px-3 py-2 text-[13px] resize-y"
              required
            />
          </div>

          {/* Escalation */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.escalationNeeded}
              onChange={(e) => setF("escalationNeeded", e.target.checked)}
              className="w-4 h-4 accent-[#C8973A]"
            />
            <div>
              <span className="text-[13px] text-text-primary">Escalation needed</span>
              <p className="text-[11px] text-[#A3A3A3]">
                Flag if pastoral, financial, or ethical concerns arose in this session.
              </p>
            </div>
          </label>

          {saveError && (
            <p className="text-[13px] text-[#FCA5A5]">{saveError}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="btn-gold px-5 py-2 text-[13px] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save session"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-[13px] text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {saved && (
        <div className="glass-2 px-4 py-3 border border-[rgba(134,239,172,0.3)]">
          <p className="text-[13px] text-[#86EFAC]">✓ Session logged successfully.</p>
        </div>
      )}

      {/* Session list */}
      {filtered.length === 0 ? (
        <div className="glass-2 p-8 text-center">
          <ClipboardList size={28} className="text-[#A3A3A3] mx-auto mb-3" />
          <p className="text-text-secondary text-[14px]">No sessions logged yet.</p>
          <p className="text-[#A3A3A3] text-[12px] mt-1">
            Log a session after each coaching conversation.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((note) => {
            const parsed = parseSessionContent(note.content);
            const isExpanded = expandedId === note.id;
            const hasEscalation = parsed.escalationNeeded;

            return (
              <div
                key={note.id}
                className={`glass-2 overflow-hidden ${
                  hasEscalation ? "border border-[rgba(252,163,77,0.3)]" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : note.id)}
                  className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-bg-base transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-text-primary">
                        {note.recipient.name ?? note.recipient.email}
                      </span>
                      {parsed.sessionDate && (
                        <span className="text-[11px] font-mono text-[#A3A3A3]">
                          {new Date(parsed.sessionDate).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                      )}
                      {hasEscalation && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[rgba(252,211,77,0.15)] border border-[#FCD34D]/20 text-[#FCD34D]">
                          <AlertTriangle size={10} />
                          Escalation flagged
                        </span>
                      )}
                    </div>
                    {parsed.currentMilestone && (
                      <p className="text-[11px] text-[#A3A3A3] mt-0.5">
                        {MILESTONE_TITLES[parsed.currentMilestone as MilestoneType] ?? parsed.currentMilestone}
                      </p>
                    )}
                    {!isExpanded && parsed.keyDiscussion && (
                      <p className="text-[12px] text-text-secondary mt-1 truncate">
                        {parsed.keyDiscussion}
                      </p>
                    )}
                    {!isExpanded && parsed.rawContent && (
                      <p className="text-[12px] text-text-secondary mt-1 truncate">
                        {parsed.rawContent}
                      </p>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={14} className="text-[#A3A3A3] shrink-0 mt-0.5" />
                  ) : (
                    <ChevronDown size={14} className="text-[#A3A3A3] shrink-0 mt-0.5" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                    {parsed.rawContent ? (
                      <p className="text-[13px] text-text-primary whitespace-pre-wrap leading-relaxed">
                        {parsed.rawContent}
                      </p>
                    ) : (
                      <>
                        {parsed.keyDiscussion && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A3A3A3] mb-1">
                              Key discussion
                            </p>
                            <p className="text-[13px] text-text-primary whitespace-pre-wrap leading-relaxed">
                              {parsed.keyDiscussion}
                            </p>
                          </div>
                        )}
                        {parsed.commitments && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A3A3A3] mb-1">
                              Commitments
                            </p>
                            <p className="text-[13px] text-text-primary whitespace-pre-wrap leading-relaxed">
                              {parsed.commitments}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    <p className="text-[11px] text-[#A3A3A3] pt-1">
                      Logged {new Date(note.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
