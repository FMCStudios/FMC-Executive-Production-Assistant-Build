import { NextResponse } from 'next/server';
import { brands } from '@/lib/brands';
import { briefTypes, buildSystemPrompt } from '@/lib/briefs';
import { generateBrief, type UpstreamContext } from '@/lib/api';
import type { BriefSchema, LeadState } from '@/types/brief-schema';
import { LEAD_STATES } from '@/types/brief-schema';

// Inline primary-role → assistant-context map. Signed-in user's primaryRole
// from the Roster drives prompt tone; anything off this list falls through
// to no extra context.
const ROLE_CONTEXT: Record<string, string> = {
  'Producer':
    'You are assisting the producer — the senior decision-maker on this project. They are experienced, direct, and strategic. Provide high-level insights, flag blind spots, and be concise. They do not need hand-holding — surface the non-obvious.',
  'Supervising Producer':
    'You are assisting the supervising producer — the senior decision-maker on this project. They are experienced, direct, and strategic. Provide high-level insights, flag blind spots, and be concise. They do not need hand-holding — surface the non-obvious.',
  'Post Supervisor':
    'You are assisting the post-production supervisor. Be technical and specific about post workflows, codecs, color science, frame rates, delivery specs, and editorial pacing. They know post — match their depth.',
  'Production Assistant':
    'You are assisting a production assistant. Be clear, structured, and guide them through each field step by step. Flag anything that should be escalated to the supervising producer. Use concrete examples when a field might be confusing.',
  'DP':
    'You are assisting the director of photography. Focus on camera systems, lens choices, lighting setups, shot design, and visual storytelling. Be specific about technical specs and creative rationale.',
  'Camera Op':
    'You are assisting a camera operator. Focus on camera systems, lens choices, framing, movement, and on-set craft. Be specific about technical specs.',
  'Editor':
    'You are assisting an editor. Be specific about narrative structure, pacing, music direction, color grade, graphics, and delivery specs. They need actionable creative direction, not vague vibes.',
  'Colourist':
    'You are assisting a colourist. Focus on grade references, delivery color spaces, mood, and technical finishing notes.',
};

// Map upstream brief ids to the UpstreamContext slot names.
const UPSTREAM_SLOT: Record<string, keyof UpstreamContext> = {
  'lead-intake': 'intake',
  'discovery': 'discovery',
  'pitch': 'pitch',
  'production': 'production',
  'post-production': 'postProduction',
  'wrap-retention': 'wrapRetention',
};

export async function POST(req: Request) {
  try {
    const {
      briefType,
      primaryRole,
      rawInput,
      reflections,
      leadState,
      upstreamBriefs,
    } = await req.json();

    if (!briefType || !rawInput) {
      return NextResponse.json(
        { error: 'Missing required fields: briefType, rawInput' },
        { status: 400 }
      );
    }

    const brief = briefTypes[briefType];
    if (!brief) {
      return NextResponse.json({ error: 'Invalid brief type' }, { status: 400 });
    }

    const brand = brands.fmc;

    const roleContextText = typeof primaryRole === 'string' ? ROLE_CONTEXT[primaryRole] : undefined;
    const operatorContext = roleContextText ? `\n\nOPERATOR CONTEXT:\n${roleContextText}` : '';

    const resolvedLeadState: LeadState = LEAD_STATES.includes(leadState as LeadState)
      ? (leadState as LeadState)
      : 'Nurture Needed';

    // Assemble upstream context for the model (JSON sidecars passed from client).
    const upstreamContext: UpstreamContext = {};
    if (Array.isArray(upstreamBriefs)) {
      for (const item of upstreamBriefs as Array<{ briefType?: string; brief?: BriefSchema }>) {
        const slot = item.briefType ? UPSTREAM_SLOT[item.briefType] : undefined;
        if (slot && item.brief) {
          upstreamContext[slot] = item.brief;
        }
      }
    }

    // Compose the final user message with reflections inline so the model
    // can source-tag them separately from the raw transcript/input.
    const reflectionBlock =
      typeof reflections === 'string' && reflections.trim()
        ? `\n\n### REFLECTION (Ferg's strategic read — tag derived content as "reflection")\n${reflections.trim()}\n\n---\n\n`
        : '';

    const combinedInput = `LEAD STATE: ${resolvedLeadState}\n\n${reflectionBlock}### RAW INPUT (tag content drawn from here as "transcript")\n${rawInput}`;

    const baseSystem = buildSystemPrompt(briefType);

    const systemPrompt = `${baseSystem}

BRAND CONTEXT:
Brand: ${brand.name}
Tagline: ${brand.tagline}
Voice: ${brand.voice}
Services: ${brand.services}
SCT Framing: ${brand.sctFraming}
Tone Instruction: ${brand.briefToneInstruction}${operatorContext}`;

    const briefData = await generateBrief(systemPrompt, combinedInput, upstreamContext);

    // Ensure leadState echoes what the user selected, even if the model
    // didn't populate it reliably.
    briefData.leadState = resolvedLeadState;
    if (typeof reflections === 'string' && reflections.trim()) {
      briefData.reflections = reflections.trim();
    }
    if (Array.isArray(upstreamBriefs) && upstreamBriefs.length > 0) {
      briefData.upstreamBriefs = (upstreamBriefs as Array<{ briefType?: string; brief?: BriefSchema; briefId?: string; generatedAt?: string }>)
        .filter(u => u.briefType && u.brief)
        .map(u => ({
          briefType: u.briefType!,
          briefId: u.briefId || u.brief?.versionHistory?.[0]?.timestamp || '',
          generatedAt: u.generatedAt || u.brief?.versionHistory?.[0]?.timestamp || new Date().toISOString(),
        }));
    }

    return NextResponse.json({ brief: briefData });
  } catch (error) {
    console.error('Brief generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate brief. Check your ANTHROPIC_API_KEY.' },
      { status: 500 }
    );
  }
}
