import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARTICIPANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      covenantSigned: true,
      covenantSignedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
