import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARTICIPANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { month, phase, draftData, submissionId } = await req.json();

  // Upsert submission record with draft data
  const submission = await db.submission.upsert({
    where: { userId_month_phase: { userId: session.user.id, month, phase } },
    create: {
      userId: session.user.id,
      month,
      phase,
      draftData,
      formData: {},
      status: "DRAFT",
    },
    update: {
      draftData,
      status: (await db.submission.findUnique({
        where: { id: submissionId ?? "" },
      }))?.status === "SUBMITTED" ? "SUBMITTED" : "DRAFT",
    },
  });

  return NextResponse.json({ success: true, submissionId: submission.id });
}
