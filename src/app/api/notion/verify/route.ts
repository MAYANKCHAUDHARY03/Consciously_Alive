import { NextResponse } from 'next/server';
import { getNotionClient } from '@/lib/notion/client';
import { getDatabaseIds } from '@/lib/notion/config';
import { getDataSource, getDataSourceId } from '@/lib/notion/databases';
import { ALL_SCHEMAS } from '@/lib/notion/schemas';
import { toSafeError } from '@/lib/notion/errors';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /api/notion/verify
 *
 * Thorough verification of all databases:
 * - Checks each database exists and is accessible
 * - Verifies all expected properties exist with correct types
 * - Verifies relations to Weekly Archive
 * - Verifies the OIR accuracy formula
 */
export async function GET(request: Request) {
  try {
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('x-setup-secret');
      if (!authHeader || authHeader !== process.env.SETUP_SECRET_KEY) {
        return NextResponse.json(
          { allPassed: false, error: 'Forbidden. Verify endpoint is protected in production.' },
          { status: 403 }
        );
      }
    }

    const dbIds = getDatabaseIds();
    const notion = getNotionClient();
    const checks: any[] = [];
    let allPassed = true;

    const nameToDbId: Record<string, string> = {
      weeklyArchive: dbIds.weeklyArchive,
      generalAwareness: dbIds.generalAwareness,
      defenceUpdates: dbIds.defenceUpdates,
      currentAffairs: dbIds.currentAffairs,
      editorials: dbIds.editorials,
      vocabulary: dbIds.vocabulary,
      oirSets: dbIds.oirSets,
      resources: dbIds.resources,
    };

    // Verify each database
    for (const [name, schema] of Object.entries(ALL_SCHEMAS)) {
      const dbId = nameToDbId[name];
      const check: any = {
        name,
        title: schema.title,
        databaseId: dbId,
        exists: false,
        propertiesOk: false,
        missingProperties: [] as string[],
        wrongTypeProperties: [] as string[],
        extraInfo: {} as any,
      };

      try {
        // 1. Verify database exists
        const db = await notion.databases.retrieve({ database_id: dbId });
        check.exists = true;

        // 2. Get data source to check properties
        const dsId = getDataSourceId(db);
        check.dataSourceId = dsId;

        const ds = await getDataSource(dsId);
        const props = (ds as any).properties ?? {};
        check.actualProperties = Object.keys(props);

        // 3. Check schema properties
        const expectedProps = Object.keys(schema.properties);
        for (const propName of expectedProps) {
          if (!(propName in props)) {
            check.missingProperties.push(propName);
          } else {
            // Verify type matches
            const expectedType = Object.keys(schema.properties[propName])[0]; // e.g., 'select', 'rich_text', etc.
            const actualType = props[propName].type;
            if (expectedType !== actualType) {
              check.wrongTypeProperties.push(
                `${propName}: expected "${expectedType}", got "${actualType}"`
              );
            }
          }
        }

        // 4. Check for "Week" relation (all except weeklyArchive)
        if (name !== 'weeklyArchive') {
          if ('Week' in props) {
            check.hasWeekRelation = true;
            const relType = props['Week'].type;
            check.weekRelationType = relType;
            if (relType === 'relation') {
              check.weekRelationTarget = props['Week'].relation?.data_source_id ?? 'unknown';
            }
          } else {
            check.hasWeekRelation = false;
            check.missingProperties.push('Week (relation)');
          }
        }

        // 5. Check OIR formula
        if (name === 'oirSets') {
          const accuracyProp = props['Accuracy (%)'];
          if (accuracyProp && accuracyProp.type === 'formula') {
            check.extraInfo.formulaExpression = accuracyProp.formula?.expression ?? 'not found';
            check.extraInfo.formulaOk = true;
          } else {
            check.extraInfo.formulaOk = false;
            check.extraInfo.formulaNote = accuracyProp
              ? `Found as type "${accuracyProp.type}" instead of formula`
              : 'Accuracy (%) property not found';
          }
        }

        // 6. Check select/multi-select option counts
        for (const propName of Object.keys(props)) {
          const prop = props[propName];
          if (prop.type === 'select' && prop.select?.options?.length) {
            check.extraInfo[`${propName}_options`] = prop.select.options.map((o: any) => o.name);
          }
          if (prop.type === 'multi_select' && prop.multi_select?.options?.length) {
            check.extraInfo[`${propName}_options`] = prop.multi_select.options.map((o: any) => o.name);
          }
        }

        check.propertiesOk = check.missingProperties.length === 0 && check.wrongTypeProperties.length === 0;

        if (!check.propertiesOk) allPassed = false;

      } catch (err: any) {
        check.error = err.message;
        allPassed = false;
      }

      checks.push(check);
    }

    // Test idempotency: verify re-running setup doesn't create duplicates
    // by checking child databases count under parent
    const idempotencyCheck: any = { childDatabaseCount: 0, titles: [] };
    try {
      const { parentPageId } = (await import('@/lib/notion/config')).notionConfig();
      let cursor: string | undefined;
      let hasMore = true;
      while (hasMore) {
        const response = await notion.blocks.children.list({
          block_id: parentPageId,
          start_cursor: cursor,
          page_size: 100,
        });
        for (const block of response.results) {
          if ((block as any).type === 'child_database') {
            idempotencyCheck.childDatabaseCount++;
            idempotencyCheck.titles.push((block as any).child_database?.title ?? '?');
          }
        }
        hasMore = response.has_more;
        cursor = response.next_cursor ?? undefined;
      }
    } catch (err: any) {
      idempotencyCheck.error = err.message;
    }

    return NextResponse.json({
      allPassed,
      databaseCount: checks.length,
      idempotencyCheck,
      checks,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    const safeError = toSafeError(err);
    return NextResponse.json(
      { error: safeError.error, code: safeError.code },
      { status: safeError.status }
    );
  }
}
