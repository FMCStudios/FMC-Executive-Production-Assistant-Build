import { NextResponse } from 'next/server';
import { brands } from '@/lib/brands';
import { briefTypes } from '@/lib/briefs';
import { operators } from '@/lib/operators';
import { generateBrief } from '@/lib/api';

export async function POST(req: Request) {
  try {
    const { briefType, operatorId, rawInput } = await req.json();

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

    // Resolve operator context (falls back to no extra context)
    const operator = operatorId ? operators[operatorId] : null;
    const operatorContext = operator?.systemPromptContext
      ? `\n\nOPERATOR CONTEXT:\n${operator.systemPromptContext}`
      : '';

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
