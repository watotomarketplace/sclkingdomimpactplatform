"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate, MONTH_TITLES } from "@/lib/utils";
import Link from "next/link";

interface ProgressParticipant {
  id: string;
  name: string;
  podName?: string;
  facilitatorName?: string;
  currentMonth: number;
  latestScorecardStatus?: "ON_TRACK" | "NEEDS_ATTENTION" | "ESCALATE";
  lastActivity?: Date | string | null;
  gateStatus?: string | null;
}

interface CohortProgressTableProps {
  participants: ProgressParticipant[];
  showFacilitatorColumn?: boolean;
  participantLinkBase?: string;
}

export function CohortProgressTable({ participants, showFacilitatorColumn = false, participantLinkBase = "/facilitator/participants" }: CohortProgressTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = participants.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || p.latestScorecardStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const scorecardBadgeVariant = (status?: string) => {
    if (status === "ESCALATE") return "escalate" as const;
    if (status === "NEEDS_ATTENTION") return "needs-attention" as const;
    return "on-track" as const;
  };

  const scorecardLabel = (status?: string) => {
    if (status === "ESCALATE") return "Escalate";
    if (status === "NEEDS_ATTENTION") return "Attention";
    if (status === "ON_TRACK") return "On Track";
    return "—";
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search participants..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary w-[220px]"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary"
        >
          <option value="">All statuses</option>
          <option value="ON_TRACK">On Track</option>
          <option value="NEEDS_ATTENTION">Needs Attention</option>
          <option value="ESCALATE">Escalate</option>
        </select>
        <span className="text-sm text-text-secondary">{filtered.length} participant{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="px-5 py-3 border-b border-border grid gap-3" style={{ gridTemplateColumns: showFacilitatorColumn ? "2fr 1fr 1fr 1fr 1fr 1fr" : "2fr 1fr 1fr 1fr 1fr" }}>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary">NAME</span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary">POD</span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary">MONTH</span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary">SCORECARD</span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary">LAST ACTIVITY</span>
          {showFacilitatorColumn && <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary">FACILITATOR</span>}
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-text-secondary text-sm">No participants found.</p>
          </div>
        ) : (
          filtered.map(p => (
            <Link
              key={p.id}
              href={`${participantLinkBase}/${p.id}`}
              className="px-5 py-3 border-b border-border last:border-0 grid gap-3 hover:bg-bg-base transition-colors items-center"
              style={{ gridTemplateColumns: showFacilitatorColumn ? "2fr 1fr 1fr 1fr 1fr 1fr" : "2fr 1fr 1fr 1fr 1fr" }}
            >
              <p className="text-[14px] font-medium text-text-primary">{p.name}</p>
              <p className="text-sm text-text-secondary">{p.podName ?? "—"}</p>
              <p className="text-sm text-text-secondary">Month {p.currentMonth} · {MONTH_TITLES[p.currentMonth]}</p>
              <div>
                {p.latestScorecardStatus ? (
                  <Badge variant={scorecardBadgeVariant(p.latestScorecardStatus)}>
                    {scorecardLabel(p.latestScorecardStatus)}
                  </Badge>
                ) : (
                  <span className="text-sm text-text-secondary">—</span>
                )}
              </div>
              <p className="text-sm text-text-secondary">
                {p.lastActivity ? formatDate(p.lastActivity) : "—"}
              </p>
              {showFacilitatorColumn && (
                <p className="text-sm text-text-secondary">{p.facilitatorName ?? "—"}</p>
              )}
            </Link>
          ))
        )}
      </Card>
    </div>
  );
}
