import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";
import { computeStatus, computeUnlocked, formatDeadline } from "@/lib/milestones";
import { MilestoneForm, type MilestoneField } from "@/components/journey/milestone-form";
import { Search, Lock } from "lucide-react";
import Link from "next/link";

const FIELDS: MilestoneField[] = [
  {
    key: "initiativeType",
    label: "Initiative type",
    type: "radio",
    helper: "Select the type of initiative you are building. This is captured once here.",
    required: true,
    options: [
      { value: "NEW_BUSINESS", label: "I am starting a new business or organisation" },
      { value: "WORKPLACE_SOLUTION", label: "I am building a solution within my current workplace" },
    ],
  },
  {
    key: "refinedProblemStatement",
    label: "Refined problem statement",
    type: "textarea",
    helper: "Update your original problem statement based on what you learned in your external validation conversations.",
    required: true,
  },
  {
    key: "conversationsSummary",
    label: "Conversations with beneficiaries (minimum 3)",
    type: "textarea",
    helper: "For each conversation, note: the person's role, the date you spoke, and the key findings. You must have spoken with at least 3 people directly affected by the problem.",
    required: true,
  },
  {
    key: "whatIsNowClearer",
    label: "What is now clearer",
    type: "textarea",
    helper: "What did you learn that you didn't know before these conversations?",
    required: true,
  },
  {
    key: "whatTheyHadWrong",
    label: "What they had wrong",
    type: "textarea",
    helper: "Which of your original assumptions were challenged or proven incorrect?",
    required: true,
  },
  {
    key: "changesToMVI",
    label: "Changes to MVI",
    type: "textarea",
    helper: "How has your Minimum Viable Initiative changed based on this validation?",
    required: true,
  },
  {
    key: "mviBuildProgress",
    label: "MVI build progress",
    type: "textarea",
    helper: "What have you started building, if anything? Optional.",
    required: false,
  },
  {
    key: "supportingFile",
    label: "Supporting evidence",
    type: "file",
    helper: "Upload any supporting documents — interview notes, photos, or data. PDF, Word, or PPT. Optional.",
    required: false,
    accept: ".pdf,.doc,.docx,.ppt,.pptx",
  },
];

export default async function Milestone1Page() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Check unlock status
  const allSubmissions = await db.milestoneSubmission.findMany({
    where: { userId: session.user.id },
    select: { milestoneType: true, status: true, submittedAt: true },
  });
  const unlocked = computeUnlocked(allSubmissions);
  if (!unlocked.includes(MilestoneType.MILESTONE_1)) redirect("/participant");

  const submission = await db.milestoneSubmission.findUnique({
    where: {
      userId_milestoneType: {
        userId: session.user.id,
        milestoneType: MilestoneType.MILESTONE_1,
      },
    },
  });

  const status = computeStatus(MilestoneType.MILESTONE_1, submission);
  const isSubmitted = status === MilestoneStatus.SUBMITTED;
  const initialValues = (submission?.formData ?? {}) as Record<string, string>;

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[780px]">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(200,151,58,0.15)] border border-[#C8973A]/30 flex items-center justify-center shrink-0">
          <Search size={22} className="text-[#FCD34D]" />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary leading-tight">
            Milestone 1 — External Validation
          </h1>
          <p className="text-text-secondary text-[13px] mt-1">
            Stage: UNDERSTAND + ENVISION — Validate the problem and refine your solution
          </p>
          <p className="text-[#A3A3A3] text-[11px] mt-0.5">
            Due {formatDeadline(MilestoneType.MILESTONE_1)}
          </p>
        </div>
      </div>

      {/* Context callout */}
      <div className="callout-identity mb-5">
        <p className="text-[13px] font-semibold text-text-primary mb-1">What you need to do</p>
        <p className="text-[13px] text-text-primary leading-relaxed">
          Have at least 3 conversations with people directly affected by the problem in your MVI Brief.
          Your goal is to understand the problem more deeply — not to pitch your solution. Let what you hear refine your thinking.
        </p>
      </div>

      <MilestoneForm
        milestoneType={MilestoneType.MILESTONE_1}
        fields={FIELDS}
        initialValues={initialValues}
        isSubmitted={isSubmitted}
      />

      <p className="text-center text-[11px] text-[#A3A3A3] mt-6">
        Once you submit, Milestone 2 will unlock automatically.
      </p>
    </div>
  );
}
