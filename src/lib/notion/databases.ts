/**
 * Reusable Notion database and data-source operations.
 * Adapted for @notionhq/client v5 which separates databases from data sources.
 *
 * Key v5 changes:
 * - databases.create returns a database with `data_sources` references
 * - Properties are managed via dataSources.update (not databases)
 * - Querying rows uses dataSources.query (not databases.query)
 * - Pages are created with data_source_id as parent
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  UpdateDatabaseParameters,
  QueryDataSourceParameters,
} from '@notionhq/client';
import { getNotionClient } from './client';
import { withRetry } from './errors';

// ─── Create Database ──────────────────────────────────────────

/**
 * Creates a Notion database under a parent page.
 * Returns the full response including data_sources[0].id for querying.
 */
export async function createDatabase(
  parentPageId: string,
  title: string,
  icon: string,
) {
  const notion = getNotionClient();

  return withRetry(() =>
    notion.databases.create({
      parent: { type: 'page_id', page_id: parentPageId },
      icon: { type: 'emoji', emoji: icon as any },
      title: [{ type: 'text', text: { content: title } }],
    }),
    3, 1000, false
  );
}

// ─── Update Data Source Properties ────────────────────────────

/**
 * Updates properties on a data source (the v5 way to define schema).
 */
export async function updateDataSourceProperties(
  dataSourceId: string,
  properties: Record<string, any>
) {
  const notion = getNotionClient();
  return withRetry(() =>
    notion.dataSources.update({
      data_source_id: dataSourceId,
      properties,
    })
  );
}

// ─── Get Database ─────────────────────────────────────────────

export async function getDatabase(databaseId: string) {
  const notion = getNotionClient();
  return withRetry(() => notion.databases.retrieve({ database_id: databaseId }));
}

// ─── Update Database ──────────────────────────────────────────

export async function updateDatabase(
  databaseId: string,
  updates: Omit<UpdateDatabaseParameters, 'database_id'>
) {
  const notion = getNotionClient();
  return withRetry(() =>
    notion.databases.update({ database_id: databaseId, ...updates })
  );
}

// ─── Get Data Source ──────────────────────────────────────────

export async function getDataSource(dataSourceId: string) {
  const notion = getNotionClient();
  return withRetry(() =>
    notion.dataSources.retrieve({ data_source_id: dataSourceId })
  );
}

// ─── Query Data Source (replaces databases.query) ─────────────

export interface QueryOptions {
  filter?: QueryDataSourceParameters['filter'];
  sorts?: QueryDataSourceParameters['sorts'];
  pageSize?: number;
  startCursor?: string;
}

export async function queryDatabase(dataSourceId: string, options: QueryOptions = {}) {
  const notion = getNotionClient();

  const params: any = {
    data_source_id: dataSourceId,
    page_size: options.pageSize ?? 50,
  };

  if (options.filter) params.filter = options.filter;
  if (options.sorts) params.sorts = options.sorts;
  if (options.startCursor) params.start_cursor = options.startCursor;

  return withRetry(() => notion.dataSources.query(params));
}

// ─── Query All Pages (handles pagination) ─────────────────────

export async function queryAllPages(dataSourceId: string, options: Omit<QueryOptions, 'startCursor' | 'pageSize'> = {}, maxPagesToFetch = 10) {
  const allResults: any[] = [];
  let cursor: string | undefined;
  let hasMore = true;
  let pagesFetched = 0;

  while (hasMore && pagesFetched < maxPagesToFetch) {
    const response = await queryDatabase(dataSourceId, {
      ...options,
      pageSize: 100,
      startCursor: cursor,
    });

    allResults.push(...response.results);
    hasMore = response.has_more;
    cursor = response.next_cursor ?? undefined;
    pagesFetched++;
  }

  return allResults;
}

// ─── Helper: Extract data_source_id from database ─────────────

/**
 * Gets the primary data_source_id from a database response.
 * Every database in v5 has at least one data source.
 */
export function getDataSourceId(database: any): string {
  if (database.data_sources && database.data_sources.length > 0) {
    return database.data_sources[0].id;
  }
  // Fallback: use the database ID itself (some API versions)
  return database.id;
}
