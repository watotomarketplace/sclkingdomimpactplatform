import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Compass, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { formatDeadline, computeStatus } from "@/lib/milestones";
import { MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";
import Link from "next/link";

const FIELD_LABELS: Record<string, string> = {
  initiativeName:    "Initiative name",
  problemStatement:  "Problem statement",
  healingHoped:      "The healing you hope to see",
  beneficiaries:     "Beneficiaries",
  mviSummary:        "MVI summary",
  singleAssumption:  "Single assumption to test",
  buyInNeeded:       "Buy-in needed",
  resourcesRequired: "Resources required",
  realisticTimeline: "Realistic timeline",
  likelyResistance:  "Likely resistance",
  evidencePlan:      "Evidence plan",
  firstTestDate:     "First test date",
};

const FIELD_ORDER = Object.keys(FIELD_LABELS);

export default async function OnboardingJourneyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const submission = await db.milestoneSubmission.findUnique({
    where: {
      userId_milestoneType: {
        userId: session.user.id,
        milestoneType: MilestoneType.ONBOARDING,
      },
    },
  });

  const status = computeStatus(MilestoneType.ONBOARDING, submission);
  const isSubmitted = status === MilestoneStatus.SUBMITTED;
  const brief = (submission?.formData ?? {}) as Record<string, string>;

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[780px]">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(200,151,58,0.20)] border border-[#C8973A]/40 flex items-center justify-center shrink-0">
          <Compass size={22} className="text-[#FCD34D]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary leading-tight">
              Onboarding — MVI Brief
            </h1>
            {isSubmitted ? (
              <span className="chip-submitted flex items-center gap-1">
                <CheckCircle2 size={11} /> Submitted
              </span>
            ) : (
              <span className="chip-in-progress flex items-center gap-1">
                <Clock size={11} /> In Progress
              </span>
            )}
          </div>
          <p className="text-text-secondary text-[13px] mt-1">
            Stage: SEE — What brokenness exists in my sphere of influence?
          </p>
          {!isSubmitted && (
            <p className="text-[#A3A3A3] text-[11px] mt-0.5">
              Due {formatDeadline(MilestoneType.ONBOARDING)}
            </p>
          )}
        </div>
      </div>

      {/* Not yet submitted — redirect to onboarding */}
      {!isSubmitted && !submission && (
        <div className="glass-2 p-6 text-center">
          <Compass size={32} className="text-[#C8973A] mx-auto mb-3" />
          <p className="text-text-primary font-semibold text-[15px] mb-1">Your MVI Brief is not yet submitted.</p>
          <p className="text-text-secondary text-[13px] mb-4">
            Complete your Minimum Viable Initiative Brief to start your Kingdom Impact Work journey.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 btn-base btn-gold px-5 py-2.5 text-[14px]"
          >
            Complete MVI Brief
            <ChevronRight size={16} />
          </Link>
        </div>
      )}

      {/* Draft in progress */}
      {!isSubmitted && submission && (
        <div className="callout-gold mb-4">
          <p className="text-[13px] font-medium">
            Your MVI Brief is saved as a draft. Complete and submit it from the onboarding page.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#FCD34D] mt-2 hover:underline"
          >
            Continue filling in your brief <ChevronRight size={13} />
          </Link>
        </div>
      )}

      {/* Submitted brief — read-only view */}
      {isSubmitted && (
        <>
          <div className="callout-gold mb-5 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[13px] font-medium">
              ✅ Your MVI Brief has been submitted and will be reviewed by your facilitator during the Day 3 onboarding slot.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#FCD34D] hover:underline shrink-0"
            >
              Edit submission <ChevronRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {FIELD_ORDER.map((key) => (
              <div key={key} className="glass-2 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1">
                  {FIELD_LABELS[key]}
                </p>
                <p className="text-[14px] text-text-primary leading-relaxed whitespace-pre-wrap">
                  {brief[key] || <span className="text-[#A3A3A3] italic">Not provided</span>}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 glass-2 p-4">
            <p className="section-label mb-2">NEXT STEP</p>
            <p className="text-[13px] text-text-secondary mb-3">
              After your facilitator reviews your brief, Milestone 1 (External Validation) will unlock.
            </p>
            <Link
              href="/participant"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#C8973A] hover:text-[#FCD34D] transition-colors"
            >
              Back to Dashboard <ChevronRight size={14} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
