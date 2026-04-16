import { NextResponse } from 'next/server';
import { verifyMagicToken, setSessionCookie } from '@/lib/auth';
import { findCrewByEmail } from '@/lib/crew';
import type { AccessLevel } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing', req.url));
  }

  const payload = verifyMagicToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL('/login?error=expired', req.url));
  }

  const member = await findCrewByEmail(payload.email);
  if (!member) {
    return NextResponse.redirect(new URL('/login?error=notfound', req.url));
  }

  const validLevels: AccessLevel[] = ['Admin', 'Supervisor', 'Crew'];
  const accessLevel: AccessLevel = validLevels.includes(member.accessLevel as AccessLevel)
    ? (member.accessLevel as AccessLevel)
    : 'Crew';

  setSessionCookie({
    email: member.email,
    firstName: member.firstName,
    lastName: member.lastName,
    displayName: member.displayName,
    accessLevel,
  });

  return NextResponse.redirect(new URL('/dashboard', req.url));
}
