"use client";

import { useState, useEffect } from "react";
import { Card, CardLabel, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Data                                                                  */
/* ------------------------------------------------------------------ */

type Status = "ON_TRACK" | "NEEDS_ATTENTION" | "ESCALATE";

const STATUS_OPTIONS: { value: Status; label: string; dot: string; chip: string }[] = [
  {
    value: "ON_TRACK",
    label: "On Track",
    dot: "bg-emerald-500",
    chip: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  {
    value: "NEEDS_ATTENTION",
    label: "Needs Attention",
    dot: "bg-amber-500",
    chip: "text-amber-700 bg-amber-50 border-amber-200",
  },
  {
    value: "ESCALATE",
    label: "Escalate",
    dot: "bg-red-500",
    chip: "text-red-700 bg-red-50 border-red-200",
  },
];

interface AreaDef {
  key: string;
  label: string;
  description: string;
  monthFocus: string; // e.g. "Month 1–2"
  statusDefinitions: Record<Status, string>;
}

const AREAS: AreaDef[] = [
  {
    key: "problemClarity",
    label: "Problem Clarity",
    description: "How clearly do you understand the problem you're solving?",
    monthFocus: "Month 1",
    statusDefinitions: {
      ON_TRACK:
        "You can articulate the problem clearly, name who it affects and why it matters — backed by real observations.",
      NEEDS_ATTENTION:
        "Your problem statement is vague or based mainly on assumptions. More research is needed.",
      ESCALATE:
        "You are unsure what problem you're solving, or you've pivoted multiple times without validation.",
    },
  },
  {
    key: "researchEffort",
    label: "Research Effort",
    description: "How rigorous has your research and validation been?",
    monthFocus: "Month 1–2",
    statusDefinitions: {
      ON_TRACK:
        "You have spoken to 5+ real people, documented their pain, and can show data that validates the problem.",
      NEEDS_ATTENTION:
        "You've done some research but it's thin — fewer than 3 conversations or only friends and family.",
      ESCALATE:
        "You have not done meaningful research beyond desktop research or personal opinion.",
    },
  },
  {
    key: "executionDiscipline",
    label: "Execution Discipline",
    description: "How consistently are you doing the work?",
    monthFocus: "All months",
    statusDefinitions: {
      ON_TRACK:
        "You complete weekly tasks on time, attend group sessions, and have no overdue deliverables.",
      NEEDS_ATTENTION:
        "You are behind on tasks or have missed more than one session — re-prioritisation is needed.",
      ESCALATE:
        "Multiple missed deadlines or sessions. Significant catch-up is required to stay in the programme.",
    },
  },
  {
    key: "mvpProgress",
    label: "MVP / Pilot Progress",
    description: "How much tangible progress have you made on your solution?",
    monthFocus: "Month 2–4",
    statusDefinitions: {
      ON_TRACK:
        "You have a working prototype or pilot running, with real users providing feedback.",
      NEEDS_ATTENTION:
        "Progress is slower than expected — your MVP/pilot exists but hasn't been tested with real users yet.",
      ESCALATE:
        "No prototype or pilot exists, or the solution is fundamentally the same as when you started.",
    },
  },
  {
    key: "kingdomAlignment",
    label: "Kingdom Alignment",
    description: "How clearly does your work serve Kingdom purposes and values?",
    monthFocus: "All months",
    statusDefinitions: {
      ON_TRACK:
        "Your work clearly creates value for others, honours God, and you can articulate the Kingdom impact.",
      NEEDS_ATTENTION:
        "The Kingdom dimension is present but not yet woven into your strategy or how you operate.",
      ESCALATE:
        "Kingdom purposes are unclear, disconnected from your work, or your practices are misaligned.",
    },
  },
  {
    key: "peerEngagement",
    label: "Peer Engagement",
    description: "How engaged are you with your pod and the programme community?",
    monthFocus: "All months",
    statusDefinitions: {
      ON_TRACK:
        "You actively contribute in pod sessions, give useful feedback to peers, and ask for help when needed.",
      NEEDS_ATTENTION:
        "You attend sessions but largely remain passive — limited contribution or collaboration.",
      ESCALATE:
        "You've missed most sessions or are disengaged to the point where your pod is being impacted.",
    },
  },
];

/* ------------------------------------------------------------------ */
/* Sub-components                                                        */
/* ------------------------------------------------------------------ */

function StatusDefinitionsCallout() {
  return (
    <div className="mb-6 rounded-xl bg-[#0A0A0A] px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-gold mb-3">
        What each status means
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {STATUS_OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-start gap-2.5">
            <span className={cn("w-2 h-2 rounded-full mt-1 shrink-0", opt.dot)} />
            <div>
              <p className="text-[12px] font-semibold text-text-primary leading-none mb-1">{opt.label}</p>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                {opt.value === "ON_TRACK" && "You're progressing well — keep going."}
                {opt.value === "NEEDS_ATTENTION" && "Something needs focus this week — be honest."}
                {opt.value === "ESCALATE" &&
                  "You need support now — your facilitator will reach out."}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AreaCard({
  area,
  status,
  evidenceValue,
  actionValue,
  onStatusChange,
  onEvidenceChange,
  onActionChange,
}: {
  area: AreaDef;
  status: Status;
  evidenceValue: string;
  actionValue: string;
  onStatusChange: (v: Status) => void;
  onEvidenceChange: (v: string) => void;
  onActionChange: (v: string) => void;
}) {
  const [showDefs, setShowDefs] = useState(false);
  const currentOpt = STATUS_OPTIONS.find((o) => o.value === status)!;

  return (
    <Card>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="mb-0">{area.label}</CardTitle>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-bg-base border border-border text-text-secondary whitespace-nowrap">
              {area.monthFocus}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">{area.description}</p>
        </div>
        <button
          onClick={() => setShowDefs((v) => !v)}
          className="shrink-0 p-1 text-text-secondary hover:text-text-primary transition-colors mt-0.5"
          title="What does each status mean for this area?"
        >
          <Info size={14} />
        </button>
      </div>

      {/* Expandable definitions */}
      {showDefs && (
        <div className="mb-3 rounded-lg bg-bg-base border border-border px-3 py-2.5 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary mb-1.5">
            Status guide for {area.label}
          </p>
          {STATUS_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-start gap-2">
              <span className={cn("w-1.5 h-1.5 rounded-full mt-1 shrink-0", opt.dot)} />
              <div>
                <span className="text-[11px] font-semibold text-text-primary">{opt.label}: </span>
                <span className="text-[11px] text-text-secondary">
                  {area.statusDefinitions[opt.value]}
                </span>
              </div>
            </div>
          ))}
          <button
            onClick={() => setShowDefs(false)}
            className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary mt-1"
          >
            <ChevronUp size={11} /> Hide
          </button>
        </div>
      )}

      {/* Status selector */}
      <div className="flex gap-2 mb-3">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatusChange(opt.value)}
            className={cn(
              "flex-1 text-[11px] font-medium py-1.5 rounded-md transition-all border",
              status === opt.value
                ? `${opt.chip} border-transparent`
                : "text-text-secondary bg-bg-base border-border hover:border-border-strong"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <textarea
          placeholder="Evidence — what specifically supports this assessment?"
          rows={2}
          value={evidenceValue}
          onChange={(e) => onEvidenceChange(e.target.value)}
          className="w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-[13px] text-text-primary outline-none focus:border-accent-primary resize-none placeholder:text-text-secondary/60"
        />
        <textarea
          placeholder="Next action — what will you do about this?"
          rows={1}
          value={actionValue}
          onChange={(e) => onActionChange(e.target.value)}
          className="w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-[13px] text-text-primary outline-none focus:border-accent-primary resize-none placeholder:text-text-secondary/60"
        />
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                  */
/* ------------------------------------------------------------------ */

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
            newScores[key] = sc[key] ?? "ON_TRACK";
            newEvidence[key] = sc[`${key}Evidence`] ?? "";
            newActions[key] = sc[`${key}Action`] ?? "";
          });
          setScores(newScores);
          setEvidence(newEvidence);
          setActions(newActions);
          setFacilitatorNotes(sc.facilitatorNotes ?? "");
        } else {
          // Reset to defaults
          const defaults: Record<string, Status> = {};
          AREAS.forEach(({ key }) => { defaults[key] = "ON_TRACK"; });
          setScores(defaults);
          setEvidence({});
          setActions({});
          setFacilitatorNotes("");
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
    <div className="px-4 py-5 md:px-6 md:py-6 max-w-[900px]">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[26px] md:text-[28px] font-semibold text-text-primary">
            Monthly Scorecard
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Honest self-assessment for Month {month}
          </p>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="h-9 px-3 bg-white border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary"
        >
          {[1, 2, 3, 4, 5, 6].map((m) => (
            <option key={m} value={m}>
              Month {m}
            </option>
          ))}
        </select>
      </div>

      {/* Status definitions callout */}
      <StatusDefinitionsCallout />

      {/* Area cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {AREAS.map((area) => (
          <AreaCard
            key={area.key}
            area={area}
            status={scores[area.key] ?? "ON_TRACK"}
            evidenceValue={evidence[area.key] ?? ""}
            actionValue={actions[area.key] ?? ""}
            onStatusChange={(v) => setScores({ ...scores, [area.key]: v })}
            onEvidenceChange={(v) => setEvidence({ ...evidence, [area.key]: v })}
            onActionChange={(v) => setActions({ ...actions, [area.key]: v })}
          />
        ))}
      </div>

      {/* Facilitator notes */}
      {facilitatorNotes && (
        <Card className="mb-6">
          <CardLabel>FACILITATOR&apos;S NOTES</CardLabel>
          <p className="text-sm text-text-primary leading-relaxed">{facilitatorNotes}</p>
        </Card>
      )}

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-xs text-text-secondary draft-saved">Saved ✓</span>
        )}
        <Button onClick={handleSave} loading={saving}>
          Save Scorecard
        </Button>
      </div>
    </div>
  );
}
