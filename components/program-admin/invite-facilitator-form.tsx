"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().min(2, "Enter full name"),
  email: z.string().email("Enter a valid email"),
});

export function InviteFacilitatorForm({ role = "FACILITATOR" }: { role?: "FACILITATOR" | "PROGRAM_ADMIN" }) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: { name: string; email: string }) => {
    setError("");
    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, role }),
    });
    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? "Failed to send invitation.");
      return;
    }
    setSuccess(true);
    reset();
    router.refresh();
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <Card className="mb-6">
      <CardTitle className="mb-4">
        Invite {role === "PROGRAM_ADMIN" ? "Program Admin" : "Facilitator"}
      </CardTitle>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Full name" type="text" error={errors.name?.message} {...register("name")} />
          <Input label="Email address" type="email" error={errors.email?.message} {...register("email")} />
        </div>
        {error && <p className="text-sm text-accent-danger">{error}</p>}
        {success && <p className="text-sm text-accent-primary">Invitation sent!</p>}
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>Send Invitation</Button>
        </div>
      </form>
    </Card>
  );
}
