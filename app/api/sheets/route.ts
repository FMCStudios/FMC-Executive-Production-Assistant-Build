import { NextResponse } from 'next/server';
import { writeBriefToSheet } from '@/lib/sheets';

export async function POST(req: Request) {
  try {
    const { brandName, briefType, rawInput, briefOutput, gaps } = await req.json();

    if (!briefOutput) {
      return NextResponse.json(
        { error: 'Missing briefOutput' },
        { status: 400 }
      );
    }

    const result = await writeBriefToSheet({
      brandName: brandName || 'Unknown',
      briefType: briefType || 'unknown',
      rawInput: rawInput || '',
      briefOutput,
      gaps: gaps || [],
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Sheet write skipped — not configured' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      briefId: result.briefId,
    });
  } catch (error) {
    console.error('[Sheets API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to write to sheet' },
      { status: 500 }
    );
  }
}
