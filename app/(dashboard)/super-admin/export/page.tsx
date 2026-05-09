import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/enums";
import { DataExportButtons } from "@/components/super-admin/data-export-buttons";
import { Download } from "lucide-react";

export default async function DataExportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.SUPER_ADMIN)) redirect("/");

  // Summary counts for context
  const [participantCount, submissionCount, meetingCount] = await Promise.all([
    db.user.count({ where: { role: { in: [Role.PARTICIPANT, Role.GROUP_LEADER] }, isActive: true } }),
    db.milestoneSubmission.count({ where: { status: "SUBMITTED" } }),
    db.groupMeetingSummary.count(),
  ]);

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[720px]">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-bg-base border border-border flex items-center justify-center shrink-0">
          <Download size={22} className="text-text-secondary" />
        </div>
        <div>
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary">Data Export</h1>
          <p className="text-text-secondary text-[13px] mt-1">Download platform data as CSV</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Participants", value: participantCount },
          { label: "Submissions", value: submissionCount },
          { label: "Meeting Summaries", value: meetingCount },
        ].map((stat) => (
          <div key={stat.label} className="glass-2 p-4 text-center">
            <p className="text-[22px] font-semibold font-mono text-text-primary">{stat.value}</p>
            <p className="text-[11px] text-[#A3A3A3] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <DataExportButtons />
    </div>
  );
}
