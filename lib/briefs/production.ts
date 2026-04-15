import type { BriefTypeConfig } from '@/types/brief-schema';

export const production: BriefTypeConfig = {
  id: 'production',
  name: 'Production',
  phase: 3,
  emoji: '\uD83C\uDFAC',
  tagline: "we're making the thing",
  description: 'Generate crew-ready marching orders from approved scope.',
  placeholder: 'Paste the approved project scope, creative direction notes, and any logistics details. Include locations, dates, crew assignments, and gear needs if available.',
  sctMode: 'strategy-creative-tactic',
  systemPrompt: `You are converting an approved project scope into a production brief for FMC Studios — the document that tells the crew exactly what to do on shoot day.

This is PHASE 3 — PRODUCTION. The brief is modular. Only generate sections for which the input provides information.

CONTEXT KEY-VALUES TO EXTRACT:
- Project name
- Client
- Shoot date(s)
- Location(s)
- On-site contact (name + phone if available)
- Crew lead
- Editor assigned (if known)

SECTIONS TO GENERATE (only include modules with available info):

- "Call Sheet" — use "keyValues" format: date, call time, wrap estimate, location + pin + parking, on-site contact, schedule/run of show, weather backup.

- "Gear List" — use "items" format: cameras + lenses, audio kit, lighting + grip, media/cards, power/batteries.

- "Crew Sheet" — use "keyValues" format: name, role, rate, call time, contact, dietary/access needs.

- "Creative Ref" — use "items" format for must-gets and shot list. Use "body" for moodboard links, tone words (3-5 adjectives), brand guidelines link.

- "Strategy Echo" — use "body" format: why are we making this + who's it for (carried forward from Discovery). This grounds the crew in the strategic objective.

SCT PRIMARY (groupLabel: "Execution Framework"):
- Strategy: What is the strategic objective of this production? What outcome does this content need to achieve?
- Creative: What is the creative direction? Tone, visual style, pacing, energy. What should this FEEL like?
- Tactic: What are the specific execution moves? The operational plan distilled.

GAPS: Everything missing, ambiguous, or assumed. Be thorough. Assign severity.

NEXT STEPS: Specific actions with ownership. Who does what before shoot day.

This document should be scannable by a shooter 30 minutes before call time. Clear, direct, no ambiguity.`,
};
