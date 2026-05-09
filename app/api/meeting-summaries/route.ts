import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hasAccess } from "@/lib/roles";
import { Role, MeetingFormat } from "@/app/generated/prisma/enums";

/**
 * Addendum 3 — Group Meeting Summary API
 * POST /api/meeting-summaries  → submit a meeting summary (Group Leader only)
 * GET  /api/meeting-summaries  → list summaries for the leader's pod
 */

const summarySchema = z.object({
  podId: z.string().min(1),
  meetingDate: z.string().min(1, "Meeting date is required"),
  format: z.nativeEnum(MeetingFormat),
  attendeeIds: z.array(z.string()).min(1, "At least one attendee is required"),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  concerns: z.string().optional().default(""),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAccess(session.user.role, Role.GROUP_LEADER)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = summarySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const { podId, meetingDate, format, attendeeIds, summary, concerns } = parsed.data;

    // Verify the user is actually a leader of this pod
    const membership = await db.podMember.findFirst({
      where: { userId: session.user.id, podId, isLeader: true },
    });
    if (!membership) {
      return NextResponse.json(
        { error: "You are not the leader of this group." },
        { status: 403 }
      );
    }

    const record = await db.groupMeetingSummary.create({
      data: {
        podId,
        authorId: session.user.id,
        meetingDate: new Date(meetingDate),
        format,
        attendeeIds,
        summary,
        concerns,
      },
    });

    return NextResponse.json({ success: true, summary: record });
  } catch (err) {
    console.error("Meeting summary error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAccess(session.user.role, Role.GROUP_LEADER)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const podMember = await db.podMember.findFirst({
    where: { userId: session.user.id, isLeader: true },
    select: { podId: true },
  });

  if (!podMember) {
    return NextResponse.json({ summaries: [] });
  }

  const summaries = await db.groupMeetingSummary.findMany({
    where: { podId: podMember.podId },
    include: { author: { select: { name: true } } },
    orderBy: { meetingDate: "desc" },
  });

  return NextResponse.json({ summaries });
}
