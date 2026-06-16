"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to error monitoring if available
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[rgba(220,38,38,0.08)] border border-[rgba(220,38,38,0.2)] mb-6">
          <AlertTriangle size={28} className="text-accent-danger" />
        </div>

        <h1 className="font-display text-[24px] font-semibold text-text-primary mb-2">
          Something went wrong
        </h1>
        <p className="text-text-secondary text-sm mb-6 max-w-[320px] mx-auto leading-relaxed">
          An unexpected error occurred. If this keeps happening, please contact your facilitator or support.
        </p>

        {error.digest && (
          <p className="text-[11px] text-text-secondary font-mono mb-5 bg-bg-base border border-border rounded px-3 py-1.5 inline-block">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1a1a1a] transition-colors"
          >
            <RotateCcw size={15} />
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-text-primary text-sm font-medium hover:border-border-strong transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
