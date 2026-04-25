import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  month: z.number().int().min(1).max(6),
  sessionDate: z.string().datetime(),
  notes: z.string().optional(),
  calendlyEventId: z.string().optional(),
});

// GET — list coaching sessions for the current user (or a specific participant if facilitator)
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const participantId = searchParams.get("participantId");

  // Participants can only fetch their own sessions
  const targetId =
    session.user.role === "PARTICIPANT"
      ? session.user.id
      : (participantId ?? session.user.id);

  const sessions = await db.coachingSession.findMany({
    where: { participantId: targetId },
    orderBy: { sessionDate: "desc" },
  });

  return NextResponse.json({ sessions });
}

// POST — log / book a session
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    // Participants log their own sessions; facilitators/admins can specify participantId
    const participantId =
      session.user.role === "PARTICIPANT"
        ? session.user.id
        : (body.participantId as string | undefined) ?? session.user.id;

    const coachingSession = await db.coachingSession.create({
      data: {
        participantId,
        month: data.month,
        sessionDate: new Date(data.sessionDate),
        notes: data.notes,
        calendlyEventId: data.calendlyEventId,
      },
    });

    return NextResponse.json({ session: coachingSession }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Coaching session create error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
