"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

const COVENANT_TEXT = `I commit to showing up — to every session, every conversation, and every assignment — with my whole self. I will do the work even when it is hard. I will tell the truth about what I observe, what I believe, and where I am struggling. I will not perform progress I have not actually made. I will honour my group by engaging with their ideas honestly. I will not compete with my teammates — I will learn alongside them. I understand that the Kingdom requires both faithfulness and rigour, and I commit to both. I enter this journey knowing that the goal is not a business plan. The goal is formation — that I would become someone who can identify a real problem, serve a real community, and steward a real solution with integrity before God and people.`;

export default function CovenantPage() {
  const { update } = useSession();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleSign = async () => {
    if (!agreed || submitting) return;
    setSubmitting(true);
    setServerError("");
    try {
      const res = await fetch("/api/covenant/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setServerError(body.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Refresh JWT then hard-navigate so the new cookie is sent immediately
      await update({ covenantSigned: true });
      window.location.href = "/problem-sightings";
    } catch {
      setServerError("A network error occurred. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="w-full md:w-[45%] flex flex-col justify-center px-8 py-12 md:px-12 lg:px-16 bg-white overflow-y-auto">
        <div className="max-w-[420px] mx-auto w-full">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold font-display">S</span>
            </div>
            <span className="text-[15px] font-semibold text-text-primary">SCL Platform</span>
          </div>

          <p className="section-label mb-3">BEFORE YOU BEGIN</p>
          <h1 className="font-display text-[30px] font-semibold text-text-primary mb-2 leading-tight">
            Venture Covenant
          </h1>
          <p className="text-text-secondary text-sm mb-6 leading-relaxed">
            Before you enter the platform, read and sign this covenant. It defines the
            posture you are committing to for the next six months.
          </p>

          {/* Covenant text */}
          <div className="border border-border rounded-lg p-5 mb-6 bg-bg-base">
            <p className="text-[14px] text-text-primary leading-relaxed italic">{COVENANT_TEXT}</p>
          </div>

          {/* Checkbox agreement */}
          <label className="flex items-start gap-3 cursor-pointer group mb-5">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-accent-primary cursor-pointer"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="text-[13px] text-text-primary leading-snug">
              I have read and commit to this covenant.
            </span>
          </label>

          {serverError && (
            <p className="text-sm text-accent-danger bg-[rgba(184,58,42,0.08)] px-3 py-2 rounded-lg mb-4">
              {serverError}
            </p>
          )}

          <Button
            type="button"
            className="w-full"
            size="lg"
            loading={submitting}
            disabled={!agreed || submitting}
            onClick={handleSign}
          >
            Sign &amp; Begin
          </Button>
        </div>
      </div>

      {/* Right — atmospheric photo */}
      <div className="hidden md:flex md:w-[55%] flex-col justify-end p-12 relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/sonoma.jpg" alt="Rolling vineyard hills" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3.5 py-1.5">
            <span className="text-accent-gold text-xs">✦</span>
            <span className="text-white/70 text-[11px] font-medium uppercase tracking-widest">Venture Covenant</span>
          </div>
          <h2 className="font-display text-[36px] font-normal text-white leading-[1.2] mb-4">
            This is not a formality.<br />It is a foundation.
          </h2>
          <p className="text-white/55 text-sm leading-relaxed max-w-sm">
            The covenant you sign today is the foundation of everything you will build
            over the next six months.
          </p>
        </div>
      </div>
    </div>
  );
}
