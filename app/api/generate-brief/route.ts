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

    const briefText = await generateBrief(systemPrompt, rawInput);

    // Strip all markdown formatting before parsing
    const normalizedText = briefText
      .replace(/^#{1,4}\s+(.+?)\s*$/gm, (_, h) => {
        const upper = h.replace(/\*{2}/g, '').replace(/:\s*$/, '').trim();
        return upper.toUpperCase() === upper ? `${upper}:` : h;
      })
      .replace(/^\*{2}([A-Z][A-Z\s&\/()\u2014-]+?)\*{2}:?\s*$/gm, '$1:')
      .replace(/\*{2}([^*]+?)\*{2}/g, '$1')
      .replace(/__([^_]+?)__/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^\s*\*\s+/gm, '- ')
      .replace(/\n{3,}/g, '\n\n');

    const gapsMatch = normalizedText.match(/GAPS[^:\n]*:\s*\n([\s\S]*?)(?=\n[A-Z][A-Z\s&\/()\u2014-]+:|\n---|\n## |$)/i);
    const gaps = gapsMatch
      ? gapsMatch[1]
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.startsWith('-') || line.startsWith('*') || line.startsWith('\u2022') || line.startsWith('\u26A0') || line.startsWith('\u25A1') || line.startsWith('\u2717'))
          .map((line: string) => line.replace(/^[-*\u2022\u26A0\u25A1\u2717]\s*/, '').trim())
          .filter(Boolean)
      : [];

    return NextResponse.json({ brief: briefText, gaps });
  } catch (error) {
    console.error('Brief generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate brief. Check your ANTHROPIC_API_KEY.' },
      { status: 500 }
    );
  }
}
