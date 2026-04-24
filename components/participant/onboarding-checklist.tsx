"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { ProgressBar } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Submission {
  month: number;
  phase: string;
  status: string;
}

interface OnboardingChecklistProps {
  currentMonth: number;
  submissions: Submission[];
}

const CHECKLIST = [
  {
    id: "covenant",
    label: "Sign Venture Covenant",
    description: "Commit to the journey by signing your Venture Covenant.",
    href: "/covenant",
    autoCompleted: true,
  },
  {
    id: "phase-1a",
    label: "Complete Month 1 Phase A — Discovery",
    description: "Map your world and identify the problem you want to solve.",
    href: "/participant/journey/month-1",
    phase: "A",
    month: 1,
  },
  {
    id: "phase-1b",
    label: "Complete Month 1 Phase B — Validation",
    description: "Validate the problem with research and stakeholder analysis.",
    href: "/participant/journey/month-1",
    phase: "B",
    month: 1,
  },
  {
    id: "phase-1c",
    label: "Complete Month 1 Phase C — Ideation",
    description: "Compare solutions and build your concept note.",
    href: "/participant/journey/month-1",
    phase: "C",
    month: 1,
  },
  {
    id: "gate-1",
    label: "Submit Gate 1 for review",
    description: "Submit your Month 1 work for facilitator review.",
    href: "/participant/journey/month-1",
  },
];

export function OnboardingChecklist({ currentMonth, submissions }: OnboardingChecklistProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Show modal on first visit
  useEffect(() => {
    const dismissed = sessionStorage.getItem("checklist-dismissed");
    if (!dismissed) setOpen(true);
  }, []);

  const isCompleted = (item: typeof CHECKLIST[0]): boolean => {
    if (item.autoCompleted) return true;
    if (item.phase && item.month) {
      return submissions.some(
        (s) => s.month === item.month && s.phase === item.phase && s.status === "SUBMITTED"
      );
    }
    return false;
  };

  const completedCount = CHECKLIST.filter(isCompleted).length;
  const pct = Math.round((completedCount / CHECKLIST.length) * 100);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem("checklist-dismissed", "1");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-accent-primary text-white text-xs font-medium px-3 py-2 rounded-full shadow-lg hover:opacity-90 transition-opacity"
      >
        Getting started ({completedCount}/{CHECKLIST.length})
      </button>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Getting Started" size="md">
      <div className="mb-4">
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-text-secondary">{completedCount} of {CHECKLIST.length} completed</span>
          <span className="text-xs font-medium text-text-primary font-mono">{pct}%</span>
        </div>
        <ProgressBar value={pct} />
      </div>

      <div className="space-y-1">
        {CHECKLIST.map((item) => {
          const done = isCompleted(item);
          const isExpanded = expanded === item.id;

          return (
            <div key={item.id} className={cn("rounded-lg border transition-colors", done ? "border-[rgba(45,90,61,0.2)] bg-[rgba(45,90,61,0.03)]" : "border-border")}>
              <button
                onClick={() => setExpanded(isExpanded ? null : item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                  done ? "border-accent-primary bg-accent-primary" : "border-border"
                )}>
                  {done && <Check size={11} className="text-white" />}
                </div>
                <span className={cn("text-sm flex-1", done ? "text-text-secondary line-through" : "text-text-primary font-medium")}>
                  {item.label}
                </span>
                {isExpanded ? <ChevronDown size={14} className="text-text-secondary shrink-0" /> : <ChevronRight size={14} className="text-text-secondary shrink-0" />}
              </button>
              {isExpanded && (
                <div className="px-4 pb-3 pl-12">
                  <p className="text-xs text-text-secondary mb-2">{item.description}</p>
                  {!done && (
                    <Link href={item.href} onClick={handleClose}>
                      <Button size="sm" variant="primary" className="text-xs">Get started</Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
