import { NextResponse } from 'next/server';
import { readCrewRoster } from '@/lib/crew';

export async function GET() {
  try {
    const result = await readCrewRoster();

    if (!result.success) {
      return NextResponse.json(
        { error: 'Crew roster not configured — check Google Sheets env vars and "Crew" tab' },
        { status: 503 }
      );
    }

    return NextResponse.json({ crew: result.crew });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Crew roster error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
