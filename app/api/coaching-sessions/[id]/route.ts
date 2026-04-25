import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  notes: z.string().optional(),
  sessionDate: z.string().datetime().optional(),
  month: z.number().int().min(1).max(6).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.coachingSession.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Owner or facilitator/admin
  const canEdit =
    existing.participantId === session.user.id ||
    ["FACILITATOR", "PROGRAM_ADMIN", "SUPER_ADMIN"].includes(session.user.role);
  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const updated = await db.coachingSession.update({
      where: { id },
      data: {
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.sessionDate ? { sessionDate: new Date(data.sessionDate) } : {}),
        ...(data.month ? { month: data.month } : {}),
      },
    });

    return NextResponse.json({ session: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.coachingSession.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canDelete =
    existing.participantId === session.user.id ||
    ["PROGRAM_ADMIN", "SUPER_ADMIN"].includes(session.user.role);
  if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.coachingSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
