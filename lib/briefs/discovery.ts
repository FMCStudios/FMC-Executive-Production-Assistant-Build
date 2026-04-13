import type { BriefType } from './index';

export const discovery: BriefType = {
  id: 'discovery',
  name: 'Discovery',
  emoji: '\uD83D\uDD0D',
  description: 'Turn call notes into confirmed scope and next steps',
  placeholder: 'Paste your discovery or scoping call notes, transcript, or post-call brain dump. Include anything discussed \u2014 budget, timeline, deliverables, client expectations.',
  systemPrompt: `You are parsing notes from a discovery or scoping call with a prospective client. The input may be raw call notes, a transcript, or a post-call brain dump.

Extract and structure:
- CLIENT: Confirmed name, company, role, contact info
- PROJECT SCOPE: What was agreed or discussed \u2014 deliverables, format, duration
- BUDGET: Confirmed range or ceiling. If discussed but not confirmed, note that.
- TIMELINE: Key dates \u2014 shoot date, edit deadline, delivery date, launch date
- DELIVERABLES: Specific outputs (hero video, social cuts, stills, etc.)
- CLIENT EXPECTATIONS: What they said they want it to feel like, look like, or accomplish. Direct quotes if captured.
- APPROVAL CHAIN: Who signs off? Is there a committee or single decision-maker?
- DISTRIBUTION: Where does the content live? Social, website, in-venue, broadcast?
- RELATIONSHIP TYPE: One-off project or potential ongoing/retainer?
- FLAGS: Anything that felt off, unclear, or risky. Scope creep indicators.
- PROPOSED PACKAGE: Based on what was discussed, what tier/package fits?
- NEXT STEPS: What was promised on the call? Who follows up on what?

Format with clear sections. Professional but not stiff.

The brand context below shapes the tone and service framing of your output.`,
};
