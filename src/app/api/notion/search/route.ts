import { NextResponse } from 'next/server';
import { searchKnowledgeBase } from '@/lib/notion/search';
import { SectionKey } from '@/lib/notion/content';
import { toSafeError } from '@/lib/notion/errors';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const section = (searchParams.get('section') as SectionKey | 'all') || 'all';
    const weekId = searchParams.get('weekId') || '';
    const topic = searchParams.get('topic') || '';
    const type = searchParams.get('type') || '';
    const includeArchived = searchParams.get('includeArchived') === 'true';
    
    // new parameters for phase 9
    const savedParam = searchParams.get('saved');
    const saved = savedParam === 'true' ? true : savedParam === 'false' ? false : undefined;
    const revision = searchParams.get('revision') || undefined;

    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const results = await searchKnowledgeBase({
      q,
      section,
      weekId,
      topic,
      type,
      includeArchived,
      saved,
      revision,
      limit
    });

    return NextResponse.json({ results });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const safeError = toSafeError(error);
    console.error('Search API error:', safeError.error);
    return NextResponse.json({ error: safeError.error }, { status: safeError.status });
  }
}
