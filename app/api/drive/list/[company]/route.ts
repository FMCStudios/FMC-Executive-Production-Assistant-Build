import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listClientBriefs } from '@/lib/drive';

export async function GET(
  _req: Request,
  { params }: { params: { company: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const company = decodeURIComponent(params.company || '').trim();
  if (!company) return NextResponse.json({ files: [] });

  const files = await listClientBriefs(company);
  return NextResponse.json({ files });
}
