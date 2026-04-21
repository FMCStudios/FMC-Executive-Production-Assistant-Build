import { NextResponse } from 'next/server';
import { writeBriefToSheet } from '@/lib/sheets';
import { uploadJsonSidecar, buildBaseFilename } from '@/lib/drive';

type DriveStatus = 'uploaded' | 'failed' | 'disabled';

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
        {
          status: 503,
          headers: {
            'X-Sheets-Success': 'false',
            'X-Sheets-Service-Account': result.serviceAccount || '',
          },
        }
      );
    }

    // Best-effort Drive JSON sidecar upload. Failure must never fail the
    // Sheets write — Sheets is canonical, Drive is a mirror.
    let driveStatus: DriveStatus = 'disabled';
    let driveJsonUrl: string | null = null;
    let driveError: string | null = null;
    try {
      const companyName = data.companyName || data.projectName || 'Unknown Client';
      const baseFilename = buildBaseFilename(data, briefTypeName || briefType || 'brief');
      const driveRes = await uploadJsonSidecar({
        jsonData: data,
        filename: baseFilename,
        companyName,
      });
      if (driveRes.success) {
        driveStatus = 'uploaded';
        driveJsonUrl = driveRes.jsonUrl || null;
      } else {
        const err = driveRes.error || 'unknown';
        if (err.toLowerCase().includes('not configured')) {
          driveStatus = 'disabled';
        } else {
          driveStatus = 'failed';
          driveError = err;
        }
      }
    } catch (driveErr) {
      const err = driveErr instanceof Error ? driveErr : new Error(String(driveErr));
      console.error('[api/sheets] Drive sidecar upload threw (non-fatal):', err.message, err.stack);
      driveStatus = 'failed';
      driveError = err.message || 'threw';
    }

    const headers = new Headers({
      'X-Sheets-Success': 'true',
      'X-Sheets-Updated-Range': result.updatedRange || '',
      'X-Sheets-Service-Account': result.serviceAccount || '',
      'X-Drive-Status': driveStatus,
    });
    if (driveJsonUrl) headers.set('X-Drive-Json-Url', driveJsonUrl);
    if (driveError) headers.set('X-Drive-Error', driveError);

    return NextResponse.json(
      { success: true, briefId: result.briefId },
      { headers }
    );
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
      {
        status: 500,
        headers: {
          'X-Sheets-Success': 'false',
          'X-Sheets-Service-Account': process.env.GOOGLE_SHEETS_CLIENT_EMAIL || '',
        },
      }
    );
  }
}
