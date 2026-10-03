import { NextResponse } from 'next/server';
import { getRecurringTopics } from '@/lib/notion/synthesis';
import { toSafeError } from '@/lib/notion/errors';

export async function GET() {
  try {
    const topics = await getRecurringTopics();
    return NextResponse.json({ success: true, data: topics });
  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      { success: false, error: safeError.error, code: safeError.code },
      { status: safeError.status }
    );
  }
}
