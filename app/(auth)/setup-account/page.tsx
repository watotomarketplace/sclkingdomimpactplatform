"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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

interface InviteData {
  name: string;
  email: string;
  role: string;
}

function SetupAccountForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });
  const password = useWatch({ control, name: "password", defaultValue: "" });

  useEffect(() => {
    if (!token) { setTokenError("Invalid invitation link."); return; }
    fetch(`/api/invitations/validate?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setTokenError(data.error);
        else setInviteData(data);
      })
      .catch(() => setTokenError("Failed to validate invitation."));
  }, [token]);

  const onSubmit = async (data: { password: string; confirmPassword: string }) => {
    if (!validatePassword(data.password)) { setServerError("Password does not meet requirements."); return; }
    const res = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: data.password }),
    });
    if (!res.ok) { setServerError("Something went wrong. Please try again."); return; }
    window.location.href = "/login?setup=complete";
  };

  if (tokenError) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-[rgba(184,58,42,0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-accent-danger text-xl">✕</span>
        </div>
        <h1 className="font-display text-[24px] font-semibold text-text-primary mb-2">Link expired</h1>
        <p className="text-text-secondary text-sm">{tokenError}</p>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-[28px] font-semibold text-text-primary mb-1">Set up your account</h1>
      <p className="text-text-secondary text-sm mb-6">
        Welcome, {inviteData.name.split(" ")[0]}. You've been invited as a <strong>{inviteData.role === "FACILITATOR" ? "Facilitator" : "Program Admin"}</strong>.
      </p>

      <div className="bg-bg-base rounded-lg px-4 py-3 mb-6 space-y-1">
        <p className="text-[11px] uppercase font-medium text-text-secondary tracking-wider">YOUR ACCOUNT</p>
        <p className="text-sm font-medium text-text-primary">{inviteData.name}</p>
        <p className="text-sm text-text-secondary">{inviteData.email}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input label="Create password" type="password" error={errors.password?.message} {...register("password")} />
          <PasswordRequirements password={password || ""} />
        </div>
        <Input label="Confirm password" type="password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />

        {serverError && (
          <p className="text-sm text-accent-danger bg-[rgba(184,58,42,0.08)] px-3 py-2 rounded-lg">{serverError}</p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Complete setup
        </Button>
      </form>
    </>
  );
}

export default function SetupAccountPage() {
  return (
    <SplitLayout imageSrc="/images/coastline.jpg" imageAlt="Coastal landscape">
      <Suspense fallback={
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <SetupAccountForm />
      </Suspense>
    </SplitLayout>
  );
}
