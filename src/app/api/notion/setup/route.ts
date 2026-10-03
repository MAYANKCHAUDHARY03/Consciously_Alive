import { NextResponse } from 'next/server';
import { setupAllDatabases } from '@/lib/notion/setup';
import { toSafeError } from '@/lib/notion/errors';

/**
 * POST /api/notion/setup
 *
 * Creates all 8 databases in Notion under the parent page.
 * This should only be called once during initial setup.
 *
 * Returns the database IDs that should be added to .env.local.
 */
export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('x-setup-secret');
      if (!authHeader || authHeader !== process.env.SETUP_SECRET_KEY) {
        return NextResponse.json(
          { success: false, message: 'Forbidden. Setup endpoint is protected in production.' },
          { status: 403 }
        );
      }
    }

    const result = await setupAllDatabases();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Some databases failed to create. Check errors.',
          errors: result.errors,
          skipped: result.skipped,
          databases: result.databases,
          relations: result.relations,
          envVars: buildEnvVars(result.databases),
          timestamp: new Date().toISOString(),
        },
        { status: 207 } // Multi-Status — partial success
      );
    }

    return NextResponse.json({
      success: true,
      message: result.skipped.length > 0
        ? `Setup complete. ${result.skipped.length} database(s) reused, ${8 - result.skipped.length} created.`
        : 'All 8 databases created successfully!',
      skipped: result.skipped,
      databases: result.databases,
      relations: result.relations,
      envVars: buildEnvVars(result.databases),
      instructions: [
        'Copy the envVars below to your .env.local file.',
        'Restart the dev server after updating .env.local.',
        'The databases are now visible in your Notion workspace.',
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      {
        success: false,
        message: safeError.error,
        code: safeError.code,
        timestamp: new Date().toISOString(),
      },
      { status: safeError.status }
    );
  }
}

/**
 * Builds env var strings for easy copy-paste to .env.local
 */
function buildEnvVars(
  databases: Record<string, { databaseId: string; dataSourceId: string }>
): Record<string, string> {
  const envMap: Record<string, string> = {};
  const nameToEnvKey: Record<string, string> = {
    weeklyArchive: 'NOTION_DB_WEEKLY_ARCHIVE',
    generalAwareness: 'NOTION_DB_GENERAL_AWARENESS',
    defenceUpdates: 'NOTION_DB_DEFENCE_UPDATES',
    currentAffairs: 'NOTION_DB_CURRENT_AFFAIRS',
    editorials: 'NOTION_DB_EDITORIALS',
    vocabulary: 'NOTION_DB_VOCABULARY',
    oirSets: 'NOTION_DB_OIR_SETS',
    resources: 'NOTION_DB_RESOURCES',
  };

  // Database IDs
  for (const [name, entry] of Object.entries(databases)) {
    const envKey = nameToEnvKey[name];
    if (envKey && entry?.databaseId) {
      envMap[envKey] = entry.databaseId;
    }
  }

  // Data source IDs (needed for querying/creating pages in v5)
  const dsNameToEnvKey: Record<string, string> = {
    weeklyArchive: 'NOTION_DS_WEEKLY_ARCHIVE',
    generalAwareness: 'NOTION_DS_GENERAL_AWARENESS',
    defenceUpdates: 'NOTION_DS_DEFENCE_UPDATES',
    currentAffairs: 'NOTION_DS_CURRENT_AFFAIRS',
    editorials: 'NOTION_DS_EDITORIALS',
    vocabulary: 'NOTION_DS_VOCABULARY',
    oirSets: 'NOTION_DS_OIR_SETS',
    resources: 'NOTION_DS_RESOURCES',
  };

  for (const [name, entry] of Object.entries(databases)) {
    const envKey = dsNameToEnvKey[name];
    if (envKey && entry?.dataSourceId) {
      envMap[envKey] = entry.dataSourceId;
    }
  }

  return envMap;
}
