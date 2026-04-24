"use client";

import { useState, useEffect } from "react";
import { Card, CardLabel, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, truncate } from "@/lib/utils";

const PROMPTS = [
  "What is God highlighting to me this month in relation to my venture?",
  "What burden became clearer to me this month?",
  "Where did I feel resistance or fear in this work, and what does that tell me?",
  "Where did I see breakthrough, confirmation, or unexpected grace?",
  "What is my next faithful step — the smallest act of obedience I can take?",
];

interface JournalEntry {
  month: number;
  isPrivate: boolean;
  prompt1?: string;
  prompt2?: string;
  prompt3?: string;
  prompt4?: string;
  prompt5?: string;
  freeNotes?: string;
  submittedAt?: string;
  updatedAt: string;
}

export default function JournalPage() {
  const [currentMonth, setCurrentMonth] = useState(1);
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [answers, setAnswers] = useState<string[]>(["", "", "", "", ""]);
  const [freeNotes, setFreeNotes] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [history, setHistory] = useState<JournalEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/journals?month=${currentMonth}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.entry) {
          const e = data.entry;
          setEntry(e);
          setAnswers([e.prompt1 ?? "", e.prompt2 ?? "", e.prompt3 ?? "", e.prompt4 ?? "", e.prompt5 ?? ""]);
          setFreeNotes(e.freeNotes ?? "");
          setIsPrivate(e.isPrivate ?? false);
        } else {
          setEntry(null);
          setAnswers(["", "", "", "", ""]);
          setFreeNotes("");
          setIsPrivate(false);
        }
      });

    fetch("/api/journals/history")
      .then((r) => r.json())
      .then((data) => setHistory(data.entries ?? []));
  }, [currentMonth]);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/journals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month: currentMonth,
        prompt1: answers[0],
        prompt2: answers[1],
        prompt3: answers[2],
        prompt4: answers[3],
        prompt5: answers[4],
        freeNotes,
        isPrivate,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="px-6 py-6 max-w-[780px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[28px] font-semibold text-text-primary">Kingdom Venture Journal</h1>
          <p className="text-text-secondary text-sm mt-1">Monthly reflections for Month {currentMonth}</p>
        </div>
        <select
          value={currentMonth}
          onChange={(e) => setCurrentMonth(Number(e.target.value))}
          className="h-9 px-3 bg-white border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary"
        >
          {[1,2,3,4,5,6].map((m) => (
            <option key={m} value={m}>Month {m}</option>
          ))}
        </select>
      </div>

      {/* Current month entry */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Month {currentMonth} Reflections</CardTitle>
          <button
            onClick={() => setIsPrivate(!isPrivate)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors",
              isPrivate
                ? "bg-[rgba(107,107,103,0.1)] text-text-secondary"
                : "bg-bg-base text-text-secondary hover:bg-border"
            )}
          >
            {isPrivate ? <EyeOff size={13} /> : <Eye size={13} />}
            {isPrivate ? "Private" : "Visible to facilitator"}
          </button>
        </div>

        <div className="space-y-5">
          {PROMPTS.map((prompt, idx) => (
            <div key={idx}>
              <p className="text-[13px] font-medium text-text-primary mb-2 leading-snug">{prompt}</p>
              <textarea
                rows={3}
                value={answers[idx]}
                onChange={(e) => {
                  const newAnswers = [...answers];
                  newAnswers[idx] = e.target.value;
                  setAnswers(newAnswers);
                }}
                className="w-full px-4 py-3 bg-bg-base border border-border rounded-lg text-[14px] text-text-primary outline-none focus:border-accent-primary resize-y"
                placeholder="Write your reflection here..."
              />
            </div>
          ))}

          <div>
            <p className="text-[13px] font-medium text-text-primary mb-2">Additional notes (optional)</p>
            <textarea
              rows={3}
              value={freeNotes}
              onChange={(e) => setFreeNotes(e.target.value)}
              className="w-full px-4 py-3 bg-bg-base border border-border rounded-lg text-[14px] text-text-primary outline-none focus:border-accent-primary resize-y"
              placeholder="Any other reflections, prayers, or observations..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-border">
          {saved && <span className="text-xs text-text-secondary">Saved</span>}
          <Button onClick={handleSave} loading={saving}>Save Entry</Button>
        </div>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardLabel>PREVIOUS ENTRIES</CardLabel>
          <div className="space-y-3">
            {history
              .filter((e) => e.month !== currentMonth)
              .map((e) => (
                <button
                  key={e.month}
                  onClick={() => setCurrentMonth(e.month)}
                  className="w-full text-left flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-bg-base transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">Month {e.month}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {e.isPrivate ? "Private entry" : truncate(e.prompt1 ?? "No content", 80)}
                    </p>
                  </div>
                  <span className="text-xs text-text-secondary">{formatDate(e.updatedAt)}</span>
                </button>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
