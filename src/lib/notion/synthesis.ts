import { ContentRecord, VALID_SECTIONS, getDataSourceIdForSection, pageToContentRecord, SectionKey } from './content';
import { getWeeksMap } from './weeks';
import { queryDatabase } from './databases';
import { searchKnowledgeBase } from './search';

export interface RelatedRecord extends ContentRecord {
  score: number;
  reason: string;
  weekLabel?: string;
}

export interface TopicContinuity {
  topic: string;
  totalRecords: number;
  weeksActive: number;
  recordsByWeek: Record<string, number>;
  savedCount: number;
  revisionCount: number;
  sections: SectionKey[];
}

export interface RevisionPriorityRecord extends ContentRecord {
  priorityScore: number;
  priorityReasons: string[];
  weekLabel?: string;
}

export interface SynthesisSavedPayload {
  totalSaved: number;
  unread: number;
  reading: number;
  reviewed: number;
  revised: number;
  topTopics: string[];
  records: ContentRecord[];
}

// Tokenizer for title matching
function getMeaningfulTokens(text: string): string[] {
  const stopwords = ['the','a','an','and','or','but','in','on','at','to','for','of','with','by'];
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopwords.includes(t));
}

export async function getRelatedRecords(record: ContentRecord, allRecordsContext?: ContentRecord[]): Promise<RelatedRecord[]> {
  // If no context provided, we might fetch a broad set using searchKnowledgeBase
  // But searching by topic is a good start.
  const weeks = await getWeeksMap();
  
  let candidates: ContentRecord[] = [];
  
  if (allRecordsContext) {
    candidates = allRecordsContext;
  } else {
    // Fetch a broad set of recent records to rank against
    // To be efficient, we search for the same topic, or just a general recent search
    const topicQuery = record.fields.topic ? searchKnowledgeBase({ topic: record.fields.topic, limit: 100 }) : Promise.resolve([]);
    const sectionQuery = searchKnowledgeBase({ section: record.section, limit: 50 });
    const weekQuery = record.fields.week ? searchKnowledgeBase({ weekId: record.fields.week, limit: 50 }) : Promise.resolve([]);
    
    const [topicRes, sectionRes, weekRes] = await Promise.all([topicQuery, sectionQuery, weekQuery]);
    
    const map = new Map<string, ContentRecord>();
    const add = (r: ContentRecord) => {
      if (r.id !== record.id) map.set(r.id, r);
    };
    
    topicRes.forEach(r => add(r.rawRecord));
    sectionRes.forEach(r => add(r.rawRecord));
    weekRes.forEach(r => add(r.rawRecord));
    
    candidates = Array.from(map.values());
  }

  const recordTokens = getMeaningfulTokens(record.title);
  
  const related: RelatedRecord[] = [];

  for (const c of candidates) {
    if (c.id === record.id) continue;
    if (c.fields.status === 'Archived') continue;

    let score = 0;
    const reasons: string[] = [];

    // +100 exact topic match
    if (record.fields.topic && c.fields.topic && record.fields.topic.toLowerCase() === c.fields.topic.toLowerCase()) {
      score += 100;
      reasons.push('SAME TOPIC');
    }

    // +50 same section
    if (record.section === c.section) {
      score += 50;
      reasons.push('SAME SECTION');
    }

    // +30 same category/type
    if (record.fields.category && c.fields.category && record.fields.category === c.fields.category) {
      score += 30;
      reasons.push('SAME CATEGORY');
    }

    // +20 shared meaningful title token
    const cTokens = getMeaningfulTokens(c.title);
    const sharedTokens = recordTokens.filter(t => cTokens.includes(t));
    if (sharedTokens.length > 0) {
      score += (20 * Math.min(sharedTokens.length, 3));
      reasons.push('SHARED KEYWORD');
    }

    // +10 same week
    if (record.fields.week && c.fields.week && record.fields.week === c.fields.week) {
      score += 10;
      reasons.push('SAME WEEK');
    }

    if (score > 0) {
      related.push({
        ...c,
        score,
        reason: reasons[0], // primary reason
        weekLabel: c.fields.week ? (weeks[c.fields.week]?.title.split('-W')[1] || weeks[c.fields.week]?.title) : undefined
      });
    }
  }

  return related.sort((a, b) => b.score - a.score).slice(0, 5);
}

// Global cache to avoid blasting Notion for synthesis.
// Next.js App Router route handlers should use native caching if possible, but an in-memory cache is fine for static synthesis.
let _synthesisCache: { records: ContentRecord[], timestamp: number } | null = null;
const SYNTHESIS_CACHE_TTL = 1000 * 60; // 1 min

export async function getRecentKnowledgeContext(forceRefresh = false): Promise<ContentRecord[]> {
  const now = Date.now();
  if (!forceRefresh && _synthesisCache && (now - _synthesisCache.timestamp < SYNTHESIS_CACHE_TTL)) {
    return _synthesisCache.records;
  }

  const promises = VALID_SECTIONS.map(async (section) => {
    const dsId = getDataSourceIdForSection(section);
    // Fetch top 200 records from each section
    const res = await queryDatabase(dsId, { pageSize: 200 });
    return res.results.map(p => pageToContentRecord(p, section));
  });

  const results = await Promise.all(promises);
  const records = results.flat().filter(r => r.fields.status !== 'Archived');
  
  _synthesisCache = { records, timestamp: now };
  return records;
}

