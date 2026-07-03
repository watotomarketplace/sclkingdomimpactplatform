"use client";

import { useState, useMemo } from "react";
import { Search, CheckCircle2 } from "lucide-react";
import { ReviewDetail } from "@/components/facilitator/review-detail";
import type { ReviewSubmission } from "@/components/facilitator/milestone-review-panel";

interface FieldDef { key: string; label: string }

interface ReviewSearchListProps {
  submissions: ReviewSubmission[];
  fields: FieldDef[];
  /** Message shown when there are no submissions at all. */
  emptyLabel: string;
}

/**
 * Master-detail review view: searchable list of students on the left; the
 * selected student's full submission on the right. Pending submissions are
 * listed before reviewed ones.
 */
export function ReviewSearchList({ submissions, fields, emptyLabel }: ReviewSearchListProps) {
  const [query, setQuery] = useState("");

  const ordered = useMemo(() => {
    // Pending (unreviewed) first, preserving incoming order within each group.
    return [...submissions].sort((a, b) => Number(!!a.reviewedById) - Number(!!b.reviewedById));
  }, [submissions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter(
      (s) => (s.userName ?? "").toLowerCase().includes(q) || s.userEmail.toLowerCase().includes(q)
    );
  }, [ordered, query]);

  const [selectedId, setSelectedId] = useState<string | null>(submissions[0]?.id ?? null);
  const selected =
    filtered.find((s) => s.id === selectedId) ?? filtered[0] ?? null;

  const pendingCount = submissions.filter((s) => !s.reviewedById).length;

  if (submissions.length === 0) {
    return (
      <div className="glass-2 p-8 text-center">
        <Search size={28} className="text-[#A3A3A3] mx-auto mb-3" />
        <p className="text-text-secondary text-[14px]">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-start">
      {/* Left: student list */}
      <div className="w-full lg:w-[300px] lg:shrink-0 lg:sticky lg:top-4 glass-2 overflow-hidden flex flex-col lg:max-h-[80vh]">
        <div className="p-2.5 border-b border-border">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students…"
              className="input-on-glass w-full pl-9 pr-3 h-9 text-[13px]"
            />
          </div>
        </div>

        <div className="overflow-y-auto divide-y divide-white/[0.05]">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-[#A3A3A3] text-center">No students match “{query}”.</p>
          ) : (
            filtered.map((s) => {
              const isSelected = selected?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                    isSelected ? "bg-[rgba(200,151,58,0.14)]" : "hover:bg-bg-base"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-bg-base border border-border flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-semibold text-text-secondary">
                      {(s.userName ?? s.userEmail).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-text-primary truncate">
                      {s.userName ?? s.userEmail}
                    </p>
                    <p className="text-[11px] text-[#A3A3A3] truncate">{s.userEmail}</p>
                  </div>
                  {s.reviewedById ? (
                    <CheckCircle2 size={13} className="text-[#86EFAC] shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FCD34D] shrink-0" title="Awaiting review" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="px-3 py-2 border-t border-border text-[11px] text-[#A3A3A3]">
          {pendingCount} awaiting · {submissions.length - pendingCount} reviewed
        </div>
      </div>

      {/* Right: selected submission */}
      <div className="w-full lg:flex-1 lg:min-w-0">
        {selected ? (
          <ReviewDetail key={selected.id} submission={selected} fields={fields} />
        ) : (
          <div className="glass-2 p-8 text-center">
            <p className="text-text-secondary text-[13px]">Select a student to view their submission.</p>
          </div>
        )}
      </div>
    </div>
  );
}
