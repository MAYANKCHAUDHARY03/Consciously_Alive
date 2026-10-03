import { getDataSourceIds } from './config';
import { createPage, getPage, updatePage } from './pages';
import { queryDatabase } from './databases';
import {
  titleProp,
  dateProp,
  numberProp,
  selectProp,
  richTextProp,
  readTitle,
  readDate,
  readDateEnd,
  readNumber,
  readSelect,
  readRichText,
  readCreatedTime,
  readLastEditedTime,
} from './properties';
import { getISOWeekInfo, getWeekKey, getWeekRange, getWeekStatus, getWeekTitle } from '../utils/date';
import { WeeklyRecord, Status } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Mappers ──────────────────────────────────────────────────

export function pageToWeeklyRecord(page: any): WeeklyRecord {
  const props = page.properties;
  
  // Find the title property (Notion names it "Name" or "Title" or whatever is configured)
  // Usually the key is 'Name' or 'Title', but we can dynamically find the property of type 'title'
  const titlePropKey = Object.keys(props).find(k => props[k].type === 'title') || 'Name';
  
  return {
    id: page.id,
    createdAt: readCreatedTime(page),
    updatedAt: readLastEditedTime(page),
    status: (readSelect(props['Status']) as Status) || 'Draft',
    title: readTitle(props[titlePropKey]),
    weekNumber: readNumber(props['Week Number']),
    startDate: readDate(props['Start Date']),
    endDate: readDate(props['End Date']) || readDateEnd(props['Start Date']), // fallback
    takeaways: readRichText(props['Takeaways']),
  };
}

export function weeklyRecordToNotionProperties(
  params: Partial<Pick<WeeklyRecord, 'title' | 'weekNumber' | 'startDate' | 'endDate' | 'status' | 'takeaways'>>
) {
  const props: any = {};
  
  if (params.title !== undefined) props['Name'] = titleProp(params.title); // Assuming title property is 'Name'
  if (params.weekNumber !== undefined) props['Week Number'] = numberProp(params.weekNumber);
  if (params.startDate !== undefined || params.endDate !== undefined) {
    props['Start Date'] = dateProp(params.startDate!, params.endDate);
    props['End Date'] = dateProp(params.endDate!);
  }
  if (params.status !== undefined) props['Status'] = selectProp(params.status);
  if (params.takeaways !== undefined) props['Takeaways'] = richTextProp(params.takeaways);

  return props;
}

// ─── Services ─────────────────────────────────────────────────

/**
 * Gets a specific week by ID.
 */
export async function getWeek(id: string): Promise<WeeklyRecord> {
  const page = await getPage(id);
  return pageToWeeklyRecord(page);
}

/**
 * Lists weeks with pagination and optional filters.
 */
export async function listWeeks(options: { 
  pageSize?: number; 
  startCursor?: string;
  status?: Status;
}) {
  const dsIds = getDataSourceIds();
  const filter: any = options.status ? {
    property: 'Status',
    select: { equals: options.status }
  } : undefined;

  const sorts = [
    {
      property: 'Start Date',
      direction: 'descending' as const,
    }
  ];

  const response = await queryDatabase(dsIds.weeklyArchive, {
    pageSize: options.pageSize,
    startCursor: options.startCursor,
    filter,
    sorts,
  });

  return {
    items: response.results.map(pageToWeeklyRecord),
    hasMore: response.has_more,
    nextCursor: response.next_cursor ?? undefined,
  };
}

/**
 * Searches for a week by its exact Week Key (e.g. 2026-W40).
 * Since title starts with the week key, we query by title.
 */
export async function getWeekByKey(weekKey: string): Promise<WeeklyRecord | null> {
  const dsIds = getDataSourceIds();
  
  // To search by title, we need to know the title property name. 
  // It's usually 'Name' but we can just use the standard title filter.
  // Wait, the API requires knowing the exact property name for filter.
  // Let's assume it is 'Name' as created by the database API.
  const response = await queryDatabase(dsIds.weeklyArchive, {
    filter: {
      property: 'title', // using 'title' as property type filter directly or 'Name' as name
      title: { starts_with: weekKey }
    },
    pageSize: 1
  });

  if (response.results.length === 0) return null;
  return pageToWeeklyRecord(response.results[0]);
}

/**
 * Creates a new Weekly Archive record.
 */
export async function createWeek(dateInput?: string | Date): Promise<WeeklyRecord> {
  const dsIds = getDataSourceIds();
  
  const weekKey = getWeekKey(dateInput);
  const title = getWeekTitle(dateInput);
  const { start, end, startObj } = getWeekRange(dateInput);
  const { week } = getISOWeekInfo(startObj);
  const status = getWeekStatus(dateInput);

  // Ensure idempotency
  const existing = await getWeekByKey(weekKey);
  if (existing) {
    return existing; // Already exists, return it
  }

  const props = {
    // In Notion, the default title column is 'Name'. We will map title to it.
    'Name': titleProp(title),
    'Week Number': numberProp(week),
    'Start Date': dateProp(start),
    'End Date': dateProp(end),
    'Status': selectProp(status),
    'Takeaways': richTextProp(''),
  };

  const page = await createPage(dsIds.weeklyArchive, props);
  return pageToWeeklyRecord(page);
}

/**
 * Gets or creates the week for the given date (defaults to today).
 * Automatically ensures idempotency.
 */
export async function getCurrentWeek(dateInput?: string | Date): Promise<WeeklyRecord> {
  const weekKey = getWeekKey(dateInput);
  const existing = await getWeekByKey(weekKey);
  if (existing) return existing;
  return createWeek(dateInput);
}

/**
 * Updates a specific week.
 */
export async function updateWeek(
  id: string, 
  updates: Pick<Partial<WeeklyRecord>, 'status' | 'takeaways' | 'title'>
): Promise<WeeklyRecord> {
  const props = weeklyRecordToNotionProperties(updates);
  const page = await updatePage(id, props);
  return pageToWeeklyRecord(page);
}

/**
 * Gets a map of all week IDs to their titles for fast lookup.
 */
export async function getWeeksMap(): Promise<Record<string, { title: string }>> {
  // Use queryAllPages instead if it existed, but we can just query a bunch
  // Or reuse listWeeks with large page size.
  const map: Record<string, { title: string }> = {};
  let hasMore = true;
  let cursor: string | undefined = undefined;

  while (hasMore) {
    const response = await listWeeks({ pageSize: 100, startCursor: cursor });
    response.items.forEach(week => {
      map[week.id] = { title: week.title };
    });
    hasMore = response.hasMore;
    cursor = response.nextCursor;
  }

  return map;
}
