import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { findCrewByEmail } from '@/lib/crew';

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ user: null });

  // Enrich with primaryRole from Roster — the signed-in user IS the operator,
  // so downstream code (BriefGenerator, generate-brief) keys off this value.
  let primaryRole = '';
  try {
    const member = await findCrewByEmail(session.email);
    primaryRole = member?.primaryRole || '';
  } catch {
    // best-effort — an empty primaryRole falls through to no extra context
  }

  return NextResponse.json({ user: { ...session, primaryRole } });
}
