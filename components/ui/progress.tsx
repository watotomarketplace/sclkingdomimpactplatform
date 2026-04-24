import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function ProgressBar({ value, max = 100, className, showLabel = false, size = "md" }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("flex-1 bg-border rounded-full overflow-hidden", size === "sm" ? "h-1.5" : "h-[6px]")}>
        <div
          className="h-full bg-accent-primary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-text-secondary font-mono w-9 text-right">{pct}%</span>
      )}
    </div>
  );
}

interface JourneyProgressProps {
  currentMonth: number;
  completedMonths: number[];
}

const MONTHS = [
  { num: 1, label: "Discovery" },
  { num: 2, label: "MVP" },
  { num: 3, label: "Prototype" },
  { num: 4, label: "Pilot" },
  { num: 5, label: "Launch" },
  { num: 6, label: "Impact" },
];

export function JourneyProgress({ currentMonth, completedMonths }: JourneyProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-0">
        {MONTHS.map((m, idx) => {
          const isCompleted = completedMonths.includes(m.num);
          const isCurrent = m.num === currentMonth;
          const isLocked = m.num > currentMonth && !isCompleted;

          return (
            <div key={m.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                    isCompleted && "bg-accent-primary text-white",
                    isCurrent && "bg-accent-gold text-white ring-2 ring-accent-gold ring-offset-2",
                    isLocked && "bg-border text-text-secondary"
                  )}
                >
                  {isCompleted ? "✓" : m.num}
                </div>
                <span className={cn(
                  "text-[10px] font-medium text-center leading-tight",
                  isCurrent && "text-accent-gold",
                  isCompleted && "text-accent-primary",
                  isLocked && "text-text-secondary"
                )}>
                  {m.label}
                </span>
              </div>
              {idx < MONTHS.length - 1 && (
                <div className={cn(
                  "h-0.5 w-full -mt-5 mx-1",
                  completedMonths.includes(m.num) ? "bg-accent-primary" : "bg-border"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
