// ── EPA Operator System ──────────────────────────────────────
// Role-based identity picker — NOT authentication.
// Operators are selectable by role title, not personal name.

export interface Operator {
  id: string;
  name: string;
  role: string;
  initials: string;
  phases: number[];
  systemPromptContext?: string;
  personality?: string;
}

export const operators: Record<string, Operator> = {
  sp: {
    id: 'sp',
    name: 'Supervising Producer',
    role: 'Oversees all phases, client-facing, scoping + strategy',
    initials: 'SP',
    phases: [1, 2, 3, 4, 5, 6],
    systemPromptContext:
      'You are assisting the supervising producer — the senior decision-maker on this project. They are experienced, direct, and strategic. Provide high-level insights, flag blind spots, and be concise. They do not need hand-holding — surface the non-obvious.',
    personality: 'Direct, strategic, no fluff',
  },
  ps: {
    id: 'ps',
    name: 'Post Supervisor',
    role: 'Post-production workflows, editorial, delivery',
    initials: 'PS',
    phases: [3, 4, 5, 6],
    systemPromptContext:
      'You are assisting the post-production supervisor. Be technical and specific about post workflows, codecs, color science, frame rates, delivery specs, and editorial pacing. They know post — match their depth.',
    personality: 'Technical, detail-oriented, post-focused',
  },
  pa: {
    id: 'pa',
    name: 'Production Assistant',
    role: 'Intake, on-set support, archive',
    initials: 'PA',
    phases: [1, 3, 6],
    systemPromptContext:
      'You are assisting a production assistant. Be clear, structured, and guide them through each field step by step. Flag anything that should be escalated to the supervising producer. Use concrete examples when a field might be confusing.',
    personality: 'Guided, structured, clear guardrails',
  },
  dp: {
    id: 'dp',
    name: 'Director of Photography',
    role: 'Camera, lighting, visual storytelling',
    initials: 'DP',
    phases: [3, 4],
    systemPromptContext:
      'You are assisting the director of photography. Focus on camera systems, lens choices, lighting setups, shot design, and visual storytelling. Be specific about technical specs and creative rationale.',
    personality: 'Visual, technical, craft-focused',
  },
  bd: {
    id: 'bd',
    name: 'Biz Dev',
    role: 'Sales pipeline, proposals, client relationships',
    initials: 'BD',
    phases: [1, 2, 5],
    systemPromptContext:
      'You are assisting the business development lead. Focus on pipeline health, pricing strategy, client relationship signals, and rebooking opportunities. Frame everything through a revenue lens.',
    personality: 'Revenue-focused, relationship-driven',
  },
  ed: {
    id: 'ed',
    name: 'Editor',
    role: 'Editorial, assembly, finishing',
    initials: 'ED',
    phases: [4, 5],
    systemPromptContext:
      'You are assisting an editor. Be specific about narrative structure, pacing, music direction, color grade, graphics, and delivery specs. They need actionable creative direction, not vague vibes.',
    personality: 'Detail-oriented, narrative-focused',
  },
};

export const operatorsList: Operator[] = [
  operators.sp,
  operators.ps,
  operators.pa,
  operators.dp,
  operators.bd,
  operators.ed,
];
