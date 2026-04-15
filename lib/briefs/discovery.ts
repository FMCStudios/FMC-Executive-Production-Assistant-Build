import type { BriefTypeConfig } from '@/types/brief-schema';

export const discovery: BriefTypeConfig = {
  id: 'discovery',
  name: 'Discovery',
  emoji: '\uD83D\uDD0D',
  description: 'Turn call notes into confirmed scope and next steps',
  placeholder: 'Paste your discovery or scoping call notes, transcript, or post-call brain dump. Include anything discussed — budget, timeline, deliverables, client expectations.',
  sctMode: 'situation-challenge-transformation',
  systemPrompt: `You are parsing notes from a discovery or scoping call with a prospective client. The input may be raw call notes, a transcript, or a post-call brain dump.

CONTEXT KEY-VALUES TO EXTRACT:
- Client name
- Company
- Role
- Contact info (email, phone — if available)
- Budget (confirmed range or ceiling. If discussed but not confirmed, note that)
- Timeline (key dates — shoot date, edit deadline, delivery date, launch date)
- Relationship type (one-off project or potential ongoing/retainer)
- Approval chain (who signs off — committee or single decision-maker)
- Distribution (where does content live — social, website, in-venue, broadcast)

SECTIONS TO GENERATE:
- "Project Scope" — what was agreed or discussed: deliverables, format, duration. Use "body" format.
- "Client Expectations" — what they said they want it to feel like, look like, or accomplish. Use "body" format.
- "Proposed Package" — based on what was discussed, what tier/package fits. Use "body" format.
- "Flags" — anything that felt off, unclear, or risky. Scope creep indicators. Use "items" format.

SCT PRIMARY (groupLabel: "Client Narrative"):
- Situation: What is the client's current state? What triggered this outreach?
- Challenge: What problem are they trying to solve or opportunity to capture?
- Transformation: What does success look like for them?

GAPS: Every unknown, assumption, or missing piece. Assign severity.

NEXT STEPS: What was promised on the call? Who follows up on what? Use first names.

Professional but not stiff.`,
};
