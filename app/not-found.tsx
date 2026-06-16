import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[rgba(200,151,58,0.1)] border border-[rgba(200,151,58,0.25)] mb-6">
          <Compass size={28} className="text-accent-gold" />
        </div>

        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-text-secondary mb-3">
          404 — Page not found
        </p>
        <h1 className="font-display text-[26px] font-semibold text-text-primary mb-3">
          This page doesn&apos;t exist
        </h1>
        <p className="text-text-secondary text-sm mb-8 max-w-[300px] mx-auto leading-relaxed">
          The page you&apos;re looking for may have been moved or doesn&apos;t exist.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1a1a1a] transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
