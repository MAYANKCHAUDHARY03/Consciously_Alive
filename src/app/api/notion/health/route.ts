import { NextResponse } from 'next/server';
import { getNotionClient } from '@/lib/notion/client';
import { notionConfig } from '@/lib/notion/config';
import { toSafeError } from '@/lib/notion/errors';

/**
 * GET /api/notion/health
 *
 * Verifies:
 * 1. Environment variables are set
 * 2. Notion client can authenticate
 * 3. Parent page is accessible
 */
export async function GET() {
  try {
    // 1. Check config (throws if missing)
    const config = notionConfig();

    // 2. Get authenticated client
    const notion = getNotionClient();

    // 3. Verify parent page is accessible
    const page = await notion.pages.retrieve({
      page_id: config.parentPageId,
    });

    // 4. Return safe success response
    return NextResponse.json({
      connected: true,
      message: 'Notion connection successful',
      parentPage: {
        id: page.id,
        // Only expose the object type, not the full content
        type: page.object,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      {
        connected: false,
        message: safeError.error,
        code: safeError.code,
        timestamp: new Date().toISOString(),
      },
      { status: safeError.status }
    );
  }
}
