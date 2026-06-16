import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess, isAdmin } from "@/lib/roles";
import { Role, MilestoneStatus, MilestoneType } from "@/app/generated/prisma/enums";
import {
  computeStatus,
  computeUnlocked,
  MILESTONE_DEADLINES,
  MILESTONE_SHORT,
  MILESTONE_ORDER,
} from "@/lib/milestones";
import Link from "next/link";
import { AlertOctagon, AlertTriangle, CheckCircle2 } from "lucide-react";

export default async function FacilitatorRedFlagsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role as Role, Role.FACILITATOR)) redirect("/");

  const adminView = isAdmin(session.user.role as Role);

  const pods = await db.pod.findMany({
    where: adminView ? {} : { facilitatorId: session.user.id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              milestoneSubmissions: {
                select: { milestoneType: true, status: true, submittedAt: true, updatedAt: true },
              },
            },
          },
        },
      },
    },
  });

  const now = new Date();

  type FlagRow = {
    userId: string;
    userName: string | null;
    userEmail: string;
    podName: string;
    milestone: MilestoneType;
    status: MilestoneStatus;
    daysOverdue: number;
  };

  const flags: FlagRow[] = [];

  for (const pod of pods) {
    for (const { user } of pod.members) {
      const subs = user.milestoneSubmissions;
      const unlocked = computeUnlocked(subs);

      // Check each unlocked milestone that hasn't been submitted
      for (const milestone of MILESTONE_ORDER) {
        if (!unlocked.includes(milestone)) break; // linear — stop at first locked
        const subRecord = subs.find((s) => s.milestoneType === milestone) ?? null;
        const status = computeStatus(milestone, subRecord, now);

        if (status === MilestoneStatus.LATE || status === MilestoneStatus.AT_RISK) {
          const deadline = MILESTONE_DEADLINES[milestone];
          const daysOverdue = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
          flags.push({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            podName: pod.name,
            milestone,
            status,
            daysOverdue,
          });
        }
      }
    }
  }

  // Sort: at-risk first, then by days overdue descending
  flags.sort((a, b) => {
    if (a.status === MilestoneStatus.AT_RISK && b.status !== MilestoneStatus.AT_RISK) return -1;
    if (b.status === MilestoneStatus.AT_RISK && a.status !== MilestoneStatus.AT_RISK) return 1;
    return b.daysOverdue - a.daysOverdue;
  });

  const atRiskCount = flags.filter((f) => f.status === MilestoneStatus.AT_RISK).length;
  const lateCount = flags.filter((f) => f.status === MilestoneStatus.LATE).length;

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[820px]">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(184,58,42,0.20)] border border-red-500/30 flex items-center justify-center shrink-0">
          <AlertOctagon size={22} className="text-[#FCA5A5]" />
        </div>
        <div>
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary">
            Late &amp; At Risk
          </h1>
          <p className="text-text-secondary text-[13px] mt-1">
            {atRiskCount > 0 && `${atRiskCount} at risk · `}
            {lateCount} late · participants past milestone deadlines
          </p>
        </div>
      </div>

      {flags.length === 0 ? (
        <div className="glass-2 p-10 text-center">
          <CheckCircle2 size={32} className="text-[#86EFAC] mx-auto mb-3" />
          <p className="text-[15px] font-semibold text-text-primary mb-1">All participants on track</p>
          <p className="text-[13px] text-[#A3A3A3]">
            No one is past their milestone deadline. Keep encouraging them!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag, i) => {
            const isAtRisk = flag.status === MilestoneStatus.AT_RISK;
            return (
              <div
                key={`${flag.userId}-${flag.milestone}`}
                className={`glass-2 overflow-hidden border-l-2 ${
                  isAtRisk ? "border-l-red-400/60" : "border-l-[#FCD34D]/50"
                }`}
              >
                <div className="px-4 py-3 flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isAtRisk
                      ? "bg-[rgba(184,58,42,0.25)] border border-red-500/30"
                      : "bg-[rgba(252,211,77,0.15)] border border-[#FCD34D]/30"
                  }`}>
                    {isAtRisk
                      ? <AlertOctagon size={15} className="text-[#FCA5A5]" />
                      : <AlertTriangle size={15} className="text-[#FCD34D]" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <Link
                        href={`/facilitator/participants/${flag.userId}`}
                        className="text-[14px] font-semibold text-text-primary hover:text-[#FCD34D] transition-colors"
                      >
                        {flag.userName ?? flag.userEmail}
                      </Link>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        isAtRisk
                          ? "bg-[rgba(184,58,42,0.25)] border border-red-500/20 text-[#FCA5A5]"
                          : "bg-[rgba(252,211,77,0.15)] border border-[#FCD34D]/20 text-[#FCD34D]"
                      }`}>
                        {isAtRisk ? "At Risk" : "Late"}
                      </span>
                    </div>
                    <p className="text-[12px] text-text-secondary mt-0.5">
                      {flag.podName} · <strong className="text-text-secondary">{MILESTONE_SHORT[flag.milestone]}</strong> · {flag.daysOverdue} day{flag.daysOverdue !== 1 ? "s" : ""} overdue
                    </p>
                    <p className="text-[12px] text-[#A3A3A3] mt-1.5">
                      {isAtRisk
                        ? `Reach out to ${flag.userName?.split(" ")[0] ?? "them"} and ask what is blocking them.`
                        : `Follow up with ${flag.userName?.split(" ")[0] ?? "them"} — they may need support to get unstuck.`
                      }
                    </p>
                  </div>

                  {/* Link */}
                  <Link
                    href={`/facilitator/participants/${flag.userId}`}
                    className="text-[12px] text-[#C8973A] hover:text-[#FCD34D] transition-colors shrink-0 mt-1"
                  >
                    View →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
