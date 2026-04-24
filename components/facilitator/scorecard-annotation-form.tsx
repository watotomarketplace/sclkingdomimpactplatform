"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ScorecardAnnotationFormProps {
  scorecardUserId: string;
  month: number;
  existingNotes?: string | null;
}

export function ScorecardAnnotationForm({ scorecardUserId, month, existingNotes }: ScorecardAnnotationFormProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(existingNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/scorecards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: scorecardUserId,
          month,
          facilitatorNotes: notes,
          // Pass all existing statuses unchanged by sending only the notes
          updateNotesOnly: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save annotation.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-xs font-medium text-text-secondary mb-1.5">Facilitator Notes</p>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={3}
        placeholder="Add your annotation for this scorecard month..."
        className="w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary resize-y"
      />
      <div className="flex items-center gap-3 mt-2">
        <Button onClick={handleSave} size="sm" loading={saving}>
          Save Notes
        </Button>
        {saved && <span className="text-xs text-accent-primary">Saved ✓</span>}
        {error && <span className="text-xs text-accent-danger">{error}</span>}
      </div>
    </div>
  );
}
