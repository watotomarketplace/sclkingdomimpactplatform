"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "gold";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

/**
 * Addendum 3 — Glass-aware buttons.
 * Primary uses accent-primary. Secondary is glass-tier-2. Gold is the highlight CTA.
 */
const variantStyles: Record<Variant, string> = {
  primary:
    "btn-primary-glass disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "btn-glass-secondary disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-text-on-glass-secondary hover:text-text-on-glass hover:bg-white/[0.06] border border-transparent disabled:opacity-50 disabled:cursor-not-allowed rounded-xl",
  destructive:
    "bg-[rgba(220,38,38,0.85)] text-white border border-[rgba(220,38,38,0.95)] hover:brightness-110 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl",
  gold:
    "btn-gold disabled:opacity-50 disabled:cursor-not-allowed",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3.5 text-xs tracking-wide",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "btn-base inline-flex items-center justify-center gap-2 font-medium",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
