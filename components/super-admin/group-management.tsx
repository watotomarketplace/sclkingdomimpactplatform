"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, X, Search, Plus, UserCheck } from "lucide-react";

interface Member {
  id: string;
  name: string | null;
  email: string;
  isLeader: boolean;
}

interface Group {
  id: string;
  name: string;
  facilitatorName: string | null;
  members: Member[];
}

interface Unassigned {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface FacilitatorOption {
  id: string;
  name: string | null;
}

interface GroupManagementProps {
  groups: Group[];
  unassigned: Unassigned[];
  facilitators: FacilitatorOption[];
}

export function GroupManagement({ groups, unassigned, facilitators }: GroupManagementProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [targetGroupId, setTargetGroupId] = useState(groups[0]?.id ?? "");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Create-group modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFacilitator, setNewFacilitator] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return unassigned;
    return unassigned.filter(
      (u) => (u.name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [unassigned, search]);

  const assign = async (userId: string) => {
    if (!targetGroupId) {
      setError("Create a group first, then assign participants to it.");
      return;
    }
    setBusyId(userId);
    setError("");
    try {
      const res = await fetch(`/api/pods/${targetGroupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Could not assign participant.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (groupId: string, userId: string) => {
    setBusyId(userId);
    setError("");
    try {
      const res = await fetch(`/api/pods/${groupId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Could not remove participant.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/pods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), facilitatorId: newFacilitator || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Could not create group.");
        return;
      }
      setShowCreate(false);
      setNewName("");
      setNewFacilitator("");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const totalMembers = groups.reduce((n, g) => n + g.members.length, 0);

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[820px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-bg-base border border-border flex items-center justify-center shrink-0">
            <UserCheck size={22} className="text-text-secondary" />
          </div>
          <div>
            <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary">
              Groups &amp; Assignment
            </h1>
            <p className="text-text-secondary text-[13px] mt-1">
              {groups.length} group{groups.length !== 1 ? "s" : ""} · {totalMembers} assigned · {unassigned.length} unassigned
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => { setShowCreate(true); setError(""); }}>
          <Plus className="w-4 h-4 mr-1.5" />
          Create Group
        </Button>
      </div>

      {error && (
        <div className="callout-warning mb-4">
          <p className="text-[13px] font-medium">{error}</p>
        </div>
      )}

      {/* Unassigned participants */}
      <div className="glass-2 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Users size={14} className="text-[#FCA5A5]" />
          <span className="text-[13px] font-semibold text-text-primary">
            Unassigned Participants ({unassigned.length})
          </span>
        </div>

        {unassigned.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-[#A3A3A3] text-center">
            Everyone is assigned to a group. 🎉
          </p>
        ) : (
          <>
            {/* Controls */}
            <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search participants by name or email…"
                  className="input-on-glass w-full pl-9 pr-3 h-9 text-[13px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#A3A3A3] whitespace-nowrap">Assign to:</span>
                <select
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                  className="input-on-glass h-9 text-[13px] px-2 max-w-[180px]"
                >
                  {groups.length === 0 && <option value="">No groups yet</option>}
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="divide-y divide-white/[0.05] max-h-[380px] overflow-y-auto">
              {filtered.map((u) => (
                <div key={u.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-text-primary truncate">{u.name ?? u.email}</p>
                    <p className="text-[11px] text-[#A3A3A3] truncate">{u.email}</p>
                  </div>
                  <button
                    onClick={() => assign(u.id)}
                    disabled={busyId === u.id || groups.length === 0}
                    className="flex items-center gap-1.5 text-[12px] text-[#C8973A] hover:text-[#FCD34D] transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <UserPlus size={13} />
                    {busyId === u.id ? "Assigning…" : "Assign"}
                  </button>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="px-4 py-6 text-[13px] text-[#A3A3A3] text-center">No matches for “{search}”.</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Groups */}
      <p className="section-label mb-3">ALL GROUPS</p>
      {groups.length === 0 ? (
        <div className="glass-2 p-8 text-center">
          <Users size={28} className="text-[#A3A3A3] mx-auto mb-3" />
          <p className="text-text-secondary text-[14px]">No groups yet. Create the first group above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.id} className="glass-2 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
                <div>
                  <span className="text-[13px] font-semibold text-text-primary">{g.name}</span>
                  <span className="text-[11px] text-[#A3A3A3] ml-2">
                    Facilitator: {g.facilitatorName ?? "Unassigned"}
                  </span>
                </div>
                <span className="text-[11px] text-[#A3A3A3] shrink-0">{g.members.length} members</span>
              </div>
              {g.members.length > 0 ? (
                <div className="px-4 py-3 flex flex-wrap gap-2">
                  {g.members.map((m) => (
                    <span
                      key={m.id}
                      className="group/chip flex items-center gap-1.5 text-[12px] pl-2.5 pr-1.5 py-1 rounded-full bg-bg-base border border-border text-text-secondary"
                    >
                      {m.name ?? m.email}
                      <button
                        onClick={() => remove(g.id, m.id)}
                        disabled={busyId === m.id}
                        className="text-[#A3A3A3] hover:text-[#FCA5A5] transition-colors disabled:opacity-40"
                        title="Remove from group"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-3 text-[13px] text-[#A3A3A3]">
                  No members yet. Assign participants from the list above.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create group modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border rounded-[12px] shadow-xl w-full max-w-[420px] p-6">
            <h2 className="text-[17px] font-semibold text-text-primary mb-4">Create Group</h2>
            <form onSubmit={createGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Group Name *</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Tuesday Group A"
                  className="input-on-glass w-full px-3 h-10 text-sm"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Facilitator (optional)</label>
                <select
                  value={newFacilitator}
                  onChange={(e) => setNewFacilitator(e.target.value)}
                  className="input-on-glass w-full px-3 h-10 text-sm"
                >
                  <option value="">Unassigned</option>
                  {facilitators.map((f) => (
                    <option key={f.id} value={f.id}>{f.name ?? "Unnamed"}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg"
                >
                  Cancel
                </button>
                <Button type="submit" size="sm" loading={creating}>Create Group</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
