"use client";

import { useState, useEffect } from "react";
import { Card, CardLabel, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const AREAS = [
  { key: "problemClarity", label: "Problem Clarity", description: "How clearly do you understand the problem you're solving?" },
  { key: "researchEffort", label: "Research Effort", description: "How rigorous has your research and validation been?" },
  { key: "executionDiscipline", label: "Execution Discipline", description: "How consistently are you doing the work?" },
  { key: "mvpProgress", label: "MVP / Pilot Progress", description: "How much tangible progress have you made?" },
  { key: "kingdomAlignment", label: "Kingdom Alignment", description: "How clearly does your work serve Kingdom purposes?" },
  { key: "peerEngagement", label: "Peer Engagement", description: "How engaged are you with your pod and program community?" },
];

type Status = "ON_TRACK" | "NEEDS_ATTENTION" | "ESCALATE";

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: "ON_TRACK", label: "On Track", color: "text-accent-primary bg-[rgba(45,90,61,0.1)]" },
  { value: "NEEDS_ATTENTION", label: "Needs Attention", color: "text-accent-warning bg-[rgba(217,119,6,0.1)]" },
  { value: "ESCALATE", label: "Escalate", color: "text-accent-danger bg-[rgba(184,58,42,0.1)]" },
];

export default function ScorecardPage() {
  const [month, setMonth] = useState(1);
  const [scores, setScores] = useState<Record<string, Status>>({});
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [actions, setActions] = useState<Record<string, string>>({});
  const [facilitatorNotes, setFacilitatorNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/scorecards?month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.scorecard) {
          const sc = data.scorecard;
          const newScores: Record<string, Status> = {};
          const newEvidence: Record<string, string> = {};
          const newActions: Record<string, string> = {};
          AREAS.forEach(({ key }) => {
            const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
            newScores[key] = sc[camelKey] ?? "ON_TRACK";
            newEvidence[key] = sc[`${camelKey}Evidence`] ?? "";
            newActions[key] = sc[`${camelKey}Action`] ?? "";
          });
          setScores(newScores);
          setEvidence(newEvidence);
          setActions(newActions);
          setFacilitatorNotes(sc.facilitatorNotes ?? "");
        }
      });
  }, [month]);

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, string> = {};
    AREAS.forEach(({ key }) => {
      payload[key] = scores[key] ?? "ON_TRACK";
      payload[`${key}Evidence`] = evidence[key] ?? "";
      payload[`${key}Action`] = actions[key] ?? "";
    });

    await fetch("/api/scorecards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, ...payload }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="px-6 py-6 max-w-[780px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[28px] font-semibold text-text-primary">Monthly Scorecard</h1>
          <p className="text-text-secondary text-sm mt-1">Honest self-assessment for Month {month}</p>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="h-9 px-3 bg-white border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary"
        >
          {[1,2,3,4,5,6].map((m) => (
            <option key={m} value={m}>Month {m}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {AREAS.map(({ key, label, description }) => (
          <Card key={key}>
            <CardTitle className="mb-1">{label}</CardTitle>
            <p className="text-xs text-text-secondary mb-3">{description}</p>

            {/* Status selector */}
            <div className="flex gap-2 mb-3">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setScores({ ...scores, [key]: opt.value })}
                  className={cn(
                    "flex-1 text-xs font-medium py-1.5 rounded-md transition-all border",
                    scores[key] === opt.value
                      ? `${opt.color} border-transparent`
                      : "text-text-secondary bg-bg-base border-border hover:border-border-strong"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <textarea
                placeholder="Evidence (what specifically supports this assessment?)"
                rows={2}
                value={evidence[key] ?? ""}
                onChange={(e) => setEvidence({ ...evidence, [key]: e.target.value })}
                className="w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-[13px] text-text-primary outline-none focus:border-accent-primary resize-none"
              />
              <textarea
                placeholder="Next action (what will you do about this?)"
                rows={1}
                value={actions[key] ?? ""}
                onChange={(e) => setActions({ ...actions, [key]: e.target.value })}
                className="w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-[13px] text-text-primary outline-none focus:border-accent-primary resize-none"
              />
            </div>
          </Card>
        ))}
      </div>

      {facilitatorNotes && (
        <Card className="mb-6">
          <CardLabel>FACILITATOR&apos;S NOTES</CardLabel>
          <p className="text-sm text-text-primary leading-relaxed">{facilitatorNotes}</p>
        </Card>
      )}

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-xs text-text-secondary">Saved</span>}
        <Button onClick={handleSave} loading={saving}>Save Scorecard</Button>
      </div>
    </div>
  );
}
