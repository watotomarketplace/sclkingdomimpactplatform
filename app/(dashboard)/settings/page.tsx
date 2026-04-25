import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      calendlyLink: true,
      participantProfile: {
        select: { category: true },
      },
    },
  });

  if (!user) redirect("/api/auth/force-signout");

  return (
    <SettingsForm
      userId={user.id}
      initialName={user.name}
      email={user.email}
      role={user.role}
      initialCalendlyLink={user.calendlyLink ?? ""}
      initialCategory={user.participantProfile?.category ?? null}
    />
  );
}
