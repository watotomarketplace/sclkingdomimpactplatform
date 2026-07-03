"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { DeleteUserButton } from "@/components/super-admin/delete-user-button";
import { UserFormModal } from "@/components/super-admin/user-form-modal";
import { Plus, Pencil, Eye, Search } from "lucide-react";

type Role = "SUPER_ADMIN" | "PROGRAM_ADMIN" | "FACILITATOR" | "GROUP_LEADER" | "PARTICIPANT";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  emailVerified: Date | string | null;
  createdAt: Date | string;
}

interface GroupedUsers {
  role: Role;
  label: string;
  users: UserRow[];
}

interface AllUsersClientProps {
  grouped: GroupedUsers[];
  totalCount: number;
}

export function AllUsersClient({ grouped, totalCount }: AllUsersClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return grouped;
    return grouped.map((g) => ({
      ...g,
      users: g.users.filter(
        (u) =>
          (u.name ?? "").toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          g.label.toLowerCase().includes(q)
      ),
    }));
  }, [grouped, query]);

  const matchCount = filteredGroups.reduce((n, g) => n + g.users.length, 0);

  const openCreate = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEdit = (user: UserRow) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="px-6 py-6 max-w-[900px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-[28px] font-semibold text-text-primary">All Users</h1>
          <p className="text-text-secondary text-sm mt-1">
            {query.trim() ? `${matchCount} of ${totalCount} accounts` : `${totalCount} total accounts`}
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users by name, email, or role…"
          className="w-full pl-10 pr-3 h-10 bg-bg-base border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary"
        />
      </div>

      {query.trim() && matchCount === 0 && (
        <Card className="py-8 text-center">
          <p className="text-text-secondary text-sm">No users match “{query}”.</p>
        </Card>
      )}

      {/* Role groups */}
      {filteredGroups.map(({ role, label, users: roleUsers }) => {
        if (roleUsers.length === 0) return null;
        return (
          <div key={role} className="mb-6">
            <p className="section-label mb-3">{label.toUpperCase()}S ({roleUsers.length})</p>
            <Card padding="none">
              <div className="px-5 py-3 border-b border-border grid grid-cols-12 gap-3">
                <span className="section-label col-span-3">NAME</span>
                <span className="section-label col-span-3">EMAIL</span>
                <span className="section-label col-span-2">STATUS</span>
                <span className="section-label col-span-2">JOINED</span>
                <span className="section-label col-span-2">ACTIONS</span>
              </div>
              {roleUsers.map((u) => (
                <div
                  key={u.id}
                  className="px-5 py-3 border-b border-border last:border-0 grid grid-cols-12 gap-3 items-center hover:bg-bg-base transition-colors"
                >
                  <p className="text-[14px] font-medium text-text-primary col-span-3 truncate">{u.name}</p>
                  <p className="text-sm text-text-secondary col-span-3 truncate">{u.email}</p>
                  <div className="col-span-2">
                    <Badge
                      variant={
                        !u.isActive ? "locked" : !u.emailVerified ? "pending" : "on-track"
                      }
                    >
                      {!u.isActive ? "Suspended" : !u.emailVerified ? "Unverified" : "Active"}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary col-span-2">{formatDate(new Date(u.createdAt))}</p>
                  <div className="col-span-2 flex items-center gap-2">
                    <button
                      onClick={() => openEdit(u)}
                      className="text-accent-primary hover:opacity-70 transition-opacity"
                      title="Edit account"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {(u.role === "PARTICIPANT" || u.role === "GROUP_LEADER") && (
                      <Link
                        href={`/facilitator/participants/${u.id}`}
                        className="text-text-secondary hover:text-text-primary transition-colors"
                        title="View submissions"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    {u.role !== "SUPER_ADMIN" && (
                      <DeleteUserButton userId={u.id} userName={u.name} userRole={u.role} />
                    )}
                  </div>
                </div>
              ))}
            </Card>
          </div>
        );
      })}

      {/* Create / Edit modal — keyed by user so fields reset to the selected account */}
      <UserFormModal
        key={editingUser?.id ?? "create"}
        open={modalOpen}
        mode={editingUser ? "edit" : "create"}
        user={editingUser ?? undefined}
        onClose={closeModal}
      />
    </div>
  );
}
