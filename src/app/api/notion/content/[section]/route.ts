/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import {
  listContent,
  createContent,
  validateContent,
  isValidSection,
  getSectionSchema,
  type SectionKey,
} from '@/lib/notion/content';
import { toSafeError } from '@/lib/notion/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notion/content/[section]
 *
 * Lists records for a section. Supports week filtering.
 * ?weekId=<id>    — filter by week relation
 * ?limit=<n>      — page size (default 50)
 * ?cursor=<s>     — pagination cursor
 * ?schema=true    — returns the section schema metadata instead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ section: string }> },
) {
  try {
    const { section } = await params;

    if (!isValidSection(section)) {
      return NextResponse.json(
        { success: false, error: `Invalid section: ${section}` },
        { status: 400 },
      );
    }

    const searchParams = request.nextUrl.searchParams;

    // Schema metadata endpoint
    if (searchParams.get('schema') === 'true') {
      const schema = getSectionSchema(section as SectionKey);
      return NextResponse.json({ success: true, data: schema });
    }

    const weekId = searchParams.get('weekId') ?? undefined;
    const pageSize = searchParams.has('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : undefined;
    const startCursor = searchParams.get('cursor') ?? undefined;

    const result = await listContent(section as SectionKey, {
      weekId,
      pageSize,
      startCursor,
    });

    return NextResponse.json({
      success: true,
      data: result.items,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    });
  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      { success: false, error: safeError.error, code: safeError.code },
      { status: safeError.status },
    );
  }
}

/**
 * POST /api/notion/content/[section]
 *
 * Creates a new record in the section.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ section: string }> },
) {
  try {
    const { section } = await params;

    if (!isValidSection(section)) {
      return NextResponse.json(
        { success: false, error: `Invalid section: ${section}` },
        { status: 400 },
      );
    }

    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Payload too large (limit 1MB)' },
        { status: 413 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    // Validate
    const errors = validateContent(section as SectionKey, body as Record<string, any>, false);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 422 },
      );
    }

    const record = await createContent(section as SectionKey, body as Record<string, any>);

    return NextResponse.json(
      { success: true, data: record },
      { status: 201 },
    );
  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      { success: false, error: safeError.error, code: safeError.code },
      { status: safeError.status },
    );
  }
}
