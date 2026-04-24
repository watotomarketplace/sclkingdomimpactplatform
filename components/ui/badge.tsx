import { cn } from "@/lib/utils";

type BadgeVariant = "on-track" | "needs-attention" | "escalate" | "pending" | "approved" | "locked" | "submitted" | "gold";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  "on-track": "bg-[#F0F0EE] text-[#1A1A1A] border border-[#D4D4D4]",
  "needs-attention": "bg-[rgba(217,119,6,0.08)] text-accent-warning border border-[rgba(217,119,6,0.2)]",
  "escalate": "bg-[rgba(220,38,38,0.08)] text-accent-danger border border-[rgba(220,38,38,0.2)]",
  "pending": "bg-[#F5F5F5] text-text-secondary border border-border",
  "approved": "bg-[#0A0A0A] text-white",
  "locked": "bg-[#F5F5F5] text-text-secondary border border-border",
  "submitted": "bg-[#0A0A0A] text-white",
  "gold": "bg-[rgba(200,151,58,0.1)] text-accent-gold border border-[rgba(200,151,58,0.25)]",
};

export function Badge({ className, variant = "pending", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusDot({ status }: { status: "on-track" | "needs-attention" | "escalate" }) {
  const colors = {
    "on-track": "bg-accent-primary",
    "needs-attention": "bg-accent-warning",
    "escalate": "bg-accent-danger",
  };
  return <span className={cn("inline-block w-2 h-2 rounded-full shrink-0", colors[status])} />;
}
