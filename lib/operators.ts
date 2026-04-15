// ── EPA Operator System ──────────────────────────────────────
// Lightweight identity picker — NOT authentication.
// Brandon can edit these profiles without touching code later
// (this becomes a settings page in a future release).

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
  brandon: {
    id: 'brandon',
    name: 'Brandon',
    role: 'Founder & Creative Director',
    initials: 'BF',
    phases: [1, 2, 3, 4, 5, 6],
    systemPromptContext:
      'You are assisting Brandon Ferguson, the founder and creative director of FMC Studios. He is experienced, direct, and strategic. Provide high-level insights, flag blind spots, and be concise. He does not need hand-holding — surface the non-obvious.',
    personality: 'Direct, strategic, no fluff',
  },
  corey: {
    id: 'corey',
    name: 'Corey',
    role: 'Post-Production Supervisor',
    initials: 'CM',
    phases: [3, 4, 5, 6],
    systemPromptContext:
      'You are assisting Corey, the post-production supervisor. Be technical and specific about post workflows, codecs, color science, frame rates, delivery specs, and editorial pacing. He knows post — match his depth.',
    personality: 'Technical, detail-oriented, post-focused',
  },
  junior: {
    id: 'junior',
    name: 'Junior',
    role: 'Production Assistant',
    initials: 'JR',
    phases: [1, 3, 6],
    systemPromptContext:
      'You are assisting a production assistant. Be clear, structured, and guide them through each field step by step. Flag anything that should be escalated to Brandon. Use concrete examples when a field might be confusing.',
    personality: 'Guided, structured, clear guardrails',
  },
};

export const operatorsList: Operator[] = [
  operators.brandon,
  operators.corey,
  operators.junior,
];
