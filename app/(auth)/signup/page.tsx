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

const schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const password = useWatch({ control, name: "password", defaultValue: "" });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    if (!validatePassword(data.password)) {
      setServerError("Password does not meet all requirements.");
      return;
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      setServerError(result.error || "Something went wrong. Please try again.");
      return;
    }

    // Account created — go straight to sign in
    window.location.href = "/login?created=true";
  };

  return (
    <SplitLayout imageSrc="/images/coastline.jpg" imageAlt="Coastal landscape">
      <h1 className="font-display text-[28px] font-semibold text-text-primary mb-1">Create an account</h1>
      <p className="text-text-secondary text-sm mb-8">Begin your Kingdom Impact Work journey.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        {serverError && (
          <p className="text-sm text-accent-danger bg-[rgba(220,38,38,0.08)] px-3 py-2 rounded-lg">
            {serverError}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/login">
            <Button type="button" variant="secondary" size="lg" className="flex-1">
              Back
            </Button>
          </Link>
          <Button type="submit" size="lg" className="flex-[2]" loading={isSubmitting}>
            Create account
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-[13px] text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-accent-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </SplitLayout>
  );
}
