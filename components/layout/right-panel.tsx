"use client";

import { X, Clock, AlertCircle, MessageSquare, BookOpen, ClipboardList, CalendarDays } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardLabel } from "@/components/ui/card";

export interface Widget {
  id: string;
  type: "gate-deadline" | "coaching-note" | "pod-meeting" | "journal-prompt" | "onboarding" | "readiness-assessment" | "monthly-rhythm";
  title: string;
  content: string;
  action?: { label: string; href: string };
  /** Used by monthly-rhythm widget — structured week-by-week activities */
  rhythm?: { week: string; focus: string }[];
}

interface RightPanelProps {
  widgets: Widget[];
}

const widgetIcons = {
  "gate-deadline": Clock,
  "coaching-note": MessageSquare,
  "pod-meeting": AlertCircle,
  "journal-prompt": BookOpen,
  "onboarding": AlertCircle,
  "readiness-assessment": ClipboardList,
  "monthly-rhythm": CalendarDays,
};

const widgetLabels: Record<Widget["type"], string> = {
  "gate-deadline": "UPCOMING GATE",
  "coaching-note": "FACILITATOR NOTE",
  "pod-meeting": "POD MEETING",
  "journal-prompt": "JOURNAL PROMPT",
  "onboarding": "GETTING STARTED",
  "readiness-assessment": "READINESS ASSESSMENT",
  "monthly-rhythm": "MONTHLY RHYTHM",
};

function MonthlyRhythmWidget({ widget, onDismiss }: { widget: Widget; onDismiss: () => void }) {
  return (
    <Card padding="sm" className="relative">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-text-secondary hover:text-text-primary"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
      <CardLabel className="flex items-center gap-1.5">
        <CalendarDays size={11} />
        {widgetLabels["monthly-rhythm"]}
      </CardLabel>
      <p className="text-[13px] text-text-primary leading-snug mb-3">{widget.content}</p>

      {widget.rhythm && widget.rhythm.length > 0 && (
        <div className="space-y-2">
          {widget.rhythm.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider w-10 shrink-0 pt-0.5">
                {item.week}
              </span>
              <p className="text-[12px] text-text-primary leading-snug flex-1">{item.focus}</p>
            </div>
          ))}
        </div>
      )}

      {widget.action && (
        <a
          href={widget.action.href}
          className="mt-3 text-[12px] font-medium text-accent-primary hover:underline block"
        >
          {widget.action.label} →
        </a>
      )}
    </Card>
  );
}

export function RightPanel({ widgets }: RightPanelProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visible = widgets.filter((w) => !dismissed.includes(w.id));

  if (visible.length === 0) return null;

  return (
    <aside className="hidden lg:block w-[280px] shrink-0 px-4 py-5 overflow-y-auto space-y-3 border-l border-border bg-bg-base">
      {visible.map((widget) => {
        const dismiss = () => setDismissed((d) => [...d, widget.id]);

        if (widget.type === "monthly-rhythm") {
          return <MonthlyRhythmWidget key={widget.id} widget={widget} onDismiss={dismiss} />;
        }

        const Icon = widgetIcons[widget.type];
        return (
          <Card key={widget.id} padding="sm" className="relative">
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 text-text-secondary hover:text-text-primary"
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
            <CardLabel className="flex items-center gap-1.5">
              <Icon size={11} />
              {widgetLabels[widget.type]}
            </CardLabel>
            <p className="text-[13px] text-text-primary leading-snug">{widget.content}</p>
            {widget.action && (
              <a
                href={widget.action.href}
                className="mt-2 text-[12px] font-medium text-accent-primary hover:underline block"
              >
                {widget.action.label} →
              </a>
            )}
          </Card>
        );
      })}
    </aside>
  );
}
