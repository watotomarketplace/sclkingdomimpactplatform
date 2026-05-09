"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Slide definitions ────────────────────────────────────────────────────────

const SLIDES = [
  {
    image: "/images/big-sur.jpg",
    tag: "KINGDOM IMPACT WORK",
    headline: (name: string) => `Welcome, ${name}.`,
    body: "You're about to begin a six-month journey to identify a real problem, build a real solution, and launch something that matters — rooted in Kingdom values and grounded in evidence.",
    detail: null,
    cta: "Begin →",
  },
  {
    image: "/images/sequoia.jpg",
    tag: "YOUR 6-MONTH PATH",
    headline: () => "Six months.\nOne real output.",
    body: "Every month builds on the last. You move through a defined venture flow — from pain point discovery all the way to a launched solution.",
    detail: [
      { label: "Month 1", value: "Pain Point to Concept" },
      { label: "Month 2", value: "MVP Design" },
      { label: "Month 3", value: "Prototype & Test" },
      { label: "Month 4", value: "Pilot" },
      { label: "Month 5", value: "Launch" },
      { label: "Month 6", value: "Impact Review" },
    ],
    cta: "Next →",
  },
  {
    image: "/images/sonoma.jpg",
    tag: "EACH MONTH",
    headline: () => "Accountability.\nCoaching. Delivery.",
    body: "Every month follows the same three-week rhythm so you always know what week you're in and what's expected.",
    detail: [
      { label: "Week 1", value: "Group Accountability — report, reflect, pray" },
      { label: "Week 2", value: "Coaching Session — 1-on-1 with your facilitator" },
      { label: "Week 3", value: "Submission & Prayer — deliver and celebrate" },
    ],
    cta: "Next →",
  },
  {
    image: "/images/sunset-clouds.jpg",
    tag: "BEFORE YOU BEGIN",
    headline: () => "Your first step\nis a covenant.",
    body: "The covenant you sign is not a formality. It defines the posture you're committing to for the next six months — honesty, faithfulness, and rigour.",
    detail: null,
    quote: "The goal is not a business plan.\nThe goal is formation.",
    cta: "Read the Covenant →",
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function WelcomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && session?.user?.covenantSigned) router.replace("/participant");
  }, [status, session, router]);

  if (status === "loading" || status === "unauthenticated") return null;

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  const goTo = (next: number) => {
    if (animating) return;
    if (next < 0 || next >= SLIDES.length) return;
    setAnimating(true);
    setTimeout(() => {
      setSlide(next);
      setAnimating(false);
    }, 200);
  };

  const handleCta = () => {
    if (isLast) {
      router.push("/covenant");
    } else {
      goTo(slide + 1);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">

      {/* ── Background images (preloaded, cross-fade) ── */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === slide && !animating ? 1 : 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      ))}

      {/* ── Gradient overlays ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />

      {/* ── Content layer ── */}
      <div className="relative z-10 h-full flex flex-col">

        {/* Logo top-left */}
        <div className="flex items-center gap-2.5 px-6 pt-8 md:px-12 md:pt-10">
          <div className="w-7 h-7 bg-bg-base rounded-lg flex items-center justify-center border border-border">
            <span className="text-text-primary text-xs font-bold font-display">S</span>
          </div>
          <span className="text-text-primary text-[13px] font-semibold tracking-tight">SCL Platform</span>
        </div>

        {/* Main text — sits above bottom controls */}
        <div
          className={cn(
            "flex-1 flex flex-col justify-end px-6 pb-32 md:px-14 md:pb-36 max-w-2xl transition-all duration-300",
            animating ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
          )}
        >
          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-bg-base border border-border rounded-full px-3 py-1 mb-5 w-fit">
            <span className="text-accent-gold text-[10px]">✦</span>
            <span className="text-text-secondary text-[10px] font-semibold uppercase tracking-widest">{current.tag}</span>
          </div>

          {/* Headline — newlines render as line breaks */}
          <h1 className="font-display text-[36px] md:text-[52px] font-semibold text-text-primary leading-[1.1] mb-4 whitespace-pre-line">
            {current.headline(firstName)}
          </h1>

          {/* Body */}
          <p className="text-text-secondary text-[15px] md:text-[16px] leading-relaxed mb-6 max-w-lg">
            {current.body}
          </p>

          {/* Detail list (months or weeks) */}
          {"detail" in current && current.detail && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 mb-6">
              {current.detail.map((item) => (
                <div key={item.label} className="flex items-baseline gap-2.5">
                  <span className="text-[11px] font-mono text-[#A3A3A3] w-14 shrink-0">{item.label}</span>
                  <span className="text-[13px] text-text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quote (last slide) */}
          {"quote" in current && current.quote && (
            <div className="border-l-2 border-accent-gold pl-4 mb-6">
              <p className="font-display text-[17px] text-text-primary italic leading-snug whitespace-pre-line">
                &ldquo;{current.quote}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* ── Bottom controls ── */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 pb-8 md:px-14 md:pb-10">

          {/* Back button */}
          <button
            onClick={() => goTo(slide - 1)}
            className={cn(
              "flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors text-[13px] font-medium min-w-[80px]",
              slide === 0 && "invisible"
            )}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === slide
                    ? "w-6 h-2 bg-white"
                    : "w-2 h-2 bg-bg-base hover:bg-bg-base"
                )}
              />
            ))}
          </div>

          {/* CTA / Next */}
          <button
            onClick={handleCta}
            className={cn(
              "flex items-center gap-1.5 font-medium text-[14px] px-5 py-2.5 rounded-lg transition-all min-w-[140px] justify-center",
              isLast
                ? "bg-white text-[#0A0A0A] hover:bg-bg-base"
                : "text-text-primary bg-bg-base hover:bg-bg-base border border-border"
            )}
          >
            {current.cta}
            {!isLast && <ChevronRight size={15} />}
          </button>
        </div>

        {/* Swipe hint on mobile — only slide 0 */}
        {slide === 0 && (
          <div className="absolute bottom-24 left-0 right-0 flex justify-center md:hidden pointer-events-none">
            <p className="text-[#A3A3A3] text-[11px] tracking-wider uppercase">Tap next to continue</p>
          </div>
        )}
      </div>
    </div>
  );
}
