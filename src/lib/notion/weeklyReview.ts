import { getDataSourceIds } from './config';
import { queryAllPages } from './databases';
import { getWeek, listWeeks } from './weeks';
import { pageToContentRecord, ContentRecord, SectionKey } from './content';
import { WeeklyRecord } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface SectionStats {
  key: SectionKey;
  label: string;
  items: number;
  saved: number;
  toRevise: number;
  revised: number;
}

export interface WeekDataSummary {
  total: number;
  covered: number;
  saved: number;
  toRevise: number;
  revised: number;
}

export interface CoverageGap {
  section: string;
  message: string;
}

export interface ContinuityStats {
  previousWeekId?: string;
  itemsDiff: number;
  savedDiff: number;
  toReviseDiff: number;
  previousTotal: number;
  previousSaved: number;
  previousToRevise: number;
}

export interface WeeklyReviewPayload {
  week: WeeklyRecord;
  summary: WeekDataSummary;
  sections: SectionStats[];
  coverageGaps: CoverageGap[];
  revision: {
    unread: number;
    reading: number;
    reviewed: number;
    revised: number;
  };
  saved: ContentRecord[];
  revisionQueue: ContentRecord[];
  recordsBySection: Record<string, ContentRecord[]>;
  previousWeek: WeeklyRecord | null;
  nextWeek: WeeklyRecord | null;
  continuity: ContinuityStats | null;
}

const SECTION_LABELS: Record<SectionKey, string> = {
  'general-awareness': 'GA // GENERAL AWARENESS',
  'defence': 'DEF // DEFENCE UPDATES',
  'current-affairs': 'CA // CURRENT AFFAIRS',
  'editorials': 'ED // EDITORIALS',
  'vocabulary': 'VOC // VOCABULARY',
  'oir': 'OIR // OIR PRACTICE',
  'resources': 'RES // RESOURCES'
};

async function getWeekRecords(weekId: string): Promise<ContentRecord[]> {
  const filter = { property: 'Week', relation: { contains: weekId } };
  const dsIds = getDataSourceIds();
  
  const [ga, def, ca, ed, voc, oir, res] = await Promise.all([
    queryAllPages(dsIds.generalAwareness, { filter }),
    queryAllPages(dsIds.defenceUpdates, { filter }),
    queryAllPages(dsIds.currentAffairs, { filter }),
    queryAllPages(dsIds.editorials, { filter }),
    queryAllPages(dsIds.vocabulary, { filter }),
    queryAllPages(dsIds.oirSets, { filter }),
    queryAllPages(dsIds.resources, { filter }),
  ]);
  
  return [
    ...ga.map(p => pageToContentRecord(p, 'general-awareness')),
    ...def.map(p => pageToContentRecord(p, 'defence')),
    ...ca.map(p => pageToContentRecord(p, 'current-affairs')),
    ...ed.map(p => pageToContentRecord(p, 'editorials')),
    ...voc.map(p => pageToContentRecord(p, 'vocabulary')),
    ...oir.map(p => pageToContentRecord(p, 'oir')),
    ...res.map(p => pageToContentRecord(p, 'resources')),
  ];
}

function processRecords(records: ContentRecord[]) {
  const sections: SectionStats[] = Object.keys(SECTION_LABELS).map(key => ({
    key: key as SectionKey,
    label: SECTION_LABELS[key as SectionKey],
    items: 0,
    saved: 0,
    toRevise: 0,
    revised: 0,
  }));

  let total = 0;
  let saved = 0;
  let toRevise = 0;
  let revised = 0;
  let covered = 0;

  const revisionCounts = { unread: 0, reading: 0, reviewed: 0, revised: 0 };
  const savedRecords: ContentRecord[] = [];
  const revisionQueue: ContentRecord[] = [];
  const recordsBySection: Record<string, ContentRecord[]> = {
    'general-awareness': [],
    'defence': [],
    'current-affairs': [],
    'editorials': [],
    'vocabulary': [],
    'oir': [],
    'resources': []
  };

  for (const record of records) {
    total++;
    const isSaved = record.fields.saved === true;
    const revState = record.fields.revision || 'Unread';
    
    if (recordsBySection[record.section]) {
      recordsBySection[record.section].push(record);
    }
    
    // Check coverage (if it has been read/reviewed/revised, it is covered. Unread is not covered unless it's just saved)
    if (revState !== 'Unread' || isSaved) {
      covered++;
    }

    if (isSaved) {
      saved++;
      savedRecords.push(record);
    }
    
    if (revState === 'Unread') revisionCounts.unread++;
    if (revState === 'Reading') revisionCounts.reading++;
    if (revState === 'Reviewed') revisionCounts.reviewed++;
    if (revState === 'Revised') revisionCounts.revised++;

    const isToRevise = ['Unread', 'Reading', 'Reviewed'].includes(revState);
    if (isToRevise) {
      toRevise++;
      revisionQueue.push(record);
    }
    if (revState === 'Revised') {
      revised++;
    }

    const sectionStat = sections.find(s => s.key === record.section);
    if (sectionStat) {
      sectionStat.items++;
      if (isSaved) sectionStat.saved++;
      if (isToRevise) sectionStat.toRevise++;
      if (revState === 'Revised') sectionStat.revised++;
    }
  }

  // Sort revision queue: Unread > Reading > Reviewed
  const revPriority: Record<string, number> = { 'Unread': 1, 'Reading': 2, 'Reviewed': 3 };
  revisionQueue.sort((a, b) => {
    const pA = revPriority[a.fields.revision || 'Unread'] || 99;
    const pB = revPriority[b.fields.revision || 'Unread'] || 99;
    return pA - pB;
  });

  return {
    sections,
    summary: { total, covered, saved, toRevise, revised },
    revision: revisionCounts,
    savedRecords,
    revisionQueue,
    recordsBySection
  };
}

