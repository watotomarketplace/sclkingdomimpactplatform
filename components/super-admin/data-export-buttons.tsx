"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

const EXPORTS = [
  {
    id: "participants",
    label: "Participants",
    description: "All participant accounts with name, email, role, group, and status.",
    endpoint: "/api/admin/export?type=participants",
    filename: "participants.csv",
  },
  {
    id: "milestones",
    label: "Milestone Submissions",
    description: "All submitted milestones with participant, type, date, and status.",
    endpoint: "/api/admin/export?type=milestones",
    filename: "milestone-submissions.csv",
  },
  {
    id: "meeting-summaries",
    label: "Meeting Summaries",
    description: "All group meeting summaries with date, format, attendance, and notes.",
    endpoint: "/api/admin/export?type=meeting-summaries",
    filename: "meeting-summaries.csv",
  },
  {
    id: "coaching-notes",
    label: "Coaching Notes",
    description: "All facilitator coaching notes with author, recipient, and content.",
    endpoint: "/api/admin/export?type=coaching-notes",
    filename: "coaching-notes.csv",
  },
];

export function DataExportButtons() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleExport = async (exp: typeof EXPORTS[0]) => {
    setLoading(exp.id);
    setError("");
    try {
      const res = await fetch(exp.endpoint);
      if (!res.ok) { setError("Export failed. Try again."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exp.filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="callout-warning mb-2">
          <p className="text-[13px] font-medium">{error}</p>
        </div>
      )}
      {EXPORTS.map((exp) => (
        <div key={exp.id} className="glass-2 p-4 flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-white">{exp.label}</p>
            <p className="text-[12px] text-white/50 mt-0.5">{exp.description}</p>
          </div>
          <button
            onClick={() => handleExport(exp)}
            disabled={loading === exp.id}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.07] border border-white/15 text-[12px] font-medium text-white/80 hover:bg-white/[0.12] hover:text-white transition-all disabled:opacity-40 shrink-0"
          >
            {loading === exp.id ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Download size={13} />
            )}
            Export CSV
          </button>
        </div>
      ))}
    </div>
  );
}
