"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type Role = "SUPER_ADMIN" | "PROGRAM_ADMIN" | "FACILITATOR" | "GROUP_LEADER" | "PARTICIPANT";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "PROGRAM_ADMIN", label: "Program Admin" },
  { value: "FACILITATOR", label: "Facilitator" },
  { value: "GROUP_LEADER", label: "Group Leader" },
  { value: "PARTICIPANT", label: "Participant" },
];

interface UserFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
  };
  onClose: () => void;
}

export function UserFormModal({ open, mode, user, onClose }: UserFormModalProps) {
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "PARTICIPANT");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isCreate = mode === "create";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isCreate || password) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (isCreate && password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = { name, email, role };
      if (password) payload.password = password;

      const res = await fetch(
        isCreate ? "/api/users" : `/api/users/${user!.id}`,
        {
          method: isCreate ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }

      router.refresh();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="p-6 w-full max-w-md">
        <h2 className="font-display text-xl font-semibold text-text-primary mb-5">
          {isCreate ? "Create Account" : "Edit Account"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Jane Doe"
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-bg-card text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="jane@example.com"
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-bg-card text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-text-secondary">
                {isCreate ? "Password" : "New Password"}
                {!isCreate && (
                  <span className="ml-1 font-normal text-text-secondary/60">(leave blank to keep current)</span>
                )}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-accent-primary hover:underline"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={isCreate}
              placeholder={isCreate ? "Min. 8 characters" : ""}
              minLength={isCreate ? 8 : undefined}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-bg-card text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
            />
          </div>

          {/* Confirm Password — show if creating or if a new password is being set */}
          {(isCreate || password) && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={isCreate || !!password}
                placeholder="Re-enter password"
                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-bg-card text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-accent-danger">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (isCreate ? "Creating…" : "Saving…") : (isCreate ? "Create Account" : "Save Changes")}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
