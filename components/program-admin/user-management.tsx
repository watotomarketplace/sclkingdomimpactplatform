"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MONTH_TITLES } from "@/lib/utils";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  podMembership: { pod: { id: string; name: string } } | null;
  participantProfile: {
    currentMonth: number;
    cohort?: { name: string } | null;
  } | null;
}

interface UserManagementProps {
  users: UserRow[];
  pods: Array<{ id: string; name: string }>;
}

export function UserManagement({ users, pods: _pods }: UserManagementProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const toggleActive = async (userId: string, currentlyActive: boolean) => {
    if (
      !confirm(
        `${currentlyActive ? "Suspend" : "Reactivate"} this user?`
      )
    )
      return;
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentlyActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "An error occurred.");
        return;
      }
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary w-[240px]"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary"
        >
          <option value="">All roles</option>
          <option value="PARTICIPANT">Participants</option>
          <option value="FACILITATOR">Facilitators</option>
        </select>
        <span className="text-sm text-text-secondary">
          {filtered.length} user{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="px-5 py-3 border-b border-border grid grid-cols-12 gap-3">
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-3">
            NAME
          </span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-3">
            EMAIL
          </span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-2">
            ROLE
          </span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-2">
            POD
          </span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-1">
            STATUS
          </span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-1">
            ACTIONS
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-text-secondary text-sm">No users found.</p>
          </div>
        ) : (
          filtered.map((user) => (
            <div
              key={user.id}
              className="px-5 py-3 border-b border-border last:border-0 grid grid-cols-12 gap-3 items-center"
            >
              <div className="col-span-3">
                <p className="text-[14px] font-medium text-text-primary">
                  {user.name}
                </p>
                {user.role === "PARTICIPANT" && user.participantProfile && (
                  <p className="text-xs text-text-secondary">
                    Month {user.participantProfile.currentMonth} ·{" "}
                    {MONTH_TITLES[user.participantProfile.currentMonth]}
                  </p>
                )}
              </div>
              <p className="text-sm text-text-secondary col-span-3 truncate">
                {user.email}
              </p>
              <div className="col-span-2">
                <Badge variant="pending">
                  {user.role.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-sm text-text-secondary col-span-2">
                {user.podMembership?.pod.name ?? "—"}
              </p>
              <div className="col-span-1">
                <Badge variant={user.isActive ? "on-track" : "escalate"}>
                  {user.isActive ? "Active" : "Suspended"}
                </Badge>
              </div>
              <div className="col-span-1">
                <button
                  onClick={() => toggleActive(user.id, user.isActive)}
                  disabled={loadingId === user.id}
                  className={`text-xs hover:underline ${
                    user.isActive
                      ? "text-accent-danger"
                      : "text-accent-primary"
                  } disabled:opacity-50`}
                >
                  {loadingId === user.id
                    ? "…"
                    : user.isActive
                    ? "Suspend"
                    : "Reactivate"}
                </button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
