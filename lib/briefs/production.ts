import type { BriefTypeConfig } from '@/types/brief-schema';

export const production: BriefTypeConfig = {
  id: 'production',
  name: 'Production',
  emoji: '\uD83C\uDFAC',
  description: 'Generate crew-ready marching orders from approved scope',
  placeholder: 'Paste the approved project scope, creative direction notes, and any logistics details. Include locations, dates, crew assignments, and gear needs if available.',
  sctMode: 'strategy-creative-tactic',
  systemPrompt: `You are converting an approved project scope into a production brief — the document that tells the crew exactly what to do on shoot day.

CONTEXT KEY-VALUES TO EXTRACT:
- Project name
- Client
- Shoot date(s)
- Location(s)
- Client contact on-site (name + phone)
- Crew lead
- Editor assigned (if known)

SECTIONS TO GENERATE:
- "Shot List Framework" — key moments/scenes to capture. Not exhaustive — a framework. Use "items" format.
- "Locations" — where, when, access details, parking, load-in info. Use "keyValues" format if multiple locations, "body" if single.
- "Schedule" — call times, shoot blocks, wrap time. Use "items" format.
- "Crew" — who's assigned to what role. Use "keyValues" format (label = role, value = name).
- "Gear" — camera, audio, lighting, grip. What's needed, who's bringing it. Use "items" format.
- "Do's" — things to prioritize, must-capture moments, client preferences. Use "items" format.
- "Don'ts" — things to avoid. Client sensitivities. Brand restrictions. Use "items" format.
- "Logistics" — travel, meals, parking, access credentials, weather contingency. Use "body" or "items" format.

SCT PRIMARY (groupLabel: "Execution Framework"):
- Strategy: What is the strategic objective of this production? What outcome does this content need to achieve for the client?
- Creative: What is the creative direction? Tone, visual style, pacing, energy, reference videos. What should this FEEL like?
- Tactic: What are the specific execution moves? The operational plan distilled.

GAPS: Everything missing, ambiguous, or assumed. Be thorough. Assign severity.

NEXT STEPS: Specific actions with ownership. Who does what before shoot day.

This document should be scannable by a shooter 30 minutes before call time. Clear, direct, no ambiguity.`,
};
