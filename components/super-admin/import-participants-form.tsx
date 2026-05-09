"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2 } from "lucide-react";

/**
 * CSV import form for bulk participant creation.
 * Submits to POST /api/admin/import-participants
 */
export function ImportParticipantsForm() {
  const [csvText, setCsvText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText((ev.target?.result as string) ?? "");
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) { setError("Please paste CSV data or upload a file."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/import-participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Import failed."); return; }
      setResult(data);
      setCsvText("");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="glass-2 p-6 text-center fade-in">
        <div className="w-12 h-12 rounded-full bg-[rgba(45,90,61,0.6)] border border-[rgba(134,239,172,0.5)] flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 size={22} className="text-[#86EFAC]" />
        </div>
        <p className="text-white font-semibold text-[15px] mb-1">Import complete</p>
        <p className="text-white/60 text-[13px] mb-4">{result.created} participant{result.created !== 1 ? "s" : ""} created.</p>
        {result.errors.length > 0 && (
          <div className="text-left mb-4">
            <p className="text-[12px] font-semibold text-[#FCA5A5] mb-1">Rows with errors ({result.errors.length}):</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {result.errors.map((e, i) => (
                <p key={i} className="text-[11px] text-white/50 font-mono">{e}</p>
              ))}
            </div>
          </div>
        )}
        <Button variant="ghost" onClick={() => setResult(null)}>Import more</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File upload */}
      <div className="glass-2 p-5">
        <p className="section-label mb-3">UPLOAD CSV FILE</p>
        <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#C8973A]/50 transition-colors">
          <Upload size={24} className="text-white/30" />
          <span className="text-[13px] text-white/55">Click to select a CSV file</span>
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={handleFileChange} />
        </label>
      </div>

      <div className="text-center text-[12px] text-white/35">— or paste CSV directly —</div>

      {/* Paste CSV */}
      <div className="glass-2 p-5">
        <label className="block mb-2">
          <span className="section-label">PASTE CSV DATA</span>
        </label>
        <textarea
          rows={8}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder={"name,email,phone,campus\nGrace Nakato,grace@example.com,+256700000000,Watoto Bugolobi"}
          className="input-on-glass w-full px-3 py-2.5 text-[12px] font-mono resize-y min-h-[120px]"
        />
      </div>

      {error && (
        <div className="callout-warning">
          <p className="text-[13px] font-medium">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" variant="gold" loading={submitting} disabled={!csvText.trim()}>
          <Upload size={15} />
          Import Participants
        </Button>
      </div>
    </form>
  );
}
