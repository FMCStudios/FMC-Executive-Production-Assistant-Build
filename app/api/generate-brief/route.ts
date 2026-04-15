import { NextResponse } from 'next/server';
import { brands } from '@/lib/brands';
import { briefTypes } from '@/lib/briefs';
import { generateBrief } from '@/lib/api';

export async function POST(req: Request) {
  try {
    const { brandId, briefType, rawInput } = await req.json();

    if (!brandId || !briefType || !rawInput) {
      return NextResponse.json(
        { error: 'Missing required fields: brandId, briefType, rawInput' },
        { status: 400 }
      );
    }

    const brand = brands[brandId];
    const brief = briefTypes[briefType];

    if (!brand || !brief) {
      return NextResponse.json(
        { error: 'Invalid brand or brief type' },
        { status: 400 }
      );
    }

    const systemPrompt = `${brief.systemPrompt}

BRAND CONTEXT:
Brand: ${brand.name}
Tagline: ${brand.tagline}
Voice: ${brand.voice}
Services: ${brand.services}
SCT Framing: ${brand.sctFraming}
Tone Instruction: ${brand.briefToneInstruction}`;

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
