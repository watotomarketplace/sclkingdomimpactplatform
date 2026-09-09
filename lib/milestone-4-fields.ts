import type { MilestoneField } from "@/components/journey/milestone-form";

/**
 * Milestone 4 — Final Submission field definitions.
 * Shared between the participant-facing form (journey/milestone-4/page.tsx)
 * and the printable Final Submission report (journey/milestone-4/final-submission/page.tsx)
 * so both always show the same labels for the same data.
 */
export const MILESTONE_4_FIELDS: MilestoneField[] = [
  {
    key: "initiativeNameFinal",
    label: "Initiative name (final)",
    type: "text",
    helper: "The final name of your initiative — may have evolved from your working title.",
    required: true,
  },
  {
    key: "brokennessAddressed",
    label: "The brokenness addressed",
    type: "textarea",
    helper: "Final framing of the problem your initiative addresses.",
    required: true,
  },
  {
    key: "whatWasBuilt",
    label: "What was built",
    type: "textarea",
    helper: "Describe your MVI as implemented — what it is, how it works, and who it serves.",
    required: true,
  },
  {
    key: "whatChangedWithEvidence",
    label: "What changed — with evidence",
    type: "textarea",
    helper: "Measurable or observable impact. Be specific: numbers, stories, behaviours that have shifted.",
    required: true,
  },
  {
    key: "whatDidntWork",
    label: "What didn't work, and why",
    type: "textarea",
    helper: "Honest reflection on failures, pivots, and the things you tried that didn't land.",
    required: true,
  },
  {
    key: "whatTheyWouldDoDifferently",
    label: "What you would do differently",
    type: "textarea",
    helper: "If you were starting again with what you now know, what would you change?",
    required: true,
  },
  {
    key: "whatHappensNext",
    label: "What happens next",
    type: "textarea",
    helper: "What is your sustainability plan after this cohort? Who carries this forward, and how?",
    required: true,
  },
  {
    key: "dedication",
    label: "Who this report is dedicated to",
    type: "textarea",
    helper: "A personal dedication — optional.",
    required: false,
  },
  {
    key: "presentationFile",
    label: "Final presentation file",
    type: "file",
    helper: "Upload your final presentation (PPT or PDF, 7–8 minutes). Required to submit.",
    required: true,
    accept: ".pdf,.ppt,.pptx",
  },
];
