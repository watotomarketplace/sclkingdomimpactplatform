import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";
import { computeStatus, computeUnlocked, formatDeadline } from "@/lib/milestones";
import { MilestoneForm } from "@/components/journey/milestone-form";
import { MILESTONE_4_FIELDS as FIELDS } from "@/lib/milestone-4-fields";
import { Sparkles, Download } from "lucide-react";
import Link from "next/link";

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

      {isSubmitted && (
        <div className="callout-gold mb-5 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[13px] font-medium">
            🎓 Your Final Submission is complete — congratulations on finishing the journey!
          </p>
          <Link
            href="/participant/journey/milestone-4/final-submission"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 btn-base btn-gold px-4 py-2 text-[13px] shrink-0"
          >
            <Download size={14} /> Download PDF
          </Link>
        </div>
      )}

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
