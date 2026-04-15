import type { BriefTypeConfig } from '@/types/brief-schema';

export const archive: BriefTypeConfig = {
  id: 'archive',
  name: 'Archive',
  phase: 6,
  emoji: '\uD83D\uDCE6',
  tagline: 'where does it live, can we delete it?',
  description: 'Create a storage action plan for project close-out — 5 minute checklist.',
  placeholder: 'Paste project close-out information — what was delivered, where files live, what needs to be kept or deleted. Include drive locations, file sizes, and client storage preferences.',
  sctMode: 'none',
  systemPrompt: `You are creating a project archive and storage action plan for FMC Studios. The input is project close-out information — what was delivered, where files live, what needs to be kept or deleted.

This is PHASE 6 — ARCHIVE. A 5-minute checklist. Clear, actionable, binary. Not a narrative.

CONTEXT KEY-VALUES TO EXTRACT:
- Project name
- Client
- Completion date
- Total project size (estimated)

SECTIONS TO GENERATE:

- "Delivery Log" — use "checklist" format: all finals sent (date + method + confirmation), client acknowledged receipt.

- "Asset Map" — use "keyValues" format: raw footage location, project files location, exports location.

- "Storage Status" — use "keyValues" format: total size, backed up (Y/N + where), cloud vs local.

- "Deletion Auth" — use "checklist" format: client notified of retention policy, client opted to keep/delete, deletion date set.

- "Portfolio Flag" — use "keyValues" format: approved for portfolio/reel (Y/N), best clips tagged.

Do NOT generate SCT blocks for archive briefs.

GAPS: Anything missing from the close-out. Assign severity.

NEXT STEPS: Who needs to do what to finalize the archive.

This should read like a checklist, not a narrative. Clear, actionable, binary.`,
};
