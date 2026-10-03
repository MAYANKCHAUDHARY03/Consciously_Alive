/**
 * Database setup service.
 * Creates all 8 databases in Notion under the parent page,
 * sets up their schemas, and wires up relations to the Weekly Archive.
 *
 * IDEMPOTENT: Before creating anything, scans the parent page for
 * existing databases matching the expected titles. If found, reuses
 * them. If not, creates new ones.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { notionConfig, setDatabaseIds, type NotionDatabaseIds } from './config';
import { createDatabase, getDataSourceId, updateDataSourceProperties, getDataSource } from './databases';
import { ALL_SCHEMAS, type DatabaseName } from './schemas';
import { withRetry } from './errors';
import { getNotionClient } from './client';

// ─── Setup Result ─────────────────────────────────────────────

export interface SetupResult {
  success: boolean;
  databases: Record<DatabaseName, { databaseId: string; dataSourceId: string; alreadyExisted: boolean }>;
  relations: string[];
  errors: string[];
  skipped: string[];
}

// ─── Find existing databases under parent page ────────────────

/**
 * Lists all blocks under the parent page and returns any databases
 * whose title matches one of our expected database titles.
 */
async function findExistingDatabases(
  parentPageId: string
): Promise<Map<string, { databaseId: string; dataSourceId: string }>> {
  const notion = getNotionClient();
  const found = new Map<string, { databaseId: string; dataSourceId: string }>();

  // Build a title → schemaKey lookup
  const titleToKey: Record<string, string> = {};
  for (const [key, schema] of Object.entries(ALL_SCHEMAS)) {
    titleToKey[schema.title] = key;
  }

  try {
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await withRetry(() =>
        notion.blocks.children.list({
          block_id: parentPageId,
          start_cursor: cursor,
          page_size: 100,
        })
      );

      for (const block of response.results) {
        if ((block as any).type === 'child_database') {
          const title = (block as any).child_database?.title ?? '';
          const schemaKey = titleToKey[title];
          if (schemaKey) {
            // Retrieve the database to get the data_source_id
            try {
              const db = await withRetry(() =>
                notion.databases.retrieve({ database_id: block.id })
              );
              const dsId = getDataSourceId(db);
              found.set(schemaKey, { databaseId: block.id, dataSourceId: dsId });
              console.log(`  ↳ Found existing: ${title} → db:${block.id} ds:${dsId}`);
            } catch {
              // Can't retrieve — treat as not found
              console.log(`  ↳ Found ${title} but can't retrieve — will recreate`);
            }
          }
        }
      }

      hasMore = response.has_more;
      cursor = response.next_cursor ?? undefined;
    }
  } catch (err: any) {
    console.error(`Failed to scan parent page: ${err.message}`);
  }

  return found;
}

// ─── Check if a data source has a specific property ───────────

async function hasProperty(dataSourceId: string, propertyName: string): Promise<boolean> {
  try {
    const ds = await getDataSource(dataSourceId);
    const props = (ds as any).properties ?? {};
    return propertyName in props;
  } catch {
    return false;
  }
}

// ─── Main Setup Function ──────────────────────────────────────

/**
 * Creates all databases and configures their properties.
 * Idempotent — checks for existing databases first and reuses them.
 */
