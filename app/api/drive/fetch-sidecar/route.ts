import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { fetchSidecarJson } from '@/lib/drive';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { fileId } = await req.json();
    if (typeof fileId !== 'string' || !fileId.trim()) {
      return NextResponse.json({ error: 'fileId required' }, { status: 400 });
    }
    const brief = await fetchSidecarJson(fileId.trim());
    if (!brief) return NextResponse.json({ error: 'Sidecar not found' }, { status: 404 });
    return NextResponse.json({ brief });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
