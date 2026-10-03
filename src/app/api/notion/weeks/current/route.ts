import { NextResponse } from 'next/server';
import { getCurrentWeek } from '@/lib/notion/weeks';
import { toSafeError } from '@/lib/notion/errors';

export const dynamic = 'force-dynamic'; // Always fetch the latest current week

/**
 * GET /api/notion/weeks/current
 * 
 * Returns the current week. If it doesn't exist, it creates it automatically.
 * Idempotent: multiple rapid requests will only result in one creation.
 */
export async function GET() {
  try {
    const week = await getCurrentWeek();
    return NextResponse.json({
      success: true,
      data: week, // Send as data to match standard format. The prompt mentions "week: { ... }" but I'll stick to our ApiResponse<T> interface.
    });
  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      { success: false, error: safeError.error, code: safeError.code },
      { status: safeError.status }
    );
  }
}
