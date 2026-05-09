import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/enums";

/**
 * GET /api/admin/export?type=participants|milestones|meeting-summaries|coaching-notes
 * Returns CSV download for super admins.
 */

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return lines.join("\n");
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAccess(session.user.role, Role.SUPER_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  let csv = "";
  let filename = "export.csv";

  if (type === "participants") {
    const users = await db.user.findMany({
      where: { role: { in: [Role.PARTICIPANT, Role.GROUP_LEADER, Role.FACILITATOR] } },
      include: { podMembership: { include: { pod: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    csv = toCSV(users.map((u) => ({
      name: u.name,
      email: u.email,
      role: u.role,
      group: u.podMembership?.pod?.name ?? "",
      campus: u.campus ?? "",
      phone: u.phone ?? "",
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
    })));
    filename = "participants.csv";
  } else if (type === "milestones") {
    const subs = await db.milestoneSubmission.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { submittedAt: "desc" },
    });
    csv = toCSV(subs.map((s) => ({
      participantName: s.user.name,
      participantEmail: s.user.email,
      milestoneType: s.milestoneType,
      status: s.status,
      submittedAt: s.submittedAt?.toISOString() ?? "",
      reviewed: !!s.reviewedById,
    })));
    filename = "milestone-submissions.csv";
  } else if (type === "meeting-summaries") {
    const summaries = await db.groupMeetingSummary.findMany({
      include: {
        pod: { select: { name: true } },
        author: { select: { name: true } },
      },
      orderBy: { meetingDate: "desc" },
    });
    csv = toCSV(summaries.map((s) => ({
      group: s.pod.name,
      author: s.author.name,
      meetingDate: s.meetingDate.toISOString().split("T")[0],
      format: s.format,
      attendeeCount: (s.attendeeIds as string[]).length,
      summary: s.summary,
      concerns: s.concerns ?? "",
    })));
    filename = "meeting-summaries.csv";
  } else if (type === "coaching-notes") {
    const notes = await db.coachingNote.findMany({
      include: {
        author: { select: { name: true } },
        recipient: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    csv = toCSV(notes.map((n) => ({
      author: n.author.name,
      recipient: n.recipient.name,
      recipientEmail: n.recipient.email,
      content: n.content,
      createdAt: n.createdAt.toISOString(),
    })));
    filename = "coaching-notes.csv";
  } else {
    return NextResponse.json({ error: "Unknown export type." }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
