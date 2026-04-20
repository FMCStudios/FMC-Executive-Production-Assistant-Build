import { NextResponse } from 'next/server';
import { brands } from '@/lib/brands';
import { briefTypes } from '@/lib/briefs';
import { generateBrief } from '@/lib/api';

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

export async function POST(req: Request) {
  try {
    const { briefType, primaryRole, rawInput } = await req.json();

    if (!briefType || !rawInput) {
      return NextResponse.json(
        { error: 'Missing required fields: briefType, rawInput' },
        { status: 400 }
      );
    }

    const brief = briefTypes[briefType];
    if (!brief) {
      return NextResponse.json(
        { error: 'Invalid brief type' },
        { status: 400 }
      );
    }

    // Always FMC brand
    const brand = brands.fmc;

    const roleContextText = typeof primaryRole === 'string' ? ROLE_CONTEXT[primaryRole] : undefined;
    const operatorContext = roleContextText ? `\n\nOPERATOR CONTEXT:\n${roleContextText}` : '';

    const systemPrompt = `${brief.systemPrompt}

BRAND CONTEXT:
Brand: ${brand.name}
Tagline: ${brand.tagline}
Voice: ${brand.voice}
Services: ${brand.services}
SCT Framing: ${brand.sctFraming}
Tone Instruction: ${brand.briefToneInstruction}${operatorContext}`;

    const briefData = await generateBrief(systemPrompt, rawInput);

    return NextResponse.json({ brief: briefData });
  } catch (error) {
    console.error('Brief generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate brief. Check your ANTHROPIC_API_KEY.' },
      { status: 500 }
    );
  }
}
