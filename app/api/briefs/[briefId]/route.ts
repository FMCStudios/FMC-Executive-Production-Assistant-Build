import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getSession } from '@/lib/auth';

export async function DELETE(
  _req: Request,
  { params }: { params: { briefId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { briefId } = params;

  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!clientEmail || !privateKey || !spreadsheetId) {
    return NextResponse.json({ error: 'Sheets not configured' }, { status: 503 });
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Pipeline!A2:U',
    });
    const rows = readRes.data.values || [];
    const rowIndex = rows.findIndex(row => (row[16] || '') === briefId);
    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
    }

    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    const pipelineSheet = metadata.data.sheets?.find(s => s.properties?.title === 'Pipeline');
    const sheetId = pipelineSheet?.properties?.sheetId;
    if (sheetId === undefined || sheetId === null) {
      return NextResponse.json({ error: 'Pipeline sheet not found' }, { status: 500 });
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex + 1, // 0-indexed, +1 for header
              endIndex: rowIndex + 2,
            },
          },
        }],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Delete brief] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
