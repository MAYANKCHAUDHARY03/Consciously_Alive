import { queryAllPages } from './databases';
import { getDataSourceIdForSection, pageToContentRecord, SectionKey, VALID_SECTIONS, SECTION_META, ContentRecord } from './content';
import { getWeeksMap } from './weeks';

export interface SearchParams {
  q?: string;
  section?: SectionKey | 'all';
  weekId?: string;
  topic?: string;
  type?: string;
  includeArchived?: boolean;
  saved?: boolean;
  revision?: string;
  limit?: number;
}

export interface SearchResult {
  id: string;
  section: SectionKey;
  sectionLabel: string;
  title: string;
  excerpt?: string;
  weekId?: string;
  weekLabel?: string;
  topic?: string;
  type?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  saved?: boolean;
  revision?: string;
  rawRecord: ContentRecord;
}

const SEARCH_PROPS: Record<SectionKey, string[]> = {
  'general-awareness': ['Name', 'Content', 'Topic'],
  'defence':           ['Name', 'Content', 'Topic'],
  'current-affairs':   ['Name', 'Content', 'Topic'],
  'editorials':        ['Name', 'Summary', 'Key Points', 'Topic'],
  'vocabulary':        ['Name', 'Meaning', 'Usage', 'Synonyms'],
  'oir':               ['Name', 'Notes'],
  'resources':         ['Name', 'Description', 'Category']
};

export async function searchKnowledgeBase(params: SearchParams): Promise<SearchResult[]> {
  const sectionsToSearch = params.section && params.section !== 'all' && VALID_SECTIONS.includes(params.section as SectionKey)
    ? [params.section as SectionKey]
    : VALID_SECTIONS;

  // Retrieve weeks map to label week IDs efficiently
  const weeksMap = await getWeeksMap();

  const searchPromises = sectionsToSearch.map(async (section) => {
    const dsId = getDataSourceIdForSection(section);
    
    // Build Notion Filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const andFilters: any[] = [];
    
    // 1. Text Query
    if (params.q && params.q.trim()) {
      const q = params.q.trim();
      const props = SEARCH_PROPS[section];
      const orFilters = props.map(p => {
        if (p === 'Name') return { property: p, title: { contains: q } };
        return { property: p, rich_text: { contains: q } };
      });
      andFilters.push({ or: orFilters });
    }

    // 2. Week Filter
    if (params.weekId && params.weekId !== 'all') {
      andFilters.push({ property: 'Week', relation: { contains: params.weekId } });
    }

    // 3. Archive Filter
    if (!params.includeArchived) {
      andFilters.push({ property: 'Status', select: { does_not_equal: 'Archived' } });
    }

    // 4. Topic Filter (if supported and requested)
    if (params.topic && params.topic !== 'all') {
      if (['general-awareness', 'defence', 'current-affairs', 'editorials', 'oir'].includes(section)) {
        if (section === 'oir') {
          // OIR uses Select for Topic
          andFilters.push({ property: 'Topic', select: { equals: params.topic } });
        } else {
          // Others use Rich Text for Topic
          andFilters.push({ property: 'Topic', rich_text: { equals: params.topic } });
        }
      }
    }

    // 5. Type Filter (if supported and requested)
    if (params.type && params.type !== 'all' && section === 'resources') {
      andFilters.push({ property: 'Type', select: { equals: params.type } });
    }

    // 6. Saved Filter
    if (params.saved !== undefined) {
      andFilters.push({ property: 'Saved', checkbox: { equals: params.saved } });
    }

    // 7. Revision Filter
    if (params.revision && params.revision !== 'all') {
      andFilters.push({ property: 'Revision', select: { equals: params.revision } });
    }

    const finalFilter = andFilters.length > 0 ? { and: andFilters } : undefined;

    try {
      const allResults = await queryAllPages(dsId, {
        filter: finalFilter,
        sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }]
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return allResults.map((page: any) => pageToContentRecord(page, section));
    } catch (e) {
      console.error(`Search error for section ${section}:`, e);
      return [];
    }
  });

  const allSectionResults = await Promise.all(searchPromises);
  const aggregatedRecords = allSectionResults.flat();

  // Map ContentRecord -> SearchResult
  const searchResults: SearchResult[] = aggregatedRecords.map(rec => {
    const fields = rec.fields || {};
    
    // Extract a sensible excerpt
    let excerpt = '';
    if (fields.content) excerpt = fields.content;
    else if (fields.summary) excerpt = fields.summary;
    else if (fields.meaning) excerpt = fields.meaning;
    else if (fields.description) excerpt = fields.description;
    else if (fields.notes) excerpt = fields.notes;

    // Truncate excerpt cleanly
    if (excerpt && excerpt.length > 150) excerpt = excerpt.substring(0, 147) + '...';

    // Figure out week label
    let weekLabel = 'Unknown Week';
    if (rec.weekId && weeksMap[rec.weekId]) {
      // weeksMap values look like "2026-W40: Sept 28 - Oct 04". Let's extract just "W40"
      const title = weeksMap[rec.weekId].title;
      const wMatch = title.match(/(W\d+)/);
      weekLabel = wMatch ? wMatch[1] : title;
    } else if (!rec.weekId) {
      weekLabel = 'No Week';
    }

    return {
      id: rec.id,
      section: rec.section,
      sectionLabel: SECTION_META[rec.section].label,
      title: rec.title || 'Untitled Document',
      excerpt,
      weekId: rec.weekId,
      weekLabel,
      topic: fields.topic || fields.category || undefined,
      type: fields.type || undefined,
      source: fields.source || undefined,
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
      archived: fields.status === 'Archived',
      saved: fields.saved,
      revision: fields.revision,
      rawRecord: rec
    };
  });

  // Rank / Sort results
  // We want to apply deterministic relevance ordering.
  const q = (params.q || '').toLowerCase().trim();
  
  searchResults.sort((a, b) => {
    if (q) {
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      
      const aExact = aTitle === q;
      const bExact = bTitle === q;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = aTitle.startsWith(q);
      const bStarts = bTitle.startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      const aContains = aTitle.includes(q);
      const bContains = bTitle.includes(q);
      if (aContains && !bContains) return -1;
      if (!aContains && bContains) return 1;
    }

    // Default to most recently updated
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Apply limit
  const limit = params.limit || 50;
  return searchResults.slice(0, limit);
}
