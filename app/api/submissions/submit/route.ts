import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARTICIPANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { month, phase, formData } = await req.json();

  // Validate phase unlock logic
  if (month === 1) {
    if (phase === "B") {
      const phaseA = await db.submission.findUnique({
        where: { userId_month_phase: { userId: session.user.id, month: 1, phase: "A" } },
      });
      if (!phaseA || phaseA.status !== "SUBMITTED") {
        return NextResponse.json({ error: "Phase A must be submitted first." }, { status: 400 });
      }
    }
    if (phase === "C") {
      const phaseB = await db.submission.findUnique({
        where: { userId_month_phase: { userId: session.user.id, month: 1, phase: "B" } },
      });
      if (!phaseB || phaseB.status !== "SUBMITTED") {
        return NextResponse.json({ error: "Phase B must be submitted first." }, { status: 400 });
      }
    }
  }

  const submission = await db.submission.upsert({
    where: { userId_month_phase: { userId: session.user.id, month, phase } },
    create: {
      userId: session.user.id,
      month,
      phase,
      formData,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    update: {
      formData,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  // Create gate review record when all phases of a month are submitted
  const allMonthSubmissions = await db.submission.findMany({
    where: { userId: session.user.id, month, status: "SUBMITTED" },
  });

  const expectedPhases = month === 1 ? ["A", "B", "C"] : ["A"];
  const allDone = expectedPhases.every((p) => allMonthSubmissions.some((s) => s.phase === p));

  if (allDone && phase === expectedPhases[expectedPhases.length - 1]) {
    // Create gate review if it doesn't exist
    const existing = await db.gateReview.findFirst({
      where: { submission: { userId: session.user.id, month } },
    });
    if (!existing) {
      await db.gateReview.create({
        data: { submissionId: submission.id },
      });
    }
  }

  // Notify facilitator
  const facilitatorPod = await db.podMember.findUnique({
    where: { userId: session.user.id },
    include: { pod: { include: { facilitator: true } } },
  });

  if (facilitatorPod?.pod.facilitator) {
    await db.notification.create({
      data: {
        userId: facilitatorPod.pod.facilitator.id,
        type: "phase_submitted",
        message: `${session.user.name} submitted Month ${month} Phase ${phase}.`,
        link: `/facilitator/participants/${session.user.id}`,
      },
    });
  }

  return NextResponse.json({ success: true, submissionId: submission.id });
}
