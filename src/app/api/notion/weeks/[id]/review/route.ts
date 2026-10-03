import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyIntelligenceReview } from '@/lib/notion/weeklyReview';
import { toSafeError } from '@/lib/notion/errors';

/**
 * GET /api/notion/weeks/[id]/review
 * 
 * Fetches the comprehensive weekly intelligence review payload.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Week ID is required' },
        { status: 400 }
      );
    }

    const payload = await getWeeklyIntelligenceReview(id);
    return NextResponse.json({ success: true, data: payload });

  } catch (err) {
    const safeError = toSafeError(err);
    console.error('[Briefing/Review API Error]', safeError.error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Unable to load weekly briefing', 
        details: safeError.error,
        code: safeError.code 
      },
      { status: safeError.status }
    );
  }
}
