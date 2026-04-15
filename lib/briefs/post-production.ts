import type { BriefTypeConfig } from '@/types/brief-schema';

export const postProduction: BriefTypeConfig = {
  id: 'post-production',
  name: 'Post-Production',
  emoji: '\u2702\uFE0F',
  description: 'Convert shoot notes into editor-ready instructions',
  placeholder: 'Paste your shoot debrief, after-action report, or producer notes. Include what was captured, any selects status, music direction, delivery specs, and notes from set.',
  sctMode: 'strategy-creative-tactic',
  systemPrompt: `You are converting shoot notes and after-action information into an editor-ready post-production brief. The input may be a shoot debrief, after-action report, or producer's notes.

CONTEXT KEY-VALUES TO EXTRACT:
- Project name
- Client
- Editor assigned
- Shoot date
- Cameras used
- Card count / total runtime
- Selects status (done/in-progress/not started, who's doing them, where they live)
- Delivery format (resolution, aspect ratios, codec, frame rate)
- Revision rounds (how many, approval process)
- First cut deadline
- Final delivery deadline

SECTIONS TO GENERATE:
- "What Was Captured" — summary of footage. Use "body" format.
- "Music & Audio" — licensed tracks, client-provided audio, VO requirements. Use "items" format.
- "Social Cuts" — platforms, aspect ratios, any platform-specific requirements. Use "items" format. Skip if not applicable.
- "Graphics & Titles" — lower thirds, title cards, logos, end cards. Use "items" format. Skip if not applicable.
- "Notes From Set" — anything the editor needs to know that isn't obvious from the footage. Moments that matter, moments to skip, client reactions. Use "body" format.

SCT PRIMARY (groupLabel: "Execution Framework"):
- Strategy: What is the edit trying to accomplish? Who is the audience and what action should they take?
- Creative: Edit style and tone — pacing, energy, mood, music direction, color grade intent.
- Tactic: Specific edit deliverables, formats, specs, revision process, timeline. The execution checklist.

GAPS: Everything missing, ambiguous, or assumed. Assign severity.

NEXT STEPS: Specific actions with ownership. Who does what to move the edit forward.

Write for an editor who wasn't on set. They need to feel the project through this document.`,
};
