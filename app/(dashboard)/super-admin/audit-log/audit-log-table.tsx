"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";

interface LogEntry {
  id: string;
  actorId: string;
  action: string;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    role: string;
  };
}

interface AuditLogTableProps {
  logs: LogEntry[];
}

function formatAction(action: string): string {
  return action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Get unique action types
  const actionTypes = useMemo(
    () => Array.from(new Set(logs.map(l => l.action))).sort(),
    [logs]
  );

  const filtered = useMemo(
    () => logs.filter(log => {
      const matchesSearch = !search ||
        log.actor.name.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase());
      const matchesAction = !actionFilter || log.action === actionFilter;
      return matchesSearch && matchesAction;
    }),
    [logs, search, actionFilter]
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search by actor or action..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary w-[240px]"
        />
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary"
        >
          <option value="">All actions</option>
          {actionTypes.map(a => (
            <option key={a} value={a}>{formatAction(a)}</option>
          ))}
        </select>
        <span className="text-sm text-text-secondary">{filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}</span>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-medium text-text-secondary">TIMESTAMP</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider font-medium text-text-secondary">ACTOR</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider font-medium text-text-secondary">ROLE</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider font-medium text-text-secondary">ACTION</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider font-medium text-text-secondary">TARGET</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider font-medium text-text-secondary">DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-secondary text-sm">No audit log entries found.</td>
                </tr>
              ) : (
                filtered.map(log => (
                  <>
                    <tr key={log.id} className="border-b border-border hover:bg-bg-base transition-colors">
                      <td className="px-5 py-3 text-xs text-text-secondary font-mono whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                          hour: "numeric", minute: "2-digit"
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-text-primary">{log.actor.name}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-secondary">{log.actor.role.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-text-primary">{log.action}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary font-mono">
                        {log.targetId ? log.targetId.slice(0, 12) + "…" : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {log.details ? (
                          <button
                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                            className="text-xs text-accent-primary hover:underline"
                          >
                            {expandedId === log.id ? "Hide" : "Show"}
                          </button>
                        ) : (
                          <span className="text-xs text-text-secondary">—</span>
                        )}
                      </td>
                    </tr>
                    {expandedId === log.id && log.details && (
                      <tr key={`${log.id}-details`} className="border-b border-border bg-bg-base">
                        <td colSpan={6} className="px-5 py-3">
                          <pre className="text-xs text-text-secondary font-mono overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
