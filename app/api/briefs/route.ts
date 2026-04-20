import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getSession, isSupervisor } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope'); // 'all' = team-wide (supervisor/admin only)

  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!clientEmail || !privateKey || !spreadsheetId) {
    return NextResponse.json({ error: 'Sheets not configured' }, { status: 503 });
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Pipeline!A2:U',
    });

    const rows = res.data.values || [];
    const email = session.email.toLowerCase();

    const briefs = rows
      .map((row) => ({
        date: row[0] || '',
        brand: row[1] || '',
        briefType: row[2] || '',
        phase: row[3] || '',
        operator: row[4] || '',
        project: row[5] || '',
        client: row[6] || '',
        status: row[7] || '',
        criticalGaps: Number(row[8] || 0),
        totalGaps: Number(row[9] || 0),
        owners: row[10] || '',
        budget: row[11] || '',
        timeline: row[12] || '',
        gapsDetail: row[13] || '',
        nextStepsDetail: row[14] || '',
        description: row[15] || '',
        briefId: row[16] || '',
        operatorEmail: (row[17] || '').toLowerCase(),
        crewOnBrief: (row[18] || '').toLowerCase(),
        leadState: row[19] || '',
        company: row[20] || '',
      }))
      .reverse();

    if (scope === 'all') {
      if (!isSupervisor(session)) {
        return NextResponse.json({ error: 'Admin/Supervisor required' }, { status: 403 });
      }
      return NextResponse.json({ all: briefs });
    }

    const wrote = briefs.filter(b => b.operatorEmail === email);
    const onBrief = briefs.filter(b =>
      b.crewOnBrief.split(',').map((s: string) => s.trim()).includes(email) && b.operatorEmail !== email
    );

    return NextResponse.json({ wrote, onBrief });
  } catch (error) {
    console.error('Briefs read error:', error);
    return NextResponse.json({ wrote: [], onBrief: [] });
  }
}
