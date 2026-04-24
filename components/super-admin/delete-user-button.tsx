"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
  userRole: string;
}

export function DeleteUserButton({ userId, userName, userRole }: DeleteUserButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Permanently delete "${userName}" (${userRole.replace("_", " ")})?

This will delete ALL their data including submissions, scorecards, journal entries, and coaching notes. This action CANNOT be undone.

Type the user's name to confirm, or click Cancel.`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to delete user.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-accent-danger hover:underline disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
