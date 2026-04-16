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
      from: 'EPA <onboarding@resend.dev>',
      to: email,
      subject: 'Your EPA login link',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <p style="color: #666; font-size: 14px;">Hey ${member.displayName},</p>
          <p style="color: #333; font-size: 14px;">Click below to log into the EPA:</p>
          <a href="${verifyUrl}" style="display: inline-block; background: #E03413; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0;">
            Log in to EPA
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">This link expires in 30 minutes. If you didn't request this, ignore this email.</p>
          <p style="color: #999; font-size: 11px; margin-top: 32px;">— FMC Studios</p>
        </div>
      `,
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
