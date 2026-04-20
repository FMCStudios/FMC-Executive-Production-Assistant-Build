import Anthropic from '@anthropic-ai/sdk';
import { google } from 'googleapis';
import type { BriefSchema } from '@/types/brief-schema';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Glossary ──────────────────────────────────────────────────
// Loaded from the "Glossary" sheet tab, cached for 5 minutes.
// Injected into every system prompt so the model knows about
// FMC-specific names (venues, clients, crew) that otherwise get
// mistranscribed.

export type GlossaryEntry = {
  correct: string;
  commonMistranscriptions: string[];
};

type GlossaryCache = {
  entries: GlossaryEntry[];
  fetchedAt: number;
};

const GLOSSARY_TTL_MS = 5 * 60 * 1000;
let glossaryCache: GlossaryCache | null = null;

export async function loadGlossary(): Promise<GlossaryEntry[]> {
  const now = Date.now();
  if (glossaryCache && now - glossaryCache.fetchedAt < GLOSSARY_TTL_MS) {
    return glossaryCache.entries;
  }

  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!clientEmail || !privateKey || !spreadsheetId) return [];

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Glossary!A2:B',
    });
    const rows = res.data.values || [];
    const entries: GlossaryEntry[] = rows
      .filter(r => (r[0] || '').toString().trim())
      .map(r => ({
        correct: r[0].toString().trim(),
        commonMistranscriptions: (r[1] || '')
          .toString()
          .split('|')
          .map((s: string) => s.trim())
          .filter(Boolean),
      }));
    glossaryCache = { entries, fetchedAt: now };
    return entries;
  } catch {
    glossaryCache = { entries: [], fetchedAt: now };
    return [];
  }
}

function formatGlossaryForPrompt(entries: GlossaryEntry[]): string {
  if (entries.length === 0) return '';
  const lines = entries.map(e => {
    const mis = e.commonMistranscriptions.length > 0
      ? ` (commonly mistranscribed as: ${e.commonMistranscriptions.join(', ')})`
      : '';
    return `  • ${e.correct}${mis}`;
  });
  return `\n\nGLOSSARY — correct spellings of FMC-specific names. If the input contains a near-match for any of these, use the correct spelling in the output:\n${lines.join('\n')}\n`;
}

// ── Upstream context ──────────────────────────────────────────

export type UpstreamContext = {
  intake?: BriefSchema;
  discovery?: BriefSchema;
  pitch?: BriefSchema;
  production?: BriefSchema;
  postProduction?: BriefSchema;
  wrapRetention?: BriefSchema;
};

function summarizeUpstream(label: string, brief: BriefSchema): string {
  const lines: string[] = [`### ${label}`];
  if (brief.projectName) lines.push(`Project: ${brief.projectName}`);
  if (brief.companyName) lines.push(`Company: ${brief.companyName}`);
  if (brief.context.length > 0) {
    lines.push('Context:');
    brief.context.forEach(kv => lines.push(`  - ${kv.label}: ${kv.value}`));
  }
  if (brief.strategicNote) lines.push(`Strategic note: ${brief.strategicNote}`);
  if (brief.sctPrimary) {
    lines.push(`${brief.sctPrimary.groupLabel}:`);
    brief.sctPrimary.blocks.forEach(b => lines.push(`  - ${b.label}: ${b.content}`));
  }
  if (brief.gaps.length > 0) {
    lines.push('Open gaps:');
    brief.gaps.forEach(g => lines.push(`  - [${g.severity || 'moderate'}] ${g.text}`));
  }
  return lines.join('\n');
}

function formatUpstreamContext(upstream: UpstreamContext | undefined): string {
  if (!upstream) return '';
  const parts: string[] = [];
  if (upstream.intake) parts.push(summarizeUpstream('INTAKE (inherited)', upstream.intake));
  if (upstream.discovery) parts.push(summarizeUpstream('DISCOVERY (inherited)', upstream.discovery));
  if (upstream.pitch) parts.push(summarizeUpstream('PITCH (inherited)', upstream.pitch));
  if (upstream.production) parts.push(summarizeUpstream('PRODUCTION (inherited)', upstream.production));
  if (upstream.postProduction) parts.push(summarizeUpstream('POST-PRODUCTION (inherited)', upstream.postProduction));
  if (upstream.wrapRetention) parts.push(summarizeUpstream('WRAP & RETENTION (inherited)', upstream.wrapRetention));
  if (parts.length === 0) return '';
  return `INHERITED CONTEXT (from upstream briefs — treat as source material, tag fields drawn from here as "inherited"):\n\n${parts.join('\n\n')}\n\n---\n\n`;
}

// ── JSON wrapper ──────────────────────────────────────────────

