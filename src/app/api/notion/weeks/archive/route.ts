import { NextRequest, NextResponse } from 'next/server';
import { getArchiveWeeks } from '@/lib/notion/weeklyReview';
import { toSafeError } from '@/lib/notion/errors';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageSize = Number(searchParams.get('limit')) || 10;
    const startCursor = searchParams.get('cursor') || undefined;

    const payload = await getArchiveWeeks(pageSize, startCursor);
    return NextResponse.json({ success: true, data: payload });

  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      { success: false, error: safeError.error, code: safeError.code },
      { status: safeError.status }
    );
  }
}
