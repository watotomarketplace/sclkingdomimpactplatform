import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role, MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";
import { MilestoneReviewPanel } from "@/components/facilitator/milestone-review-panel";
import { Search, CheckCircle2, Clock } from "lucide-react";

const FIELDS = [
  { key: "initiativeType",           label: "Initiative type" },
  { key: "refinedProblemStatement",  label: "Refined problem statement" },
  { key: "conversationsSummary",     label: "Conversations with beneficiaries (min 3)" },
  { key: "whatIsNowClearer",         label: "What is now clearer" },
  { key: "whatTheyHadWrong",         label: "What they had wrong" },
  { key: "changesToMVI",             label: "Changes to MVI" },
  { key: "mviBuildProgress",         label: "MVI build progress" },
  { key: "supportingFile",           label: "Supporting evidence (file)" },
];

export default async function ReviewMilestone1Page() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.FACILITATOR)) redirect("/");

  const pods = await db.pod.findMany({
    where: { facilitatorId: session.user.id },
    include: { members: { select: { userId: true } } },
  });
  const participantIds = pods.flatMap((p) => p.members.map((m) => m.userId));

  const submissions = await db.milestoneSubmission.findMany({
    where: {
      milestoneType: MilestoneType.MILESTONE_1,
      status: MilestoneStatus.SUBMITTED,
      userId: { in: participantIds },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { submittedAt: "asc" },
  });

  const reviewed = submissions.filter((s) => s.reviewedById);
  const pending = submissions.filter((s) => !s.reviewedById);

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[820px]">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(200,151,58,0.15)] border border-[#C8973A]/30 flex items-center justify-center shrink-0">
          <Search size={22} className="text-[#FCD34D]" />
        </div>
        <div>
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary">
            Milestone 1 Reviews — External Validation
          </h1>
          <p className="text-text-secondary text-[13px] mt-1">
            {pending.length} pending · {reviewed.length} reviewed
          </p>
        </div>
      </div>

      {submissions.length === 0 && (
        <div className="glass-2 p-8 text-center">
          <Search size={28} className="text-[#A3A3A3] mx-auto mb-3" />
          <p className="text-text-secondary text-[14px]">No Milestone 1 submissions yet.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="mb-6">
          <p className="section-label mb-3 flex items-center gap-2"><Clock size={11} /> AWAITING REVIEW ({pending.length})</p>
          <div className="space-y-2">
            {pending.map((s) => (
              <MilestoneReviewPanel key={s.id} submission={{ id: s.id, userId: s.userId, userName: s.user.name, userEmail: s.user.email, milestoneType: s.milestoneType, status: s.status, formData: (s.formData ?? {}) as Record<string, unknown>, submittedAt: s.submittedAt, reviewedById: s.reviewedById, reviewNotes: s.reviewNotes }} fields={FIELDS} />
            ))}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <p className="section-label mb-3 flex items-center gap-2"><CheckCircle2 size={11} /> REVIEWED ({reviewed.length})</p>
          <div className="space-y-2">
            {reviewed.map((s) => (
              <MilestoneReviewPanel key={s.id} submission={{ id: s.id, userId: s.userId, userName: s.user.name, userEmail: s.user.email, milestoneType: s.milestoneType, status: s.status, formData: (s.formData ?? {}) as Record<string, unknown>, submittedAt: s.submittedAt, reviewedById: s.reviewedById, reviewNotes: s.reviewNotes }} fields={FIELDS} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
