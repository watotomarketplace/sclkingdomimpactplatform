import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") ?? "1");
  const userId = searchParams.get("userId") ?? session.user.id;

  if (userId !== session.user.id && session.user.role === "PARTICIPANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entry = await db.journalEntry.findUnique({
    where: { userId_month: { userId, month } },
  });

  if (!entry) return NextResponse.json({ entry: null });

  // Mask private entries for non-owners
  if (entry.isPrivate && userId !== session.user.id) {
    return NextResponse.json({
      entry: {
        month: entry.month,
        isPrivate: true,
        updatedAt: entry.updatedAt,
        prompt1: null,
        prompt2: null,
        prompt3: null,
        prompt4: null,
        prompt5: null,
        freeNotes: null,
      },
    });
  }

  return NextResponse.json({ entry });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARTICIPANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { month, isPrivate, prompt1, prompt2, prompt3, prompt4, prompt5, freeNotes } = await req.json();

  const entry = await db.journalEntry.upsert({
    where: { userId_month: { userId: session.user.id, month } },
    create: { userId: session.user.id, month, isPrivate: isPrivate ?? false, prompt1, prompt2, prompt3, prompt4, prompt5, freeNotes },
    update: { isPrivate: isPrivate ?? false, prompt1, prompt2, prompt3, prompt4, prompt5, freeNotes },
  });

  return NextResponse.json({ entry });
}
