import { NextResponse } from 'next/server';
import { readGearLibrary } from '@/lib/gear';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await readGearLibrary();

    if (!result.success) {
      return NextResponse.json(
        { error: 'Gear library not configured — check Google Sheets env vars and "Gear Library" tab' },
        { status: 503 }
      );
    }

    return NextResponse.json({ gear: result.gear });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Gear library error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
