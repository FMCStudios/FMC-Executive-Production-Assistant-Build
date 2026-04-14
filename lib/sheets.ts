import { google } from 'googleapis';

// ── Auth ──────────────────────────────────────────────────────

function getAuth() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    console.warn('[Sheets] Missing env vars — GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY, or GOOGLE_SHEETS_SPREADSHEET_ID');
    return null;
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return { auth, spreadsheetId };
}

// ── Field extraction ──────────────────────────────────────────

function normalizeBrief(text: string): string {
  return text
    .replace(/^#{1,4}\s+([A-Z][A-Z\s&\/()\u2014-]+?)\s*:?\s*$/gm, '$1:')
    .replace(/^\*{2}([A-Z][A-Z\s&\/()\u2014-]+?)\*{2}:?\s*$/gm, '$1:');
}

function extractAfterHeader(text: string, pattern: RegExp): string {
  const normalized = normalizeBrief(text);
  const match = normalized.match(pattern);
  if (!match) return '';
  const startIdx = match.index! + match[0].length;
  const rest = normalized.slice(startIdx);
  // Take content until the next section header
  const nextHeader = rest.match(/\n[A-Z][A-Z\s&\/()\u2014-]+:/);
  const content = nextHeader ? rest.slice(0, nextHeader.index!) : rest;
  return content.trim().split('\n')[0]?.trim() || '';
}

function extractSection(text: string, pattern: RegExp): string[] {
  const normalized = normalizeBrief(text);
  const match = normalized.match(pattern);
  if (!match) return [];
  const startIdx = match.index! + match[0].length;
  const rest = normalized.slice(startIdx);
  const nextHeader = rest.match(/\n[A-Z][A-Z\s&\/()\u2014-]+:/);
  const content = nextHeader ? rest.slice(0, nextHeader.index!) : rest;
  return content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => l.replace(/^[-\u2022\u25A1\u2713\u2717\u26A0]\s*/, '').trim())
    .filter(Boolean);
}

export function extractFields(briefOutput: string) {
  const projectName =
    extractAfterHeader(briefOutput, /PROJECT:\s*/i) || 'Untitled';

  const clientName =
    extractAfterHeader(briefOutput, /PROSPECT:\s*/i) ||
    extractAfterHeader(briefOutput, /CLIENT:\s*/i) ||
    'Unknown';

  const gaps = extractSection(briefOutput, /GAPS[:\s]*\n/i);

  const nextSteps = extractSection(
    briefOutput,
    /(?:RECOMMENDED\s+)?NEXT\s+STEPS[:\s]*\n/i
  );

  // Revenue: scan for dollar amounts or budget keywords
  const dollarMatches = briefOutput.match(/\$[\d,]+(?:\.\d{2})?(?:\s*[kKmM])?/g);
  const budgetLine = briefOutput.match(/(?:budget|rate|pricing)[:\s]+([^\n]+)/i);
  const revenue = dollarMatches
    ? dollarMatches.join(', ')
    : budgetLine
      ? budgetLine[1].trim()
      : 'Unknown';

  // Follow-up date extraction
  const followUpMatch = briefOutput.match(
    /(?:follow[- ]?up|check[- ]?in|deadline|due)[:\s]+([^\n]{5,60})/i
  );
  const followUpDate = followUpMatch ? followUpMatch[1].trim() : '';

  return {
    projectName: projectName.slice(0, 200),
    clientName: clientName.slice(0, 200),
    gaps: gaps.join(', ').slice(0, 2000),
    nextSteps: nextSteps.join('; ').slice(0, 2000),
    revenue: revenue.slice(0, 200),
    followUpDate: followUpDate.slice(0, 100),
  };
}

// ── Sheet write ───────────────────────────────────────────────

export type BriefSheetData = {
  brandName: string;
  briefType: string;
  rawInput: string;
  briefOutput: string;
  gaps: string[];
};

export async function writeBriefToSheet(data: BriefSheetData): Promise<{ success: boolean; briefId: string }> {
  const config = getAuth();
  if (!config) {
    console.warn('[Sheets] Skipping write — not configured');
    return { success: false, briefId: '' };
  }

  const { auth, spreadsheetId } = config;
  const sheets = google.sheets({ version: 'v4', auth });

  const briefId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const extracted = extractFields(data.briefOutput);

  const row = [
    timestamp,                                           // A: Timestamp
    briefId,                                             // B: Brief ID
    data.brandName,                                      // C: Brand
    data.briefType,                                      // D: Brief Type
    extracted.projectName,                               // E: Project Name
    extracted.clientName,                                 // F: Client/Prospect Name
    'EPA User',                                          // G: Submitted By
    'Generated',                                         // H: Status
    data.rawInput.slice(0, 5000),                        // I: Raw Input
    data.briefOutput.slice(0, 10000),                    // J: Brief Output
    extracted.gaps || data.gaps.join(', ').slice(0, 2000), // K: Gaps Flagged
    extracted.nextSteps,                                 // L: Next Steps
    extracted.revenue,                                   // M: Revenue Indicator
    extracted.followUpDate,                              // N: Follow-Up Date
    '',                                                  // O: Notes
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Pipeline!A:O',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });

  return { success: true, briefId };
}
