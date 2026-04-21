#!/usr/bin/env tsx
// One-time rewrite of the Pipeline tab header row (A1:U1) to match the
// authoritative column order defined in lib/sheets.ts. Safe to run multiple
// times — it only overwrites A1:U1, never touches data rows.
//
// Run: npx tsx scripts/rewrite-sheet-headers.ts

import { google } from 'googleapis';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: '.env.local' });
loadDotenv();

// Must match the row ordering in lib/sheets.ts buildRow logic.
const HEADERS: string[] = [
  'Date',              // A
  'Brand',             // B
  'Brief Type',        // C
  'Phase',             // D
  'Operator',          // E
  'Project',           // F
  'Client',            // G
  'Status',            // H
  'Critical Gaps',     // I
  'Total Gaps',        // J
  'Owners',            // K
  'Budget',            // L
  'Timeline',          // M
  'Gaps Detail',       // N
  'Next Steps Detail', // O
  'Description',       // P
  'Brief ID',          // Q
  'Operator Email',    // R
  'Crew On Brief',     // S
  'Lead State',        // T
  'Company',           // U
];

async function main() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    console.error('Missing env vars. Set GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY, GOOGLE_SHEETS_SPREADSHEET_ID.');
    process.exit(1);
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const before = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Pipeline!A1:AN1',
  });
  const beforeRow = before.data.values?.[0] || [];
  console.log('[before] Pipeline!A1:AN1 →', beforeRow);
  console.log('[before] column count:', beforeRow.length);

  const result = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Pipeline!A1:U1',
    valueInputOption: 'RAW',
    requestBody: { values: [HEADERS] },
  });
  console.log('[write] updatedRange:', result.data.updatedRange);
  console.log('[write] updatedCells:', result.data.updatedCells);

  const after = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Pipeline!A1:U1',
  });
  console.log('[after] Pipeline!A1:U1 →', after.data.values?.[0]);
  console.log(`[after] wrote ${HEADERS.length} header cells to Pipeline!A1:U1.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
