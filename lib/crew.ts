import { google } from 'googleapis';

export type CrewMember = {
  firstName: string;
  lastName: string;
  aka: string;
  primaryRole: string;
  otherRoles: string[];
  email: string;
  phone: string;
  shootingRate: string;
  editingRate: string;
  producingRate: string;
  otherRate: string;
  otherRateLabel: string;
  notes: string;
  skills: string[];
  // Computed
  displayName: string;
  fullName: string;
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

export { getAuth as getSheetAuth };

export async function readCrewRoster(): Promise<{ success: boolean; crew: CrewMember[] }> {
  const config = getAuth();
  if (!config) return { success: false, crew: [] };

  const { auth, spreadsheetId } = config;
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Roster!A2:N',
  });

  const rows = res.data.values || [];

  const crew: CrewMember[] = rows
    .filter((row) => row[0]?.trim())
    .map((row) => {
      const firstName = row[0]?.trim() || '';
      const lastName = row[1]?.trim() || '';
      const aka = row[2]?.trim() || '';
      return {
        firstName,
        lastName,
        aka,
        primaryRole: row[3]?.trim() || '',
        otherRoles: (row[4] || '').split(',').map((r: string) => r.trim()).filter(Boolean),
        email: row[5]?.trim() || '',
        phone: row[6]?.trim() || '',
        shootingRate: row[7]?.trim() || '',
        editingRate: row[8]?.trim() || '',
        producingRate: row[9]?.trim() || '',
        otherRate: row[10]?.trim() || '',
        otherRateLabel: row[11]?.trim() || '',
        notes: row[12]?.trim() || '',
        skills: (row[13] || '').split(',').map((s: string) => s.trim()).filter(Boolean),
        displayName: aka || firstName,
        fullName: `${firstName} ${lastName}`.trim(),
      };
    });

  return { success: true, crew };
}

export async function writeCrewMember(data: {
  firstName: string;
  lastName: string;
  aka: string;
  primaryRole: string;
  otherRoles: string;
  email: string;
  phone: string;
  shootingRate: string;
  editingRate: string;
  producingRate: string;
  otherRate: string;
  otherRateLabel: string;
}): Promise<{ success: boolean }> {
  const config = getAuth();
  if (!config) return { success: false };

  const { auth, spreadsheetId } = config;
  const sheets = google.sheets({ version: 'v4', auth });

  const row = [
    data.firstName,
    data.lastName,
    data.aka,
    data.primaryRole,
    data.otherRoles,
    data.email,
    data.phone,
    data.shootingRate,
    data.editingRate,
    data.producingRate,
    data.otherRate,
    data.otherRateLabel,
    '',
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Roster!A:M',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });

  return { success: true };
}
