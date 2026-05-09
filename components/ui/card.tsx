import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  /** Glass tier — 2 = default content card, 3 = elevated (modal-like) */
  tier?: 2 | 3;
  /** Whether to lift on hover (default true for tier 2) */
  hoverable?: boolean;
}

/**
 * Addendum 3: Glass card. Replaces the v3.0 flat white card.
 * - Tier 2 = standard content card (default)
 * - Tier 3 = elevated surface (modals, dropdowns)
 */
export function Card({
  className,
  padding = "md",
  tier = 2,
  hoverable = false,
  children,
  ...props
}: CardProps) {
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  const tierClass = tier === 3 ? "glass-3" : "glass-2";
  const hoverClass = hoverable ? "glass-2-hover cursor-pointer" : "";

  return (
    <div
      className={cn(tierClass, hoverClass, paddingStyles[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-[15px] font-semibold text-text-on-glass", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardLabel({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("section-label mb-3", className)} {...props}>
      {children}
    </p>
  );
}
