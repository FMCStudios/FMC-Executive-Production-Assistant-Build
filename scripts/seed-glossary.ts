#!/usr/bin/env tsx
// One-time seed for the Glossary tab.
// Run: npx tsx scripts/seed-glossary.ts
// After seeding, Brett/Corey can edit the sheet directly.

import { google, type sheets_v4 } from 'googleapis';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: '.env.local' });
loadDotenv();

type Row = [string, string];

const SEED: Row[] = [
  ['STACKT Market', 'stacked | stact | stacked market'],
  ['BMO Field', 'b-mo field | beemo field'],
  ['Scotiabank Arena', 'scotia bank arena'],
  ['Roy Thomson Hall', 'roy thompson hall'],
  ['Canada Games Park', 'canada game park'],
  ['MLSE', 'm.l.s.e. | emmelsee'],
  ['TJX Canada', 't.j.x. | t-j-x'],
  ['F45', 'f forty five | f-45'],
  ['Sage', ''],
  ['Powered By Sage', 'powered by sage'],
  ['Bari & Blue', 'barry and blue | berry and blue'],
  ['Ferguson Media Collective', 'ferguson media co | f.m.c.'],
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

  // Check if Glossary tab exists
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const hasGlossary = meta.data.sheets?.some((s: sheets_v4.Schema$Sheet) => s.properties?.title === 'Glossary');

  if (!hasGlossary) {
    console.log('Creating Glossary tab...');
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: 'Glossary' },
            },
          },
        ],
      },
    });
  } else {
    console.log('Glossary tab already exists — skipping creation.');
  }

  // Headers + seed. values.update with USER_ENTERED overwrites A1:B(N+1).
  const values: string[][] = [
    ['Correct', 'Common Mistranscriptions (pipe-separated)'],
    ...SEED,
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Glossary!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });

  console.log(`Seeded ${SEED.length} glossary rows into Glossary tab.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
