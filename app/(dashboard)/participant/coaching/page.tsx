"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardLabel, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarDays, Plus, ExternalLink, Trash2, ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CoachingSession {
  id: string;
  month: number;
  sessionDate: string;
  notes: string | null;
  calendlyEventId: string | null;
  createdAt: string;
}

const MONTH_TITLES: Record<number, string> = {
  1: "Pain Point to Concept",
  2: "MVP Design",
  3: "Prototype & Test",
  4: "Pilot",
  5: "Launch",
  6: "Impact Review",
};

export default function CoachingPage() {
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logMonth, setLogMonth] = useState(1);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [logNotes, setLogNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coaching-sessions");
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLog = async () => {
    if (!logDate) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/coaching-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: logMonth,
          sessionDate: new Date(logDate).toISOString(),
          notes: logNotes || undefined,
        }),
      });
      if (res.ok) {
        setShowLogForm(false);
        setLogNotes("");
        await load();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/coaching-sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  // Group sessions by month
  const byMonth: Record<number, CoachingSession[]> = {};
  sessions.forEach((s) => {
    if (!byMonth[s.month]) byMonth[s.month] = [];
    byMonth[s.month].push(s);
  });

  return (
    <div className="px-4 py-5 md:px-6 md:py-6 max-w-[780px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[26px] md:text-[28px] font-semibold text-text-primary">
            Coaching Sessions
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Schedule and track your coaching conversations
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowLogForm((v) => !v)}
          className="flex items-center gap-1.5"
        >
          <Plus size={14} />
          Log Session
        </Button>
      </div>

      {/* Book via Calendly banner */}
      <Card className="mb-6 bg-[#0A0A0A] border-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-white mb-1">
              Book a 1-on-1 with your facilitator
            </p>
            <p className="text-[12px] text-white/60 leading-relaxed">
              Use the link below to schedule a session directly in your facilitator's calendar. After
              your session, log it here to keep your record up to date.
            </p>
          </div>
          <CalendarDays size={20} className="text-white/40 shrink-0 mt-0.5" />
        </div>
        <a
          href="#"
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-accent-gold hover:underline"
          onClick={(e) => {
            e.preventDefault();
            alert("Your facilitator's booking link will appear here once they have set up their calendar.");
          }}
        >
          Open booking calendar <ExternalLink size={11} />
        </a>
      </Card>

      {/* Log session form */}
      {showLogForm && (
        <Card className="mb-6 border-2 border-accent-primary/20">
          <CardTitle className="mb-3">Log a Completed Session</CardTitle>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-1 block">
                Month
              </label>
              <select
                value={logMonth}
                onChange={(e) => setLogMonth(Number(e.target.value))}
                className="w-full h-9 px-3 bg-white border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary"
              >
                {[1, 2, 3, 4, 5, 6].map((m) => (
                  <option key={m} value={m}>
                    Month {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-1 block">
                Date
              </label>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-1 block">
              Notes (optional)
            </label>
            <textarea
              placeholder="Key takeaways, commitments or follow-ups from this session…"
              rows={3}
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              className="w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-[13px] text-text-primary outline-none focus:border-accent-primary resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShowLogForm(false)}>
              Cancel
            </Button>
            <Button size="sm" loading={submitting} onClick={handleLog}>
              Save Session
            </Button>
          </div>
        </Card>
      )}

      {/* Sessions list */}
      {loading ? (
        <div className="text-sm text-text-secondary py-8 text-center">Loading sessions…</div>
      ) : sessions.length === 0 ? (
        <Card className="text-center py-12">
          <CalendarDays size={32} className="text-border-strong mx-auto mb-3" />
          <p className="text-[15px] font-medium text-text-primary mb-1">No sessions yet</p>
          <p className="text-sm text-text-secondary">
            Book a session with your facilitator or log one you have already completed.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(byMonth)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([month, monthSessions]) => (
              <div key={month}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary mb-2">
                  Month {month} — {MONTH_TITLES[Number(month)]}
                </p>
                <div className="space-y-2">
                  {monthSessions.map((s) => (
                    <Card key={s.id} padding="sm" className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-bg-base border border-border flex items-center justify-center shrink-0">
                        <CalendarDays size={14} className="text-text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-text-primary">
                          {formatDate(new Date(s.sessionDate))}
                        </p>
                        {s.notes && (
                          <p className="text-[12px] text-text-secondary mt-0.5 leading-relaxed">
                            {s.notes}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deletingId === s.id}
                        className="shrink-0 p-1 text-text-secondary hover:text-accent-danger transition-colors disabled:opacity-40"
                        title="Delete session"
                      >
                        <Trash2 size={13} />
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
