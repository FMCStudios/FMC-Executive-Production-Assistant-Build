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
- CREATIVE DIRECTION: What's the look, feel, and tone of this piece? Reference videos if mentioned. Style keywords.
- SHOT LIST FRAMEWORK: Key moments/scenes to capture. Not exhaustive \u2014 this is a framework, not a 200-line spreadsheet.
- LOCATIONS: Where, when, access details, parking, load-in info
- SCHEDULE: Call times, shoot blocks, wrap time
- CREW: Who's assigned to what role. Names and responsibilities.
- GEAR: Camera, audio, lighting, grip \u2014 what's needed, who's bringing it
- CLIENT CONTACT: Who's on-site from the client side? Phone number.
- DOS: Things to prioritize, must-capture moments, client preferences
- DON'TS: Things to avoid. Client sensitivities. Brand restrictions.
- LOGISTICS: Travel, meals, parking, access credentials, weather contingency

This document should be scannable by a shooter 30 minutes before call time. Clear, direct, no ambiguity.

The brand context below shapes the tone and service framing of your output.`,
};
