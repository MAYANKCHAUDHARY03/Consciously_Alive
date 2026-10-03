/**
 * Reusable Notion page operations.
 * Updated for @notionhq/client v5.
 * All functions are server-side only.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { getNotionClient } from './client';
import { withRetry } from './errors';

// ─── Create Page ──────────────────────────────────────────────

/**
 * Creates a page in a data source (Notion v5).
 * Use the data_source_id from the database's data_sources array.
 */
export async function createPage(
  dataSourceId: string,
  properties: Record<string, any>,
  children?: any[]
) {
  const notion = getNotionClient();

  const params: any = {
    parent: { type: 'data_source_id', data_source_id: dataSourceId },
    properties,
  };

  if (children && children.length > 0) {
    params.children = children;
  }

  return withRetry(() => notion.pages.create(params), 3, 1000, false);
}

// ─── Get Page ─────────────────────────────────────────────────

export async function getPage(pageId: string) {
  const notion = getNotionClient();
  return withRetry(() => notion.pages.retrieve({ page_id: pageId }));
}

// ─── Update Page ──────────────────────────────────────────────

export async function updatePage(
  pageId: string,
  properties: Record<string, any>
) {
  const notion = getNotionClient();
  return withRetry(() =>
    notion.pages.update({ page_id: pageId, properties })
  );
}

// ─── Archive Page (soft delete) ───────────────────────────────

export async function archivePage(pageId: string) {
  const notion = getNotionClient();
  return withRetry(() =>
    notion.pages.update({ page_id: pageId, in_trash: true })
  );
}

// ─── Restore Page ─────────────────────────────────────────────

export async function restorePage(pageId: string) {
  const notion = getNotionClient();
  return withRetry(() =>
    notion.pages.update({ page_id: pageId, in_trash: false })
  );
}

// ─── Get Page Content (blocks) ────────────────────────────────

export async function getPageBlocks(pageId: string) {
  const notion = getNotionClient();
  const blocks: any[] = [];
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await withRetry(() =>
      notion.blocks.children.list({
        block_id: pageId,
        start_cursor: cursor,
        page_size: 100,
      })
    );

    blocks.push(...response.results);
    hasMore = response.has_more;
    cursor = response.next_cursor ?? undefined;
  }

  return blocks;
}

// ─── Append Block Children ────────────────────────────────────

export async function appendBlocks(pageId: string, children: any[]) {
  const notion = getNotionClient();
  return withRetry(() =>
    notion.blocks.children.append({
      block_id: pageId,
      children,
    })
  );
}
