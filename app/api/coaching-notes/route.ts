import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !hasAccess(session.user.role, Role.FACILITATOR)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recipientId, content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content required." }, { status: 400 });
  }

  const note = await db.coachingNote.create({
    data: { authorId: session.user.id, recipientId, content },
  });

  // Notify participant
  await db.notification.create({
    data: {
      userId: recipientId,
      type: "coaching_note",
      message: `${session.user.name} added a coaching note for you.`,
      link: "/participant",
    },
  });

  return NextResponse.json({ note });
}
