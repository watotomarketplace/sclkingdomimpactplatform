"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface CohortData {
  id: string;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
  _count?: { participants: number; pods: number };
  participants?: unknown[];
  pods?: unknown[];
}

interface CohortManagementProps {
  cohorts: CohortData[];
}

export function CohortManagement({ cohorts: initialCohorts }: CohortManagementProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CohortData | null>(null);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toInputDate = (d: string | Date) =>
    new Date(d).toISOString().slice(0, 10);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", startDate: "", endDate: "" });
    setError("");
    setShowModal(true);
  };

  const openEdit = (c: CohortData) => {
    setEditing(c);
    setForm({ name: c.name, startDate: toInputDate(c.startDate), endDate: toInputDate(c.endDate) });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const url = editing ? `/api/cohorts/${editing.id}` : "/api/cohorts";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "An error occurred.");
        return;
      }
      setShowModal(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (cohort: CohortData) => {
    const res = await fetch(`/api/cohorts/${cohort.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !cohort.isActive }),
    });
    if (res.ok) router.refresh();
  };

  const handleDelete = async (cohort: CohortData) => {
    if (!confirm(`Delete cohort "${cohort.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/cohorts/${cohort.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Could not delete cohort.");
    } else {
      router.refresh();
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[28px] font-semibold text-text-primary">Cohorts</h1>
          <p className="text-text-secondary text-sm mt-1">{initialCohorts.length} cohort{initialCohorts.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openCreate} size="sm">Create Cohort</Button>
      </div>

      {/* List */}
      {initialCohorts.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-text-secondary text-sm">No cohorts yet. Create the first one above.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {initialCohorts.map((c) => {
            const participantCount = c.participants?.length ?? 0;
            const podCount = c.pods?.length ?? 0;
            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-semibold text-text-primary">{c.name}</p>
                      <Badge variant={c.isActive ? "on-track" : "locked"}>
                        {c.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {formatDate(c.startDate)} → {formatDate(c.endDate)}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      {participantCount} participant{participantCount !== 1 ? "s" : ""} · {podCount} pod{podCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEdit(c)} className="text-xs text-accent-primary hover:underline">Edit</button>
                    <button onClick={() => handleToggleActive(c)} className="text-xs text-accent-primary hover:underline">
                      {c.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => handleDelete(c)} className="text-xs text-accent-danger hover:underline">Delete</button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border rounded-[12px] shadow-xl w-full max-w-[440px] p-6">
            <h2 className="text-[17px] font-semibold text-text-primary mb-4">
              {editing ? "Edit Cohort" : "Create Cohort"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Cohort Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Kingdom Impact Work 2025"
                  className="w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">End Date *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary"
                    required
                  />
                </div>
              </div>
              {error && <p className="text-sm text-accent-danger">{error}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg">
                  Cancel
                </button>
                <Button type="submit" size="sm" loading={loading}>
                  {editing ? "Save Changes" : "Create Cohort"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