function computeCoverageGaps(sections: SectionStats[]): CoverageGap[] {
  const gaps: CoverageGap[] = [];

  const ga = sections.find(s => s.key === 'general-awareness');
  if (!ga || ga.items === 0) {
    gaps.push({ section: 'GENERAL AWARENESS', message: 'No briefing records logged.' });
  }

  const oir = sections.find(s => s.key === 'oir');
  if (!oir || oir.items === 0) {
    gaps.push({ section: 'OIR PRACTICE', message: 'No practice set recorded this week.' });
  }

  const ed = sections.find(s => s.key === 'editorials');
  if (ed && ed.items > 0 && ed.toRevise === ed.items && ed.revised === 0 && (ed.items - ed.toRevise) === 0) {
    // wait, if toRevise == items, it could be unread/reading/reviewed. Let's see if we can check specifically for unread.
    // Actually we only have toRevise count. If nothing is revised and nothing is saved?
    if (ed.saved === 0) {
      gaps.push({ section: 'EDITORIALS', message: `${ed.items} records available — none saved or revised.` });
    }
  }

  const res = sections.find(s => s.key === 'resources');
  if (res && res.items > 0 && res.toRevise === res.items && res.saved === 0) {
    gaps.push({ section: 'RESOURCES', message: `${res.items} resources exist but none have been saved or processed.` });
  }

  return gaps;
}

export async function getWeeklyIntelligenceReview(weekId: string): Promise<WeeklyReviewPayload> {
  // 1. Fetch current week
  const week = await getWeek(weekId);
  
  // 2. Fetch all weeks to determine previous/next
  const allWeeks = await listWeeks({ pageSize: 100 });
  const sortedWeeks = allWeeks.items.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  
  const currentIndex = sortedWeeks.findIndex(w => w.id === weekId);
  const nextWeek = currentIndex > 0 ? sortedWeeks[currentIndex - 1] : null;
  const previousWeek = currentIndex !== -1 && currentIndex < sortedWeeks.length - 1 ? sortedWeeks[currentIndex + 1] : null;

  // 3. Fetch and process current week records
  const currentRecords = await getWeekRecords(weekId);
  const currentStats = processRecords(currentRecords);

  const coverageGaps = computeCoverageGaps(currentStats.sections);

  // 4. Continuity (fetch previous week if exists)
  let continuity: ContinuityStats | null = null;
  if (previousWeek) {
    const prevRecords = await getWeekRecords(previousWeek.id);
    const prevStats = processRecords(prevRecords);

    continuity = {
      previousWeekId: previousWeek.id,
      itemsDiff: currentStats.summary.total - prevStats.summary.total,
      savedDiff: currentStats.summary.saved - prevStats.summary.saved,
      toReviseDiff: currentStats.summary.toRevise - prevStats.summary.toRevise,
      previousTotal: prevStats.summary.total,
      previousSaved: prevStats.summary.saved,
      previousToRevise: prevStats.summary.toRevise,
    };
  }

  return {
    week,
    summary: currentStats.summary,
    sections: currentStats.sections,
    coverageGaps,
    revision: currentStats.revision,
    saved: currentStats.savedRecords,
    revisionQueue: currentStats.revisionQueue,
    recordsBySection: currentStats.recordsBySection,
    previousWeek,
    nextWeek,
    continuity
  };
}

export async function getArchiveWeeks(pageSize = 10, startCursor?: string) {
  const allWeeks = await listWeeks({ pageSize, startCursor });
  
  // For each week, get its records and process
  const weeksWithStats = await Promise.all(
    allWeeks.items.map(async (week) => {
      // We process them sequentially or bounded parallel to avoid heavy rate limiting
      const records = await getWeekRecords(week.id);
      const stats = processRecords(records);
      
      const coveragePercentage = stats.summary.total === 0 
        ? 0 
        : Math.round((stats.summary.covered / stats.summary.total) * 100);
        
      return {
        week,
        summary: stats.summary,
        coveragePercentage
      };
    })
  );
  
  return {
    items: weeksWithStats,
    hasMore: allWeeks.hasMore,
    nextCursor: allWeeks.nextCursor
  };
}
