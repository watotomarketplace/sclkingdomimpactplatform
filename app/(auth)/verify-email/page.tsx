"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SplitLayout } from "@/components/auth/split-layout";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.success ? "success" : "error");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  if (status === "loading") {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary">Verifying your email...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-[rgba(45,90,61,0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-accent-primary text-xl">✓</span>
        </div>
        <h1 className="font-display text-[24px] font-semibold text-text-primary mb-2">Email verified</h1>
        <p className="text-text-secondary text-sm mb-6">
          Your account is now active. Sign in to begin your journey.
        </p>
        <Link href="/login">
          <Button size="lg" className="w-full">Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 bg-[rgba(184,58,42,0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-accent-danger text-xl">✕</span>
      </div>
      <h1 className="font-display text-[24px] font-semibold text-text-primary mb-2">Link expired</h1>
      <p className="text-text-secondary text-sm mb-6">
        This verification link has expired or is invalid. Please sign up again or request a new link.
      </p>
      <Link href="/signup">
        <Button variant="secondary" size="lg" className="w-full">Back to sign up</Button>
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <SplitLayout imageSrc="/images/misty-forest.jpg" imageAlt="Misty forest with light rays">
      <Suspense fallback={
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </SplitLayout>
  );
}
