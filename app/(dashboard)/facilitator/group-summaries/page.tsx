import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/enums";
import { ListChecks, Users, AlertTriangle } from "lucide-react";

export default async function FacilitatorGroupSummariesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.FACILITATOR)) redirect("/");

  const pods = await db.pod.findMany({
    where: { facilitatorId: session.user.id },
    include: {
      meetingSummaries: {
        orderBy: { meetingDate: "desc" },
        include: { author: { select: { name: true } } },
      },
      members: { select: { userId: true } },
    },
    orderBy: { name: "asc" },
  });

  const totalSummaries = pods.reduce((n, p) => n + p.meetingSummaries.length, 0);

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[820px]">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(200,151,58,0.15)] border border-[#C8973A]/30 flex items-center justify-center shrink-0">
          <ListChecks size={22} className="text-[#FCD34D]" />
        </div>
        <div>
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary">Group Meeting Summaries</h1>
          <p className="text-text-secondary text-[13px] mt-1">
            {pods.length} group{pods.length !== 1 ? "s" : ""} · {totalSummaries} total summaries
          </p>
        </div>
      </div>

      {pods.length === 0 && (
        <div className="glass-2 p-8 text-center">
          <Users size={28} className="text-[#A3A3A3] mx-auto mb-3" />
          <p className="text-text-secondary text-[14px]">No groups assigned to you yet.</p>
        </div>
      )}

      <div className="space-y-5">
        {pods.map((pod) => (
          <div key={pod.id} className="glass-2 overflow-hidden">
            {/* Pod header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-[#FCD34D]" />
                <span className="text-[13px] font-semibold text-text-primary">{pod.name}</span>
                <span className="text-[11px] text-[#A3A3A3]">{pod.members.length} members</span>
              </div>
              <span className="text-[11px] text-[#A3A3A3]">
                {pod.meetingSummaries.length} summar{pod.meetingSummaries.length === 1 ? "y" : "ies"}
              </span>
            </div>

            {pod.meetingSummaries.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <p className="text-[13px] text-[#A3A3A3]">No summaries submitted yet for this group.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {pod.meetingSummaries.map((s) => (
                  <div key={s.id} className="px-4 py-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-text-primary">
                          {new Date(s.meetingDate).toLocaleDateString("en-GB", {
                            weekday: "short", day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-bg-base text-[#A3A3A3]">
                          {s.format.replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#A3A3A3] shrink-0">
                        by {s.author.name}
                      </span>
                    </div>

                    <p className="text-[13px] text-text-secondary leading-relaxed mb-2">{s.summary}</p>

                    <p className="text-[11px] text-[#A3A3A3]">
                      {(s.attendeeIds as string[]).length} attended
                    </p>

                    {s.concerns && (
                      <div className="mt-2 flex items-start gap-1.5 px-3 py-2 rounded-lg bg-[rgba(220,38,38,0.08)] border border-red-500/20">
                        <AlertTriangle size={12} className="text-red-400 mt-0.5 shrink-0" />
                        <p className="text-[12px] text-red-300 leading-relaxed">{s.concerns}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
