import { google } from 'googleapis';
import type { BriefSchema } from '@/types/brief-schema';

// Pipeline tab column order (A through U) — authoritative. The header row in
// the sheet MUST match this. Drift between the code and the sheet header
// causes silent column offset bugs. To realign the header, run:
//   npx tsx scripts/rewrite-sheet-headers.ts
//
// A: Date
// B: Brand
// C: Brief Type
// D: Phase
// E: Operator
// F: Project
// G: Client
// H: Status
// I: Critical Gaps
// J: Total Gaps
// K: Owners
// L: Budget
// M: Timeline
// N: Gaps Detail
// O: Next Steps Detail
// P: Description
// Q: Brief ID
// R: Operator Email
// S: Crew On Brief
// T: Lead State
// U: Company

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
  phase: number;
  operatorId: string;
  operatorEmail?: string;
  crewOnBrief?: string;
  rawInput: string;
  data: BriefSchema;
};

export async function writeBriefToSheet(input: BriefSheetData): Promise<{
  success: boolean;
  briefId: string;
  updatedRange?: string;
  updatedRows?: number;
  updatedCells?: number;
  serviceAccount?: string;
}> {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || '';
  const config = getAuth();
  if (!config) {
    console.warn('[Sheets] Skipping write — not configured');
    return { success: false, briefId: '', serviceAccount: clientEmail };
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
    timestamp,                         // A: Date
    input.brandName,                   // B: Brand
    input.briefTypeName,               // C: Brief Type
    input.phase.toString(),            // D: Phase
    input.operatorId,                  // E: Operator
    data.projectName,                  // F: Project
    clientName,                        // G: Client
    'Generated',                       // H: Status
    criticalGaps.toString(),           // I: Critical Gaps
    totalGaps.toString(),              // J: Total Gaps
    owners,                            // K: Owner(s)
    budget,                            // L: Budget
    timeline,                          // M: Timeline
    gapsSummary,                       // N: Gaps Detail
    nextStepsSummary,                  // O: Next Steps Detail
    data.projectDescription || '',     // P: Description
    briefId,                           // Q: Brief ID
    input.operatorEmail || '',         // R: Operator Email
    input.crewOnBrief || '',           // S: Crew On Brief
    data.leadState || '',              // T: Lead State
    data.companyName || '',            // U: Company
  ];

  try {
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Pipeline!A1',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });

    const updates = result.data.updates || {};
    const updatedRange = updates.updatedRange || '';
    const updatedRows = updates.updatedRows ?? 0;
    const updatedCells = updates.updatedCells ?? 0;

    console.log('[Sheets] Append OK', {
      updatedRange,
      updatedRows,
      updatedCells,
      serviceAccount: clientEmail,
      spreadsheetId,
    });

    return {
      success: true,
      briefId,
      updatedRange,
      updatedRows,
      updatedCells,
      serviceAccount: clientEmail,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(
      '[Sheets] Append failed:',
      err.message,
      err.stack,
      JSON.stringify(err, Object.getOwnPropertyNames(err)),
      { serviceAccount: clientEmail, spreadsheetId }
    );
    throw err;
  }
}
