import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

interface RedFlagParticipant {
  userId: string;
  userName: string;
  podName?: string;
  facilitatorName?: string;
  consecutiveEscalateCount: number;
  lastScorecardMonth: number;
  lastScorecardDate?: Date | string | null;
}

interface RedFlagsListProps {
  redFlags: RedFlagParticipant[];
  showFacilitatorColumn?: boolean;
  participantLinkBase?: string;
}

export function RedFlagsList({ redFlags, showFacilitatorColumn = false, participantLinkBase = "/facilitator/participants" }: RedFlagsListProps) {
  if (redFlags.length === 0) {
    return (
      <Card className="py-16 text-center">
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 rounded-full bg-[rgba(45,90,61,0.1)] flex items-center justify-center">
            <AlertTriangle size={18} className="text-accent-primary" />
          </div>
        </div>
        <p className="text-[15px] font-semibold text-text-primary mb-1">All Clear</p>
        <p className="text-sm text-text-secondary">No red flags — all participants on track 🎉</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[rgba(184,58,42,0.08)] border border-[rgba(184,58,42,0.2)] rounded-[10px] px-4 py-3 flex items-center gap-2">
        <AlertTriangle size={16} className="text-accent-danger shrink-0" />
        <p className="text-sm text-accent-danger font-medium">
          {redFlags.length} participant{redFlags.length !== 1 ? "s" : ""} need{redFlags.length === 1 ? "s" : ""} immediate attention
        </p>
      </div>

      <div className="space-y-3">
        {redFlags.map(flag => (
          <Card key={flag.userId}>
            <div className="flex items-start justify-between">
              <div>
                <Link href={`${participantLinkBase}/${flag.userId}`} className="text-[15px] font-semibold text-text-primary hover:text-accent-primary">
                  {flag.userName}
                </Link>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {flag.podName && <span className="text-xs text-text-secondary">{flag.podName}</span>}
                  {showFacilitatorColumn && flag.facilitatorName && (
                    <span className="text-xs text-text-secondary">· Facilitator: {flag.facilitatorName}</span>
                  )}
                  <span className="text-xs text-text-secondary">· Month {flag.lastScorecardMonth}</span>
                  {flag.lastScorecardDate && (
                    <span className="text-xs text-text-secondary">· Last scorecard: {formatDate(flag.lastScorecardDate)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Badge variant="escalate">{flag.consecutiveEscalateCount} consecutive Escalate</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
