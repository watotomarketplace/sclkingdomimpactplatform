import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role, MilestoneStatus } from "@/app/generated/prisma/enums";
import {
  computeStatus,
  MILESTONE_TITLES,
  MILESTONE_ORDER,
  statusChipClass,
  statusLabel,
} from "@/lib/milestones";
import { Users, FileText, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function GroupLeaderDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.GROUP_LEADER)) redirect("/participant");

  // Find the pod this person leads
  const podMember = await db.podMember.findFirst({
    where: { userId: session.user.id, isLeader: true },
    include: {
      pod: {
        include: {
          members: {
            include: {
              user: {
                include: {
                  milestoneSubmissions: {
                    orderBy: { updatedAt: "desc" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const pod = podMember?.pod;
  const members = pod?.members ?? [];

  // Latest meeting summary
  const latestSummary = pod
    ? await db.groupMeetingSummary.findFirst({
        where: { podId: pod.id },
        orderBy: { meetingDate: "desc" },
      })
    : null;

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[820px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-[28px] md:text-[32px] font-semibold text-text-primary leading-tight">
          Group Status
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {pod ? `${pod.name} — ${members.length} member${members.length !== 1 ? "s" : ""}` : "No group assigned yet"}
        </p>
      </div>

      {/* No pod assigned */}
      {!pod && (
        <div className="glass-2 p-8 text-center">
          <Users size={32} className="text-[#A3A3A3] mx-auto mb-3" />
          <p className="text-text-secondary font-semibold text-[15px] mb-1">No group assigned</p>
          <p className="text-[#A3A3A3] text-[13px]">
            Contact your facilitator to be assigned to a group.
          </p>
        </div>
      )}

      {/* Meeting summary quick action */}
      {pod && (
        <div className="glass-2 p-4 mb-4 flex items-center justify-between gap-3 fade-in-up">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[rgba(200,151,58,0.2)] border border-[#C8973A]/40 flex items-center justify-center">
              <FileText size={16} className="text-[#FCD34D]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-text-primary">Meeting Summary</p>
              <p className="text-[11px] text-text-secondary">
                {latestSummary
                  ? `Last submitted: ${new Date(latestSummary.meetingDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                  : "No summaries submitted yet"}
              </p>
            </div>
          </div>
          <Link
            href="/group-leader/meeting-summary"
            className="flex items-center gap-1 text-[12px] font-medium text-[#C8973A] hover:text-[#FCD34D] transition-colors shrink-0"
          >
            Submit new <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* Member cards */}
      {pod && members.length > 0 && (
        <div className="space-y-3">
          <p className="section-label">GROUP MEMBERS</p>
          {members.map((member, i) => {
            const memberSubs = member.user.milestoneSubmissions;

            // Find active milestone
            const submittedTypes = new Set(
              memberSubs
                .filter((s) => s.status === MilestoneStatus.SUBMITTED)
                .map((s) => s.milestoneType)
            );
            const activeMilestone =
              MILESTONE_ORDER.find((m) => !submittedTypes.has(m)) ??
              MILESTONE_ORDER[MILESTONE_ORDER.length - 1];

            const activeSub =
              memberSubs.find((s) => s.milestoneType === activeMilestone) ?? null;
            const milestoneStatus = computeStatus(activeMilestone, activeSub);
            const completedCount = submittedTypes.size;
            const isLeader = member.isLeader;

            return (
              <div
                key={member.userId}
                className="glass-2 p-4 fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[rgba(200,151,58,0.20)] border border-[#C8973A]/30 flex items-center justify-center shrink-0">
                    <span className="text-[13px] font-semibold text-[#FCD34D]">
                      {(member.user.name ?? "?").charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold text-text-primary truncate">
                        {member.user.name}
                      </span>
                      {isLeader && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[rgba(200,151,58,0.2)] text-[#FCD34D]">
                          Leader
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-text-secondary mt-0.5">
                      {MILESTONE_TITLES[activeMilestone]}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={statusChipClass(milestoneStatus)}>
                      {statusLabel(milestoneStatus)}
                    </span>
                    <span className="text-[11px] text-[#A3A3A3]">
                      {completedCount}/{MILESTONE_ORDER.length} done
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Your own journey reminder */}
      <div className="glass-2 p-4 mt-6 fade-in-up">
        <p className="section-label mb-2">YOUR JOURNEY</p>
        <p className="text-[13px] text-text-secondary mb-3">
          As a Group Leader, you are also a participant. Stay on track with your own milestones.
        </p>
        <Link
          href="/participant"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#C8973A] hover:text-[#FCD34D] transition-colors"
        >
          Go to my dashboard <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
