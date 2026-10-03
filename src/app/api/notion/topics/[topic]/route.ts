import { NextRequest, NextResponse } from 'next/server';
import { getTopicTimeline } from '@/lib/notion/synthesis';
import { toSafeError } from '@/lib/notion/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topic: string }> }
) {
  try {
    const { topic } = await params;
    const timeline = await getTopicTimeline(decodeURIComponent(topic));
    return NextResponse.json({ success: true, data: timeline });
  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      { success: false, error: safeError.error, code: safeError.code },
      { status: safeError.status }
    );
  }
}
