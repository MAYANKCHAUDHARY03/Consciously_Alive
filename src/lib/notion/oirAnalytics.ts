/**
 * OIR Analytics Service — server-side aggregation of OIR practice data.
 *
 * Fetches OIR records from Notion, aggregates them into analytics
 * payloads, and computes weighted metrics. All calculations follow
 * the weighted-accuracy principle:
 *
 *   Global Accuracy = Total Correct / Total Questions × 100
 *
 * NOT the average of individual percentages.
 *
 * Archived/deleted records are automatically excluded by the Notion API
 * (archived pages are not returned by default queries).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { getDataSourceIds } from './config';
import { queryAllPages } from './databases';
import {
  readTitle,
  readSelect,
  readNumber,
  readFormula,
  readRichText,
  readRelation,
  readCreatedTime,
} from './properties';
import { listWeeks } from './weeks';
import type { WeeklyRecord } from './types';

// ─── Types ────────────────────────────────────────────────────

export type AnalyticsRange = '4w' | '8w' | '12w' | '24w' | 'all';

const RANGE_WEEKS: Record<AnalyticsRange, number | null> = {
  '4w': 4,
  '8w': 8,
  '12w': 12,
  '24w': 24,
  'all': null,
};

/** Minimum questions before a topic is considered a meaningful signal */
const MIN_TOPIC_QUESTIONS = 10;

export interface OirSummary {
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  accuracy: number;             // weighted: totalCorrect / totalQuestions × 100
  practiceSets: number;
  averageTimePerQuestion: number | null;  // minutes per question, null if no timing data
  speedAvailable: boolean;
}

export interface WeeklyTrendPoint {
  weekId: string;
  weekLabel: string;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  accuracy: number;             // weighted
  practiceSets: number;
  averageTimePerQuestion: number | null;
}

export interface TopicPerformance {
  topic: string;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  accuracy: number;             // weighted
  practiceSets: number;
  sufficientData: boolean;      // >= MIN_TOPIC_QUESTIONS
}

export interface SpeedAccuracyPoint {
  label: string;                // practice set name or week label
  accuracy: number;
  timePerQuestion: number;      // minutes per question
  totalQuestions: number;
}

export interface RecentPracticeEntry {
  id: string;
  title: string;
  createdAt: string;
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeTaken: number | null;     // minutes, null if not recorded
  timePerQuestion: number | null;
  difficulty: string;
}

export interface OirInsight {
  type: 'improvement' | 'regression' | 'best_week' | 'weakest_topic' | 'strongest_topic' | 'info';
  message: string;
}

export interface OirAnalyticsPayload {
  summary: OirSummary;
  weeklyTrend: WeeklyTrendPoint[];
  topicPerformance: TopicPerformance[];
  speedAccuracy: SpeedAccuracyPoint[];
  speedAvailable: boolean;
  recentPractice: RecentPracticeEntry[];
  insights: OirInsight[];
  range: AnalyticsRange;
  dataAvailable: boolean;
}

// ─── Internal Record Type ─────────────────────────────────────

interface OirRecord {
  id: string;
  title: string;
  createdAt: string;
  weekId: string;
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeTaken: number;
  difficulty: string;
  notes: string;
  status: string;
}

// ─── Safe Math Helpers ────────────────────────────────────────

function safeAccuracy(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 10000) / 100; // 2 decimal places
}

function safeTimePerQuestion(timeTaken: number, totalQuestions: number): number | null {
  if (totalQuestions <= 0 || timeTaken <= 0) return null;
  return Math.round((timeTaken / totalQuestions) * 100) / 100;
}

// ─── Page → OirRecord Mapper ─────────────────────────────────

