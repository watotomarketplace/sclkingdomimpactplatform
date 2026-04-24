import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PhaseForm } from "@/components/participant/phase-form";
import { getPhaseContent } from "@/lib/form-content";
import Link from "next/link";
import { ChevronLeft, Lock } from "lucide-react";

export default async function Month1PhaseCPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const phaseB = await db.submission.findUnique({
    where: { userId_month_phase: { userId: session.user.id, month: 1, phase: "B" } },
  });

  if (!phaseB || phaseB.status !== "SUBMITTED") {
    return (
      <div className="px-6 py-6 max-w-[780px]">
        <Link href="/participant/journey/month-1" className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm mb-6 transition-colors">
          <ChevronLeft size={16} /> Month 1 Overview
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center mb-4">
            <Lock size={20} className="text-text-secondary" />
          </div>
          <h2 className="font-display text-[22px] font-semibold text-text-primary mb-2">Phase C is locked</h2>
          <p className="text-text-secondary text-sm max-w-sm">
            Complete and submit Phase B — Validation before unlocking Phase C — Ideation.
          </p>
          <Link href="/participant/journey/month-1/phase-B" className="mt-4 text-sm text-accent-primary hover:underline">
            Go to Phase B →
          </Link>
        </div>
      </div>
    );
  }

  const content = getPhaseContent(1, "C")!;
  const submission = await db.submission.findUnique({
    where: { userId_month_phase: { userId: session.user.id, month: 1, phase: "C" } },
  });

  const formData = (submission?.formData as Record<string, string>) ?? {};
  const draftData = (submission?.draftData as Record<string, string>) ?? {};
  const initialData = submission?.status === "SUBMITTED" ? formData : { ...draftData, ...formData };

  return (
    <div className="px-6 py-6 max-w-[780px]">
      <Link href="/participant/journey/month-1" className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm mb-4 transition-colors">
        <ChevronLeft size={16} /> Month 1 Overview
      </Link>
      <div className="mb-6">
        <p className="section-label mb-1">MONTH 1 · PHASE C</p>
        <h1 className="font-display text-[28px] font-semibold text-text-primary">{content.title}</h1>
        {content.subtitle && <p className="text-text-secondary italic mt-1">{content.subtitle}</p>}
      </div>
      <PhaseForm
        month={1}
        phase="C"
        content={content}
        initialData={initialData}
        isSubmitted={submission?.status === "SUBMITTED"}
        submissionId={submission?.id}
      />
    </div>
  );
}
