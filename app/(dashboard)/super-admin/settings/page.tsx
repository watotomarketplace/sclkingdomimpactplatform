import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { Shield } from "lucide-react";
import { SettingsForm } from "@/app/(dashboard)/super-admin/settings/settings-form";

export default async function SystemSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.SUPER_ADMIN)) redirect("/");

  // Get or create singleton settings record
  const settings = await db.systemSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  return (
    <div className="px-6 py-6 max-w-[780px]">
      <div className="flex items-center gap-2 mb-6">
        <Shield size={20} className="text-accent-gold" />
        <div>
          <h1 className="font-display text-[28px] font-semibold text-text-primary">System Settings</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Platform configuration — changes take effect immediately
          </p>
        </div>
      </div>

      <SettingsForm
        settings={{
          platformName: settings.platformName,
          supportEmail: settings.supportEmail,
          sessionTimeoutMin: settings.sessionTimeoutMin,
          invitationExpiryH: settings.invitationExpiryH,
        }}
      />
    </div>
  );
}
