import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@/app/generated/prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.PARTICIPANT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const answers = await db.readinessAssessment.findMany({
    where: { userId },
    orderBy: { questionNumber: "asc" },
  });

  return NextResponse.json({ answers });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.PARTICIPANT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { questionNumber, currentAnswer, actionToTake, submit } = await req.json();

  if (typeof questionNumber !== "number" || questionNumber < 1 || questionNumber > 6) {
    return NextResponse.json({ error: "questionNumber must be between 1 and 6" }, { status: 400 });
  }

  const isFinalSubmit = submit === true && questionNumber === 6;
  const submittedAt = isFinalSubmit ? new Date() : undefined;

  const record = await db.readinessAssessment.upsert({
    where: { userId_questionNumber: { userId, questionNumber } },
    update: {
      currentAnswer,
      actionToTake: actionToTake ?? null,
      ...(submittedAt !== undefined && { submittedAt }),
    },
    create: {
      userId,
      questionNumber,
      currentAnswer,
      actionToTake: actionToTake ?? null,
      ...(submittedAt !== undefined && { submittedAt }),
    },
  });

  if (isFinalSubmit) {
    await db.user.update({
      where: { id: userId },
      data: { readinessComplete: true },
    });
  }

  return NextResponse.json({ record });
}
