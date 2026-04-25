"use client";

import { useState } from "react";
import Link from "next/link";
import { SplitLayout } from "@/components/auth/split-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({ email: z.string().email("Enter a valid email address") });

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: { email: string }) => {
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSent(true); // Always show success (don't reveal if email exists)
  };

  return (
    <SplitLayout imageSrc="/images/big-sur.jpg" imageAlt="Coastal landscape">
      {sent ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-[rgba(45,90,61,0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-accent-primary text-xl">✓</span>
          </div>
          <h1 className="font-display text-[24px] font-semibold text-text-primary mb-2">Check your email</h1>
          <p className="text-text-secondary text-sm mb-6">
            If that email is registered, we've sent a password reset link. Check your inbox.
          </p>
          <Link href="/login" className="text-sm text-accent-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="font-display text-[28px] font-semibold text-text-primary mb-1">Forgot password</h1>
          <p className="text-text-secondary text-sm mb-8">
            Enter your email address and we'll send you a reset link.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email address" type="email" error={errors.email?.message} {...register("email")} />
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Send reset link
            </Button>
          </form>
          <p className="mt-6 text-center text-[13px] text-text-secondary">
            <Link href="/login" className="text-accent-primary hover:underline">Back to sign in</Link>
          </p>
        </>
      )}
    </SplitLayout>
  );
}
