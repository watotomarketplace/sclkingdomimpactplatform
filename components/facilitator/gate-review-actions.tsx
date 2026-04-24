"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";

interface GateReviewActionsProps {
  reviewId: string;
  participantId: string;
  month: number;
  participantName: string;
}

export function GateReviewActions({ reviewId, participantId, month, participantName }: GateReviewActionsProps) {
  const router = useRouter();
  const [revisionModal, setRevisionModal] = useState(false);
  const [redirectModal, setRedirectModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);

  const submitDecision = async (decision: "APPROVED" | "REVISION_REQUESTED" | "REDIRECTED", feedbackText?: string) => {
    setLoading(true);
    await fetch("/api/gate-reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, decision, feedback: feedbackText }),
    });
    setLoading(false);
    setRevisionModal(false);
    setRedirectModal(false);
    setConfirmApprove(false);
    router.refresh();
  };

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" variant="primary" onClick={() => setConfirmApprove(true)}>
          <CheckCircle2 size={14} />
          Approve
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setRevisionModal(true)}>
          <RotateCcw size={14} />
          Request Revision
        </Button>
        <Button size="sm" variant="destructive" onClick={() => setRedirectModal(true)}>
          <AlertTriangle size={14} />
          Redirect
        </Button>
      </div>

      {/* Approve confirmation */}
      <Modal open={confirmApprove} onClose={() => setConfirmApprove(false)} title="Confirm Approval" size="sm">
        <p className="text-sm text-text-secondary mb-4">
          Approve Gate {month} for <strong>{participantName}</strong>? This will unlock Month {month + 1} for them.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmApprove(false)}>Cancel</Button>
          <Button className="flex-1" loading={loading} onClick={() => submitDecision("APPROVED")}>
            Confirm Approval
          </Button>
        </div>
      </Modal>

      {/* Revision modal */}
      <Modal open={revisionModal} onClose={() => setRevisionModal(false)} title="Request Revision">
        <p className="text-sm text-text-secondary mb-3">
          What specific changes does <strong>{participantName}</strong> need to make?
        </p>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          placeholder="Be specific about what needs to be revised and why..."
          className="w-full px-4 py-3 bg-bg-base border border-border rounded-lg text-[14px] outline-none focus:border-accent-primary resize-none mb-4"
        />
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setRevisionModal(false)}>Cancel</Button>
          <Button variant="gold" className="flex-1" loading={loading} disabled={!feedback.trim()} onClick={() => submitDecision("REVISION_REQUESTED", feedback)}>
            Send Feedback
          </Button>
        </div>
      </Modal>

      {/* Redirect modal */}
      <Modal open={redirectModal} onClose={() => setRedirectModal(false)} title="Redirect to Program Admin">
        <p className="text-sm text-text-secondary mb-3">
          Flag this submission for Program Admin review. Include notes on your concern.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Describe your concern and why this needs escalation..."
          className="w-full px-4 py-3 bg-bg-base border border-border rounded-lg text-[14px] outline-none focus:border-accent-primary resize-none mb-4"
        />
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setRedirectModal(false)}>Cancel</Button>
          <Button variant="destructive" className="flex-1" loading={loading} disabled={!notes.trim()} onClick={() => submitDecision("REDIRECTED", notes)}>
            Redirect
          </Button>
        </div>
      </Modal>
    </>
  );
}
