import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  participantId: z.string(),
  confirmed: z.boolean(),
});

// PATCH — toggle M0 attendance for a participant
// Accessible by: FACILITATOR, PROGRAM_ADMIN, SUPER_ADMIN
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowedRoles = ["FACILITATOR", "PROGRAM_ADMIN", "SUPER_ADMIN"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { participantId, confirmed } = schema.parse(body);

    const profile = await db.participantProfile.findUnique({ where: { userId: participantId } });
    if (!profile) {
      return NextResponse.json({ error: "Participant profile not found" }, { status: 404 });
    }

    const updated = await db.participantProfile.update({
      where: { userId: participantId },
      data: { attendanceConfirmed: confirmed },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        actorId: session.user.id,
        action: confirmed ? "M0_ATTENDANCE_CONFIRMED" : "M0_ATTENDANCE_UNCONFIRMED",
        targetId: participantId,
        details: { confirmed },
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Attendance update error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
