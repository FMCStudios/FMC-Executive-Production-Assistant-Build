import { google } from 'googleapis';

export type CrewMember = {
  name: string;
  role: string;
  email: string;
  phone: string;
  dayRate: string;
  kitFee: string;
  gear: string[];
  notes: string;
};

function getAuth() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) return null;

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return { auth, spreadsheetId };
}

export async function readCrewRoster(): Promise<{ success: boolean; crew: CrewMember[] }> {
  const config = getAuth();
  if (!config) return { success: false, crew: [] };

  const { auth, spreadsheetId } = config;
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Crew!A2:H',
  });

  const rows = res.data.values || [];

  const crew: CrewMember[] = rows
    .filter((row) => row[0]?.trim())
    .map((row) => ({
      name: row[0]?.trim() || '',
      role: row[1]?.trim() || '',
      email: row[2]?.trim() || '',
      phone: row[3]?.trim() || '',
      dayRate: row[4]?.trim() || '',
      kitFee: row[5]?.trim() || '',
      gear: (row[6] || '').split(',').map((g: string) => g.trim()).filter(Boolean),
      notes: row[7]?.trim() || '',
    }));

  return { success: true, crew };
}
