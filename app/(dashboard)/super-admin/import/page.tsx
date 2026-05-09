import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/enums";
import { ImportParticipantsForm } from "@/components/super-admin/import-participants-form";
import { Upload } from "lucide-react";

export default async function ImportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.SUPER_ADMIN)) redirect("/");

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[720px]">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-bg-base border border-border flex items-center justify-center shrink-0">
          <Upload size={22} className="text-text-secondary" />
        </div>
        <div>
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary">Import Participants</h1>
          <p className="text-text-secondary text-[13px] mt-1">Bulk-create participant accounts from a CSV file</p>
        </div>
      </div>

      <div className="glass-2 p-5 mb-5">
        <p className="section-label mb-3">CSV FORMAT</p>
        <p className="text-[13px] text-text-secondary mb-3 leading-relaxed">
          Upload a CSV with the following columns. Accounts will be created with a temporary password
          sent to each participant by email.
        </p>
        <div className="glass-3 rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 gap-0 border-b border-border px-4 py-2">
            {["Column", "Required", "Example"].map((h) => (
              <span key={h} className="text-[11px] font-semibold uppercase tracking-wider text-[#A3A3A3]">{h}</span>
            ))}
          </div>
          {[
            ["name", "Yes", "Grace Nakato"],
            ["email", "Yes", "grace@example.com"],
            ["phone", "No", "+256 700 000000"],
            ["campus", "No", "Watoto Bugolobi"],
          ].map(([col, req, ex]) => (
            <div key={col} className="grid grid-cols-3 gap-0 px-4 py-2 border-b border-border last:border-0">
              <span className="text-[12px] font-mono text-[#FCD34D]">{col}</span>
              <span className="text-[12px] text-text-secondary">{req}</span>
              <span className="text-[12px] text-[#A3A3A3]">{ex}</span>
            </div>
          ))}
        </div>
      </div>

      <ImportParticipantsForm />
    </div>
  );
}
