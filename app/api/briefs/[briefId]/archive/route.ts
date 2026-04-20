import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getSession } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: { briefId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { briefId } = params;
  const body = await req.json().catch(() => ({}));
  const newStatus = typeof body?.status === 'string' && body.status.trim() ? body.status.trim() : 'Archived';

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

    const sheetRow = rowIndex + 2; // +1 header, +1 for 1-indexed sheet rows
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Pipeline!H${sheetRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[newStatus]] },
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Archive] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