const JSON_WRAPPER = `

CRITICAL FORMATTING INSTRUCTION:
You MUST respond with ONLY a valid JSON object matching this exact TypeScript type. No markdown, no code fences, no preamble, no explanation — ONLY the JSON object.

type SourceAttribution = "transcript" | "reflection" | "inherited";

type BriefSchema = {
  projectName: string;
  projectDescription?: string;
  clientFirstName?: string;
  clientLastName?: string;
  companyName?: string;
  context: Array<{ label: string; value: string }>;
  sections: Array<{
    header: string;
    body?: string;
    items?: string[];
    keyValues?: Array<{ label: string; value: string }>;
    checklist?: Array<{ label: string; checked: boolean }>;
    source?: SourceAttribution;
  }>;
  sctPrimary?: {
    groupLabel: string;
    blocks: Array<{ label: string; content: string }>;
  };
  sctSecondary?: {
    groupLabel: string;
    blocks: Array<{ label: string; content: string }>;
  };
  gaps: Array<{ text: string; severity?: "critical" | "moderate" | "minor"; source?: SourceAttribution }>;
  nextSteps: Array<{ owner: string; action: string; deadline?: string; source?: SourceAttribution }>;
  strategicNote?: string;
  leadState: "Disqualified" | "Nurture Needed" | "Formal Quote Requested" | "Formal Pitch Requested" | "In Production" | "On Hold" | "Won" | "Lost";
  reEngagementTrigger?: string;
  gammaPrompt?: string;
};

Rules for populating the schema:
- "context" holds the top-level key-value pairs: prospect/client name, company, location, contact, role, referral source, budget indicators, timeline, etc. Every discrete fact gets its own entry.
- "clientFirstName", "clientLastName", "companyName" populate the header convention. Extract if available.
- "sections" holds narrative content blocks that don't fit into SCT, gaps, or next steps. Each section has a "header" and either "body" (paragraph text), "items" (bullet list), "keyValues" (labeled data pairs), or "checklist" (checkbox items). Use the most appropriate format for the content.
- "source" on each section/gap/nextStep: "transcript" for content drawn from the client's words in the input, "reflection" for strategic reads from the reflection input, "inherited" for fields carried forward from an upstream brief.
- "sctPrimary" and "sctSecondary" hold SCT framework blocks. The groupLabel and block labels will be specified in the brief type instructions.
- "gaps" must be thorough. Every unknown, assumption, or missing piece gets an entry. Assign severity: "critical" for things that block progress, "moderate" for things that need answers soon, "minor" for nice-to-knows.
- "nextSteps" must have an owner for every action. Use first names. If ownership is unclear, use "Team". Never use "Ferguson" — use "Ferg". Include deadlines where the input suggests them.
- "projectName" should be the client/project name extracted from the input.
- "projectDescription" should be a one-line summary of the project/opportunity.
- "strategicNote" is the 2-3 sentence TL;DR. It renders at the TOP of the document, ahead of everything else. Only omit if there is literally nothing strategic to say.
- "leadState" is required. Inherit from the briefState provided in input, or infer from the input. Default to "Nurture Needed" if unclear.
- "reEngagementTrigger" is required ONLY if leadState is "Disqualified", "Nurture Needed", "Lost", or "On Hold" — in that case describe what would need to be true for this to become active again.
- "gammaPrompt" is populated ONLY for Pitch briefs. Leave undefined for all other brief types.

Respond with ONLY the JSON object. No other text.`;

// ── Main generator ────────────────────────────────────────────

export async function generateBrief(
  systemPrompt: string,
  userInput: string,
  upstreamContext?: UpstreamContext
): Promise<BriefSchema> {
  const glossary = await loadGlossary();
  const glossaryBlock = formatGlossaryForPrompt(glossary);
  const upstreamBlock = formatUpstreamContext(upstreamContext);

  const fullSystem = `${systemPrompt}${glossaryBlock}${JSON_WRAPPER}`;
  const fullUser = `${upstreamBlock}${userInput}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: fullSystem,
    messages: [{ role: 'user', content: fullUser }],
  });

  const content = response.content[0];
  const text = content.type === 'text' ? content.text : '{}';

  const cleaned = text
    .replace(/^```(?:json)?\s*/gm, '')
    .replace(/```\s*$/gm, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as BriefSchema;
    return validateBriefSchema(parsed);
  } catch (e) {
    console.error('Failed to parse brief JSON:', e);
    console.error('Raw response:', text.substring(0, 500));
    return validateBriefSchema({
      projectName: 'Parse Error',
      projectDescription: 'The AI response could not be parsed. Try regenerating.',
      context: [],
      sections: [{ header: 'Raw Output', body: text }],
      gaps: [{ text: 'Brief could not be structured — review raw output above', severity: 'critical' }],
      nextSteps: [{ owner: 'Team', action: 'Regenerate this brief' }],
      leadState: 'Nurture Needed',
      versionHistory: [],
    } as BriefSchema);
  }
}

export function validateBriefSchema(data: BriefSchema): BriefSchema {
  if (!Array.isArray(data.context)) data.context = [];
  if (!Array.isArray(data.sections)) data.sections = [];
  if (!Array.isArray(data.gaps)) data.gaps = [];
  if (!Array.isArray(data.nextSteps)) data.nextSteps = [];

  // Normalize owner names
  data.nextSteps = data.nextSteps.map(step => ({
    ...step,
    owner: step.owner === 'Ferguson' ? 'Ferg' : step.owner,
  }));

  if (!data.projectName) {
    const nameEntry = data.context.find(c =>
      /^(name|client|prospect|project|company)/i.test(c.label)
    );
    data.projectName = nameEntry?.value || 'Untitled Brief';
  }

  if (!data.leadState) data.leadState = 'Nurture Needed';

  if (!Array.isArray(data.versionHistory) || data.versionHistory.length === 0) {
    data.versionHistory = [{ version: 1, timestamp: new Date().toISOString() }];
  }

  if (data.gammaPrompt === null) data.gammaPrompt = undefined;

  return data;
}
