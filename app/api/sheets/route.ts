import { NextResponse } from 'next/server';
import { writeBriefToSheet } from '@/lib/sheets';

export async function POST(req: Request) {
  try {
    const { brandName, briefType, briefTypeName, phase, operatorId, operatorEmail, crewOnBrief, rawInput, briefOutput } = await req.json();

    if (!briefOutput) {
      return NextResponse.json(
        { error: 'Missing briefOutput' },
        { status: 400 }
      );
    }

    // briefOutput is now a BriefSchema object, not a string
    const data = typeof briefOutput === 'string' ? JSON.parse(briefOutput) : briefOutput;

    const result = await writeBriefToSheet({
      brandName: brandName || 'FMC Studios',
      briefType: briefType || 'unknown',
      briefTypeName: briefTypeName || briefType || 'unknown',
      phase: phase || 0,
      operatorId: operatorId || 'unknown',
      operatorEmail: operatorEmail || '',
      crewOnBrief: crewOnBrief || '',
      rawInput: rawInput || '',
      data,
    });

    if (!result.success) {
      console.warn('EPA Sheets: Write skipped — not configured (missing env vars)');
      return NextResponse.json(
        { error: 'Sheet write skipped — not configured' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      briefId: result.briefId,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('EPA Sheets: Error:', err.message);

    const message = err.message;
    if (message.includes('PERMISSION_DENIED') || message.includes('forbidden')) {
      console.error('EPA Sheets: Service account likely lacks Editor access on the spreadsheet');
    }
    if (message.includes('not found') || message.includes('Unable to parse range')) {
      console.error('EPA Sheets: Sheet tab "Pipeline" may not exist — check name is exact');
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
