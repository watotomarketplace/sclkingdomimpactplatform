import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";
import { computeStatus, computeUnlocked, formatDeadline } from "@/lib/milestones";
import { MilestoneForm, type MilestoneField } from "@/components/journey/milestone-form";
import { Hammer } from "lucide-react";

const FIELDS: MilestoneField[] = [
  {
    key: "testCycle1Date",
    label: "Test cycle 1 — Date",
    type: "date",
    helper: "When did your first test take place?",
    required: true,
  },
  {
    key: "testCycle1Assumption",
    label: "Test cycle 1 — Assumption tested",
    type: "textarea",
    helper: "What were you trying to prove or disprove in this test?",
    required: true,
  },
  {
    key: "testCycle1WhatBuilt",
    label: "Test cycle 1 — What was built",
    type: "textarea",
    helper: "Describe what you created specifically for this test.",
    required: true,
  },
  {
    key: "testCycle1WhoTested",
    label: "Test cycle 1 — Who tested it",
    type: "textarea",
    helper: "Describe the participants — who they are and how they were selected.",
    required: true,
  },
  {
    key: "testCycle1WhatTheyDid",
    label: "Test cycle 1 — What they actually did",
    type: "textarea",
    helper: "Describe observed behaviour — not just what participants said, but what they did.",
    required: true,
  },
  {
    key: "testCycle1WhatLearned",
    label: "Test cycle 1 — What was learned",
    type: "textarea",
    helper: "What are the key lessons from this test cycle?",
    required: true,
  },
  {
    key: "testCycle2",
    label: "Test cycle 2 (if applicable)",
    type: "textarea",
    helper: "If you ran a second iteration, describe it: date, what was tested, who participated, what they did, and what you learned. Optional.",
    required: false,
  },
  {
    key: "behaviouralEvidence",
    label: "Real behavioural evidence",
    type: "textarea",
    helper: "What non-verbal, behavioural evidence (not just polite feedback) did you observe that shows your initiative is or isn't working?",
    required: true,
  },
  {
    key: "mviStatus",
    label: "MVI status",
    type: "textarea",
    helper: "Where does your initiative stand right now? What's working, and what isn't?",
    required: true,
  },
  {
    key: "supportingFile",
    label: "Supporting evidence",
    type: "file",
    helper: "Upload test results, photos, or recordings. PDF, image, or document. Optional.",
    required: false,
    accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif",
  },
  {
    key: "audioNote",
    label: "Audio note",
    type: "audio",
    helper: "Record a voice note reflecting on what you learned. Max 25MB (.mp3 or .m4a). Optional.",
    required: false,
  },
];

export default async function Milestone2Page() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const allSubmissions = await db.milestoneSubmission.findMany({
    where: { userId: session.user.id },
    select: { milestoneType: true, status: true, submittedAt: true },
  });
  const unlocked = computeUnlocked(allSubmissions);
  if (!unlocked.includes(MilestoneType.MILESTONE_2)) redirect("/participant");

  const submission = await db.milestoneSubmission.findUnique({
    where: {
      userId_milestoneType: {
        userId: session.user.id,
        milestoneType: MilestoneType.MILESTONE_2,
      },
    },
  });

  const status = computeStatus(MilestoneType.MILESTONE_2, submission);
  const isSubmitted = status === MilestoneStatus.SUBMITTED;
  const initialValues = (submission?.formData ?? {}) as Record<string, string>;

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[780px]">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(200,151,58,0.15)] border border-[#C8973A]/30 flex items-center justify-center shrink-0">
          <Hammer size={22} className="text-[#FCD34D]" />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary leading-tight">
            Milestone 2 — Build & Test
          </h1>
          <p className="text-text-secondary text-[13px] mt-1">
            Stage: BUILD — What is the smallest version I can create and test with real people?
          </p>
          <p className="text-[#A3A3A3] text-[11px] mt-0.5">
            Due {formatDeadline(MilestoneType.MILESTONE_2)}
          </p>
        </div>
      </div>

      <div className="callout-identity mb-5">
        <p className="text-[13px] font-semibold text-text-primary mb-1">What you need to do</p>
        <p className="text-[13px] text-text-primary leading-relaxed">
          Create the simplest possible version of your initiative and test it with real people.
          The goal is learning — not perfection. Build, test, listen, and iterate.
        </p>
      </div>

      <MilestoneForm
        milestoneType={MilestoneType.MILESTONE_2}
        fields={FIELDS}
        initialValues={initialValues}
        isSubmitted={isSubmitted}
      />

      <p className="text-center text-[11px] text-[#A3A3A3] mt-6">
        Once you submit, Milestone 3 will unlock automatically.
      </p>
    </div>
  );
}
