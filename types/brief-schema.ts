// ── EPA Brief Schema ──────────────────────────────────────────
// Canonical structure for all brief types across all brands.
// The AI returns JSON matching this shape. The PDF template and
// on-screen renderer consume it directly — no regex parsing.

export type KeyValue = {
  label: string;
  value: string;
};

export type ActionItem = {
  owner: string;
  action: string;
  deadline?: string;
};

export type GapItem = {
  text: string;
  severity?: 'critical' | 'moderate' | 'minor';
};

export type SCTBlock = {
  label: string;
  content: string;
};

export type ContentSection = {
  header: string;
  body?: string;
  items?: string[];
  keyValues?: KeyValue[];
  checklist?: { label: string; checked: boolean }[];
};

export type BriefSchema = {
  // ── Context (top of every brief) ────────────────────────────
  projectName: string;
  projectDescription?: string;
  context: KeyValue[];

  // ── Narrative / assessment sections ─────────────────────────
  sections: ContentSection[];

  // ── SCT framework (adapts per brief type) ───────────────────
  sctPrimary?: {
    groupLabel: string;
    blocks: SCTBlock[];
  };
  sctSecondary?: {
    groupLabel: string;
    blocks: SCTBlock[];
  };

  // ── Gaps ────────────────────────────────────────────────────
  gaps: GapItem[];

  // ── Next steps grouped by owner ─────────────────────────────
  nextSteps: ActionItem[];

  // ── Strategic note (optional) ───────────────────────────────
  strategicNote?: string;
};

// ── Brief type metadata ───────────────────────────────────────

export type SCTMode = 'situation-challenge-transformation' | 'strategy-creative-tactic' | 'dual' | 'none';

export type BriefTypeConfig = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  placeholder: string;
  sctMode: SCTMode;
  systemPrompt: string;
};
