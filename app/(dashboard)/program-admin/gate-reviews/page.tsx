import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function ProgramAdminGateReviewsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.PROGRAM_ADMIN)) redirect("/");

  const [pendingReviews, reviewedReviews] = await Promise.all([
    db.gateReview.findMany({
      where: { decision: null },
      include: {
        submission: {
          include: {
            user: {
              include: {
                podMembership: {
                  include: { pod: { include: { facilitator: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.gateReview.findMany({
      where: { decision: { not: null } },
      include: {
        submission: { include: { user: true } },
        reviewer: { select: { name: true } },
      },
      orderBy: { reviewedAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="px-6 py-6 max-w-[900px]">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-text-primary">
          Gate Reviews
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {pendingReviews.length} pending review
          {pendingReviews.length !== 1 ? "s" : ""} across all facilitators
        </p>
      </div>

      {pendingReviews.length === 0 && (
        <Card className="py-12 text-center mb-6">
          <p className="text-text-secondary text-sm">
            No pending gate reviews. All caught up!
          </p>
        </Card>
      )}

      {pendingReviews.length > 0 && (
        <div className="space-y-4 mb-8">
          <p className="text-[10px] uppercase tracking-wider font-medium text-text-secondary">
            PENDING REVIEWS
          </p>
          {pendingReviews.map((review) => {
            const participant = review.submission.user;
            const facilitator =
              participant.podMembership?.pod.facilitator;
            return (
              <Card key={review.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[15px] font-medium text-text-primary">
                      {participant.name}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {participant.podMembership?.pod.name ?? "No pod"} · Gate{" "}
                      {review.submission.month} Review
                    </p>
                    <p className="text-xs text-text-secondary">
                      Facilitator: {facilitator?.name ?? "Unassigned"} ·
                      Submitted {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <Badge variant="pending">Pending</Badge>
                </div>

                <details className="mt-3">
                  <summary className="text-xs text-accent-primary cursor-pointer hover:underline">
                    View submission content
                  </summary>
                  <div className="mt-3 space-y-2 bg-bg-base rounded-lg p-3">
                    {Object.entries(
                      review.submission.formData as Record<string, string>
                    )
                      .filter(([, v]) => v)
                      .slice(0, 8)
                      .map(([k, v]) => (
                        <div key={k}>
                          <p className="text-[10px] uppercase font-medium text-text-secondary">
                            {k.replace(/_/g, " ")}
                          </p>
                          <p className="text-[13px] text-text-primary">{v}</p>
                        </div>
                      ))}
                  </div>
                </details>
              </Card>
            );
          })}
        </div>
      )}

      {reviewedReviews.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-medium text-text-secondary mb-3">
            RECENTLY REVIEWED
          </p>
          <div className="space-y-3">
            {reviewedReviews.map((review) => (
              <Card key={review.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium text-text-primary">
                      {review.submission.user.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Gate {review.submission.month} · Reviewed by{" "}
                      {review.reviewer?.name ?? "—"} ·{" "}
                      {review.reviewedAt
                        ? formatDate(review.reviewedAt)
                        : "—"}
                    </p>
                  </div>
                  <Badge
                    variant={
                      review.decision === "APPROVED"
                        ? "approved"
                        : review.decision === "REVISION_REQUESTED"
                        ? "needs-attention"
                        : "escalate"
                    }
                  >
                    {review.decision === "APPROVED"
                      ? "Approved"
                      : review.decision === "REVISION_REQUESTED"
                      ? "Revision Requested"
                      : "Redirected"}
                  </Badge>
                </div>
                {review.feedback && (
                  <p className="text-xs text-text-secondary mt-1 italic">
                    &ldquo;{review.feedback.slice(0, 100)}&rdquo;
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
