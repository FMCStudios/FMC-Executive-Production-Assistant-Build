import type { BriefTypeConfig } from '@/types/brief-schema';

import { leadIntake } from './lead-intake';
import { discovery } from './discovery';
import { pitch } from './pitch';
import { production } from './production';
import { postProduction } from './post-production';
import { wrapRetention } from './wrap-retention';
import { archive } from './archive';

export type BriefType = BriefTypeConfig;

export const briefTypes: Record<string, BriefTypeConfig> = {
  'lead-intake': leadIntake,
  'discovery': discovery,
  'pitch': pitch,
  'production': production,
  'post-production': postProduction,
  'wrap-retention': wrapRetention,
  'archive': archive,
};

export const briefTypesList: BriefTypeConfig[] = [
  leadIntake,
  discovery,
  pitch,
  production,
  postProduction,
  wrapRetention,
  archive,
];

// ── Shared instruction blocks ──────────────────────────────────
// Appended to every brief's systemPrompt via buildSystemPrompt().

const SOURCE_ATTRIBUTION = `SOURCE ATTRIBUTION:
For every section, block, gap, and next step you generate, tag it with its source via the "source" field:
  - "transcript" for content drawn from the client's actual words or facts in the input
  - "reflection" for strategic reads derived from the reflection input (separate from raw input)
  - "inherited" for fields carried forward from an upstream brief sidecar
Attach the source to each ContentSection, GapItem, and ActionItem. If a section mixes sources, tag it with the dominant one and inline-flag the other in the body text.`;

const STRATEGIC_NOTE_PROMOTION = `STRATEGIC NOTE PROMOTION:
The strategicNote renders as a callout block at the TOP of the document — ahead of all other content. Write it as a 2-3 sentence TL;DR that gives the reader the strategic takeaway before they read the rest. Make it land.`;

const NEXT_STEPS_HYGIENE = `NEXT STEPS HYGIENE:
Structure nextSteps via an action-text prefix convention:
  - "Completed: [action]" for actions already taken (include date if known)
  - "[action]" for pending actions (the default, assigned with deadline)
  - "Waiting on: [dependency]" for blockers from the client
Group by owner. Use "Ferg" never "Ferguson". Unassigned post roles (e.g. "Post Supervisor" when the person isn't named) stay as the role, not a person.`;

const CONDITIONAL_TIER_LOGIC = `CONDITIONAL TIER LOGIC:
If leadState is "Disqualified", "Nurture Needed", "Lost", or "On Hold", DO NOT generate the "Three Tiers" / "Tier" section. Instead generate a "Re-Engagement Conditions" section using "body" format — plain text describing what would need to be true for this to become an active project again. Also populate the reEngagementTrigger field with a one-sentence summary of those conditions.`;

const CONDITIONAL_TIER_BRIEFS = new Set(['discovery', 'pitch', 'production']);

export function buildSystemPrompt(id: string): string {
  const brief = briefTypes[id];
  if (!brief) return '';
  const blocks: string[] = [
    brief.systemPrompt,
    SOURCE_ATTRIBUTION,
    STRATEGIC_NOTE_PROMOTION,
    NEXT_STEPS_HYGIENE,
  ];
  if (CONDITIONAL_TIER_BRIEFS.has(id)) blocks.push(CONDITIONAL_TIER_LOGIC);
  return blocks.join('\n\n');
}
