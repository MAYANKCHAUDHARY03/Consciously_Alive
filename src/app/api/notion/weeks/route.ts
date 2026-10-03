import { NextRequest, NextResponse } from 'next/server';
import { listWeeks, createWeek } from '@/lib/notion/weeks';
import { toSafeError } from '@/lib/notion/errors';
import { Status } from '@/lib/notion/types';

/**
 * GET /api/notion/weeks
 * 
 * Lists weeks with optional pagination and status filtering.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageSize = searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const startCursor = searchParams.get('cursor') ?? undefined;
    const status = searchParams.get('status') as Status | undefined;

    const response = await listWeeks({ pageSize, startCursor, status });

    return NextResponse.json({
      success: true,
      data: response.items,
      hasMore: response.hasMore,
      nextCursor: response.nextCursor,
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
 * POST /api/notion/weeks
 * 
 * Creates a specific week based on date input.
 */
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // ignore
    }

    const dateInput = (body.date || body.startDate) as string | undefined;

    // Reject totally invalid dates explicitly
    if (dateInput && isNaN(new Date(dateInput).getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date input' },
        { status: 400 }
      );
    }

    const week = await createWeek(dateInput);

    return NextResponse.json({
      success: true,
      data: week,
    });
  } catch (err) {
    const safeError = toSafeError(err);
    // Let's assume conflict if Notion returns something specific, but `createWeek` 
    // already handles idempotency, so it'll just return the existing week instead of error.
    return NextResponse.json(
      { success: false, error: safeError.error, code: safeError.code },
      { status: safeError.status }
    );
  }
}
