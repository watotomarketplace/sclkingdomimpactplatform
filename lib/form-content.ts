export interface FormField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "matrix";
  placeholder?: string;
  hint?: string;
  highlighted?: boolean;
  required?: boolean;
  options?: string[];
}

export interface FormSection {
  id: string;
  label: string;
  icon?: string;
  note?: string;
  noteType?: "warning" | "info";
  fields: FormField[];
}

export interface PhaseContent {
  title: string;
  subtitle?: string;
  sections: FormSection[];
}

export const MONTH1_PHASE_A: PhaseContent = {
  title: "Phase A — Discovery",
  subtitle: "Map your world and name your burden",
  sections: [
    {
      id: "sphere-mapping",
      label: "SPHERE MAPPING",
      icon: "🗺️",
      note: "List every sphere of life or community you are embedded in — work, family, church, neighbourhood, profession, hobby.",
      fields: [
        { key: "spheres", label: "Your spheres of influence", type: "textarea", placeholder: "List each sphere on a new line (e.g. Small business owners in my community, Youth in my church...)", required: true },
        { key: "primary_sphere", label: "Which sphere pulls at you most?", type: "textarea", placeholder: "Describe in 1–2 sentences...", highlighted: true, required: true },
      ],
    },
    {
      id: "pain-point",
      label: "PAIN POINT CAPTURE",
      icon: "📍",
      note: "A pain point is something you have directly observed — not something you assume, not something you read about. It must come from lived proximity.",
      fields: [
        { key: "pain_observation", label: "What did you directly observe?", type: "textarea", placeholder: "Describe the specific scene, moment, or pattern you witnessed...", required: true },
        { key: "pain_who", label: "Who is experiencing this pain?", type: "text", placeholder: "Be specific about the group or person", required: true },
        { key: "pain_frequency", label: "How often does this happen? How widespread is it?", type: "textarea", placeholder: "Evidence of scale or frequency..." },
        { key: "pain_impact", label: "What is the cost of this pain? (Human, economic, spiritual)", type: "textarea", placeholder: "What does this pain cost the people experiencing it?" },
      ],
    },
    {
      id: "kingdom-discernment",
      label: "KINGDOM DISCERNMENT",
      icon: "✦",
      fields: [
        { key: "burden", label: "What burden has God placed on your heart?", type: "textarea", placeholder: "Not what you think should matter — what actually keeps you up at night?", required: true },
        { key: "uniqueness", label: "Why are YOU uniquely positioned to address this?", type: "textarea", placeholder: "What in your story, skills, or relationships gives you access others don't have?" },
        { key: "kingdom_why", label: "How does solving this advance the Kingdom?", type: "textarea", placeholder: "Connect this problem to a Kingdom value (justice, restoration, flourishing...)", highlighted: true },
      ],
    },
  ],
};

export const MONTH1_PHASE_B: PhaseContent = {
  title: "Phase B — Validation",
  subtitle: "Prove the problem is real before you build anything",
  sections: [
    {
      id: "problem-statement",
      label: "PROBLEM STATEMENT",
      icon: "📝",
      note: "⚠️ Keep these three things separate: the Problem (what you observed), the Problem Statement (who is affected and why it matters), and the Solution (what you will build). Do not mix them.",
      noteType: "warning",
      fields: [
        { key: "problem_raw", label: "The problem (what you observed)", type: "textarea", placeholder: "Just the observation — no solution language", required: true },
        { key: "problem_statement", label: "Problem statement (who is affected + why it matters)", type: "textarea", placeholder: "[Group] experiences [problem] which results in [consequence]...", highlighted: true, required: true },
        { key: "problem_not_solution", label: "Explicitly: what is NOT the solution yet", type: "textarea", placeholder: "Name what you are NOT building at this stage..." },
      ],
    },
    {
      id: "root-cause",
      label: "ROOT-CAUSE ANALYSIS",
      icon: "🔍",
      fields: [
        { key: "surface_symptoms", label: "Surface symptoms you can observe", type: "textarea", placeholder: "What does the problem look like on the surface?", required: true },
        { key: "underlying_causes", label: "Underlying causes (ask 'why' 3–5 times)", type: "textarea", placeholder: "Why does the problem exist? And why does that exist? Go deeper...", required: true },
        { key: "root_cause", label: "Root cause (the deepest 'why')", type: "textarea", highlighted: true, placeholder: "The foundational cause — if you could only fix one thing...", required: true },
      ],
    },
    {
      id: "stakeholder-map",
      label: "STAKEHOLDER MAP",
      icon: "👥",
      fields: [
        { key: "primary_stakeholder", label: "Primary stakeholder (who suffers most)", type: "text", required: true },
        { key: "secondary_stakeholders", label: "Secondary stakeholders (who else is affected)", type: "textarea" },
        { key: "gatekeepers", label: "Gatekeepers (who controls access to the primary group)", type: "textarea" },
        { key: "change_makers", label: "Change-makers (who already works on this problem)", type: "textarea" },
      ],
    },
    {
      id: "alternatives",
      label: "ALTERNATIVES SCAN",
      icon: "🔎",
      note: "Research what already exists. This is not to copy — it is to understand the landscape you're entering.",
      fields: [
        { key: "existing_solutions", label: "What solutions currently exist?", type: "textarea", placeholder: "List organisations, products, approaches you found...", required: true },
        { key: "gaps", label: "What gaps do the existing solutions leave?", type: "textarea", highlighted: true, placeholder: "Where do they fall short for your specific group?" },
        { key: "differentiation", label: "How would your approach be different?", type: "textarea" },
      ],
    },
  ],
};

