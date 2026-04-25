"use client";

import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceToggleProps {
  participantId: string;
  initialConfirmed: boolean;
}

export function AttendanceToggle({ participantId, initialConfirmed }: AttendanceToggleProps) {
  const [confirmed, setConfirmed] = useState(initialConfirmed);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, confirmed: !confirmed }),
      });
      if (res.ok) {
        setConfirmed((v) => !v);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1.5 rounded-lg border transition-all",
        confirmed
          ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
          : "text-text-secondary bg-bg-base border-border hover:border-border-strong",
        loading && "opacity-50 cursor-not-allowed"
      )}
      title={confirmed ? "M0 attendance confirmed — click to undo" : "Mark M0 attendance confirmed"}
    >
      {confirmed ? (
        <CheckCircle2 size={13} className="shrink-0" />
      ) : (
        <Circle size={13} className="shrink-0" />
      )}
      M0 {confirmed ? "Attended" : "Attendance"}
    </button>
  );
}