export async function setupAllDatabases(): Promise<SetupResult> {
  const config = notionConfig();
  const parentPageId = config.parentPageId;

  const result: SetupResult = {
    success: false,
    databases: {} as any,
    relations: [],
    errors: [],
    skipped: [],
  };

  const dbEntries: Record<string, { databaseId: string; dataSourceId: string; alreadyExisted: boolean }> = {};

  // Step 0: Scan for existing databases
  console.log('Scanning parent page for existing databases...');
  const existing = await findExistingDatabases(parentPageId);
  console.log(`Found ${existing.size} existing database(s).`);

  // Step 1: Create databases that don't exist yet
  for (const [name, schema] of Object.entries(ALL_SCHEMAS)) {
    const existingEntry = existing.get(name);

    if (existingEntry) {
      console.log(`Reusing existing database: ${schema.title}`);
      dbEntries[name] = { ...existingEntry, alreadyExisted: true };
      result.skipped.push(`${name} (${schema.title}) — already exists`);
      continue;
    }

    try {
      console.log(`Creating database: ${schema.title}...`);

      const db = await createDatabase(parentPageId, schema.title, schema.icon);
      const dataSourceId = getDataSourceId(db);

      dbEntries[name] = {
        databaseId: db.id,
        dataSourceId,
        alreadyExisted: false,
      };

      console.log(`  ✓ ${schema.title} → db:${db.id} ds:${dataSourceId}`);

      // Small delay to avoid rate limits
      await sleep(400);
    } catch (err: any) {
      const msg = `Failed to create ${name}: ${err.message}`;
      console.error(`  ✗ ${msg}`);
      result.errors.push(msg);
    }
  }

  // Step 2: Add/update properties for each database's data source
  for (const [name, schema] of Object.entries(ALL_SCHEMAS)) {
    const entry = dbEntries[name];
    if (!entry) continue;

    try {
      console.log(`Configuring properties for: ${schema.title}...`);

      await updateDataSourceProperties(entry.dataSourceId, schema.properties);

      console.log(`  ✓ Properties set for ${schema.title}`);
      await sleep(400);
    } catch (err: any) {
      const msg = `Failed to set properties for ${name}: ${err.message}`;
      console.error(`  ✗ ${msg}`);
      result.errors.push(msg);
    }
  }

  // Step 3: Add relation properties linking child databases to Weekly Archive
  const weeklyEntry = dbEntries.weeklyArchive;
  if (weeklyEntry) {
    const childDatabases: Array<{ name: DatabaseName; label: string }> = [
      { name: 'generalAwareness', label: 'GA Entries' },
      { name: 'defenceUpdates', label: 'Defence Entries' },
      { name: 'currentAffairs', label: 'CA Entries' },
      { name: 'editorials', label: 'Editorials' },
      { name: 'vocabulary', label: 'Vocab Words' },
      { name: 'oirSets', label: 'OIR Sets' },
      { name: 'resources', label: 'Resources' },
    ];

    for (const child of childDatabases) {
      const childEntry = dbEntries[child.name];
      if (!childEntry) continue;

      // Check if relation already exists
      const relationExists = await hasProperty(childEntry.dataSourceId, 'Week');
      if (relationExists) {
        console.log(`  ↳ Relation already exists: ${child.name}.Week → Weekly Archive`);
        result.relations.push(`${child.name} → weeklyArchive (already existed)`);
        continue;
      }

      try {
        console.log(`Creating relation: ${child.name} → Weekly Archive...`);

        await addRelation(
          childEntry.dataSourceId,
          'Week',
          weeklyEntry.dataSourceId,
        );

        result.relations.push(`${child.name} → weeklyArchive (via "Week")`);
        console.log(`  ✓ Relation created: ${child.name}.Week → Weekly Archive`);
        await sleep(500);
      } catch (err: any) {
        const msg = `Failed to create relation for ${child.name}: ${err.message}`;
        console.error(`  ✗ ${msg}`);
        result.errors.push(msg);
      }
    }
  }

  // Step 4: Persist IDs
  if (Object.keys(dbEntries).length === Object.keys(ALL_SCHEMAS).length) {
    const ids: NotionDatabaseIds = {
      weeklyArchive: dbEntries.weeklyArchive.databaseId,
      generalAwareness: dbEntries.generalAwareness.databaseId,
      defenceUpdates: dbEntries.defenceUpdates.databaseId,
      currentAffairs: dbEntries.currentAffairs.databaseId,
      editorials: dbEntries.editorials.databaseId,
      vocabulary: dbEntries.vocabulary.databaseId,
      oirSets: dbEntries.oirSets.databaseId,
      resources: dbEntries.resources.databaseId,
    };

    setDatabaseIds(ids);
    result.success = result.errors.length === 0;
  }

  result.databases = dbEntries as any;
  return result;
}

// ─── Helper: Add Relation Property ────────────────────────────

async function addRelation(
  dataSourceId: string,
  propertyName: string,
  relatedDataSourceId: string,
) {
  const notion = getNotionClient();

  return withRetry(() =>
    notion.dataSources.update({
      data_source_id: dataSourceId,
      properties: {
        [propertyName]: {
          relation: {
            data_source_id: relatedDataSourceId,
            type: 'dual_property',
            dual_property: {},
          },
        },
      },
    })
  );
}

// ─── Helper ───────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
