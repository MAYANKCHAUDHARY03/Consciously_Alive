import { getDataSourceIds } from './config';
import { queryAllPages } from './databases';
import { getWeek } from './weeks';
import { readTitle, readSelect } from './properties';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface DashboardStats {
  generalAwareness: number;
  defenceUpdates: number;
  currentAffairs: number;
  editorials: number;
  vocabulary: number;
  oirSets: number;
  resources: number;
  total: number;
}

export interface RecentItem {
  id: string;
  title: string;
  category: string;
  sourceType: string;
  createdAt: string;
}

export interface DashboardData {
  week: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  stats: DashboardStats;
  recent: RecentItem[];
}

export async function getWeeklyDashboardStats(weekId: string): Promise<DashboardData> {
  // 1. Fetch the week details
  const week = await getWeek(weekId);
  const dsIds = getDataSourceIds();

  // 2. Prepare the filter for the week relation
  const filter = {
    property: 'Week',
    relation: { contains: weekId },
  };

  // 3. Query all 7 child databases in parallel
  // We use queryAllPages to ensure we get the full count even if it exceeds 100
  // (though rare for a single week's category).
  // We can also extract recent items from these results.
  const [
    gaResults,
    defResults,
    caResults,
    edResults,
    vocResults,
    oirResults,
    resResults,
  ] = await Promise.all([
    queryAllPages(dsIds.generalAwareness, { filter }),
    queryAllPages(dsIds.defenceUpdates, { filter }),
    queryAllPages(dsIds.currentAffairs, { filter }),
    queryAllPages(dsIds.editorials, { filter }),
    queryAllPages(dsIds.vocabulary, { filter }),
    queryAllPages(dsIds.oirSets, { filter }),
    queryAllPages(dsIds.resources, { filter }),
  ]);

  const stats: DashboardStats = {
    generalAwareness: gaResults.length,
    defenceUpdates: defResults.length,
    currentAffairs: caResults.length,
    editorials: edResults.length,
    vocabulary: vocResults.length,
    oirSets: oirResults.length,
    resources: resResults.length,
    total: 0, // calculated below
  };
  
  stats.total = Object.values(stats).reduce((a, b) => a + b, 0);

  // 4. Combine all results to find the most recent items across all databases
  // We map them to a common RecentItem interface
  const allItems: RecentItem[] = [];

  const mapItems = (results: any[], sourceType: string) => {
    results.forEach(page => {
      const props = page.properties;
      
      // In Notion schema, titles are rich text or title. Let's find the title prop.
      const actualTitleProp = Object.keys(props).find(k => props[k].type === 'title') || 'Name';
      const title = readTitle(props[actualTitleProp]);
      
      // OIR doesn't have a specific title? Actually all DBs have a title property.
      // E.g., OIR has 'Title', Vocabulary has 'Meaning'? Wait, schemas.ts doesn't explicitly name the title property,
      // it is usually auto-created as 'Name' or 'Title' unless renamed.
      
      let category = 'Uncategorized';
      if (props['Category']) category = readSelect(props['Category']) || category;
      if (props['Topic'] && props['Topic'].type === 'select') category = readSelect(props['Topic']) || category; // OIR uses Topic as select
      if (props['Source'] && props['Source'].type === 'select') category = readSelect(props['Source']) || category; // Editorials uses Source as select
      if (props['Type'] && props['Type'].type === 'select') category = readSelect(props['Type']) || category; // Resources uses Type as select
      
      // Vocabulary doesn't have a category select, we could just use the word itself which is the title.
      if (sourceType === 'Vocabulary') {
        category = 'Word';
      }

      allItems.push({
        id: page.id,
        title: title || 'Untitled',
        category,
        sourceType,
        createdAt: page.created_time, // Notion API exposes created_time at root level
      });
    });
  };

  mapItems(gaResults, 'General Awareness');
  mapItems(defResults, 'Defence Updates');
  mapItems(caResults, 'Current Affairs');
  mapItems(edResults, 'Editorials');
  mapItems(vocResults, 'Vocabulary');
  mapItems(oirResults, 'OIR Practice');
  mapItems(resResults, 'Resources');

  // Sort by created_time descending
  allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Take top 5
  const recent = allItems.slice(0, 5);

  return {
    week: {
      id: week.id,
      title: week.title,
      startDate: week.startDate,
      endDate: week.endDate,
      status: week.status,
    },
    stats,
    recent,
  };
}
