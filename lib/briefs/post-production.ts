import type { BriefType } from './index';

export const postProduction: BriefType = {
  id: 'post-production',
  name: 'Post-Production',
  emoji: '\u2702\uFE0F',
  description: 'Convert shoot notes into editor-ready instructions',
  placeholder: 'Paste your shoot debrief, after-action report, or producer notes. Include what was captured, any selects status, music direction, delivery specs, and notes from set.',
  systemPrompt: `You are converting shoot notes and after-action information into an editor-ready post-production brief. The input may be a shoot debrief, after-action report, or producer\u2019s notes.

Extract and structure:
- PROJECT: Name, client, editor assigned
- STRATEGY: What was the strategic goal of this project? What is the edit trying to accomplish? Who is the audience and what action should they take?
- CREATIVE: What is the edit style and tone? Pacing, energy, mood, music direction, color grade intent. Reference videos if available.
- TACTIC: Specific edit deliverables, formats, specs, revision process, timeline, social cutdown requirements. The execution checklist.
- WHAT WAS CAPTURED: Summary of footage \u2014 cameras, card count, total runtime
- SELECTS STATUS: Are selects done? Who\u2019s doing them? Where do they live?
- MUSIC/AUDIO: Licensed tracks, client-provided audio, VO requirements
- DELIVERY SPECS: Format, resolution, aspect ratios, codec, frame rate
- SOCIAL CUTS: Are social cutdowns needed? What platforms, what aspect ratios?
- GRAPHICS/TITLES: Any lower thirds, title cards, logos, end cards needed?
- REVISION LIMITS: How many rounds? What\u2019s the approval process?
- TIMELINE: First cut deadline, final delivery deadline
- NOTES FROM SET: Anything the editor needs to know that isn\u2019t obvious from the footage \u2014 moments that matter, moments to skip, client reactions.
- GAPS: List everything that is missing, ambiguous, or assumed. Be thorough.
- RECOMMENDED NEXT STEPS: Specific actions with ownership (who does what).

Write for an editor who wasn\u2019t on set. They need to feel the project through this document.

The brand context below shapes the tone and service framing of your output.`,
};
