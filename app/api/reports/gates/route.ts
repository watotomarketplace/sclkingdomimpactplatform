import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.PROGRAM_ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviews = await db.gateReview.findMany({
    include: {
      submission: { include: { user: true } },
      reviewer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const url = new URL(req.url);
  const format = url.searchParams.get("format");

  const rows = reviews.map(r => ({
    participant: r.submission.user.name,
    email: r.submission.user.email,
    month: r.submission.month,
    phase: r.submission.phase,
    decision: r.decision ?? "PENDING",
    reviewer: r.reviewer?.name ?? "—",
    reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : "—",
    submittedAt: new Date(r.createdAt).toLocaleDateString(),
  }));

  if (format === "csv") {
    const headers = ["Participant", "Email", "Month", "Phase", "Decision", "Reviewer", "Reviewed At", "Submitted At"];
    const csvRows = [
      headers.join(","),
      ...rows.map(r => [
        `"${r.participant}"`, `"${r.email}"`, r.month, `"${r.phase}"`,
        `"${r.decision}"`, `"${r.reviewer}"`, `"${r.reviewedAt}"`, `"${r.submittedAt}"`,
      ].join(",")),
    ].join("\n");

    return new Response(csvRows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="gate-summary-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json(rows);
}
