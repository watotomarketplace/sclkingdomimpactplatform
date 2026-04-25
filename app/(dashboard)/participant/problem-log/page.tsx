"use client";

import { useState, useEffect } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, MapPin, Users, Calendar, Eye } from "lucide-react";

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

export default function ProblemLogPage() {
  const [entries, setEntries]       = useState<ProblemEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Load entries ──────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/problem-log");
      if (res.ok) setEntries(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  };

  const openEdit = (entry: ProblemEntry) => {
    setEditId(entry.id);
    setForm({
      observation: entry.observation,
      sphere:      entry.sphere,
      affected:    entry.affected ?? "",
      observedAt:  entry.observedAt.split("T")[0],
    });
    setError("");
    setShowForm(true);
  };

  const cancel = () => {
    setShowForm(false);
    setEditId(null);
    setError("");
  };

  const handleSave = async () => {
    if (!form.observation.trim() || form.observation.trim().length < 5) {
      setError("Please describe what you observed (at least 5 characters).");
      return;
    }
    if (!form.sphere.trim() || form.sphere.trim().length < 2) {
      setError("Please describe where you saw this.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const url    = editId ? `/api/problem-log/${editId}` : "/api/problem-log";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong.");
        return;
      }

      await load();
      cancel();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this problem entry?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/problem-log/${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="px-6 py-6 max-w-[820px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-[26px] font-semibold text-text-primary">
            Problem Sightings
          </h1>
          <p className="text-text-secondary text-sm mt-1 max-w-lg">
            Before the class, log every problem you notice in your sphere — your workplace,
            community, church, or daily life. Don&rsquo;t filter. Just observe and record.
            You&rsquo;ll refine these during Month 1.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-[#0A0A0A] hover:bg-[#1a1a1a] text-white text-[13px] font-medium px-4 py-2.5 rounded-lg transition-colors shrink-0 ml-4"
          >
            <Plus size={14} />
            Log a problem
          </button>
        )}
      </div>

      {/* Empty state callout (when no entries yet, before form opens) */}
      {!loading && entries.length === 0 && !showForm && (
        <Card className="py-12 flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-accent-gold/10 flex items-center justify-center mb-4">
            <Eye size={20} className="text-accent-gold" />
          </div>
          <h3 className="font-display text-[17px] font-semibold text-text-primary mb-2">
            Start observing
          </h3>
          <p className="text-text-secondary text-sm max-w-sm leading-relaxed">
            Look around your world this week. What frustrates people? What systems are broken?
            What needs aren&rsquo;t being met? Log anything that catches your attention.
          </p>
          <button
            onClick={openAdd}
            className="mt-6 flex items-center gap-2 bg-[#0A0A0A] hover:bg-[#1a1a1a] text-white text-[13px] font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Log your first problem
          </button>
        </Card>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <Card className="mb-6 border-accent-primary/30">
          <h2 className="text-[15px] font-semibold text-text-primary mb-4">
            {editId ? "Edit problem" : "Log a problem"}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                What did you observe? <span className="text-accent-danger">*</span>
              </label>
              <textarea
                className="w-full min-h-[100px] resize-none rounded-lg border border-border bg-bg-base px-3.5 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary transition-colors"
                placeholder="Describe the problem or situation you noticed — be specific."
                value={form.observation}
                onChange={(e) => setForm((f) => ({ ...f, observation: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Where did you see it? <span className="text-accent-danger">*</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-border bg-bg-base px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary transition-colors"
                  placeholder="e.g. My workplace, my neighbourhood, church…"
                  value={form.sphere}
                  onChange={(e) => setForm((f) => ({ ...f, sphere: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Date observed
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-bg-base px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary transition-colors"
                  value={form.observedAt}
                  onChange={(e) => setForm((f) => ({ ...f, observedAt: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Who is affected?{" "}
                <span className="text-text-secondary font-normal">(optional)</span>
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-bg-base px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary transition-colors"
                placeholder="e.g. Small business owners, young people, patients…"
                value={form.affected}
                onChange={(e) => setForm((f) => ({ ...f, affected: e.target.value }))}
              />
            </div>

            {error && (
              <p className="text-sm text-accent-danger bg-[rgba(220,38,38,0.08)] px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="secondary" size="sm" onClick={cancel} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" loading={saving} onClick={handleSave}>
                {editId ? "Save changes" : "Log problem"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Entry count */}
      {entries.length > 0 && (
        <div className="flex items-center justify-between mb-3">
          <CardLabel>{entries.length} PROBLEM{entries.length !== 1 ? "S" : ""} LOGGED</CardLabel>
        </div>
      )}

      {/* Entry list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-bg-base border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id} padding="md" className="group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-text-primary leading-relaxed">
                    {entry.observation}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5">
                    <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                      <MapPin size={11} className="shrink-0" />
                      {entry.sphere}
                    </span>
                    {entry.affected && (
                      <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                        <Users size={11} className="shrink-0" />
                        {entry.affected}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                      <Calendar size={11} className="shrink-0" />
                      {formatDate(entry.observedAt)}
                    </span>
                  </div>
                </div>

                {/* Actions — appear on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => openEdit(entry)}
                    className="p-1.5 rounded-md hover:bg-bg-base text-text-secondary hover:text-text-primary transition-colors"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                    className="p-1.5 rounded-md hover:bg-[rgba(220,38,38,0.08)] text-text-secondary hover:text-accent-danger transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Encouragement when they have entries */}
      {!loading && entries.length >= 3 && (
        <div className="mt-6 bg-[rgba(200,151,58,0.06)] border border-accent-gold/20 rounded-lg px-5 py-4">
          <p className="text-[13px] text-text-secondary leading-relaxed">
            <span className="text-accent-gold font-semibold">Keep going.</span>{" "}
            The more problems you log now, the richer your Month 1 discovery work will be.
            Great ventures start with an honest list of what is broken in the world.
          </p>
        </div>
      )}
    </div>
  );
}
