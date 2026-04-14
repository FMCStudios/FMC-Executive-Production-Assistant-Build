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
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Sheets API] Error:', message);
    if (message.includes('PERMISSION_DENIED') || message.includes('forbidden')) {
      console.error('[Sheets API] Service account likely lacks Editor access on the spreadsheet');
    }
    if (message.includes('not found') || message.includes('Unable to parse range')) {
      console.error('[Sheets API] Sheet tab "Pipeline" may not exist — create it or check the name is exact');
    }
    return NextResponse.json(
      { error: 'Failed to write to sheet', detail: message },
      { status: 500 }
    );
  }
}
