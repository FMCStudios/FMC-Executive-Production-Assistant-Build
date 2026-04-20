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
    notes?: string;
  }>
): Promise<{ success: boolean }> {
  const config = getAuth();
  if (!config) return { success: false };

  const { auth, spreadsheetId } = config;
  const sheets = google.sheets({ version: 'v4', auth });

  // Resolve sheetId for the "Gear Library" tab — batchUpdate.deleteDimension
  // needs it, values.* ranges do not.
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const tab = meta.data.sheets?.find(s => s.properties?.title === 'Gear Library');
  const gearSheetId = tab?.properties?.sheetId;
  if (gearSheetId === undefined || gearSheetId === null) return { success: false };

  // Find every row in col D owned by `owner` and delete them in reverse so
  // earlier indices stay valid. deleteDimension ranges are half-open and
  // 0-indexed: row 2 in Sheets (first data row under the header) is
  // startIndex: 1 / endIndex: 2.
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Gear Library!A2:H',
  });
  const rows = res.data.values || [];
  const target = owner.trim().toLowerCase();

  const matchingIndices: number[] = [];
  rows.forEach((row, i) => {
    if ((row[3] || '').toString().trim().toLowerCase() === target) {
      matchingIndices.push(i);
    }
  });

  if (matchingIndices.length > 0) {
    const requests = matchingIndices
      .sort((a, b) => b - a)
      .map(i => ({
        deleteDimension: {
          range: {
            sheetId: gearSheetId,
            dimension: 'ROWS',
            startIndex: i + 1,
            endIndex: i + 2,
          },
        },
      }));
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }

  if (items.length > 0) {
    const newRows = items.map(g => [
      g.itemName || '',
      g.brand || '',
      g.category || '',
      owner,
      g.rentalRate || '',
      g.condition || '',
      g.serialNumber || '',
      g.notes || '',
    ]);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Gear Library!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: newRows },
    });
  }

  return { success: true };
}
