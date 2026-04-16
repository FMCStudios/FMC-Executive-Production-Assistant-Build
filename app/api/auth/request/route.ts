import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { findCrewByEmail } from '@/lib/crew';
import { createMagicToken } from '@/lib/auth';

export async function POST(req: Request) {
  const genericMsg = "If your email is on the roster, you'll get a link.";

  // Log env var presence (not values)
  console.log('[auth/request] ENV CHECK:', {
    RESEND_API_KEY: process.env.RESEND_API_KEY ? `defined (${process.env.RESEND_API_KEY.length} chars)` : 'MISSING',
    AUTH_SECRET: process.env.AUTH_SECRET ? 'defined' : 'MISSING',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ? 'defined' : 'MISSING',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'not set',
    VERCEL_URL: process.env.VERCEL_URL || 'not set',
    GOOGLE_SHEETS_CLIENT_EMAIL: process.env.GOOGLE_SHEETS_CLIENT_EMAIL ? 'defined' : 'MISSING',
    GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'defined' : 'MISSING',
  });

  let email: string;
  try {
    const body = await req.json();
    email = body.email;
    console.log('[auth/request] Email received:', email ? `${email.substring(0, 3)}...@...` : 'empty');
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error('[auth/request] Failed to parse request body:', e.name, e.message, e.stack);
    return NextResponse.json({ message: genericMsg });
  }

  if (!email) {
    console.log('[auth/request] No email provided');
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  // Step 1: Find crew member
  let member;
  try {
    console.log('[auth/request] Looking up email in Roster...');
    member = await findCrewByEmail(email);
    console.log('[auth/request] Roster lookup result:', member ? `found: ${member.displayName}` : 'not found');
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error('[auth/request] Roster lookup FAILED:', e.name, e.message, e.stack);
    return NextResponse.json({ message: genericMsg });
  }

  if (!member) {
    return NextResponse.json({ message: genericMsg });
  }

  // Step 2: Create magic token
  let token: string;
  let verifyUrl: string;
  try {
    token = createMagicToken(email);
    console.log('[auth/request] Magic token created, length:', token.length);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    verifyUrl = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;
    console.log('[auth/request] Verify URL base:', baseUrl);
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error('[auth/request] Token creation FAILED:', e.name, e.message, e.stack);
    return NextResponse.json({ message: genericMsg });
  }

  // Step 3: Send email via Resend
  try {
    console.log('[auth/request] Sending email via Resend to:', email);
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: 'EPA <epa@fmcstudios.com>',
      replyTo: 'brandon@fmcstudios.com',
      to: email,
      subject: 'Your EPA login link',
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0D0D0D; font-family: 'Avenir Next', Avenir, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0D0D0D;">
    <tr><td align="center" style="padding: 40px 20px;">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; width: 100%;">
        <!-- Header with ember gradient -->
        <tr><td style="background: linear-gradient(180deg, rgba(224,52,19,0.12) 0%, rgba(180,95,52,0.06) 60%, transparent 100%); border-radius: 16px 16px 0 0; padding: 40px 32px 24px; text-align: center;">
          <img src="https://fmc-epa.vercel.app/logos/fmc-cube.png" alt="FMC" width="40" height="40" style="display: block; margin: 0 auto 20px;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #F0EBE1; letter-spacing: -0.02em;">Your EPA login link</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="background-color: rgba(255,255,255,0.03); padding: 32px; border-left: 1px solid rgba(255,255,255,0.06); border-right: 1px solid rgba(255,255,255,0.06);">
          <p style="margin: 0 0 8px; font-size: 15px; color: #F0EBE1;">Hey ${member.displayName},</p>
          <p style="margin: 0 0 28px; font-size: 14px; color: rgba(240,235,225,0.5); line-height: 1.5;">Click below to sign in. This link expires in 30 minutes.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr><td style="background-color: #E03413; border-radius: 8px;">
              <a href="${verifyUrl}" style="display: inline-block; padding: 14px 28px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; letter-spacing: 0.01em;">Log in to EPA</a>
            </td></tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background-color: rgba(255,255,255,0.02); border-radius: 0 0 16px 16px; padding: 24px 32px; border-left: 1px solid rgba(255,255,255,0.06); border-right: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06);">
          <p style="margin: 0 0 12px; font-size: 11px; color: rgba(240,235,225,0.25); line-height: 1.5;">If you didn't request this, you can ignore this email. Only roster members can request login links.</p>
          <p style="margin: 0; font-size: 11px; color: rgba(224,52,19,0.4);">FMC Studios &middot; EPA</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    console.log('[auth/request] Resend response:', JSON.stringify(result));
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error('[auth/request] Resend send FAILED:', e.name, e.message, e.stack);
    return NextResponse.json({ message: genericMsg });
  }

  console.log('[auth/request] Success — email sent');
  return NextResponse.json({ message: genericMsg });
}
