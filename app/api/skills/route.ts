import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { readSkillsLibrary, appendSkillToLibrary } from '@/lib/crew';

export async function GET() {
  try {
    const skills = await readSkillsLibrary();
    return NextResponse.json({ skills });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return NextResponse.json({ error: err.message, skills: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { skill } = await req.json();
    if (typeof skill !== 'string' || !skill.trim()) {
      return NextResponse.json({ error: 'Skill required' }, { status: 400 });
    }
    const { added, skills } = await appendSkillToLibrary(skill);
    return NextResponse.json({ added, skills });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