function pageToOirRecord(page: any): OirRecord {
  const props = page.properties;
  const titleKey = Object.keys(props).find(k => props[k].type === 'title') || 'Name';
  const weekIds = readRelation(props['Week']);

  const totalQ = readNumber(props['Total Questions']);
  const correctRaw = readNumber(props['Correct Answers']);
  const correctCapped = Math.min(correctRaw, totalQ);

  return {
    id: page.id,
    title: readTitle(props[titleKey]),
    createdAt: readCreatedTime(page),
    weekId: weekIds.length > 0 ? weekIds[0] : '',
    topic: readSelect(props['Topic']) || 'Uncategorized',
    totalQuestions: totalQ,
    correctAnswers: correctCapped,
    accuracy: Number(readFormula(props['Accuracy (%)'])) || 0,
    timeTaken: readNumber(props['Time Taken (min)']),
    difficulty: readSelect(props['Difficulty']) || '',
    notes: readRichText(props['Notes']),
    status: readSelect(props['Status']) || 'Active',
  };
}

// ─── Fetch OIR Records ───────────────────────────────────────

async function fetchOirRecords(weekIds?: string[]): Promise<OirRecord[]> {
  const dsIds = getDataSourceIds();

  // Build filter: exclude archived records (Notion API excludes archived pages by default)
  // Additionally filter by Status !== 'Archived' for our app-level archiving
  let filter: any = {
    property: 'Status',
    select: { does_not_equal: 'Archived' },
  };

  // If we have specific week IDs, add a compound filter
  if (weekIds && weekIds.length > 0) {
    const weekFilters = weekIds.map(wid => ({
      property: 'Week',
      relation: { contains: wid },
    }));

    filter = {
      and: [
        filter,
        { or: weekFilters },
      ],
    };
  }

  const pages = await queryAllPages(dsIds.oirSets, {
    filter,
    sorts: [{ timestamp: 'created_time', direction: 'descending' }],
  });

  return pages
    .map(pageToOirRecord)
    .filter(r => r.totalQuestions >= 0 && r.correctAnswers >= 0);
}

// ─── Fetch Weeks for Range ───────────────────────────────────

async function fetchWeeksForRange(range: AnalyticsRange): Promise<WeeklyRecord[]> {
  const limit = RANGE_WEEKS[range];

  // Fetch weeks sorted by start date descending
  const result = await listWeeks({
    pageSize: limit ?? 100,
  });

  let weeks = result.items;

  // If 'all', paginate to get everything
  if (range === 'all' && result.hasMore) {
    let cursor = result.nextCursor;
    while (cursor) {
      const next = await listWeeks({ pageSize: 100, startCursor: cursor });
      weeks = [...weeks, ...next.items];
      cursor = next.hasMore ? next.nextCursor : undefined;
    }
  }

  return weeks;
}

// ─── Build Analytics ─────────────────────────────────────────

export async function getOirAnalytics(range: AnalyticsRange = '12w'): Promise<OirAnalyticsPayload> {
  // 1. Fetch relevant weeks
  const weeks = await fetchWeeksForRange(range);

  if (weeks.length === 0) {
    return emptyPayload(range);
  }

  // Build a week lookup map
  const weekMap = new Map<string, WeeklyRecord>();
  weeks.forEach(w => weekMap.set(w.id, w));
  const weekIds = weeks.map(w => w.id);

  // 2. Fetch OIR records for those weeks
  const records = await fetchOirRecords(weekIds);

  if (records.length === 0) {
    return emptyPayload(range);
  }

  // 3. Compute summary
  const summary = computeSummary(records);

  // 4. Compute weekly trend
  const weeklyTrend = computeWeeklyTrend(records, weeks);

  // 5. Compute topic performance
  const topicPerformance = computeTopicPerformance(records);

  // 6. Compute speed-accuracy scatter data
  const speedAvailable = records.some(r => r.timeTaken > 0);
  const speedAccuracy = speedAvailable ? computeSpeedAccuracy(records) : [];

  // 7. Recent practice log (last 10)
  const recentPractice = records.slice(0, 10).map(r => ({
    id: r.id,
    title: r.title,
    createdAt: r.createdAt,
    topic: r.topic,
    totalQuestions: r.totalQuestions,
    correctAnswers: r.correctAnswers,
    accuracy: safeAccuracy(r.correctAnswers, r.totalQuestions),
    timeTaken: r.timeTaken > 0 ? r.timeTaken : null,
    timePerQuestion: safeTimePerQuestion(r.timeTaken, r.totalQuestions),
    difficulty: r.difficulty,
  }));

  // 8. Compute insights
  const insights = computeInsights(summary, weeklyTrend, topicPerformance, speedAvailable);

  return {
    summary,
    weeklyTrend,
    topicPerformance,
    speedAccuracy,
    speedAvailable,
    recentPractice,
    insights,
    range,
    dataAvailable: true,
  };
}

