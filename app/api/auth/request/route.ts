import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { findCrewByEmail } from '@/lib/crew';
import { createMagicToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Generic message regardless of whether email exists
    const genericMsg = "If your email is on the roster, you'll get a link.";

    const member = await findCrewByEmail(email);
    if (!member) {
      return NextResponse.json({ message: genericMsg });
    }

    const token = createMagicToken(email);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
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

    return NextResponse.json({ message: genericMsg });
  } catch (error) {
    console.error('Auth request error:', error);
    return NextResponse.json({ message: "If your email is on the roster, you'll get a link." });
  }
}
