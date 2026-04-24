import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { MONTH_TITLES, MONTH_SUBTITLES } from "@/lib/utils";
import { Lock } from "lucide-react";
import Link from "next/link";

export default async function Month2Page() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const monthNum = 2;
  const title = MONTH_TITLES[monthNum];
  const subtitle = MONTH_SUBTITLES[monthNum];

  return (
    <div className="px-6 py-6 max-w-[780px]">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-bg-base border border-border flex items-center justify-center shrink-0">
          <span className="text-text-secondary font-semibold text-sm">{monthNum}</span>
        </div>
        <div>
          <h1 className="font-display text-[28px] font-semibold text-text-primary">
            Month {monthNum} — {title}
          </h1>
          <p className="text-text-secondary text-sm">{subtitle}</p>
        </div>
      </div>

      <Card className="py-16 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-bg-base border border-border flex items-center justify-center">
            <Lock size={18} className="text-text-secondary" />
          </div>
        </div>
        <h2 className="text-[17px] font-semibold text-text-primary mb-2">Coming in Phase 2</h2>
        <p className="text-text-secondary text-sm max-w-[340px] mx-auto">
          This module is being developed. Complete Month 1 — Discovery to prepare for what comes next.
        </p>
        <div className="mt-6">
          <Link href="/participant/journey/month-1" className="text-accent-primary text-sm hover:underline">
            ← Back to Month 1
          </Link>
        </div>
      </Card>
    </div>
  );
}
