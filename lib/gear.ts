import { google } from 'googleapis';
import { getSheetAuth } from './crew';

export type GearItem = {
  itemName: string;
  brand: string;
  category: string;
  owner: string;
  rentalRate: string;
  condition: string;
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
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
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
    range: 'Gear Library!A2:H',
  });

  const rows = res.data.values || [];

  const gear: GearItem[] = rows
    .filter((row) => row[0]?.trim())
    .map((row) => ({
      itemName: row[0]?.trim() || '',
      brand: row[1]?.trim() || '',
      category: row[2]?.trim() || '',
      owner: row[3]?.trim() || '',
      rentalRate: row[4]?.trim() || '',
      condition: row[5]?.trim() || '',
      serialNumber: row[6]?.trim() || '',
      notes: row[7]?.trim() || '',
    }));

  return { success: true, gear };
}

export async function writeGearItems(
  owner: string,
  items: Array<{
    itemName: string;
    brand: string;
    category: string;
    rentalRate: string;
    condition: string;
    serialNumber: string;
  }>
): Promise<{ success: boolean }> {
  const config = getAuth();
  if (!config) return { success: false };

  const { auth, spreadsheetId } = config;
  const sheets = google.sheets({ version: 'v4', auth });

  const rows = items.map((g) => [
    g.itemName,
    g.brand,
    g.category,
    owner,
    g.rentalRate,
    g.condition,
    g.serialNumber,
    '',
  ]);

  if (rows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Gear Library!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows },
    });
  }

  return { success: true };
}
