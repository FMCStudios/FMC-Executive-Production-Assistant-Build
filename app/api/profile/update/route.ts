import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Resend } from 'resend';
import { getSession } from '@/lib/auth';
import { writeGearItems } from '@/lib/gear';

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { profile, gear } = await req.json();

  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!clientEmail || !privateKey || !spreadsheetId) {
    return NextResponse.json({ error: 'Sheets not configured' }, { status: 503 });
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Find the user's row in Roster
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Roster!A2:O' });
    const rows = res.data.values || [];
    const rowIndex = rows.findIndex(row => (row[5] || '').toLowerCase() === session.email.toLowerCase());

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const oldRow = rows[rowIndex];
    const fields = ['First Name', 'Last Name', 'AKA', 'Primary Role', 'Other Roles', 'Email', 'Phone',
      'Shooting Rate', 'Editing Rate', 'Producing Rate', 'Other Rate', 'Other Rate Label', 'Notes', 'Skills'];

    const newRow = [
      profile.firstName || '', profile.lastName || '', profile.aka || '',
      profile.primaryRole || '', profile.otherRoles || '', profile.email || '',
      profile.phone || '', profile.shootingRate || '', profile.editingRate || '',
      profile.producingRate || '', profile.otherRate || '', profile.otherRateLabel || '',
      profile.notes || '', profile.skills || '',
      oldRow[14] || 'Crew', // Preserve access level
    ];

    // Compute diff
    const changes: string[] = [];
    for (let i = 0; i < fields.length; i++) {
      const oldVal = (oldRow[i] || '').trim();
      const newVal = (newRow[i] || '').trim();
      if (oldVal !== newVal) {
        changes.push(`${fields[i]}: "${oldVal}" → "${newVal}"`);
      }
    }

    // Write updated row (A{row}:O{row})
    const sheetRow = rowIndex + 2; // +2 for header + 0-index
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Roster!A${sheetRow}:O${sheetRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [newRow] },
    });

    // Update gear: clear old gear for this owner, write new
    const fullName = `${profile.firstName} ${profile.lastName}`.trim();
    if (gear && Array.isArray(gear)) {
      // Read existing gear, find rows to clear
      const gearRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Gear Library!A2:H' });
      const gearRows = gearRes.data.values || [];
      // We can't easily delete rows via Sheets API values, so we overwrite with new gear
      // For simplicity, append new gear items (admin manages cleanup in Sheets)
      const newGear = gear.filter((g: { itemName: string }) => g.itemName?.trim());
      if (newGear.length > 0) {
        await writeGearItems(fullName, newGear);
      }
    }

    // Email admin if changes detected
    if (changes.length > 0 && process.env.ADMIN_EMAIL) {
      const name = `${profile.firstName} ${profile.lastName}`.trim();
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'EPA <onboarding@resend.dev>',
          to: process.env.ADMIN_EMAIL,
          subject: `Profile update: ${name}`,
          html: `<div style="font-family: -apple-system, sans-serif; padding: 20px;">
            <p><strong>${name}</strong> updated their profile:</p>
            <ul>${changes.map(c => `<li style="font-size: 14px; color: #333; margin: 4px 0;">${c}</li>`).join('')}</ul>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">— EPA</p>
          </div>`,
        });
      } catch { /* email is best-effort */ }
    }

    return NextResponse.json({ success: true, changes: changes.length });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
