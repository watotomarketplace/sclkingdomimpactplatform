import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess, isAdmin } from "@/lib/roles";
import { Role, MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";
import { MilestoneReviewPanel } from "@/components/facilitator/milestone-review-panel";
import { Compass, CheckCircle2, Clock } from "lucide-react";

const FIELDS = [
  { key: "initiativeName",    label: "Initiative name" },
  { key: "problemStatement",  label: "Problem statement" },
  { key: "healingHoped",      label: "The healing hoped for" },
  { key: "beneficiaries",     label: "Beneficiaries" },
  { key: "mviSummary",        label: "MVI summary" },
  { key: "singleAssumption",  label: "Single assumption to test" },
  { key: "buyInNeeded",       label: "Buy-in needed" },
  { key: "resourcesRequired", label: "Resources required" },
  { key: "realisticTimeline", label: "Realistic timeline" },
  { key: "likelyResistance",  label: "Likely resistance" },
  { key: "evidencePlan",      label: "Evidence plan" },
  { key: "firstTestDate",     label: "First test date" },
];

export default async function ReviewOnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role as Role, Role.FACILITATOR)) redirect("/");

  const adminView = isAdmin(session.user.role as Role);

  let participantFilter: { userId?: { in: string[] } } = {};
  if (!adminView) {
    const pods = await db.pod.findMany({
      where: { facilitatorId: session.user.id },
      include: { members: { select: { userId: true } } },
    });
    participantFilter = { userId: { in: pods.flatMap((p) => p.members.map((m) => m.userId)) } };
  }

  const submissions = await db.milestoneSubmission.findMany({
    where: {
      milestoneType: MilestoneType.ONBOARDING,
      status: MilestoneStatus.SUBMITTED,
      ...participantFilter,
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
          <Compass size={22} className="text-[#FCD34D]" />
        </div>
        <div>
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary">
            Onboarding Reviews — MVI Brief
          </h1>
          <p className="text-text-secondary text-[13px] mt-1">
            {pending.length} pending · {reviewed.length} reviewed
          </p>
        </div>
      </div>

      {submissions.length === 0 && (
        <div className="glass-2 p-8 text-center">
          <Compass size={28} className="text-[#A3A3A3] mx-auto mb-3" />
          <p className="text-text-secondary text-[14px]">No submitted MVI Briefs yet.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="mb-6">
          <p className="section-label mb-3 flex items-center gap-2">
            <Clock size={11} /> AWAITING REVIEW ({pending.length})
          </p>
          <div className="space-y-2">
            {pending.map((s) => (
              <MilestoneReviewPanel
                key={s.id}
                submission={{
                  id: s.id,
                  userId: s.userId,
                  userName: s.user.name,
                  userEmail: s.user.email,
                  milestoneType: s.milestoneType,
                  status: s.status,
                  formData: (s.formData ?? {}) as Record<string, unknown>,
                  submittedAt: s.submittedAt,
                  reviewedById: s.reviewedById,
                  reviewNotes: s.reviewNotes,
                }}
                fields={FIELDS}
              />
            ))}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <p className="section-label mb-3 flex items-center gap-2">
            <CheckCircle2 size={11} /> REVIEWED ({reviewed.length})
          </p>
          <div className="space-y-2">
            {reviewed.map((s) => (
              <MilestoneReviewPanel
                key={s.id}
                submission={{
                  id: s.id,
                  userId: s.userId,
                  userName: s.user.name,
                  userEmail: s.user.email,
                  milestoneType: s.milestoneType,
                  status: s.status,
                  formData: (s.formData ?? {}) as Record<string, unknown>,
                  submittedAt: s.submittedAt,
                  reviewedById: s.reviewedById,
                  reviewNotes: s.reviewNotes,
                }}
                fields={FIELDS}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
