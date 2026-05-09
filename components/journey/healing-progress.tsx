"use client";

import { HEALING_STAGES, MILESTONE_TO_STAGE, type HealingStageKey } from "@/lib/milestones";
import { MilestoneType } from "@/app/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { Eye, Search, Lightbulb, Hammer, Sparkles, Check } from "lucide-react";

const STAGE_ICONS: Record<HealingStageKey, React.ElementType> = {
  SEE: Eye,
  UNDERSTAND: Search,
  ENVISION: Lightbulb,
  BUILD: Hammer,
  LAUNCH: Sparkles,
};

interface HealingProgressProps {
  /** Submitted milestones (used to determine completed stages) */
  submittedMilestones: MilestoneType[];
  /** The participant's currently-active milestone */
  currentMilestone?: MilestoneType;
}

/**
 * Addendum 3 §2.1 — 5-Stage Healing Framework progress bar.
 * SEE → UNDERSTAND → ENVISION → BUILD → LAUNCH & MEASURE
 */
export function HealingProgress({ submittedMilestones, currentMilestone }: HealingProgressProps) {
  const submittedSet = new Set(submittedMilestones);

  // A stage is "complete" when ALL its mapped milestones have been submitted
  const stageStatus = (stageKey: HealingStageKey): "complete" | "current" | "upcoming" => {
    const milestonesInStage = (Object.entries(MILESTONE_TO_STAGE) as [MilestoneType, HealingStageKey][])
      .filter(([, s]) => s === stageKey)
      .map(([m]) => m);

    const allComplete = milestonesInStage.every((m) => submittedSet.has(m));
    if (allComplete && milestonesInStage.length > 0) return "complete";
    if (currentMilestone && MILESTONE_TO_STAGE[currentMilestone] === stageKey) return "current";
    return "upcoming";
  };

  return (
    <div className="glass-2 p-5 md:p-6">
      <p className="section-label mb-4">5-STAGE HEALING JOURNEY</p>

      <div className="relative">
        {/* Track */}
        <div
          className="absolute top-5 left-5 right-5 h-0.5 bg-bg-base hidden md:block"
          aria-hidden
        />

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-2 relative">
          {HEALING_STAGES.map((stage) => {
            const status = stageStatus(stage.key);
            const Icon = STAGE_ICONS[stage.key];

            return (
              <div
                key={stage.key}
                className="flex md:flex-col items-center md:items-center md:flex-1 gap-3 md:gap-2 md:text-center"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all relative z-10",
                    status === "complete" && "bg-[rgba(45,90,61,0.6)] border border-[rgba(134,239,172,0.5)] text-[#86EFAC]",
                    status === "current" && "bg-[rgba(200,151,58,0.25)] border border-[#C8973A] text-[#FCD34D] pulse-gold",
                    status === "upcoming" && "bg-bg-base border border-border text-[#A3A3A3]"
                  )}
                >
                  {status === "complete" ? <Check size={16} /> : <Icon size={16} />}
                </div>

                <div className="md:mt-2 flex-1">
                  <p
                    className={cn(
                      "text-[12px] font-semibold uppercase tracking-wider",
                      status === "current" ? "text-[#FCD34D]" : "text-text-primary"
                    )}
                  >
                    {stage.name}
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-snug hidden md:block">
                    {stage.question}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
