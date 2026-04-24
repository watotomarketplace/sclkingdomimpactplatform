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

const variantStyles: Record<Variant, string> = {
  primary: "bg-[#0A0A0A] text-white hover:bg-[#262626] disabled:opacity-40",
  secondary: "bg-white border border-border text-text-primary hover:bg-bg-base disabled:opacity-40",
  ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-base disabled:opacity-40",
  destructive: "bg-accent-danger text-white hover:opacity-90 disabled:opacity-40",
  gold: "bg-accent-gold text-white hover:opacity-90 disabled:opacity-40",
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
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer",
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
