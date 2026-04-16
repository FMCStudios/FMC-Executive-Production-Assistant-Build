import { NextResponse } from 'next/server';
import { verifyMagicToken, createSessionToken } from '@/lib/auth';
import { findCrewByEmail } from '@/lib/crew';
import type { AccessLevel } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  // Step 1: Check token presence
  if (!token) {
    console.error('[auth/verify] No token in query params');
    return NextResponse.redirect(new URL('/login?error=missing', req.url));
  }

  const tokenPreview = `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
  console.log('[auth/verify] Token received:', tokenPreview, `(${token.length} chars)`);

  // Step 2: Verify magic token
  let payload: { email: string } | null;
  try {
    payload = verifyMagicToken(token);
    if (payload) {
      console.log('[auth/verify] Token verified — email:', payload.email);
    } else {
      console.error('[auth/verify] Token verification FAILED — returned null (expired or invalid signature)');
      return NextResponse.redirect(new URL('/login?error=expired', req.url));
    }
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error('[auth/verify] Token verification threw:', e.name, e.message, e.stack);
    return NextResponse.redirect(new URL('/login?error=expired', req.url));
  }

  // Step 3: Find crew member
  let member;
  try {
    member = await findCrewByEmail(payload.email);
    console.log('[auth/verify] Roster lookup:', member ? `found ${member.displayName} (${member.accessLevel})` : 'NOT FOUND');
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error('[auth/verify] Roster lookup threw:', e.name, e.message, e.stack);
    return NextResponse.redirect(new URL('/login?error=notfound', req.url));
  }

  if (!member) {
    return NextResponse.redirect(new URL('/login?error=notfound', req.url));
  }

  // Step 4: Create session token
  const validLevels: AccessLevel[] = ['Admin', 'Supervisor', 'Crew'];
  const accessLevel: AccessLevel = validLevels.includes(member.accessLevel as AccessLevel)
    ? (member.accessLevel as AccessLevel)
    : 'Crew';

  let sessionToken: string;
  try {
    sessionToken = createSessionToken({
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      displayName: member.displayName,
      accessLevel,
    });
    console.log('[auth/verify] Session token created:', sessionToken.length, 'chars');
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error('[auth/verify] Session token creation threw:', e.name, e.message, e.stack);
    return NextResponse.redirect(new URL('/login?error=expired', req.url));
  }

  // Step 5: Build redirect response and set cookie ON THE RESPONSE
  // (cookies().set() doesn't work with NextResponse.redirect — the redirect
  // response object replaces whatever cookies() tried to set)
  const dashboardUrl = new URL('/dashboard', req.url);
  const response = NextResponse.redirect(dashboardUrl);

  const cookieOptions = {
    name: 'epa-session',
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  };

  console.log('[auth/verify] Setting cookie:', {
    name: cookieOptions.name,
    valueLength: cookieOptions.value.length,
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
    maxAge: cookieOptions.maxAge,
  });

  response.cookies.set(cookieOptions);

  console.log('[auth/verify] Redirecting to:', dashboardUrl.toString());
  return response;
}
