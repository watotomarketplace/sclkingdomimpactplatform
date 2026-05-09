import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/enums";
import { MeetingSummaryForm } from "@/components/group-leader/meeting-summary-form";
import { FileText } from "lucide-react";

export default async function MeetingSummaryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.GROUP_LEADER)) redirect("/participant");

  // Get the pod this leader manages
  const podMember = await db.podMember.findFirst({
    where: { userId: session.user.id, isLeader: true },
    include: {
      pod: {
        include: {
          members: { include: { user: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  if (!podMember?.pod) {
    return (
      <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[780px]">
        <div className="glass-2 p-8 text-center">
          <FileText size={32} className="text-[#A3A3A3] mx-auto mb-3" />
          <p className="text-text-secondary font-semibold text-[15px]">No group assigned</p>
          <p className="text-[#A3A3A3] text-[13px] mt-1">Contact your facilitator to be assigned a group.</p>
        </div>
      </div>
    );
  }

  const pod = podMember.pod;
  const members = pod.members.map((m) => ({ id: m.user.id, name: m.user.name ?? "Unknown" }));

  // Recent summaries
  const recentSummaries = await db.groupMeetingSummary.findMany({
    where: { podId: pod.id },
    orderBy: { meetingDate: "desc" },
    take: 5,
  });

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[780px]">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(200,151,58,0.15)] border border-[#C8973A]/30 flex items-center justify-center shrink-0">
          <FileText size={22} className="text-[#FCD34D]" />
        </div>
        <div>
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary leading-tight">
            Submit Meeting Summary
          </h1>
          <p className="text-text-secondary text-[13px] mt-1">{pod.name}</p>
        </div>
      </div>

      {/* Recent summaries */}
      {recentSummaries.length > 0 && (
        <div className="glass-2 p-4 mb-5">
          <p className="section-label mb-3">RECENT SUMMARIES</p>
          <div className="space-y-2">
            {recentSummaries.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-[13px] text-text-primary">
                  {new Date(s.meetingDate).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="text-[11px] text-[#A3A3A3] font-mono">{s.format}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <MeetingSummaryForm podId={pod.id} members={members} />
    </div>
  );
}