export async function getRecurringTopics(): Promise<TopicContinuity[]> {
  const records = await getRecentKnowledgeContext();
  const weeks = await getWeeksMap();
  
  const topicsMap = new Map<string, TopicContinuity>();

  for (const record of records) {
    const topic = record.fields.topic;
    if (!topic || topic.trim() === '') continue;
    const tLower = topic.trim().toLowerCase();

    if (!topicsMap.has(tLower)) {
      topicsMap.set(tLower, {
        topic: topic.trim(),
        totalRecords: 0,
        weeksActive: 0,
        recordsByWeek: {},
        savedCount: 0,
        revisionCount: 0,
        sections: []
      });
    }

    const tData = topicsMap.get(tLower)!;
    tData.totalRecords++;
    
    if (record.fields.saved) tData.savedCount++;
    if (record.fields.revision && record.fields.revision !== 'Unread') tData.revisionCount++;
    
    if (!tData.sections.includes(record.section)) {
      tData.sections.push(record.section);
    }

    if (record.fields.week) {
      const weekNum = (weeks[record.fields.week]?.title.split('-W')[1]) || 'Unknown';
      const label = `W${weekNum}`;
      if (!tData.recordsByWeek[label]) {
        tData.recordsByWeek[label] = 0;
      }
      tData.recordsByWeek[label]++;
    }
  }

  // Count weeksActive
  const finalTopics = Array.from(topicsMap.values()).map(t => {
    t.weeksActive = Object.keys(t.recordsByWeek).length;
    return t;
  });

  // Filter out topics that only appear in a single week and have few records, to emphasize "Recurring"
  return finalTopics
    .filter(t => t.weeksActive > 1 || t.totalRecords > 2)
    .sort((a, b) => b.totalRecords - a.totalRecords);
}

export async function getTopicTimeline(topicName: string): Promise<ContentRecord[]> {
  const records = await getRecentKnowledgeContext();
  const tLower = topicName.trim().toLowerCase();
  
  const matches = records.filter(r => r.fields.topic && r.fields.topic.trim().toLowerCase() === tLower);
  
  // Sort chronologically (oldest to newest for timeline, or newest to oldest)
  // Let's sort oldest to newest for a top-down timeline
  return matches.sort((a, b) => {
    const dateA = a.fields.date ? new Date(a.fields.date).getTime() : new Date(a.createdAt).getTime();
    const dateB = b.fields.date ? new Date(b.fields.date).getTime() : new Date(b.createdAt).getTime();
    return dateB - dateA; // Newest first
  });
}

export async function getRevisionIntelligence(): Promise<RevisionPriorityRecord[]> {
  const records = await getRecentKnowledgeContext();
  const weeks = await getWeeksMap();
  
  // Find all records that need revision
  const revisionCandidates = records.filter(r => r.fields.revision && r.fields.revision !== 'Revised');
  const scored: RevisionPriorityRecord[] = [];

  const now = Date.now();

  for (const r of revisionCandidates) {
    let score = 0;
    const reasons: string[] = [];

    const isUnread = r.fields.revision === 'Unread';
    const isReading = r.fields.revision === 'Reading';
    const isReviewed = r.fields.revision === 'Reviewed';
    const isSaved = !!r.fields.saved;

    const createdAt = new Date(r.createdAt).getTime();
    const daysOld = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    // +40 Saved + Unread
    if (isSaved && isUnread) {
      score += 40;
      reasons.push('SAVED // UNREAD');
    }
    
    // +30 Saved + Reading
    if (isSaved && isReading) {
      score += 30;
      reasons.push('SAVED // READING');
    }

    // +20 older Unread
    if (isUnread && daysOld > 3 && !isSaved) {
      score += 20;
      reasons.push(`OLDER RECORD // ${daysOld} DAYS`);
    } else if (isUnread && isSaved) {
      reasons.push(`OLDER RECORD // ${daysOld} DAYS`);
    }

    // +15 older Reading
    if (isReading && daysOld > 2 && !isSaved) {
      score += 15;
      reasons.push(`STUCK IN READING // ${daysOld} DAYS`);
    }

    // +10 reviewed but not revised
    if (isReviewed) {
      score += 10;
      reasons.push('REVIEWED // NEEDS REVISION');
    }

    if (score > 0) {
      scored.push({
        ...r,
        priorityScore: score,
        priorityReasons: reasons,
        weekLabel: r.fields.week ? (weeks[r.fields.week]?.title.split('-W')[1] || weeks[r.fields.week]?.title) : undefined
      });
    }
  }

  return scored.sort((a, b) => b.priorityScore - a.priorityScore);
}

export async function getSavedSynthesis(): Promise<SynthesisSavedPayload> {
  const records = await getRecentKnowledgeContext();
  const savedRecords = records.filter(r => r.fields.saved);

  let unread = 0, reading = 0, reviewed = 0, revised = 0;
  const topicCounts = new Map<string, number>();

  for (const r of savedRecords) {
    if (r.fields.revision === 'Unread') unread++;
    else if (r.fields.revision === 'Reading') reading++;
    else if (r.fields.revision === 'Reviewed') reviewed++;
    else if (r.fields.revision === 'Revised') revised++;

    if (r.fields.topic) {
      const t = r.fields.topic.trim();
      topicCounts.set(t, (topicCounts.get(t) || 0) + 1);
    }
  }

  const topTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(t => t[0]);

  return {
    totalSaved: savedRecords.length,
    unread,
    reading,
    reviewed,
    revised,
    topTopics,
    records: savedRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  };
}