export const MONTH1_PHASE_C: PhaseContent = {
  title: "Phase C — Ideation",
  subtitle: "From many ideas to one focused concept",
  sections: [
    {
      id: "solution-matrix",
      label: "SOLUTION COMPARISON MATRIX",
      icon: "⚡",
      note: "Generate 3 distinct solution ideas. Score each on: Feasibility (can you actually build it?), Impact (does it address the root cause?), Scalability (can it grow?), Kingdom Alignment (does it reflect Kingdom values?).",
      fields: [
        { key: "idea_1", label: "Idea 1 — name and description", type: "textarea", required: true },
        { key: "idea_1_feasibility", label: "Idea 1 — Feasibility score (1–5)", type: "select", options: ["1 - Very difficult", "2 - Difficult", "3 - Moderate", "4 - Feasible", "5 - Very feasible"] },
        { key: "idea_1_impact", label: "Idea 1 — Impact score (1–5)", type: "select", options: ["1 - Minimal", "2 - Low", "3 - Moderate", "4 - High", "5 - Very high"] },
        { key: "idea_1_scalability", label: "Idea 1 — Scalability score (1–5)", type: "select", options: ["1 - Not scalable", "2 - Limited", "3 - Moderate", "4 - Scalable", "5 - Highly scalable"] },
        { key: "idea_1_kingdom", label: "Idea 1 — Kingdom Alignment score (1–5)", type: "select", options: ["1 - Weak", "2 - Some", "3 - Moderate", "4 - Strong", "5 - Very strong"] },

        { key: "idea_2", label: "Idea 2 — name and description", type: "textarea", required: true },
        { key: "idea_2_feasibility", label: "Idea 2 — Feasibility score (1–5)", type: "select", options: ["1 - Very difficult", "2 - Difficult", "3 - Moderate", "4 - Feasible", "5 - Very feasible"] },
        { key: "idea_2_impact", label: "Idea 2 — Impact score (1–5)", type: "select", options: ["1 - Minimal", "2 - Low", "3 - Moderate", "4 - High", "5 - Very high"] },
        { key: "idea_2_scalability", label: "Idea 2 — Scalability score (1–5)", type: "select", options: ["1 - Not scalable", "2 - Limited", "3 - Moderate", "4 - Scalable", "5 - Highly scalable"] },
        { key: "idea_2_kingdom", label: "Idea 2 — Kingdom Alignment score (1–5)", type: "select", options: ["1 - Weak", "2 - Some", "3 - Moderate", "4 - Strong", "5 - Very strong"] },

        { key: "idea_3", label: "Idea 3 — name and description", type: "textarea", required: true },
        { key: "idea_3_feasibility", label: "Idea 3 — Feasibility score (1–5)", type: "select", options: ["1 - Very difficult", "2 - Difficult", "3 - Moderate", "4 - Feasible", "5 - Very feasible"] },
        { key: "idea_3_impact", label: "Idea 3 — Impact score (1–5)", type: "select", options: ["1 - Minimal", "2 - Low", "3 - Moderate", "4 - High", "5 - Very high"] },
        { key: "idea_3_scalability", label: "Idea 3 — Scalability score (1–5)", type: "select", options: ["1 - Not scalable", "2 - Limited", "3 - Moderate", "4 - Scalable", "5 - Highly scalable"] },
        { key: "idea_3_kingdom", label: "Idea 3 — Kingdom Alignment score (1–5)", type: "select", options: ["1 - Weak", "2 - Some", "3 - Moderate", "4 - Strong", "5 - Very strong"] },

        { key: "chosen_idea", label: "Chosen idea and your reasoning", type: "textarea", highlighted: true, required: true, placeholder: "Which idea scored best AND resonates with your calling? Why did you choose it?" },
      ],
    },
    {
      id: "value-proposition",
      label: "VALUE PROPOSITION BUILDER",
      icon: "💡",
      fields: [
        { key: "target_customer", label: "For [target group]", type: "text", required: true },
        { key: "need", label: "Who needs [describe the need]", type: "textarea", required: true },
        { key: "product_name", label: "My solution is [name/description]", type: "text", required: true },
        { key: "category", label: "That is a [category/type of solution]", type: "text" },
        { key: "key_benefit", label: "That delivers [key benefit]", type: "textarea", highlighted: true, required: true },
        { key: "differentiation_vp", label: "Unlike [alternatives], my solution [unique differentiator]", type: "textarea" },
      ],
    },
    {
      id: "concept-note",
      label: "CONCEPT NOTE",
      icon: "📄",
      note: "This is your Gate 1 document. Write it clearly enough that someone unfamiliar with your idea could understand and evaluate it.",
      fields: [
        { key: "problem_summary", label: "The problem (2–3 sentences)", type: "textarea", required: true },
        { key: "target_group", label: "Target group and evidence of need", type: "textarea", required: true },
        { key: "proposed_solution", label: "Proposed solution", type: "textarea", required: true },
        { key: "kingdom_dimension", label: "Kingdom dimension — why this matters beyond business", type: "textarea", highlighted: true, required: true },
        { key: "next_steps", label: "Next steps for Month 2", type: "textarea" },
      ],
    },
  ],
};

export function getPhaseContent(month: number, phase: string): PhaseContent | null {
  if (month === 1 && phase === "A") return MONTH1_PHASE_A;
  if (month === 1 && phase === "B") return MONTH1_PHASE_B;
  if (month === 1 && phase === "C") return MONTH1_PHASE_C;
  return null;
}
