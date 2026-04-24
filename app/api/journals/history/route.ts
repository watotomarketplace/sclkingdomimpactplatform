import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await db.journalEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { month: "desc" },
    select: {
      month: true,
      isPrivate: true,
      prompt1: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ entries });
}
