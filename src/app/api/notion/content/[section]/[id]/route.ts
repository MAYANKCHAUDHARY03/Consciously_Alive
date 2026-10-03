/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import {
  getContent,
  updateContent,
  archiveContent,
  validateContent,
  isValidSection,
  type SectionKey,
} from '@/lib/notion/content';
import { toSafeError } from '@/lib/notion/errors';

/**
 * GET /api/notion/content/[section]/[id]
 *
 * Retrieves a single record by its Notion page ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ section: string; id: string }> },
) {
  try {
    const { section, id } = await params;

    if (!isValidSection(section)) {
      return NextResponse.json(
        { success: false, error: `Invalid section: ${section}` },
        { status: 400 },
      );
    }

    const record = await getContent(section as SectionKey, id);
    return NextResponse.json({ success: true, data: record });
  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      { success: false, error: safeError.error, code: safeError.code },
      { status: safeError.status },
    );
  }
}

/**
 * PATCH /api/notion/content/[section]/[id]
 *
 * Updates an existing record.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ section: string; id: string }> },
) {
  try {
    const { section, id } = await params;

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

    // Validate (partial — isUpdate=true)
    const errors = validateContent(section as SectionKey, body as Record<string, any>, true);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 422 },
      );
    }

    const record = await updateContent(section as SectionKey, id, body as Record<string, any>);
    return NextResponse.json({ success: true, data: record });
  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      { success: false, error: safeError.error, code: safeError.code },
      { status: safeError.status },
    );
  }
}

/**
 * DELETE /api/notion/content/[section]/[id]
 *
 * Archives a record (soft-delete via Notion).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ section: string; id: string }> },
) {
  try {
    const { section, id } = await params;

    if (!isValidSection(section)) {
      return NextResponse.json(
        { success: false, error: `Invalid section: ${section}` },
        { status: 400 },
      );
    }

    await archiveContent(id);
    return NextResponse.json({ success: true, message: 'Record archived' });
  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      { success: false, error: safeError.error, code: safeError.code },
      { status: safeError.status },
    );
  }
}
