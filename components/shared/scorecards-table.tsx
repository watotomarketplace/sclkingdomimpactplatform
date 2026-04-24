"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface ScorecardRow {
  userId: string;
  userName: string;
  podName?: string;
  facilitatorName?: string;
  month: number;
  statuses: {
    problemClarity: string;
    researchEffort: string;
    executionDiscipline: string;
    mvpProgress: string;
    kingdomAlignment: string;
    peerEngagement: string;
  };
  facilitatorNotes?: string | null;
  submittedAt?: Date | string | null;
}

interface ScorecardsTableProps {
  rows: ScorecardRow[];
  showFacilitatorColumn?: boolean;
  participantLinkBase?: string;
}

function getOverallStatus(statuses: ScorecardRow["statuses"]): "ON_TRACK" | "NEEDS_ATTENTION" | "ESCALATE" {
  const vals = Object.values(statuses);
  if (vals.some(s => s === "ESCALATE")) return "ESCALATE";
  if (vals.some(s => s === "NEEDS_ATTENTION")) return "NEEDS_ATTENTION";
  return "ON_TRACK";
}

function statusDot(s: string) {
  const colors: Record<string, string> = {
    "ON_TRACK": "bg-accent-primary",
    "NEEDS_ATTENTION": "bg-accent-warning",
    "ESCALATE": "bg-accent-danger",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[s] ?? "bg-border-strong"}`} title={s.replace("_", " ")} />;
}

export function ScorecardsTable({ rows, showFacilitatorColumn = false, participantLinkBase = "/facilitator/participants" }: ScorecardsTableProps) {
  const [search, setSearch] = useState("");

  const filtered = rows.filter(r =>
    !search || r.userName.toLowerCase().includes(search.toLowerCase())
  );

  const categoryLabels = ["PC", "RE", "ED", "MVP", "KA", "PE"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search participants..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary w-[220px]"
        />
        <span className="text-sm text-text-secondary">{filtered.length} scorecard{filtered.length !== 1 ? "s" : ""}</span>
        <span className="text-xs text-text-secondary ml-2">PC=Problem Clarity · RE=Research · ED=Execution · MVP=MVP Progress · KA=Kingdom · PE=Peer</span>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-medium text-text-secondary">NAME</th>
                <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-medium text-text-secondary">MONTH</th>
                <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-medium text-text-secondary">OVERALL</th>
                {categoryLabels.map(l => (
                  <th key={l} className="px-2 py-3 text-center text-[10px] uppercase tracking-wider font-medium text-text-secondary">{l}</th>
                ))}
                <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-medium text-text-secondary">NOTES</th>
                {showFacilitatorColumn && <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-medium text-text-secondary">FACILITATOR</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-text-secondary text-sm">No scorecards found.</td>
                </tr>
              ) : (
                filtered.map((row, i) => {
                  const overall = getOverallStatus(row.statuses);
                  const overallBadge = overall === "ESCALATE" ? "escalate" : overall === "NEEDS_ATTENTION" ? "needs-attention" : "on-track";
                  const overallLabel = overall === "ESCALATE" ? "Escalate" : overall === "NEEDS_ATTENTION" ? "Attention" : "On Track";
                  const categoryValues = [
                    row.statuses.problemClarity,
                    row.statuses.researchEffort,
                    row.statuses.executionDiscipline,
                    row.statuses.mvpProgress,
                    row.statuses.kingdomAlignment,
                    row.statuses.peerEngagement,
                  ];
                  return (
                    <tr key={`${row.userId}-${row.month}-${i}`} className="border-b border-border last:border-0 hover:bg-bg-base transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`${participantLinkBase}/${row.userId}`} className="text-[14px] font-medium text-text-primary hover:text-accent-primary">
                          {row.userName}
                        </Link>
                        {row.podName && <p className="text-xs text-text-secondary">{row.podName}</p>}
                      </td>
                      <td className="px-3 py-3 text-sm text-text-secondary">Month {row.month}</td>
                      <td className="px-3 py-3">
                        <Badge variant={overallBadge as "on-track" | "needs-attention" | "escalate"}>{overallLabel}</Badge>
                      </td>
                      {categoryValues.map((v, ci) => (
                        <td key={ci} className="px-2 py-3 text-center">
                          {statusDot(v)}
                        </td>
                      ))}
                      <td className="px-3 py-3 text-xs text-text-secondary max-w-[140px] truncate">
                        {row.facilitatorNotes ?? "—"}
                      </td>
                      {showFacilitatorColumn && (
                        <td className="px-3 py-3 text-sm text-text-secondary">{row.facilitatorName ?? "—"}</td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