// ─── Compute Functions ───────────────────────────────────────

function computeSummary(records: OirRecord[]): OirSummary {
  let totalQ = 0;
  let totalC = 0;
  let totalTime = 0;
  let timeRecords = 0;

  for (const r of records) {
    totalQ += r.totalQuestions;
    totalC += r.correctAnswers;
    if (r.timeTaken > 0) {
      totalTime += r.timeTaken;
      timeRecords++;
    }
  }

  const speedAvailable = timeRecords > 0;
  const avgTimePerQ = speedAvailable ? safeTimePerQuestion(totalTime, totalQ) : null;

  return {
    totalQuestions: totalQ,
    totalCorrect: totalC,
    totalIncorrect: totalQ - totalC,
    accuracy: safeAccuracy(totalC, totalQ),
    practiceSets: records.length,
    averageTimePerQuestion: avgTimePerQ,
    speedAvailable,
  };
}

function computeWeeklyTrend(records: OirRecord[], weeks: WeeklyRecord[]): WeeklyTrendPoint[] {
  // Group records by weekId
  const byWeek = new Map<string, OirRecord[]>();
  for (const r of records) {
    if (!r.weekId) continue;
    const existing = byWeek.get(r.weekId) || [];
    existing.push(r);
    byWeek.set(r.weekId, existing);
  }

  // Only include weeks that have OIR data
  const trend: WeeklyTrendPoint[] = [];
  for (const week of weeks) {
    const weekRecords = byWeek.get(week.id);
    if (!weekRecords || weekRecords.length === 0) continue;

    let totalQ = 0;
    let totalC = 0;
    let totalTime = 0;

    for (const r of weekRecords) {
      totalQ += r.totalQuestions;
      totalC += r.correctAnswers;
      if (r.timeTaken > 0) {
        totalTime += r.timeTaken;
      }
    }

    trend.push({
      weekId: week.id,
      weekLabel: week.title.split(' ')[0] || week.title, // e.g. "2026-W40"
      totalQuestions: totalQ,
      correct: totalC,
      incorrect: totalQ - totalC,
      accuracy: safeAccuracy(totalC, totalQ),
      practiceSets: weekRecords.length,
      averageTimePerQuestion: safeTimePerQuestion(totalTime, totalQ),
    });
  }

  // Sort chronologically (oldest first) for charting
  trend.reverse();

  return trend;
}

function computeTopicPerformance(records: OirRecord[]): TopicPerformance[] {
  const byTopic = new Map<string, OirRecord[]>();

  for (const r of records) {
    const topic = r.topic || 'Uncategorized';
    const existing = byTopic.get(topic) || [];
    existing.push(r);
    byTopic.set(topic, existing);
  }

  const topics: TopicPerformance[] = [];
  for (const [topic, topicRecords] of byTopic) {
    let totalQ = 0;
    let totalC = 0;

    for (const r of topicRecords) {
      totalQ += r.totalQuestions;
      totalC += r.correctAnswers;
    }

    topics.push({
      topic,
      totalQuestions: totalQ,
      correct: totalC,
      incorrect: totalQ - totalC,
      accuracy: safeAccuracy(totalC, totalQ),
      practiceSets: topicRecords.length,
      sufficientData: totalQ >= MIN_TOPIC_QUESTIONS,
    });
  }

  // Sort by accuracy ascending so weakest areas appear first
  topics.sort((a, b) => a.accuracy - b.accuracy);

  return topics;
}

