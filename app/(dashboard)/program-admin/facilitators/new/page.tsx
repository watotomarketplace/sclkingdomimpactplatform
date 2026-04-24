import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { InviteFacilitatorForm } from "@/components/program-admin/invite-facilitator-form";
import Link from "next/link";

export default async function NewFacilitatorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.PROGRAM_ADMIN)) redirect("/");

  return (
    <div className="px-6 py-6 max-w-[780px]">
      <div className="mb-6">
        <Link
          href="/program-admin/facilitators"
          className="text-xs text-text-secondary hover:text-text-primary mb-2 inline-flex items-center gap-1"
        >
          ← Back to Facilitators
        </Link>
        <h1 className="font-display text-[28px] font-semibold text-text-primary">
          Invite Facilitator
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Send an invitation to a new facilitator
        </p>
      </div>

      <InviteFacilitatorForm />
    </div>
  );
}
