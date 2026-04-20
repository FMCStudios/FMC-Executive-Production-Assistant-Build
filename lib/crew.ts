import { google } from 'googleapis';

export type RosterType = 'owner' | 'team' | 'freelance';

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
  accessLevel: string;
  rosterType?: RosterType;
  // Computed
  displayName: string;
  fullName: string;
};

function parseRosterType(raw: string | undefined): RosterType {
  const v = (raw || '').trim().toLowerCase();
  if (v === 'owner' || v === 'team' || v === 'freelance') return v;
  return 'team';
}

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
    range: 'Roster!A2:P',
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
        accessLevel: row[13]?.trim() || 'Crew',
        rosterType: parseRosterType(row[14]),
        skills: (row[15] || '').split(',').map((s: string) => s.trim()).filter(Boolean),
        displayName: aka || firstName,
        fullName: `${firstName} ${lastName}`.trim(),
      };
    });

  return { success: true, crew };
}

export async function findCrewByEmail(email: string): Promise<CrewMember | null> {
  const { crew } = await readCrewRoster();
  return crew.find(c => c.email.toLowerCase() === email.toLowerCase()) || null;
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
  skills?: string;
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
    '',                 // M: Notes
    'Crew',             // N: Access Level (default)
    'team',             // O: Roster Type (default)
    data.skills || '',  // P: Skills
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Roster!A:P',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });

  return { success: true };
}

export async function readSkillsLibrary(): Promise<string[]> {
  const config = getAuth();
  if (!config) return [];
  const { auth, spreadsheetId } = config;
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Skills!A2:A',
  });
  return (res.data.values || [])
    .map(r => (r[0] || '').trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

export async function appendSkillToLibrary(skill: string): Promise<{ added: boolean; skills: string[] }> {
  const trimmed = skill.trim();
  if (!trimmed) return { added: false, skills: await readSkillsLibrary() };
  const existing = await readSkillsLibrary();
  if (existing.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
    return { added: false, skills: existing };
  }
  const config = getAuth();
  if (!config) return { added: false, skills: existing };
  const { auth, spreadsheetId } = config;
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Skills!A:A',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[trimmed]] },
  });
  return { added: true, skills: [...existing, trimmed].sort((a, b) => a.localeCompare(b)) };
}

export async function writeRosterUpdate(
  email: string,
  updates: { rosterType?: RosterType; otherRoles?: string }
): Promise<{ success: boolean; error?: string }> {
  const config = getAuth();
  if (!config) return { success: false, error: 'Sheets not configured' };

  const { auth, spreadsheetId } = config;
  const sheets = google.sheets({ version: 'v4', auth });

  const target = email.trim().toLowerCase();
  if (!target) return { success: false, error: 'Email required' };

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Roster!A2:P',
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r) => (r[5] || '').toString().trim().toLowerCase() === target);

  if (rowIndex === -1) {
    return { success: false, error: 'Email not in roster' };
  }

  const sheetRow = rowIndex + 2; // +1 for header, +1 for 1-indexing
  const writes: Promise<unknown>[] = [];

  if (typeof updates.otherRoles === 'string') {
    writes.push(
      sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Roster!E${sheetRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[updates.otherRoles]] },
      })
    );
  }

  if (updates.rosterType) {
    writes.push(
      sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Roster!O${sheetRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[updates.rosterType]] },
      })
    );
  }

  if (writes.length === 0) {
    return { success: true };
  }

  await Promise.all(writes);
  return { success: true };
}
