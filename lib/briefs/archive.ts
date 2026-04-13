import type { BriefType } from './index';

export const archive: BriefType = {
  id: 'archive',
  name: 'Archive',
  emoji: '\uD83D\uDCE6',
  description: 'Create a storage action plan for project close-out',
  placeholder: 'Paste project close-out information \u2014 what was delivered, where files live, what needs to be kept or deleted. Include drive locations, file sizes, and client storage preferences.',
  systemPrompt: `You are creating a project archive and storage action plan. The input is project close-out information \u2014 what was delivered, where files live, what needs to be kept or deleted.

Extract and structure:
- PROJECT: Name, client, completion date
- FINAL DELIVERABLES: List of delivered files with specs (format, resolution)
- CONSOLIDATION CHECKLIST:
  \u25A1 Master project file (.prproj / .fcpx / DaVinci) \u2014 location
  \u25A1 Final exports \u2014 location
  \u25A1 Selected stills \u2014 location
  \u25A1 Raw footage \u2014 total size, drive location
  \u25A1 Audio files \u2014 location
- DELETE LIST:
  \u25A1 Proxy media
  \u25A1 Render cache files
  \u25A1 Duplicate exports / draft versions
  \u25A1 Scratch disks / temp files
  \u25A1 Old project file versions
- CLIENT OFFLOAD:
  \u25A1 Does the client want raw footage? (Y/N)
  \u25A1 Are they paying for storage/transfer? (Y/N, rate if applicable)
  \u25A1 Transfer method (hard drive ship, cloud upload, client drive)
  \u25A1 Transfer deadline
- COLD STORAGE:
  \u25A1 Archive drive label/name
  \u25A1 Folder structure on archive drive
  \u25A1 Retrieval notes (what someone would need to find this in 2 years)
- CONFIRMATION:
  \u25A1 All deliverables confirmed received by client
  \u25A1 Project folder cleaned
  \u25A1 Archive drive updated
  \u25A1 Project marked complete

This should read like a checklist, not a narrative. Clear, actionable, binary.

The brand context below shapes the tone and service framing of your output.`,
};
