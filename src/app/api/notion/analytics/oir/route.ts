import { NextRequest, NextResponse } from 'next/server';
import { getOirAnalytics, type AnalyticsRange } from '@/lib/notion/oirAnalytics';
import { toSafeError } from '@/lib/notion/errors';

export const dynamic = 'force-dynamic';

const VALID_RANGES = ['4w', '8w', '12w', '24w', 'all'];

/**
 * GET /api/notion/analytics/oir
 *
 * Returns aggregated OIR analytics data.
 * ?range=12w (default) — 4w, 8w, 12w, 24w, all
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rangeParam = searchParams.get('range') || '12w';

    if (!VALID_RANGES.includes(rangeParam)) {
      return NextResponse.json(
        { success: false, error: `Invalid range: ${rangeParam}. Must be one of: ${VALID_RANGES.join(', ')}` },
        { status: 400 },
      );
    }

    const data = await getOirAnalytics(rangeParam as AnalyticsRange);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      { success: false, error: safeError.error, code: safeError.code },
      { status: safeError.status },
    );
  }
}
