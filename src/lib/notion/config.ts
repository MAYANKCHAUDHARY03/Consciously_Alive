/**
 * Notion configuration — reads from environment variables.
 * Throws a clear error if required variables are missing.
 */

export interface NotionConfig {
  apiKey: string;
  parentPageId: string;
}

/** Database IDs — populated after Phase 2 database creation */
export interface NotionDatabaseIds {
  weeklyArchive: string;
  generalAwareness: string;
  defenceUpdates: string;
  currentAffairs: string;
  editorials: string;
  vocabulary: string;
  oirSets: string;
  resources: string;
}

/** Data Source IDs — needed for querying/creating pages in Notion v5 */
export type NotionDataSourceIds = {
  [K in keyof NotionDatabaseIds]: string;
};

let _config: NotionConfig | null = null;
let _dbIds: NotionDatabaseIds | null = null;
let _dsIds: NotionDataSourceIds | null = null;

export function notionConfig(): NotionConfig {
  if (_config) return _config;

  const apiKey = process.env.NOTION_API_KEY;
  const rawPageId = process.env.NOTION_PARENT_PAGE_ID;

  if (!apiKey) {
    throw new Error(
      'NOTION_API_KEY is not set. Add it to .env.local — see .env.local for instructions.'
    );
  }

  if (!rawPageId) {
    throw new Error(
      'NOTION_PARENT_PAGE_ID is not set. Add the parent page ID to .env.local.'
    );
  }

  const parentPageId = normalizePageId(rawPageId);
  _config = { apiKey, parentPageId };
  return _config;
}

/**
 * Normalizes a Notion page ID:
 *  - Extracts UUID from full Notion URLs
 *  - Adds dashes to 32-char hex strings
 *  - Passes through already-dashed UUIDs
 */
function normalizePageId(input: string): string {
  let id = input.trim();

  // If it's a URL, extract the last 32-hex-char segment
  if (id.startsWith('http')) {
    const match = id.match(/([a-f0-9]{32})(?:[?#]|$)/i)
      ?? id.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (match) {
      id = match[1];
    }
  }

  // Strip the hash fragment if present
  if (id.includes('#')) {
    id = id.split('#').pop()!;
  }

  // Remove any dashes for uniform handling
  const stripped = id.replace(/-/g, '');

  // Validate it's a 32-char hex string
  if (!/^[a-f0-9]{32}$/i.test(stripped)) {
    throw new Error(
      `Invalid Notion page ID: "${input}". Expected a 32-character hex UUID or a Notion page URL.`
    );
  }

  // Format as UUID with dashes: 8-4-4-4-12
  return [
    stripped.slice(0, 8),
    stripped.slice(8, 12),
    stripped.slice(12, 16),
    stripped.slice(16, 20),
    stripped.slice(20),
  ].join('-');
}

/**
 * Set database IDs after creation.
 * In production these would be persisted to env or a config file.
 */
export function setDatabaseIds(ids: NotionDatabaseIds): void {
  _dbIds = ids;
  // Also set as env vars for the current process
  process.env.NOTION_DB_WEEKLY_ARCHIVE = ids.weeklyArchive;
  process.env.NOTION_DB_GENERAL_AWARENESS = ids.generalAwareness;
  process.env.NOTION_DB_DEFENCE_UPDATES = ids.defenceUpdates;
  process.env.NOTION_DB_CURRENT_AFFAIRS = ids.currentAffairs;
  process.env.NOTION_DB_EDITORIALS = ids.editorials;
  process.env.NOTION_DB_VOCABULARY = ids.vocabulary;
  process.env.NOTION_DB_OIR_SETS = ids.oirSets;
  process.env.NOTION_DB_RESOURCES = ids.resources;
}

export function getDatabaseIds(): NotionDatabaseIds {
  if (_dbIds) return _dbIds;

  // Try loading from environment
  const ids: Partial<NotionDatabaseIds> = {
    weeklyArchive: process.env.NOTION_DB_WEEKLY_ARCHIVE,
    generalAwareness: process.env.NOTION_DB_GENERAL_AWARENESS,
    defenceUpdates: process.env.NOTION_DB_DEFENCE_UPDATES,
    currentAffairs: process.env.NOTION_DB_CURRENT_AFFAIRS,
    editorials: process.env.NOTION_DB_EDITORIALS,
    vocabulary: process.env.NOTION_DB_VOCABULARY,
    oirSets: process.env.NOTION_DB_OIR_SETS,
    resources: process.env.NOTION_DB_RESOURCES,
  };

  // Check for missing IDs
  const missing = Object.entries(ids)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(
      `Notion database IDs not configured: ${missing.join(', ')}. ` +
      'Run the database setup first, then add IDs to .env.local.'
    );
  }

  _dbIds = ids as NotionDatabaseIds;
  return _dbIds;
}

export function getDataSourceIds(): NotionDataSourceIds {
  if (_dsIds) return _dsIds;

  const ids: Partial<NotionDataSourceIds> = {
    weeklyArchive: process.env.NOTION_DS_WEEKLY_ARCHIVE,
    generalAwareness: process.env.NOTION_DS_GENERAL_AWARENESS,
    defenceUpdates: process.env.NOTION_DS_DEFENCE_UPDATES,
    currentAffairs: process.env.NOTION_DS_CURRENT_AFFAIRS,
    editorials: process.env.NOTION_DS_EDITORIALS,
    vocabulary: process.env.NOTION_DS_VOCABULARY,
    oirSets: process.env.NOTION_DS_OIR_SETS,
    resources: process.env.NOTION_DS_RESOURCES,
  };

  const missing = Object.entries(ids)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(
      `Notion data source IDs not configured: ${missing.join(', ')}. ` +
      'Run the database setup first, then add IDs to .env.local.'
    );
  }

  _dsIds = ids as NotionDataSourceIds;
  return _dsIds;
}
