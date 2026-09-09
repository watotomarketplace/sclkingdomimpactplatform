"use client";

import { Download } from "lucide-react";

/**
 * Triggers the browser print dialog on the Final Submission report page.
 * Participants choose "Save as PDF" as the destination to download it.
 */
export function FinalSubmissionPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 btn-base btn-gold px-4 py-2 text-[13px]"
    >
      <Download size={14} />
      Download PDF
    </button>
  );
}
