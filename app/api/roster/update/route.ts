import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { writeRosterUpdate, type RosterType } from '@/lib/crew';

export async function POST(req: Request) {
  const session = getSession();
  if (!session || session.accessLevel !== 'Admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { email, rosterType, otherRoles } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const validRosterTypes: RosterType[] = ['owner', 'team', 'freelance'];
    const updates: { rosterType?: RosterType; otherRoles?: string } = {};

    if (typeof rosterType === 'string') {
      if (!validRosterTypes.includes(rosterType as RosterType)) {
        return NextResponse.json({ error: 'Invalid rosterType' }, { status: 400 });
      }
      updates.rosterType = rosterType as RosterType;
    }

    if (typeof otherRoles === 'string') {
      updates.otherRoles = otherRoles;
    }

    const result = await writeRosterUpdate(email, updates);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
