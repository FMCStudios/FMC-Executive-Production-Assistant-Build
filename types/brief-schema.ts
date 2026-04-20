// ── EPA Brief Schema ──────────────────────────────────────────
// Canonical structure for all brief types across all brands.
// The AI returns JSON matching this shape. The PDF template and
// on-screen renderer consume it directly — no regex parsing.

export type LeadState =
  | 'Disqualified'
  | 'Nurture Needed'
  | 'Formal Quote Requested'
  | 'Formal Pitch Requested'
  | 'In Production'
  | 'On Hold'
  | 'Won'
  | 'Lost';

export const LEAD_STATES: LeadState[] = [
  'Disqualified',
  'Nurture Needed',
  'Formal Quote Requested',
  'Formal Pitch Requested',
  'In Production',
  'On Hold',
  'Won',
  'Lost',
];

// Lead states that suppress the three-tier section and render
// "Re-Engagement Conditions" instead.
export const COLD_LEAD_STATES: LeadState[] = [
  'Disqualified',
  'Nurture Needed',
  'Lost',
  'On Hold',
];

export type SourceAttribution = 'transcript' | 'reflection' | 'inherited';

export type KeyValue = {
  label: string;
  value: string;
};

export type ActionItem = {
  owner: string;
  action: string;
  deadline?: string;
  source?: SourceAttribution;
};

export type GapItem = {
  text: string;
  severity?: 'critical' | 'moderate' | 'minor';
  source?: SourceAttribution;
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
  source?: SourceAttribution;
};

export type VersionHistoryEntry = {
  version: number;
  timestamp: string;
  regeneratedReason?: string;
};

export type UpstreamBriefRef = {
  briefType: string;
  briefId: string;
  generatedAt: string;
};

export type BriefSchema = {
  // ── Identity / header ───────────────────────────────────────
  projectName: string;
  projectDescription?: string;
  clientFirstName?: string;
  clientLastName?: string;
  companyName?: string;

  // ── Context (top of every brief) ────────────────────────────
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

  // ── Strategic note (optional, promoted to top) ──────────────
  strategicNote?: string;

  // ── Lifecycle state ─────────────────────────────────────────
  leadState: LeadState;
  reEngagementTrigger?: string;

  // ── Source attribution, audit trail ─────────────────────────
  reflections?: string;
  sourceAttribution?: Array<{ sectionHeader: string; source: SourceAttribution }>;
  versionHistory: VersionHistoryEntry[];
  upstreamBriefs?: UpstreamBriefRef[];

  // ── Pitch-only output: Gamma-ready prompt ───────────────────
  gammaPrompt?: string;
};

// ── Brief type metadata ───────────────────────────────────────

export type SCTMode = 'situation-challenge-transformation' | 'strategy-creative-tactic' | 'dual' | 'none';

export type BriefTypeConfig = {
  id: string;
  name: string;
  phase: number;
  emoji: string;
  description: string;
  tagline: string;
  placeholder: string;
  sctMode: SCTMode;
  systemPrompt: string;
};
