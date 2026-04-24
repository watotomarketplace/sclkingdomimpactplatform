"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ResendInviteButtonProps {
  invitationId: string;
}

export function ResendInviteButton({ invitationId }: ResendInviteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to resend invitation.");
        return;
      }
      setSent(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return <span className="text-xs text-accent-primary font-medium">Sent ✓</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleResend}
        disabled={loading}
        className="text-xs text-accent-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Sending…" : "Resend"}
      </button>
      {error && <p className="text-[11px] text-accent-danger">{error}</p>}
    </div>
  );
}
