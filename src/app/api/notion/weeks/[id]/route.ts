import { NextRequest, NextResponse } from 'next/server';
import { getWeek, updateWeek } from '@/lib/notion/weeks';
import { toSafeError } from '@/lib/notion/errors';

/**
 * GET /api/notion/weeks/[id]
 * 
 * Retrieve a specific Weekly Archive record by its ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Next.js 15 route handlers use Promise for params
) {
  try {
    const { id } = await params;
    const week = await getWeek(id);
    return NextResponse.json({
      success: true,
      data: week,
    });
  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      { success: false, error: safeError.error, code: safeError.code },
      { status: safeError.status }
    );
  }
}

/**
 * PATCH /api/notion/weeks/[id]
 * 
 * Update editable metadata of a specific week.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Only allow updating specific fields
    const updates = {
      title: body.title,
      status: body.status,
      takeaways: body.takeaways,
    };

    const week = await updateWeek(id, updates);

    return NextResponse.json({
      success: true,
      data: week,
    });
  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      { success: false, error: safeError.error, code: safeError.code },
      { status: safeError.status }
    );
  }
}
