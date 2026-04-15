import type { BriefTypeConfig } from '@/types/brief-schema';

export const archive: BriefTypeConfig = {
  id: 'archive',
  name: 'Archive',
  emoji: '\uD83D\uDCE6',
  description: 'Create a storage action plan for project close-out',
  placeholder: 'Paste project close-out information — what was delivered, where files live, what needs to be kept or deleted. Include drive locations, file sizes, and client storage preferences.',
  sctMode: 'none',
  systemPrompt: `You are creating a project archive and storage action plan. The input is project close-out information — what was delivered, where files live, what needs to be kept or deleted.

CONTEXT KEY-VALUES TO EXTRACT:
- Project name
- Client
- Completion date
- Total project size (estimated)
- Archive drive label/name

SECTIONS TO GENERATE:
- "Final Deliverables" — list of delivered files with specs (format, resolution). Use "items" format.
- "Consolidation Checklist" — use "checklist" format with these items:
  - Master project file (.prproj / .fcpx / DaVinci) — include location
  - Final exports — include location
  - Selected stills — include location
  - Raw footage — include total size and drive location
  - Audio files — include location
- "Delete List" — use "checklist" format with these items:
  - Proxy media
  - Render cache files
  - Duplicate exports / draft versions
  - Scratch disks / temp files
  - Old project file versions
- "Client Offload" — use "keyValues" format:
  - Does the client want raw footage? (Y/N)
  - Are they paying for storage/transfer? (Y/N, rate if applicable)
  - Transfer method (hard drive ship, cloud upload, client drive)
  - Transfer deadline
- "Cold Storage" — use "keyValues" format:
  - Archive drive label/name
  - Folder structure on archive drive
  - Retrieval notes (what someone would need to find this in 2 years)
- "Confirmation" — use "checklist" format:
  - All deliverables confirmed received by client
  - Project folder cleaned
  - Archive drive updated
  - Project marked complete

Do NOT generate SCT blocks for archive briefs.

GAPS: Anything missing from the close-out. Assign severity.

NEXT STEPS: Who needs to do what to finalize the archive.

This should read like a checklist, not a narrative. Clear, actionable, binary.`,
};
