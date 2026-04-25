"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, MapPin, Users, Calendar, Eye, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProblemEntry {
  id: string;
  observation: string;
  sphere: string;
  affected: string | null;
  observedAt: string;
}

type FormState = {
  observation: string;
  sphere: string;
  affected: string;
  observedAt: string;
};

const EMPTY_FORM: FormState = {
  observation: "",
  sphere: "",
  affected: "",
  observedAt: new Date().toISOString().split("T")[0],
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ProblemSightingsOnboarding() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [entries, setEntries]     = useState<ProblemEntry[]>([]);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && !session?.user?.covenantSigned) router.replace("/welcome");
  }, [status, session, router]);

  // Load existing entries
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/problem-log").then(r => r.ok ? r.json() : []).then(setEntries).catch(() => {});
  }, [status]);

  if (status === "loading" || status === "unauthenticated") return null;

  const handleSave = async () => {
    if (!form.observation.trim() || form.observation.trim().length < 5) {
      setError("Describe what you observed (at least 5 characters).");
      return;
    }
    if (!form.sphere.trim() || form.sphere.trim().length < 2) {
      setError("Describe where you saw this.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/problem-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b.error ?? "Something went wrong.");
        return;
      }
      const entry = await res.json();
      setEntries(prev => [entry, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/problem-log/${id}`, { method: "DELETE" });
      setEntries(prev => prev.filter(e => e.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── Left: fixed atmospheric image panel ── */}
      <div className="relative h-48 md:h-auto md:w-[38%] md:fixed md:top-0 md:left-0 md:bottom-0 shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/tahoe-beach.jpg" alt="Clear lake" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 md:bg-gradient-to-r md:from-black/10 md:via-black/30 md:to-black/70" />
        <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-10 md:right-10 z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-3">
            <span className="text-accent-gold text-[10px]">✦</span>
            <span className="text-white/70 text-[10px] font-semibold uppercase tracking-widest">Before Month 1</span>
          </div>
          <h2 className="font-display text-[22px] md:text-[28px] text-white leading-snug">
            What problems<br className="hidden md:block" /> do you see?
          </h2>
          <p className="text-white/55 text-[13px] mt-2 leading-relaxed hidden md:block max-w-xs">
            Don&rsquo;t filter. Just observe and record. You&rsquo;ll refine these in Month 1.
          </p>
        </div>
      </div>

      {/* ── Right: scrollable content ── */}
      <div className="flex-1 md:ml-[38%] bg-white min-h-screen flex flex-col">
        <div className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-[600px] mx-auto w-full">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-7 h-7 bg-[#0A0A0A] rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold font-display">S</span>
              </div>
              <span className="text-[13px] font-semibold text-text-primary">SCL Platform</span>
            </div>
            <p className="section-label mb-2">PROBLEM SIGHTINGS</p>
            <h1 className="font-display text-[26px] md:text-[30px] font-semibold text-text-primary leading-tight mb-2">
              What are you noticing?
            </h1>
            <p className="text-text-secondary text-[14px] leading-relaxed">
              Before the teaching session begins, log every problem you&rsquo;re observing
              in your world. These become the raw material for Month 1.
            </p>
          </div>

          {/* Add problem button */}
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setError(""); setForm(EMPTY_FORM); }}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-accent-primary/40 hover:bg-accent-primary/[0.03] text-text-secondary hover:text-accent-primary rounded-xl py-4 text-[13px] font-medium transition-all mb-5"
            >
              <Plus size={16} />
              Log a problem
            </button>
          )}

          {/* Add form */}
          {showForm && (
            <div className="border border-border rounded-xl p-5 mb-5 bg-bg-base">
              <h3 className="text-[14px] font-semibold text-text-primary mb-4">New problem sighting</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                    What did you observe? <span className="text-accent-danger">*</span>
                  </label>
                  <textarea
                    className="w-full min-h-[90px] resize-none rounded-lg border border-border bg-white px-3.5 py-3 text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary transition-colors"
                    placeholder="Describe the problem or situation you noticed…"
                    value={form.observation}
                    onChange={e => setForm(f => ({ ...f, observation: e.target.value }))}
                    rows={3}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                      Where? <span className="text-accent-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary transition-colors"
                      placeholder="Workplace, community…"
                      value={form.sphere}
                      onChange={e => setForm(f => ({ ...f, sphere: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                      Date observed
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary transition-colors"
                      value={form.observedAt}
                      onChange={e => setForm(f => ({ ...f, observedAt: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                    Who is affected? <span className="text-text-tertiary font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary transition-colors"
                    placeholder="e.g. Small businesses, young people…"
                    value={form.affected}
                    onChange={e => setForm(f => ({ ...f, affected: e.target.value }))}
                  />
                </div>
                {error && (
                  <p className="text-[13px] text-accent-danger bg-[rgba(220,38,38,0.07)] px-3 py-2 rounded-lg">{error}</p>
                )}
                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={() => { setShowForm(false); setError(""); }}
                    className="px-4 py-2.5 text-[13px] font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-bg-base transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium bg-[#0A0A0A] text-white rounded-lg hover:bg-[#1a1a1a] disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Saving…" : "Log problem"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Entry count */}
          {entries.length > 0 && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-3">
              {entries.length} problem{entries.length !== 1 ? "s" : ""} logged
            </p>
          )}

          {/* Entry list */}
          <div className="space-y-2.5 mb-8">
            {entries.map(entry => (
              <div
                key={entry.id}
                className="group flex items-start gap-3 bg-bg-base border border-border rounded-xl px-4 py-3.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-text-primary leading-relaxed">{entry.observation}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                      <MapPin size={10} />{entry.sphere}
                    </span>
                    {entry.affected && (
                      <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                        <Users size={10} />{entry.affected}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                      <Calendar size={10} />{formatDate(entry.observedAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[rgba(220,38,38,0.08)] text-text-secondary hover:text-accent-danger transition-all shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {entries.length === 0 && !showForm && (
            <div className="text-center py-8 mb-8">
              <div className="w-10 h-10 rounded-full bg-accent-gold/10 flex items-center justify-center mx-auto mb-3">
                <Eye size={18} className="text-accent-gold" />
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed max-w-xs mx-auto">
                Look around your world this week. What frustrates people? What needs aren&rsquo;t being met?
              </p>
            </div>
          )}

          {/* Encouragement */}
          {entries.length >= 3 && (
            <div className="bg-[rgba(200,151,58,0.06)] border border-accent-gold/20 rounded-xl px-4 py-3.5 mb-6">
              <p className="text-[13px] text-text-secondary">
                <span className="text-accent-gold font-semibold">Keep going.</span>{" "}
                The more you log now, the richer your Month 1 discovery will be.
              </p>
            </div>
          )}
        </div>

        {/* ── Sticky footer: Continue button ── */}
        <div className="sticky bottom-0 bg-white border-t border-border px-6 py-4 md:px-12">
          <div className="max-w-[600px] mx-auto flex items-center justify-between gap-4">
            <div>
              {entries.length === 0 ? (
                <p className="text-[12px] text-text-secondary">You can add more from your dashboard anytime.</p>
              ) : (
                <p className="text-[12px] text-text-secondary">
                  <span className="text-text-primary font-medium">{entries.length} problem{entries.length !== 1 ? "s" : ""} logged.</span>{" "}
                  You can add more from your dashboard.
                </p>
              )}
            </div>
            <button
              onClick={() => { window.location.href = "/participant"; }}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-[14px] transition-all shrink-0",
                entries.length > 0
                  ? "bg-[#0A0A0A] text-white hover:bg-[#1a1a1a]"
                  : "bg-bg-base text-text-primary border border-border hover:border-border-strong hover:bg-white"
              )}
            >
              {entries.length > 0 ? "Go to Dashboard" : "Skip for now"}
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
