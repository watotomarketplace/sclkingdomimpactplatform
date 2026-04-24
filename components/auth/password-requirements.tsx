"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const REQUIREMENTS = [
  { key: "uppercase", label: "1 uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { key: "lowercase", label: "1 lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { key: "number", label: "1 number", test: (p: string) => /[0-9]/.test(p) },
  { key: "special", label: "1 special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  { key: "length", label: "8 to 64 characters", test: (p: string) => p.length >= 8 && p.length <= 64 },
];

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  if (!password) return null;

  return (
    <div className="space-y-1.5 mt-2">
      {REQUIREMENTS.map((req) => {
        const met = req.test(password);
        return (
          <div key={req.key} className="flex items-center gap-2">
            {met ? (
              <Check size={12} className="text-accent-primary shrink-0" />
            ) : (
              <Circle size={12} className="text-border-strong shrink-0" />
            )}
            <span className={cn("text-xs", met ? "text-accent-primary" : "text-text-secondary")}>
              {req.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function validatePassword(password: string): boolean {
  return REQUIREMENTS.every((req) => req.test(password));
}
