import { google } from 'googleapis';
import type { BriefSchema } from '@/types/brief-schema';

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

// ── Sheet write ───────────────────────────────────────────────

export type BriefSheetData = {
  brandName: string;
  briefType: string;
  briefTypeName: string;
  rawInput: string;
  data: BriefSchema;
};

export async function writeBriefToSheet(input: BriefSheetData): Promise<{ success: boolean; briefId: string }> {
  const config = getAuth();
  if (!config) {
    console.warn('[Sheets] Skipping write — not configured');
    return { success: false, briefId: '' };
  }

  const { auth, spreadsheetId } = config;
  const sheets = google.sheets({ version: 'v4', auth });

  const briefId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const { data } = input;

  // Extract client/prospect name from context
  const clientEntry = data.context.find(c =>
    /^(prospect|client|name|couple)/i.test(c.label)
  );
  const clientName = clientEntry?.value || '';

  // Count gaps by severity
  const criticalGaps = data.gaps.filter(g => g.severity === 'critical').length;
  const totalGaps = data.gaps.length;

  // Summarize gaps as readable text
  const gapsSummary = data.gaps
    .map(g => `[${g.severity || 'moderate'}] ${g.text}`)
    .join(' | ')
    .slice(0, 2000);

  // Summarize next steps as readable text
  const nextStepsSummary = data.nextSteps
    .map(s => {
      const dl = s.deadline ? ` (${s.deadline})` : '';
      return `${s.owner}: ${s.action}${dl}`;
    })
    .join(' | ')
    .slice(0, 2000);

  // Extract unique owners
  const owners = Array.from(new Set(data.nextSteps.map(s => s.owner))).join(', ');

  // Budget indicator from context
  const budgetEntry = data.context.find(c =>
    /budget|rate|pricing|cost/i.test(c.label)
  );
  const budget = budgetEntry?.value || '';

  // Timeline from context
  const timelineEntry = data.context.find(c =>
    /timeline|deadline|date|delivery/i.test(c.label)
  );
  const timeline = timelineEntry?.value || '';

  const row = [
    timestamp,                    // A: Date
    input.brandName,              // B: Brand
    input.briefTypeName,          // C: Brief Type
    data.projectName,             // D: Project
    clientName,                   // E: Client
    'Generated',                  // F: Status
    criticalGaps.toString(),      // G: Critical Gaps
    totalGaps.toString(),         // H: Total Gaps
    owners,                       // I: Owner(s)
    budget,                       // J: Budget
    timeline,                     // K: Timeline
    gapsSummary,                  // L: Gaps Detail
    nextStepsSummary,             // M: Next Steps Detail
    data.projectDescription || '',// N: Description
    briefId,                      // O: Brief ID
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Pipeline!A:O',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });

  return { success: true, briefId };
}
