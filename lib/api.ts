import Anthropic from '@anthropic-ai/sdk';
import type { BriefSchema } from '@/types/brief-schema';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const JSON_WRAPPER = `

CRITICAL FORMATTING INSTRUCTION:
You MUST respond with ONLY a valid JSON object matching this exact TypeScript type. No markdown, no code fences, no preamble, no explanation — ONLY the JSON object.

type BriefSchema = {
  projectName: string;
  projectDescription?: string;
  context: Array<{ label: string; value: string }>;
  sections: Array<{
    header: string;
    body?: string;
    items?: string[];
    keyValues?: Array<{ label: string; value: string }>;
    checklist?: Array<{ label: string; checked: boolean }>;
  }>;
  sctPrimary?: {
    groupLabel: string;
    blocks: Array<{ label: string; content: string }>;
  };
  sctSecondary?: {
    groupLabel: string;
    blocks: Array<{ label: string; content: string }>;
  };
  gaps: Array<{ text: string; severity?: "critical" | "moderate" | "minor" }>;
  nextSteps: Array<{ owner: string; action: string; deadline?: string }>;
  strategicNote?: string;
};

Rules for populating the schema:
- "context" holds the top-level key-value pairs: prospect/client name, company, location, contact, role, referral source, budget indicators, timeline, etc. Every discrete fact gets its own entry.
- "sections" holds narrative content blocks that don't fit into SCT, gaps, or next steps. Each section has a "header" and either "body" (paragraph text), "items" (bullet list), "keyValues" (labeled data pairs), or "checklist" (checkbox items). Use the most appropriate format for the content.
- "sctPrimary" and "sctSecondary" hold SCT framework blocks. The groupLabel and block labels will be specified in the brief type instructions.
- "gaps" must be thorough. Every unknown, assumption, or missing piece gets an entry. Assign severity: "critical" for things that block progress, "moderate" for things that need answers soon, "minor" for nice-to-knows.
- "nextSteps" must have an owner for every action. Use first names. If ownership is unclear, use "Team". Never use "Ferguson" — use "Ferg". Include deadlines where the input suggests them.
- "projectName" should be the client/project name extracted from the input.
- "projectDescription" should be a one-line summary of the project/opportunity.
- "strategicNote" is optional — only include if there's a high-level strategic observation worth calling out separately.

Respond with ONLY the JSON object. No other text.`;

export async function generateBrief(systemPrompt: string, userInput: string): Promise<BriefSchema> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: systemPrompt + JSON_WRAPPER,
    messages: [{ role: 'user', content: userInput }],
  });

  const content = response.content[0];
  const text = content.type === 'text' ? content.text : '{}';

  // Strip any accidental markdown fences
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
    // Return a minimal valid schema so the UI doesn't crash
    return {
      projectName: 'Parse Error',
      projectDescription: 'The AI response could not be parsed. Try regenerating.',
      context: [],
      sections: [{ header: 'Raw Output', body: text }],
      gaps: [{ text: 'Brief could not be structured — review raw output above', severity: 'critical' }],
      nextSteps: [{ owner: 'Team', action: 'Regenerate this brief' }],
    };
  }
}

function validateBriefSchema(data: BriefSchema): BriefSchema {
  // Ensure required arrays exist
  if (!Array.isArray(data.context)) data.context = [];
  if (!Array.isArray(data.sections)) data.sections = [];
  if (!Array.isArray(data.gaps)) data.gaps = [];
  if (!Array.isArray(data.nextSteps)) data.nextSteps = [];

  // Normalize owner names
  data.nextSteps = data.nextSteps.map(step => ({
    ...step,
    owner: step.owner === 'Ferguson' ? 'Ferg' : step.owner,
  }));

  // Ensure projectName
  if (!data.projectName) {
    const nameEntry = data.context.find(c =>
      /^(name|client|prospect|project|company)/i.test(c.label)
    );
    data.projectName = nameEntry?.value || 'Untitled Brief';
  }

  return data;
}
