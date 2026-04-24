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

  const participants = await db.user.findMany({
    where: { role: "PARTICIPANT" },
    include: {
      participantProfile: { include: { cohort: true } },
      podMembership: { include: { pod: true } },
      submissions: true,
    },
    orderBy: { name: "asc" },
  });

  const approvedGates = await db.gateReview.findMany({
    where: { decision: "APPROVED" },
    include: { submission: { select: { userId: true } } },
  });

  const approvedByUser = new Map<string, number>();
  approvedGates.forEach(gr => {
    approvedByUser.set(gr.submission.userId, (approvedByUser.get(gr.submission.userId) ?? 0) + 1);
  });

  const url = new URL(req.url);
  const format = url.searchParams.get("format");

  const rows = participants.map(p => ({
    name: p.name,
    email: p.email,
    cohort: p.participantProfile?.cohort?.name ?? "",
    pod: p.podMembership?.pod.name ?? "",
    currentMonth: p.participantProfile?.currentMonth ?? 1,
    phasesSubmitted: p.submissions.filter(s => s.status === "SUBMITTED").length,
    gatesApproved: approvedByUser.get(p.id) ?? 0,
  }));

  if (format === "csv") {
    const headers = ["Name", "Email", "Cohort", "Pod", "Current Month", "Phases Submitted", "Gates Approved"];
    const csvRows = [
      headers.join(","),
      ...rows.map(r => [
        `"${r.name}"`, `"${r.email}"`, `"${r.cohort}"`, `"${r.pod}"`,
        r.currentMonth, r.phasesSubmitted, r.gatesApproved,
      ].join(",")),
    ].join("\n");

    return new Response(csvRows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="progress-report-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json(rows);
}
