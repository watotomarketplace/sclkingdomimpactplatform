import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ExportButton } from "@/components/shared/export-button";
import {
  ClipboardCheck,
  CheckCircle2,
  RefreshCw,
  XCircle,
} from "lucide-react";

export default async function GateReportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.PROGRAM_ADMIN)) redirect("/");

  const reviews = await db.gateReview.findMany({
    include: {
      submission: { include: { user: true } },
      reviewer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = reviews.length;
  const approved = reviews.filter((r) => r.decision === "APPROVED").length;
  const revision = reviews.filter(
    (r) => r.decision === "REVISION_REQUESTED"
  ).length;
  const redirected = reviews.filter(
    (r) => r.decision === "REDIRECTED"
  ).length;
  const pending = reviews.filter((r) => r.decision === null).length;
  const approvalRate =
    total > 0 ? Math.round((approved / total) * 100) : 0;

  return (
    <div className="px-6 py-6 max-w-[1100px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[28px] font-semibold text-text-primary">
            Gate Summary Report
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Gate review decisions across all participants
          </p>
        </div>
        <ExportButton
          endpoint="/api/reports/gates?format=csv"
          filename="gate-summary.csv"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card padding="sm">
          <CardLabel className="flex items-center gap-1">
            <ClipboardCheck size={11} />
            TOTAL
          </CardLabel>
          <p className="text-[26px] font-semibold text-text-primary font-mono">
            {total}
          </p>
        </Card>
        <Card padding="sm">
          <CardLabel className="flex items-center gap-1">
            <CheckCircle2 size={11} />
            APPROVED
          </CardLabel>
          <p className="text-[26px] font-semibold text-accent-primary font-mono">
            {approved}
          </p>
          <p className="text-xs text-text-secondary">{approvalRate}% rate</p>
        </Card>
        <Card padding="sm">
          <CardLabel className="flex items-center gap-1">
            <RefreshCw size={11} />
            REVISION
          </CardLabel>
          <p className="text-[26px] font-semibold text-accent-warning font-mono">
            {revision}
          </p>
        </Card>
        <Card padding="sm">
          <CardLabel className="flex items-center gap-1">
            <XCircle size={11} />
            REDIRECTED
          </CardLabel>
          <p className="text-[26px] font-semibold text-accent-danger font-mono">
            {redirected}
          </p>
        </Card>
        <Card padding="sm">
          <CardLabel>PENDING</CardLabel>
          <p className="text-[26px] font-semibold text-text-primary font-mono">
            {pending}
          </p>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="px-5 py-3 border-b border-border grid grid-cols-12 gap-3">
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-3">
            PARTICIPANT
          </span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-1">
            GATE
          </span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-1">
            PHASE
          </span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-2">
            DECISION
          </span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-2">
            REVIEWER
          </span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary col-span-3">
            DATE
          </span>
        </div>
        {reviews.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-text-secondary text-sm">
              No gate reviews yet.
            </p>
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="px-5 py-3 border-b border-border last:border-0 grid grid-cols-12 gap-3 items-center"
            >
              <div className="col-span-3">
                <p className="text-[14px] font-medium text-text-primary">
                  {r.submission.user.name}
                </p>
                <p className="text-xs text-text-secondary">
                  {r.submission.user.email}
                </p>
              </div>
              <p className="text-sm text-text-secondary col-span-1">
                {r.submission.month}
              </p>
              <p className="text-sm text-text-secondary col-span-1">
                {r.submission.phase}
              </p>
              <div className="col-span-2">
                {r.decision ? (
                  <Badge
                    variant={
                      r.decision === "APPROVED"
                        ? "approved"
                        : r.decision === "REVISION_REQUESTED"
                        ? "needs-attention"
                        : "escalate"
                    }
                  >
                    {r.decision === "APPROVED"
                      ? "Approved"
                      : r.decision === "REVISION_REQUESTED"
                      ? "Revision"
                      : "Redirected"}
                  </Badge>
                ) : (
                  <Badge variant="pending">Pending</Badge>
                )}
              </div>
              <p className="text-sm text-text-secondary col-span-2">
                {r.reviewer?.name ?? "—"}
              </p>
              <p className="text-sm text-text-secondary col-span-3">
                {r.reviewedAt
                  ? formatDate(r.reviewedAt)
                  : r.decision === null
                  ? "—"
                  : formatDate(r.createdAt)}
              </p>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
