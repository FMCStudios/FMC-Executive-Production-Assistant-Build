import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('key') !== 'test') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error('[test-email] ADMIN_EMAIL env var not set');
    return NextResponse.json({ error: 'ADMIN_EMAIL not configured' }, { status: 503 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[test-email] RESEND_API_KEY env var not set');
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 });
  }

  try {
    const resend = new Resend(apiKey);
    const timestamp = new Date().toISOString();

    const result = await resend.emails.send({
      from: 'EPA <onboarding@resend.dev>',
      to: adminEmail,
      subject: 'EPA test email',
      html: `<p>If you're reading this, Resend is wired up and working.</p><p>Deployed at ${timestamp}.</p>`,
    });

    console.log('[test-email] Success:', JSON.stringify(result));
    return NextResponse.json({ success: true, result, timestamp });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[test-email] Failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
