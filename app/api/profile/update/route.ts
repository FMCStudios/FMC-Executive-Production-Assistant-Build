import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Resend } from 'resend';
import { getSession } from '@/lib/auth';
import { writeGearItems } from '@/lib/gear';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { profile, gear, targetEmail } = await req.json();

  // Admin-edit mode: an Admin can edit any roster row by passing targetEmail.
  // Non-admins ignore targetEmail and can only edit their own row.
  const wantsOtherTarget = typeof targetEmail === 'string' && targetEmail.trim().length > 0;
  if (wantsOtherTarget && session.accessLevel !== 'Admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  const emailToEdit: string = wantsOtherTarget ? targetEmail.trim() : session.email;
  const editingOther = emailToEdit.toLowerCase() !== session.email.toLowerCase();

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
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Roster!A2:P' });
    const rows = res.data.values || [];
    const rowIndex = rows.findIndex(row => (row[5] || '').toLowerCase() === emailToEdit.toLowerCase());

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const oldRow = rows[rowIndex];
    // Gear rows in the sheet are keyed by "First Last" — take that from the
    // row we're about to write (admin-edit mode: row belongs to the target
    // user, not the session user). Fall back to the incoming form if the
    // row is somehow empty.
    const targetFullName =
      `${oldRow[0] || ''} ${oldRow[1] || ''}`.trim()
      || `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    // Fields we track for the diff. Indices in `oldRow`:
    //   A–M = 0–12, P (Skills) = 15
    const fields = ['First Name', 'Last Name', 'AKA', 'Primary Role', 'Other Roles', 'Email', 'Phone',
      'Shooting Rate', 'Editing Rate', 'Producing Rate', 'Other Rate', 'Other Rate Label', 'Notes', 'Skills'];

    const newRowAM = [
      profile.firstName || '', profile.lastName || '', profile.aka || '',
      profile.primaryRole || '', profile.otherRoles || '', profile.email || '',
      profile.phone || '', profile.shootingRate || '', profile.editingRate || '',
      profile.producingRate || '', profile.otherRate || '', profile.otherRateLabel || '',
      profile.notes || '',
    ];
    const newSkills = profile.skills || '';

    // Compute diff
    const changes: string[] = [];
    for (let i = 0; i < newRowAM.length; i++) {
      const oldVal = (oldRow[i] || '').trim();
      const newVal = (newRowAM[i] || '').trim();
      if (oldVal !== newVal) {
        changes.push(`${fields[i]}: "${oldVal}" → "${newVal}"`);
      }
    }
    const oldSkills = (oldRow[15] || '').trim();
    if (oldSkills !== newSkills.trim()) {
      changes.push(`Skills: "${oldSkills}" → "${newSkills.trim()}"`);
    }

    // Write A:M (user-owned) and P (skills) separately.
    // N (Access Level) and O (Roster Type) are admin-only — never written here.
    const sheetRow = rowIndex + 2; // +2 for header + 0-index
    await Promise.all([
      sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Roster!A${sheetRow}:M${sheetRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRowAM] },
      }),
      sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Roster!P${sheetRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[newSkills]] },
      }),
    ]);

    // Gear update: replace-by-owner. We always call through when gear is
    // provided, even if the list is empty — that's a valid "user cleared
    // their gear" state. writeGearItems deletes then appends.
    if (Array.isArray(gear)) {
      const cleanGear = gear
        .filter((g: { itemName?: string }) => g.itemName?.trim())
        .map((g: {
          itemName: string;
          brand?: string;
          category?: string;
          rentalRate?: string;
          condition?: string;
          serialNumber?: string;
          notes?: string;
        }) => ({
          itemName: g.itemName.trim(),
          brand: (g.brand || '').trim(),
          category: (g.category || '').trim(),
          rentalRate: (g.rentalRate || '').trim(),
          condition: (g.condition || '').trim(),
          serialNumber: (g.serialNumber || '').trim(),
          notes: (g.notes || '').trim(),
        }));
      await writeGearItems(targetFullName, cleanGear);
    }

    // Email admin if changes detected — skip when admin is editing someone else
    // (admin already knows what they did).
    if (changes.length > 0 && !editingOther && process.env.ADMIN_EMAIL) {
      const name = `${profile.firstName} ${profile.lastName}`.trim();
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'EPA <epa@fmcstudios.com>',
          replyTo: 'brandon@fmcstudios.com',
          to: process.env.ADMIN_EMAIL,
          subject: `Profile update: ${name}`,
          html: `<div style="font-family: 'Avenir Next', Avenir, -apple-system, sans-serif; background: #0D0D0D; padding: 32px; border-radius: 16px; max-width: 480px;">
            <p style="color: #F0EBE1; font-size: 14px; font-weight: 600; margin: 0 0 16px;"><strong>${name}</strong> updated their profile:</p>
            <ul style="padding-left: 16px; margin: 0 0 20px;">${changes.map(c => `<li style="font-size: 13px; color: rgba(240,235,225,0.6); margin: 6px 0; line-height: 1.4;">${c}</li>`).join('')}</ul>
            <p style="color: rgba(224,52,19,0.4); font-size: 11px; margin: 0;">FMC Studios &middot; EPA</p>
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
