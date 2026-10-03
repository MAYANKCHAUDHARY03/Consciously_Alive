import { NextRequest, NextResponse } from 'next/server';
import { getRelatedRecords } from '@/lib/notion/synthesis';
import { getContent, SectionKey } from '@/lib/notion/content';
import { toSafeError } from '@/lib/notion/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ section: string; id: string }> }
) {
  try {
    const { section, id } = await params;
    // We fetch the core record
    const record = await getContent(section as SectionKey, id);
    if (!record) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }
    const related = await getRelatedRecords(record);
    return NextResponse.json({ success: true, data: related });
  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      { success: false, error: safeError.error, code: safeError.code },
      { status: safeError.status }
    );
  }
}
