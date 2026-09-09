import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MilestoneType, MilestoneStatus } from "@/app/generated/prisma/enums";
import { computeStatus } from "@/lib/milestones";
import { formatDate } from "@/lib/utils";
import { parseUploadedFiles } from "@/lib/files";
import { MILESTONE_4_FIELDS as FIELDS } from "@/lib/milestone-4-fields";
import { FinalSubmissionPrintButton } from "@/components/journey/final-submission-print-button";
import { Sparkles, CheckCircle2, Paperclip } from "lucide-react";
import Link from "next/link";

/**
 * Printable / downloadable Final Submission report for Milestone 4.
 * Styled to echo the in-app gold/green Kingdom Impact palette so a
 * "Print → Save as PDF" produces a branded report, not a plain document.
 */
export default async function Milestone4FinalSubmissionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { participantProfile: { include: { cohort: true } } },
  });
  if (!user) redirect("/login");

  const submission = await db.milestoneSubmission.findUnique({
    where: {
      userId_milestoneType: {
        userId: session.user.id,
        milestoneType: MilestoneType.MILESTONE_4,
      },
    },
  });

  const status = computeStatus(MilestoneType.MILESTONE_4, submission);
  if (status !== MilestoneStatus.SUBMITTED || !submission) {
    redirect("/participant/journey/milestone-4");
  }

  const values = (submission.formData ?? {}) as Record<string, string>;
  const initiativeName = values.initiativeNameFinal || "Kingdom Impact Initiative";

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @media print {
          @page { margin: 0.6in; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Controls — hidden when printing */}
      <div className="print:hidden sticky top-0 bg-white border-b border-border px-6 py-3 flex items-center justify-between z-10">
        <div>
          <p className="text-[15px] font-semibold text-text-primary">Final Submission Report</p>
          <p className="text-xs text-text-secondary">Milestone 4 — ready to download</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/participant/journey/milestone-4" className="text-sm text-text-secondary hover:text-text-primary">
            ← Back
          </Link>
          <FinalSubmissionPrintButton />
        </div>
      </div>

      {/* Report */}
      <div className="max-w-[800px] mx-auto">
        {/* Top ribbon */}
        <div className="h-2 bg-gradient-to-r from-[#2D5A3D] via-[#C8973A] to-[#86EFAC] print:break-inside-avoid" />

        <div className="px-8 py-10 print:px-6 print:py-8">
          {/* Cover header */}
          <div className="flex items-start gap-4 mb-8 pb-8 border-b-2 border-gray-200">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(200,151,58,0.20)] border border-[#C8973A]/50 flex items-center justify-center shrink-0">
              <Sparkles size={26} className="text-[#C8973A]" />
            </div>
            <div className="flex-1">
              <p className="section-label mb-1">KINGDOM IMPACT WORK</p>
              <h1 className="font-display text-[30px] font-semibold text-text-primary leading-tight mb-1">
                Final Submission Report
              </h1>
              <h2 className="font-display text-[18px] text-[#C8973A] mb-4">{initiativeName}</h2>
              <div className="flex items-center gap-2 flex-wrap text-sm text-text-secondary">
                <span className="chip-submitted flex items-center gap-1">
                  <CheckCircle2 size={11} /> Submitted
                </span>
                <span>·</span>
                <span><span className="font-medium text-text-primary">{user.name}</span></span>
                {user.participantProfile?.cohort && (
                  <>
                    <span>·</span>
                    <span>{user.participantProfile.cohort.name}</span>
                  </>
                )}
                {submission.submittedAt && (
                  <>
                    <span>·</span>
                    <span>Submitted {formatDate(submission.submittedAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            {FIELDS.map((field) => {
              const val = values[field.key];
              return (
                <div
                  key={field.key}
                  className="rounded-lg border border-border border-l-4 border-l-[#C8973A] px-4 py-3 print:break-inside-avoid"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a6a25] mb-1">
                    {field.label}
                  </p>
                  {field.type === "file" || field.type === "audio" ? (
                    (() => {
                      const files = parseUploadedFiles(val);
                      return files.length > 0 ? (
                        <div className="space-y-1">
                          {files.map((f) => (
                            <a
                              key={f.url}
                              href={f.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[13px] text-[#2D5A3D] font-medium underline flex items-center gap-1.5"
                            >
                              <Paperclip size={12} className="shrink-0" />
                              <span className="truncate">{f.name}</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-text-secondary italic text-[13px]">Not provided</span>
                      );
                    })()
                  ) : (
                    <p className="text-[14px] text-text-primary whitespace-pre-wrap leading-relaxed">
                      {val || <span className="text-text-secondary italic">Not provided</span>}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t-2 border-gray-200 text-center">
            <p className="text-sm text-text-primary font-medium mb-1">
              🙏 Journey complete — well done, {user.name.split(" ")[0]}.
            </p>
            <p className="text-xs text-text-secondary">
              SCL Kingdom Impact Work Platform · Confidential participant record
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Generated {formatDate(new Date())}</p>
          </div>
        </div>

        {/* Bottom ribbon */}
        <div className="h-2 bg-gradient-to-r from-[#86EFAC] via-[#C8973A] to-[#2D5A3D]" />
      </div>
    </div>
  );
}
