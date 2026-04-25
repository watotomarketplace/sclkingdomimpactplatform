"use client";

import { useState } from "react";
import Link from "next/link";
import { SplitLayout } from "@/components/auth/split-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordRequirements, validatePassword } from "@/components/auth/password-requirements";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";

const step1Schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type Step1Data = z.infer<typeof step1Schema>;

type Category = "ENTREPRENEUR" | "INTRAPRENEUR";

const CATEGORIES: { value: Category; emoji: string; headline: string; description: string }[] = [
  {
    value: "ENTREPRENEUR",
    emoji: "🌱",
    headline: "An entrepreneurial venture",
    description:
      "I am building or want to build a business, startup, or social enterprise of my own.",
  },
  {
    value: "INTRAPRENEUR",
    emoji: "🏢",
    headline: "An intrapreneurial project",
    description:
      "I am employed and working on an innovation, product, or solution within my organisation.",
  },
];

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting: step1Submitting },
  } = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });

  const password = useWatch({ control, name: "password", defaultValue: "" });

  const onStep1Submit = (data: Step1Data) => {
    if (!validatePassword(data.password)) {
      return; // PasswordRequirements component shows what's missing
    }
    setStep1Data(data);
    setStep(2);
  };

  const onFinalSubmit = async () => {
    if (!step1Data || !selectedCategory) return;
    setServerError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...step1Data, category: selectedCategory }),
      });

      const result = await res.json();
      if (!res.ok) {
        setServerError(result.error || "Something went wrong. Please try again.");
        return;
      }

      window.location.href = "/login?created=true";
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SplitLayout imageSrc="/images/big-sur.jpg" imageAlt="Coastal landscape">
      {step === 1 ? (
        <>
          <h1 className="font-display text-[28px] font-semibold text-text-primary mb-1">
            Create an account
          </h1>
          <p className="text-text-secondary text-sm mb-8">
            Begin your Kingdom Impact Work journey.
          </p>

          <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-4">
            <Input
              label="Full legal name"
              type="text"
              autoComplete="name"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <div>
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register("password")}
              />
              <PasswordRequirements password={password || ""} />
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/login">
                <Button type="button" variant="secondary" size="lg" className="flex-1">
                  Back
                </Button>
              </Link>
              <Button type="submit" size="lg" className="flex-[2]" loading={step1Submitting}>
                Continue →
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-[13px] text-text-secondary">
            Already have an account?{" "}
            <Link href="/login" className="text-accent-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </>
      ) : (
        <>
          {/* Step 2 — Category selection */}
          <div className="mb-1">
            <button
              onClick={() => setStep(1)}
              className="text-[13px] text-text-secondary hover:text-text-primary mb-5 flex items-center gap-1.5 transition-colors"
            >
              ← Back
            </button>
            <h1 className="font-display text-[26px] font-semibold text-text-primary mb-1">
              What are you working on?
            </h1>
            <p className="text-text-secondary text-sm mb-8">
              This helps us tailor the programme questions to your context.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border-2 transition-all duration-150 focus:outline-none",
                  selectedCategory === cat.value
                    ? "border-accent-primary bg-[rgba(10,10,10,0.04)]"
                    : "border-border hover:border-border-strong bg-white"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5 leading-none">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[15px] font-semibold text-text-primary">{cat.headline}</p>
                      {/* Radio indicator */}
                      <span
                        className={cn(
                          "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
                          selectedCategory === cat.value
                            ? "border-accent-primary"
                            : "border-border-strong"
                        )}
                      >
                        {selectedCategory === cat.value && (
                          <span className="w-2 h-2 rounded-full bg-accent-primary block" />
                        )}
                      </span>
                    </div>
                    <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {serverError && (
            <p className="text-sm text-accent-danger bg-[rgba(220,38,38,0.08)] px-3 py-2 rounded-lg mb-4">
              {serverError}
            </p>
          )}

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!selectedCategory}
            loading={submitting}
            onClick={onFinalSubmit}
          >
            Create account
          </Button>

          <p className="mt-4 text-center text-[12px] text-text-secondary">
            You can always update this later in your profile settings.
          </p>
        </>
      )}
    </SplitLayout>
  );
}
