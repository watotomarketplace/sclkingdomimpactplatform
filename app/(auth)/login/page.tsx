"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { SplitLayout } from "@/components/auth/split-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const accountCreated = searchParams.get("created") === "true";
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError("Invalid email or password. Please try again.");
      return;
    }

    // Hard redirect so the browser sends the newly-set session cookie.
    // router.push() is client-side and doesn't include the fresh JWT cookie,
    // causing middleware to see no session and redirect-loop.
    window.location.href = callbackUrl || "/";
  };

  return (
    <>
      {accountCreated && (
        <div className="mb-6 bg-[rgba(10,10,10,0.06)] border border-border rounded-lg px-4 py-3 flex items-center gap-2.5">
          <span className="text-accent-primary text-sm">✓</span>
          <p className="text-sm text-text-primary font-medium">Account created — sign in below.</p>
        </div>
      )}
      <h1 className="font-display text-[28px] font-semibold text-text-primary mb-1">Welcome back</h1>
      <p className="text-text-secondary text-sm mb-8">Sign in to your SCL account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        {serverError && (
          <p className="text-sm text-accent-danger bg-[rgba(184,58,42,0.08)] px-3 py-2 rounded-lg">
            {serverError}
          </p>
        )}

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-[13px] text-accent-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting} size="lg">
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-accent-primary font-medium hover:underline">
          Create account
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <SplitLayout imageSrc="/images/misty-forest.jpg" imageAlt="Misty forest with light rays">
      <Suspense fallback={<div className="h-96 animate-pulse bg-bg-card rounded-xl" />}>
        <LoginForm />
      </Suspense>
    </SplitLayout>
  );
}
