"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PodData {
  id: string;
  name: string;
  cohortId: string;
  facilitatorId: string | null;
  cohort: { id: string; name: string };
  facilitator: { id: string; name: string } | null;
  members: Array<{ userId: string; user: { id: string; name: string } }>;
}

interface FacilitatorOption {
  id: string;
  name: string;
}

interface CohortOption {
  id: string;
  name: string;
}

interface PodManagementProps {
  pods: PodData[];
  facilitators: FacilitatorOption[];
  cohorts: CohortOption[];
}

export function PodManagement({
  pods: initialPods,
  facilitators,
  cohorts,
}: PodManagementProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingPod, setEditingPod] = useState<PodData | null>(null);
  const [form, setForm] = useState({
    name: "",
    cohortId: "",
    facilitatorId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openCreate = () => {
    setEditingPod(null);
    setForm({ name: "", cohortId: cohorts[0]?.id ?? "", facilitatorId: "" });
    setError("");
    setShowModal(true);
  };

  const openEdit = (pod: PodData) => {
    setEditingPod(pod);
    setForm({
      name: pod.name,
      cohortId: pod.cohortId,
      facilitatorId: pod.facilitatorId ?? "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.cohortId) {
      setError("Pod name and cohort are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const url = editingPod ? `/api/pods/${editingPod.id}` : "/api/pods";
      const method = editingPod ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          cohortId: form.cohortId,
          facilitatorId: form.facilitatorId || null,
        }),
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

  const handleDelete = async (podId: string, podName: string) => {
    if (
      !confirm(
        `Delete "${podName}"? This cannot be undone. Pods with members cannot be deleted.`
      )
    )
      return;
    const res = await fetch(`/api/pods/${podId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Could not delete pod.");
      return;
    }
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[28px] font-semibold text-text-primary">
            Pods
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {initialPods.length} pod{initialPods.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          Create Pod
        </Button>
      </div>

      {cohorts.length === 0 && (
        <Card className="py-8 text-center mb-6">
          <p className="text-text-secondary text-sm">
            No cohorts exist yet. Create a cohort first before adding pods.
          </p>
        </Card>
      )}

      {initialPods.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-text-secondary text-sm">
            No pods yet. Create the first pod above.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {initialPods.map((pod) => (
            <Card key={pod.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-text-primary">
                    {pod.name}
                  </p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {pod.cohort.name} · Facilitator:{" "}
                    {pod.facilitator?.name ?? "Unassigned"}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {pod.members.length} member
                    {pod.members.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(pod)}
                    className="text-xs text-accent-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pod.id, pod.name)}
                    className="text-xs text-accent-danger hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {pod.members.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex flex-wrap gap-1.5">
                    {pod.members.map((m) => (
                      <span
                        key={m.userId}
                        className="text-xs bg-bg-base border border-border rounded-md px-2 py-0.5 text-text-secondary"
                      >
                        {m.user.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border rounded-[12px] shadow-xl w-full max-w-[440px] p-6">
            <h2 className="text-[17px] font-semibold text-text-primary mb-4">
              {editingPod ? "Edit Pod" : "Create Pod"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Pod Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Cohort 1 Pod A"
                  className="w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Cohort *
                </label>
                <select
                  value={form.cohortId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cohortId: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary"
                  required
                >
                  <option value="">Select cohort...</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Facilitator
                </label>
                <select
                  value={form.facilitatorId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, facilitatorId: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary"
                >
                  <option value="">Unassigned</option>
                  {facilitators.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {error && <p className="text-sm text-accent-danger">{error}</p>}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg"
                >
                  Cancel
                </button>
                <Button type="submit" size="sm" loading={loading}>
                  {editingPod ? "Save Changes" : "Create Pod"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
