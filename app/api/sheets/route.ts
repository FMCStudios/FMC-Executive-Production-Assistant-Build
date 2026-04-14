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

    // Diagnostic logging for Vercel function logs
    console.log('EPA Sheets: Attempting write...');
    console.log('EPA Sheets: Client email:', process.env.GOOGLE_SHEETS_CLIENT_EMAIL ? process.env.GOOGLE_SHEETS_CLIENT_EMAIL.slice(0, 20) + '...' : 'MISSING');
    console.log('EPA Sheets: Spreadsheet ID:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID || 'MISSING');
    console.log('EPA Sheets: Private key starts with:', process.env.GOOGLE_SHEETS_PRIVATE_KEY ? process.env.GOOGLE_SHEETS_PRIVATE_KEY.slice(0, 27) + '...' : 'MISSING');

    const result = await writeBriefToSheet({
      brandName: brandName || 'Unknown',
      briefType: briefType || 'unknown',
      rawInput: rawInput || '',
      briefOutput,
      gaps: gaps || [],
    });

    if (!result.success) {
      console.warn('EPA Sheets: Write skipped — not configured (missing env vars)');
      return NextResponse.json(
        { error: 'Sheet write skipped — not configured' },
        { status: 503 }
      );
    }

    console.log('EPA Sheets: Write successful, briefId:', result.briefId);
    return NextResponse.json({
      success: true,
      briefId: result.briefId,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('EPA Sheets: FULL ERROR:', err.message);
    console.error('EPA Sheets: Stack:', err.stack);
    if ('code' in err) console.error('EPA Sheets: Error code:', (err as { code: unknown }).code);
    if ('status' in err) console.error('EPA Sheets: Error status:', (err as { status: unknown }).status);

    const message = err.message;
    if (message.includes('PERMISSION_DENIED') || message.includes('forbidden')) {
      console.error('EPA Sheets: Service account likely lacks Editor access on the spreadsheet');
    }
    if (message.includes('not found') || message.includes('Unable to parse range')) {
      console.error('EPA Sheets: Sheet tab "Pipeline" may not exist — check name is exact');
    }
    if (message.includes('invalid_grant') || message.includes('Invalid JWT')) {
      console.error('EPA Sheets: Private key is malformed — check \\\\n vs \\n escaping in env var');
    }

    return NextResponse.json(
      { error: message, code: 'code' in err ? (err as { code: unknown }).code : undefined },
      { status: 500 }
    );
  }
}
