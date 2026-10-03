import { NextResponse } from 'next/server';
import { getSavedSynthesis } from '@/lib/notion/synthesis';
import { toSafeError } from '@/lib/notion/errors';

export async function GET() {
  try {
    const data = await getSavedSynthesis();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      { success: false, error: safeError.error, code: safeError.code },
      { status: safeError.status }
    );
  }
}
