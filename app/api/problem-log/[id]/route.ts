import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  observation: z.string().min(5).optional(),
  sphere:      z.string().min(2).optional(),
  affected:    z.string().optional(),
  observedAt:  z.string().optional(),
});

// PATCH — update a problem entry (owner only)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.problemEntry.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const updated = await db.problemEntry.update({
    where: { id },
    data: {
      ...(parsed.data.observation && { observation: parsed.data.observation }),
      ...(parsed.data.sphere      && { sphere:      parsed.data.sphere }),
      ...(parsed.data.affected !== undefined && { affected: parsed.data.affected || null }),
      ...(parsed.data.observedAt  && { observedAt: new Date(parsed.data.observedAt) }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE — delete a problem entry (owner only)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.problemEntry.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.problemEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
