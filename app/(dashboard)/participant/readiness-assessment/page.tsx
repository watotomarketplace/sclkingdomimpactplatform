import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ReadinessRevisitClient } from "./client";

export default async function ReadinessRevisitPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "PARTICIPANT") redirect("/");

  const answers = await db.readinessAssessment.findMany({
    where: { userId: session.user.id },
    orderBy: { questionNumber: "asc" },
  });

  const lastUpdated =
    answers.length > 0
      ? answers.reduce(
          (latest, a) => (a.updatedAt > latest ? a.updatedAt : latest),
          answers[0].updatedAt
        )
      : null;

  return <ReadinessRevisitClient initialAnswers={answers} lastUpdated={lastUpdated} />;
}
