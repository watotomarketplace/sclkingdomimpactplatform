"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SplitLayout } from "@/components/auth/split-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordRequirements, validatePassword } from "@/components/auth/password-requirements";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });
  const password = useWatch({ control, name: "password", defaultValue: "" });

  const onSubmit = async (data: { password: string; confirmPassword: string }) => {
    if (!token) { setServerError("Invalid reset link."); return; }
    if (!validatePassword(data.password)) { setServerError("Password does not meet requirements."); return; }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: data.password }),
    });

    if (!res.ok) { setServerError("This reset link has expired. Please request a new one."); return; }
    window.location.href = "/login?reset=true";
  };

  return (
    <>
      <h1 className="font-display text-[28px] font-semibold text-text-primary mb-1">Set new password</h1>
      <p className="text-text-secondary text-sm mb-8">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input label="New password" type="password" error={errors.password?.message} {...register("password")} />
          <PasswordRequirements password={password || ""} />
        </div>
        <Input label="Confirm password" type="password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />

        {serverError && (
          <p className="text-sm text-accent-danger bg-[rgba(184,58,42,0.08)] px-3 py-2 rounded-lg">{serverError}</p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Reset password
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        <Link href="/login" className="text-accent-primary hover:underline">Back to sign in</Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <SplitLayout imageSrc="/images/misty-forest.jpg" imageAlt="Misty forest with light rays">
      <Suspense fallback={<div className="h-96 animate-pulse bg-bg-card rounded-xl" />}>
        <ResetPasswordForm />
      </Suspense>
    </SplitLayout>
  );
}
