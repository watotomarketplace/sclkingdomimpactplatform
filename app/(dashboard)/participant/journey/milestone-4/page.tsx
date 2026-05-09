import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";
import { computeStatus, computeUnlocked, formatDeadline } from "@/lib/milestones";
import { MilestoneForm, type MilestoneField } from "@/components/journey/milestone-form";
import { Sparkles } from "lucide-react";

const FIELDS: MilestoneField[] = [
  {
    key: "initiativeNameFinal",
    label: "Initiative name (final)",
    type: "text",
    helper: "The final name of your initiative — may have evolved from your working title.",
    required: true,
  },
  {
    key: "brokennessAddressed",
    label: "The brokenness addressed",
    type: "textarea",
    helper: "Final framing of the problem your initiative addresses.",
    required: true,
  },
  {
    key: "whatWasBuilt",
    label: "What was built",
    type: "textarea",
    helper: "Describe your MVI as implemented — what it is, how it works, and who it serves.",
    required: true,
  },
  {
    key: "whatChangedWithEvidence",
    label: "What changed — with evidence",
    type: "textarea",
    helper: "Measurable or observable impact. Be specific: numbers, stories, behaviours that have shifted.",
    required: true,
  },
  {
    key: "whatDidntWork",
    label: "What didn't work, and why",
    type: "textarea",
    helper: "Honest reflection on failures, pivots, and the things you tried that didn't land.",
    required: true,
  },
  {
    key: "whatTheyWouldDoDifferently",
    label: "What you would do differently",
    type: "textarea",
    helper: "If you were starting again with what you now know, what would you change?",
    required: true,
  },
  {
    key: "whatHappensNext",
    label: "What happens next",
    type: "textarea",
    helper: "What is your sustainability plan after this cohort? Who carries this forward, and how?",
    required: true,
  },
  {
    key: "dedication",
    label: "Who this report is dedicated to",
    type: "textarea",
    helper: "A personal dedication — optional.",
    required: false,
  },
  {
    key: "presentationFile",
    label: "Final presentation file",
    type: "file",
    helper: "Upload your final presentation (PPT or PDF, 7–8 minutes). Required to submit.",
    required: true,
    accept: ".pdf,.ppt,.pptx",
  },
];

export default async function Milestone4Page() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const allSubmissions = await db.milestoneSubmission.findMany({
    where: { userId: session.user.id },
    select: { milestoneType: true, status: true, submittedAt: true },
  });
  const unlocked = computeUnlocked(allSubmissions);
  if (!unlocked.includes(MilestoneType.MILESTONE_4)) redirect("/participant");

  const submission = await db.milestoneSubmission.findUnique({
    where: {
      userId_milestoneType: {
        userId: session.user.id,
        milestoneType: MilestoneType.MILESTONE_4,
      },
    },
  });

  const status = computeStatus(MilestoneType.MILESTONE_4, submission);
  const isSubmitted = status === MilestoneStatus.SUBMITTED;
  const initialValues = (submission?.formData ?? {}) as Record<string, string>;

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[780px]">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(200,151,58,0.20)] border border-[#C8973A]/50 flex items-center justify-center shrink-0">
          <Sparkles size={22} className="text-[#FCD34D]" />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary leading-tight">
            Milestone 4 — Final Submission
          </h1>
          <p className="text-text-secondary text-[13px] mt-1">
            Stage: LAUNCH &amp; MEASURE — What evidence shows this is working, and what healing has begun?
          </p>
          <p className="text-[#A3A3A3] text-[11px] mt-0.5">
            Due {formatDeadline(MilestoneType.MILESTONE_4)}
          </p>
        </div>
      </div>

      <div className="callout-gold mb-5">
        <p className="text-[13px] font-semibold text-text-primary mb-1">🎉 You're at the finish line</p>
        <p className="text-[13px] text-text-primary leading-relaxed">
          This is your final submission. Take time to document your evidence thoroughly —
          your story of healing is what this entire journey has been building toward.
          Your submission will be shared at the cohort graduation showcase.
        </p>
      </div>

      <MilestoneForm
        milestoneType={MilestoneType.MILESTONE_4}
        fields={FIELDS}
        initialValues={initialValues}
        isSubmitted={isSubmitted}
      />

      <p className="text-center text-[11px] text-[#A3A3A3] mt-6">
        Submitting Milestone 4 completes your Kingdom Impact Work journey. Well done. 🙏
      </p>
    </div>
  );
}