function computeSpeedAccuracy(records: OirRecord[]): SpeedAccuracyPoint[] {
  return records
    .filter(r => r.timeTaken > 0 && r.totalQuestions > 0)
    .map(r => ({
      label: r.title || `${r.topic} (${r.totalQuestions}Q)`,
      accuracy: safeAccuracy(r.correctAnswers, r.totalQuestions),
      timePerQuestion: safeTimePerQuestion(r.timeTaken, r.totalQuestions) ?? 0,
      totalQuestions: r.totalQuestions,
    }));
}

function computeInsights(
  summary: OirSummary,
  trend: WeeklyTrendPoint[],
  topics: TopicPerformance[],
  speedAvailable: boolean,
): OirInsight[] {
  const insights: OirInsight[] = [];

  // Total practice volume
  insights.push({
    type: 'info',
    message: `${summary.totalQuestions} questions practiced across ${summary.practiceSets} sessions.`,
  });

  // Trend: compare earliest and latest week
  if (trend.length >= 2) {
    const earliest = trend[0];
    const latest = trend[trend.length - 1];
    const diff = Math.round((latest.accuracy - earliest.accuracy) * 100) / 100;

    if (diff > 0) {
      insights.push({
        type: 'improvement',
        message: `Accuracy improved by ${Math.abs(diff)} percentage points from ${earliest.weekLabel} to ${latest.weekLabel}.`,
      });
    } else if (diff < 0) {
      insights.push({
        type: 'regression',
        message: `Accuracy decreased by ${Math.abs(diff)} percentage points from ${earliest.weekLabel} to ${latest.weekLabel}.`,
      });
    }

    // Best week
    const bestWeek = trend.reduce((best, w) =>
      w.accuracy > best.accuracy && w.totalQuestions >= 5 ? w : best, trend[0]);
    if (bestWeek.totalQuestions >= 5) {
      insights.push({
        type: 'best_week',
        message: `Best recorded performance: ${bestWeek.weekLabel} at ${bestWeek.accuracy}% (${bestWeek.totalQuestions} questions).`,
      });
    }
  }

  // Topic insights (only for topics with sufficient data)
  const sufficientTopics = topics.filter(t => t.sufficientData);
  if (sufficientTopics.length >= 2) {
    const weakest = sufficientTopics[0]; // already sorted ascending
    const strongest = sufficientTopics[sufficientTopics.length - 1];

    insights.push({
      type: 'weakest_topic',
      message: `${weakest.topic} has the lowest recorded accuracy at ${weakest.accuracy}% (${weakest.totalQuestions} questions).`,
    });

    insights.push({
      type: 'strongest_topic',
      message: `${strongest.topic} has the highest recorded accuracy at ${strongest.accuracy}% (${strongest.totalQuestions} questions).`,
    });
  }

  // Speed insight
  if (speedAvailable && summary.averageTimePerQuestion !== null) {
    insights.push({
      type: 'info',
      message: `Average speed: ${summary.averageTimePerQuestion} minutes per question.`,
    });
  }

  return insights;
}

// ─── Empty Payload ───────────────────────────────────────────

function emptyPayload(range: AnalyticsRange): OirAnalyticsPayload {
  return {
    summary: {
      totalQuestions: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      accuracy: 0,
      practiceSets: 0,
      averageTimePerQuestion: null,
      speedAvailable: false,
    },
    weeklyTrend: [],
    topicPerformance: [],
    speedAccuracy: [],
    speedAvailable: false,
    recentPractice: [],
    insights: [],
    range,
    dataAvailable: false,
  };
}
