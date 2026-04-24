import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { MONTH_TITLES } from "@/lib/utils";
import { Lock } from "lucide-react";
import Link from "next/link";

export default async function Month5PhaseAPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const monthNum = 5;
  const phase = "A";

  return (
    <div className="px-6 py-6 max-w-[780px]">
      <div className="mb-4">
        <Link href={`/participant/journey/month-${monthNum}`}
          className="text-xs text-text-secondary hover:text-text-primary">
          ← Month {monthNum} — {MONTH_TITLES[monthNum]}
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-text-primary">
          Month {monthNum} Phase {phase}
        </h1>
        <p className="text-text-secondary text-sm">{MONTH_TITLES[monthNum]} — Phase {phase}</p>
      </div>
      <Card className="py-16 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-bg-base border border-border flex items-center justify-center">
            <Lock size={18} className="text-text-secondary" />
          </div>
        </div>
        <h2 className="text-[17px] font-semibold text-text-primary mb-2">Coming in Phase 2</h2>
        <p className="text-text-secondary text-sm max-w-[340px] mx-auto">
          Month {monthNum} Phase {phase} content is being developed. Focus on completing Month 1 first.
        </p>
        <div className="mt-6">
          <Link href="/participant" className="text-accent-primary text-sm hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </Card>
    </div>
  );
}
