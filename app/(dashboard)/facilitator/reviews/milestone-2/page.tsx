import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess, isAdmin } from "@/lib/roles";
import { Role, MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";
import { ReviewSearchList } from "@/components/facilitator/review-search-list";
import { Hammer } from "lucide-react";

const FIELDS = [
  { key: "testCycle1Date",         label: "Test cycle 1 — Date" },
  { key: "testCycle1Assumption",   label: "Test cycle 1 — Assumption tested" },
  { key: "testCycle1WhatBuilt",    label: "Test cycle 1 — What was built" },
  { key: "testCycle1WhoTested",    label: "Test cycle 1 — Who tested it" },
  { key: "testCycle1WhatTheyDid",  label: "Test cycle 1 — What they actually did" },
  { key: "testCycle1WhatLearned",  label: "Test cycle 1 — What was learned" },
  { key: "testCycle2",             label: "Test cycle 2 (if applicable)" },
  { key: "behaviouralEvidence",    label: "Real behavioural evidence" },
  { key: "mviStatus",              label: "MVI status" },
  { key: "supportingFile",         label: "Supporting evidence (file)" },
  { key: "audioNote",              label: "Audio note" },
];

export default async function ReviewMilestone2Page() {
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
    where: { milestoneType: MilestoneType.MILESTONE_2, status: MilestoneStatus.SUBMITTED, ...participantFilter },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { submittedAt: "asc" },
  });

  const reviewed = submissions.filter((s) => s.reviewedById);
  const pending = submissions.filter((s) => !s.reviewedById);

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[1400px]">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(200,151,58,0.15)] border border-[#C8973A]/30 flex items-center justify-center shrink-0">
          <Hammer size={22} className="text-[#FCD34D]" />
        </div>
        <div>
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary">Milestone 2 Reviews — Build &amp; Test</h1>
          <p className="text-text-secondary text-[13px] mt-1">{pending.length} pending · {reviewed.length} reviewed</p>
        </div>
      </div>

      <ReviewSearchList
        submissions={submissions.map((s) => ({
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
        }))}
        fields={FIELDS}
        emptyLabel="No Milestone 2 submissions yet."
      />
    </div>
  );
}
