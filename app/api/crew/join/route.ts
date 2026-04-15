import { NextResponse } from 'next/server';
import { writeCrewMember } from '@/lib/crew';
import { writeGearItems } from '@/lib/gear';

export async function POST(req: Request) {
  try {
    const { code, crew, gear } = await req.json();

    const validCode = process.env.CREW_INVITE_CODE;
    if (!validCode || code !== validCode) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 403 });
    }

    if (!crew?.firstName || !crew?.lastName || !crew?.email) {
      return NextResponse.json({ error: 'First name, last name, and email are required' }, { status: 400 });
    }

    const crewResult = await writeCrewMember(crew);
    if (!crewResult.success) {
      return NextResponse.json({ error: 'Failed to write to Roster — check Sheets config' }, { status: 503 });
    }

    const owner = `${crew.firstName} ${crew.lastName}`.trim();
    if (gear && Array.isArray(gear) && gear.length > 0) {
      await writeGearItems(owner, gear);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Crew join error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
