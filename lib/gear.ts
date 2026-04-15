import { google } from 'googleapis';

export type GearItem = {
  itemName: string;
  category: string;
  owner: string;
  rentalRate: string;
  serialNumber: string;
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

export async function readGearLibrary(): Promise<{ success: boolean; gear: GearItem[] }> {
  const config = getAuth();
  if (!config) return { success: false, gear: [] };

  const { auth, spreadsheetId } = config;
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Gear Library!A2:F',
  });

  const rows = res.data.values || [];

  const gear: GearItem[] = rows
    .filter((row) => row[0]?.trim())
    .map((row) => ({
      itemName: row[0]?.trim() || '',
      category: row[1]?.trim() || '',
      owner: row[2]?.trim() || '',
      rentalRate: row[3]?.trim() || '',
      serialNumber: row[4]?.trim() || '',
      notes: row[5]?.trim() || '',
    }));

  return { success: true, gear };
}
