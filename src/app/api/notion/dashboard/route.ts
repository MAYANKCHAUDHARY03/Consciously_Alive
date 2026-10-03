import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyDashboardStats } from '@/lib/notion/dashboard';
import { getCurrentWeek, getWeekByKey } from '@/lib/notion/weeks';
import { toSafeError } from '@/lib/notion/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notion/dashboard
 * 
 * Fetches the dashboard aggregation for a specific week or the current week.
 * ?weekKey=2026-W40 (Optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const weekKey = searchParams.get('weekKey');

    let weekId: string;

    if (weekKey) {
      // Find the specific week by key
      const week = await getWeekByKey(weekKey);
      if (!week) {
        return NextResponse.json(
          { success: false, error: 'Week not found' },
          { status: 404 }
        );
      }
      weekId = week.id;
    } else {
      // Auto-fallback to the current active week
      const currentWeek = await getCurrentWeek();
      weekId = currentWeek.id;
    }

    const data = await getWeeklyDashboardStats(weekId);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      { success: false, error: safeError.error, code: safeError.code },
      { status: safeError.status }
    );
  }
}
