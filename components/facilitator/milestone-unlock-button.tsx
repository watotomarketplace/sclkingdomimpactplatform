"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Unlock } from "lucide-react";
import { MilestoneType } from "@/app/generated/prisma/enums";
import { MILESTONE_SHORT } from "@/lib/milestones";
import { Button } from "@/components/ui/button";

export function MilestoneUnlockButton({
  participantId,
  targetMilestone,
}: {
  participantId: string;
  targetMilestone: MilestoneType;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUnlock = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/milestone-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, targetMilestone }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to unlock.");
        return;
      }
      setConfirming(false);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[12px] text-[#FCD34D]">
          Unlock {MILESTONE_SHORT[targetMilestone]}?
        </span>
        <Button size="sm" variant="gold" loading={loading} onClick={handleUnlock}>
          Confirm
        </Button>
        <button
          onClick={() => setConfirming(false)}
          className="text-[12px] text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancel
        </button>
        {error && <span className="text-[11px] text-[#FCA5A5]">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-[11px] text-[#C8973A] hover:text-[#FCD34D] transition-colors"
    >
      <Unlock size={11} />
      Force unlock {MILESTONE_SHORT[targetMilestone]}
    </button>
  );
}
