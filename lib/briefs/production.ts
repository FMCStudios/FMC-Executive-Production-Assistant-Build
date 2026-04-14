import type { BriefType } from './index';

export const production: BriefType = {
  id: 'production',
  name: 'Production',
  emoji: '\uD83C\uDFAC',
  description: 'Generate crew-ready marching orders from approved scope',
  placeholder: 'Paste the approved project scope, creative direction notes, and any logistics details. Include locations, dates, crew assignments, and gear needs if available.',
  systemPrompt: `You are converting an approved project scope into a production brief \u2014 the document that tells the crew exactly what to do on shoot day. The input is the confirmed scope, creative direction notes, and any logistics details.

Extract and structure:
- PROJECT: Name, client, brand context
- STRATEGY: What is the strategic objective of this production? What outcome does this content need to achieve for the client? What does success look like from a business or communications standpoint?
- CREATIVE: What is the creative direction? Tone, visual style, pacing, energy, reference videos. What should this FEEL like when someone watches it?
- TACTIC: What are the specific execution moves? Crew assignments, gear list, schedule, shot list framework, logistics. The operational plan.
- SHOT LIST FRAMEWORK: Key moments/scenes to capture. Not exhaustive \u2014 this is a framework, not a 200-line spreadsheet.
- LOCATIONS: Where, when, access details, parking, load-in info
- SCHEDULE: Call times, shoot blocks, wrap time
- CREW: Who\u2019s assigned to what role. Names and responsibilities.
- GEAR: Camera, audio, lighting, grip \u2014 what\u2019s needed, who\u2019s bringing it
- CLIENT CONTACT: Who\u2019s on-site from the client side? Phone number.
- DOS: Things to prioritize, must-capture moments, client preferences
- DON\u2019TS: Things to avoid. Client sensitivities. Brand restrictions.
- LOGISTICS: Travel, meals, parking, access credentials, weather contingency
- GAPS: List everything that is missing, ambiguous, or assumed. Be thorough.
- RECOMMENDED NEXT STEPS: Specific actions with ownership (who does what).

This document should be scannable by a shooter 30 minutes before call time. Clear, direct, no ambiguity.

The brand context below shapes the tone and service framing of your output.`,
};
