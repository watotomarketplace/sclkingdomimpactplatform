import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  observation: z.string().min(5, "Please describe what you observed"),
  sphere:      z.string().min(2, "Please describe where you saw this"),
  affected:    z.string().optional(),
  observedAt:  z.string().optional(),
});

// GET — list all problem entries for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await db.problemEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { observedAt: "desc" },
  });

  return NextResponse.json(entries);
}

// POST — create a new problem entry
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const entry = await db.problemEntry.create({
    data: {
      userId:      session.user.id,
      observation: parsed.data.observation,
      sphere:      parsed.data.sphere,
      affected:    parsed.data.affected ?? null,
      observedAt:  parsed.data.observedAt ? new Date(parsed.data.observedAt) : new Date(),
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
