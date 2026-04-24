"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="floating-label-group w-full">
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            placeholder=" "
            className={cn(
              "w-full h-14 px-4 pt-6 pb-2 bg-white border-[1.5px] rounded-lg text-[15px] text-text-primary outline-none transition-colors",
              "border-border focus:border-accent-primary",
              error && "border-accent-danger focus:border-accent-danger",
              isPassword && "pr-12",
              className
            )}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary transition-all pointer-events-none",
              "text-[15px]"
            )}
          >
            {label}
          </label>
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-accent-danger">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  highlighted?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, highlighted, id, ...props }, ref) => {
    const textareaId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("floating-label-group w-full", highlighted && "field-highlighted pl-3")}>
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            placeholder=" "
            rows={4}
            className={cn(
              "w-full px-4 pt-8 pb-3 bg-white border-[1.5px] rounded-lg text-[15px] text-text-primary outline-none transition-colors resize-y min-h-[100px]",
              "border-border focus:border-accent-primary",
              error && "border-accent-danger focus:border-accent-danger",
              highlighted && "border-accent-primary",
              className
            )}
            {...props}
          />
          <label
            htmlFor={textareaId}
            className="absolute left-4 top-4 text-text-secondary transition-all pointer-events-none text-[15px]"
          >
            {label}
          </label>
        </div>
        {error && <p className="mt-1 text-xs text-accent-danger">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
