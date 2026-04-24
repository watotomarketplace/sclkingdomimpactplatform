import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, MONTH_TITLES } from "@/lib/utils";
import { PrintWorkbookButton } from "@/app/(dashboard)/participant/workbook/print-button";

export default async function WorkbookPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      participantProfile: { include: { cohort: true } },
      submissions: { orderBy: [{ month: "asc" }, { phase: "asc" }] },
      scorecards: { orderBy: { month: "asc" } },
      journals: { orderBy: { month: "asc" } },
      receivedCoachingNotes: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!user) redirect("/login");

  const currentMonth = user.participantProfile?.currentMonth ?? 1;

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @media print {
          @page { margin: 0.75in; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Print controls — hidden when printing */}
      <div className="print:hidden sticky top-0 bg-white border-b border-border px-6 py-3 flex items-center justify-between z-10">
        <div>
          <p className="text-[15px] font-semibold text-text-primary">Kingdom Impact Workbook</p>
          <p className="text-xs text-text-secondary">Your complete journey record</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/participant" className="text-sm text-text-secondary hover:text-text-primary">← Dashboard</a>
          <PrintWorkbookButton />
        </div>
      </div>

      {/* Workbook content */}
      <div className="max-w-[800px] mx-auto px-8 py-10 print:px-6 print:py-8">

        {/* Cover */}
        <div className="mb-10 pb-8 border-b-2 border-gray-200 print:break-after-page">
          <h1 className="font-display text-[36px] font-semibold text-text-primary mb-2">
            Kingdom Impact Work
          </h1>
          <h2 className="font-display text-[22px] text-text-secondary mb-6">Participant Workbook</h2>
          <div className="space-y-1 text-sm text-text-secondary">
            <p><span className="font-medium text-text-primary">Participant:</span> {user.name}</p>
            <p><span className="font-medium text-text-primary">Email:</span> {user.email}</p>
            {user.participantProfile?.cohort && (
              <p><span className="font-medium text-text-primary">Cohort:</span> {user.participantProfile.cohort.name}</p>
            )}
            <p><span className="font-medium text-text-primary">Progress:</span> Month {currentMonth} of 6 — {MONTH_TITLES[currentMonth]}</p>
            <p><span className="font-medium text-text-primary">Exported:</span> {formatDate(new Date())}</p>
          </div>
        </div>

        {/* Submissions by month */}
        {[1, 2, 3, 4, 5, 6].map((month) => {
          const monthSubs = user.submissions.filter(s => s.month === month && s.status === "SUBMITTED");
          const monthScorecard = user.scorecards.find(sc => sc.month === month);
          const monthJournal = user.journals.find(j => j.month === month);
          if (!monthSubs.length && !monthScorecard && !monthJournal) return null;

          return (
            <div key={month} className="mb-10 print:break-inside-avoid-page">
              <h2 className="font-display text-[22px] font-semibold text-text-primary mb-1 border-b border-gray-200 pb-2">
                Month {month} — {MONTH_TITLES[month]}
              </h2>

              {/* Phase submissions */}
              {monthSubs.map(sub => (
                <div key={sub.id} className="mb-6">
                  <h3 className="text-[15px] font-semibold text-text-primary mb-3">Phase {sub.phase} Submission</h3>
                  {sub.submittedAt && (
                    <p className="text-xs text-text-secondary mb-3">Submitted {formatDate(sub.submittedAt)}</p>
                  )}
                  <div className="space-y-3">
                    {Object.entries(sub.formData as Record<string, string>)
                      .filter(([, v]) => v?.trim())
                      .map(([key, val]) => (
                        <div key={key}>
                          <p className="text-[11px] uppercase tracking-wider font-medium text-text-secondary mb-0.5">
                            {key.replace(/_/g, " ")}
                          </p>
                          <p className="text-sm text-text-primary whitespace-pre-wrap">{val}</p>
                        </div>
                      ))}
                  </div>
                </div>
              ))}

              {/* Scorecard */}
              {monthScorecard && (
                <div className="mb-6">
                  <h3 className="text-[15px] font-semibold text-text-primary mb-3">Scorecard</h3>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    {[
                      ["Problem Clarity", monthScorecard.problemClarity],
                      ["Research Effort", monthScorecard.researchEffort],
                      ["Execution Discipline", monthScorecard.executionDiscipline],
                      ["MVP Progress", monthScorecard.mvpProgress],
                      ["Kingdom Alignment", monthScorecard.kingdomAlignment],
                      ["Peer Engagement", monthScorecard.peerEngagement],
                    ].map(([label, val]) => (
                      <div key={label as string} className="border border-gray-200 rounded-lg p-2">
                        <p className="text-text-secondary mb-0.5">{label}</p>
                        <p className={`font-semibold ${val === "ON_TRACK" ? "text-green-700" : val === "NEEDS_ATTENTION" ? "text-amber-600" : "text-red-600"}`}>
                          {val === "ON_TRACK" ? "On Track" : val === "NEEDS_ATTENTION" ? "Needs Attention" : "Escalate"}
                        </p>
                      </div>
                    ))}
                  </div>
                  {monthScorecard.facilitatorNotes && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3">
                      <p className="text-[11px] uppercase tracking-wider font-medium text-text-secondary mb-1">Facilitator Notes</p>
                      <p className="text-sm text-text-primary">{monthScorecard.facilitatorNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Journal */}
              {monthJournal && !monthJournal.isPrivate && (
                <div className="mb-6">
                  <h3 className="text-[15px] font-semibold text-text-primary mb-3">Kingdom Journal</h3>
                  <div className="space-y-3">
                    {[monthJournal.prompt1, monthJournal.prompt2, monthJournal.prompt3, monthJournal.prompt4, monthJournal.prompt5]
                      .filter(Boolean)
                      .map((text, i) => (
                        <div key={i}>
                          <p className="text-[11px] uppercase tracking-wider font-medium text-text-secondary mb-0.5">Reflection {i + 1}</p>
                          <p className="text-sm text-text-primary whitespace-pre-wrap">{text}</p>
                        </div>
                      ))}
                    {monthJournal.freeNotes && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider font-medium text-text-secondary mb-0.5">Additional Notes</p>
                        <p className="text-sm text-text-primary whitespace-pre-wrap">{monthJournal.freeNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Coaching Notes summary */}
        {user.receivedCoachingNotes.length > 0 && (
          <div className="mb-10 print:break-inside-avoid-page">
            <h2 className="font-display text-[22px] font-semibold text-text-primary mb-3 border-b border-gray-200 pb-2">
              Facilitator Coaching Notes
            </h2>
            <div className="space-y-3">
              {user.receivedCoachingNotes.map(note => (
                <div key={note.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-text-secondary">{note.author.name}</p>
                    <p className="text-xs text-text-secondary">{formatDate(note.createdAt)}</p>
                  </div>
                  <p className="text-sm text-text-primary">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-gray-200 pt-6 text-center text-xs text-text-secondary print:mt-10">
          <p>SCL Kingdom Impact Work Platform · Confidential participant record</p>
          <p className="mt-1">Generated {formatDate(new Date())}</p>
        </div>
      </div>
    </div>
  );
}
