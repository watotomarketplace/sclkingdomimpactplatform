import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";
import { computeStatus, computeUnlocked, formatDeadline } from "@/lib/milestones";
import { MilestoneForm, type MilestoneField } from "@/components/journey/milestone-form";
import { Hammer } from "lucide-react";

const FIELDS: MilestoneField[] = [
  {
    key: "whereRunningNow",
    label: "Where your MVI is running now",
    type: "textarea",
    helper: "Describe the current deployment context — where, with whom, and in what format your initiative is operating.",
    required: true,
  },
  {
    key: "frequencyRhythm",
    label: "Frequency and rhythm",
    type: "textarea",
    helper: "How often does your initiative run? With how many people, and in what rhythm?",
    required: true,
  },
  {
    key: "numbersReached",
    label: "Numbers",
    type: "textarea",
    helper: "How many people have you reached, served, paid, or who have returned? Be specific.",
    required: true,
  },
  {
    key: "specificImpactStory",
    label: "A specific story of impact",
    type: "textarea",
    helper: "Describe one concrete example — a real person, what changed for them because of your initiative.",
    required: true,
  },
  {
    key: "resistanceWhatPushedBack",
    label: "Resistance — what pushed back",
    type: "textarea",
    helper: "What encountered resistance or friction in this phase?",
    required: true,
  },
  {
    key: "resistanceFromWhom",
    label: "Resistance — from whom",
    type: "textarea",
    helper: "Who resisted — stakeholders, beneficiaries, institutions, or your own assumptions?",
    required: true,
  },
  {
    key: "resistanceHowResponded",
    label: "Resistance — how you responded",
    type: "textarea",
    helper: "What did you do in response to the resistance?",
    required: true,
  },
  {
    key: "whatIsBecomingClearer",
    label: "What is becoming clearer",
    type: "textarea",
    helper: "What are you learning about the brokenness you are addressing, and about the healing that is possible?",
    required: true,
  },
  {
    key: "artefact",
    label: "An artefact",
    type: "file",
    helper: "Upload a photo, document, recording, or screenshot of your MVI in action. Optional.",
    required: false,
    accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4",
  },
];

export default async function Milestone3Page() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const allSubmissions = await db.milestoneSubmission.findMany({
    where: { userId: session.user.id },
    select: { milestoneType: true, status: true, submittedAt: true },
  });
  const unlocked = computeUnlocked(allSubmissions);
  if (!unlocked.includes(MilestoneType.MILESTONE_3)) redirect("/participant");

  const submission = await db.milestoneSubmission.findUnique({
    where: {
      userId_milestoneType: {
        userId: session.user.id,
        milestoneType: MilestoneType.MILESTONE_3,
      },
    },
  });

  const status = computeStatus(MilestoneType.MILESTONE_3, submission);
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
            Milestone 3 — Implementation
          </h1>
          <p className="text-text-secondary text-[13px] mt-1">
            Stage: BUILD — Implementing, iterating, and documenting what you are learning.
          </p>
          <p className="text-[#A3A3A3] text-[11px] mt-0.5">
            Due {formatDeadline(MilestoneType.MILESTONE_3)}
          </p>
        </div>
      </div>

      <div className="callout-identity mb-5">
        <p className="text-[13px] font-semibold text-text-primary mb-1">What you need to do</p>
        <p className="text-[13px] text-text-primary leading-relaxed">
          Run your initiative with your target community. Document what is happening — challenges,
          adaptations, and early signs of healing. This is the longest phase: be patient, be faithful.
        </p>
      </div>

      <MilestoneForm
        milestoneType={MilestoneType.MILESTONE_3}
        fields={FIELDS}
        initialValues={initialValues}
        isSubmitted={isSubmitted}
      />

      <p className="text-center text-[11px] text-[#A3A3A3] mt-6">
        Once you submit, Milestone 4 will unlock automatically.
      </p>
    </div>
  );
}
