/**
 * Content CRUD service for all 7 child databases.
 * Provides generic list/get/create/update/archive operations
 * with section-specific property mapping.
 *
 * All Notion-specific logic is encapsulated here — the API routes
 * and UI never touch Notion directly.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { getDataSourceIds } from './config';
import { queryDatabase } from './databases';
import { createPage, getPage, updatePage, archivePage } from './pages';
import {
  titleProp,
  richTextProp,
  numberProp,
  selectProp,
  multiSelectProp,
  dateProp,
  checkboxProp,
  urlProp,
  relationProp,
  readTitle,
  readRichText,
  readNumber,
  readSelect,
  readMultiSelect,
  readDate,
  readCheckbox,
  readUrl,
  readFormula,
  readRelation,
  readCreatedTime,
  readLastEditedTime,
} from './properties';
import type { Status, Priority, RevisionStatus, Difficulty } from './types';

// ─── Section Identifiers ──────────────────────────────────────

export type SectionKey =
  | 'general-awareness'
  | 'defence'
  | 'current-affairs'
  | 'editorials'
  | 'vocabulary'
  | 'oir'
  | 'resources';

export const VALID_SECTIONS: SectionKey[] = [
  'general-awareness',
  'defence',
  'current-affairs',
  'editorials',
  'vocabulary',
  'oir',
  'resources',
];

export const SECTION_META: Record<SectionKey, { code: string; label: string; icon: string }> = {
  'general-awareness': { code: 'GA', label: 'General Awareness', icon: '🌍' },
  'defence':           { code: 'DEF', label: 'Defence Updates', icon: '🛡️' },
  'current-affairs':   { code: 'CA', label: 'Current Affairs', icon: '📰' },
  'editorials':        { code: 'ED', label: 'Editorials', icon: '✍️' },
  'vocabulary':        { code: 'VOC', label: 'Vocabulary', icon: '🧩' },
  'oir':               { code: 'OIR', label: 'OIR Practice', icon: '🧠' },
  'resources':         { code: 'RES', label: 'Resources', icon: '🔗' },
};

// Map section keys to data source config keys
const SECTION_DS_MAP: Record<SectionKey, keyof ReturnType<typeof getDataSourceIds>> = {
  'general-awareness': 'generalAwareness',
  'defence':           'defenceUpdates',
  'current-affairs':   'currentAffairs',
  'editorials':        'editorials',
  'vocabulary':        'vocabulary',
  'oir':               'oirSets',
  'resources':         'resources',
};

export function isValidSection(section: string): section is SectionKey {
  return VALID_SECTIONS.includes(section as SectionKey);
}

export function getDataSourceIdForSection(section: SectionKey): string {
  const dsIds = getDataSourceIds();
  const key = SECTION_DS_MAP[section];
  return dsIds[key];
}

// ─── Content Record (normalized application type) ─────────────

export interface ContentRecord {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  section: SectionKey;
  weekId: string;
  fields: Record<string, any>;
}

// ─── Page → ContentRecord Mapper ──────────────────────────────

export function pageToContentRecord(page: any, section: SectionKey): ContentRecord {
  const props = page.properties;

  // Find the title property dynamically
  const titleKey = Object.keys(props).find(k => props[k].type === 'title') || 'Name';
  const title = readTitle(props[titleKey]);

  // Read week relation
  const weekIds = readRelation(props['Week']);
  const weekId = weekIds.length > 0 ? weekIds[0] : '';

  // Read all fields based on section
  const fields = readSectionFields(props, section);

  return {
    id: page.id,
    title,
    createdAt: readCreatedTime(page),
    updatedAt: readLastEditedTime(page),
    section,
    weekId,
    fields,
  };
}

// ─── Section-Specific Field Readers ───────────────────────────

function readSectionFields(props: any, section: SectionKey): Record<string, any> {
  switch (section) {
    case 'general-awareness':
    case 'defence':
      return {
        content:  readRichText(props['Content']),
        category: readSelect(props['Category']),
        topic:    readRichText(props['Topic']),
        source:   readRichText(props['Source']),
        priority: readSelect(props['Priority']),
        revision: readSelect(props['Revision']),
        status:   readSelect(props['Status']),
        saved:    readCheckbox(props['Saved']),
        tags:     readMultiSelect(props['Tags']),
      };

    case 'current-affairs':
      return {
        content:  readRichText(props['Content']),
        category: readSelect(props['Category']),
        topic:    readRichText(props['Topic']),
        date:     readDate(props['Date']),
        source:   readRichText(props['Source']),
        priority: readSelect(props['Priority']),
        revision: readSelect(props['Revision']),
        status:   readSelect(props['Status']),
        saved:    readCheckbox(props['Saved']),
        tags:     readMultiSelect(props['Tags']),
      };

    case 'editorials':
      return {
        summary:   readRichText(props['Summary']),
        keyPoints: readRichText(props['Key Points']),
        source:    readSelect(props['Source']),
        url:       readUrl(props['URL']),
        date:      readDate(props['Date']),
        topic:     readRichText(props['Topic']),
        priority:  readSelect(props['Priority']),
        revision:  readSelect(props['Revision']),
        status:    readSelect(props['Status']),
        saved:     readCheckbox(props['Saved']),
        tags:      readMultiSelect(props['Tags']),
      };

    case 'vocabulary':
      return {
        meaning:    readRichText(props['Meaning']),
        usage:      readRichText(props['Usage']),
        synonyms:   readRichText(props['Synonyms']),
        source:     readRichText(props['Source']),
        difficulty: readSelect(props['Difficulty']),
        revision:   readSelect(props['Revision']),
        status:     readSelect(props['Status']),
        mastered:   readCheckbox(props['Mastered']),
        saved:      readCheckbox(props['Saved']),
        tags:       readMultiSelect(props['Tags']),
      };

    case 'oir':
      return {
        topic:          readSelect(props['Topic']),
        totalQuestions: readNumber(props['Total Questions']),
        correctAnswers: readNumber(props['Correct Answers']),
        accuracy:       readFormula(props['Accuracy (%)']),
        timeTaken:      readNumber(props['Time Taken (min)']),
        difficulty:     readSelect(props['Difficulty']),
        notes:          readRichText(props['Notes']),
        revision:       readSelect(props['Revision']),
        status:         readSelect(props['Status']),
        saved:          readCheckbox(props['Saved']),
      };

    case 'resources':
      return {
        url:         readUrl(props['URL']),
        type:        readSelect(props['Type']),
        category:    readRichText(props['Category']),
        description: readRichText(props['Description']),
        priority:    readSelect(props['Priority']),
        status:      readSelect(props['Status']),
        revision:    readSelect(props['Revision']),
        saved:       readCheckbox(props['Saved']),
        completed:   readCheckbox(props['Completed']),
        tags:        readMultiSelect(props['Tags']),
      };

    default:
      return {};
  }
}

// ─── Section-Specific Property Builders ───────────────────────

function buildSectionProperties(
  section: SectionKey,
  data: Record<string, any>,
  weekId?: string,
): Record<string, any> {
  const props: Record<string, any> = {};

  // Title (only if provided)
  if (data.title !== undefined) {
    props['Name'] = titleProp(data.title);
  }

  // Week relation (only if provided)
  if (weekId) {
    props['Week'] = relationProp([weekId]);
  }

  switch (section) {
    case 'general-awareness':
    case 'defence':
      if (data.content !== undefined)  props['Content']  = richTextProp(data.content);
      if (data.category !== undefined) props['Category'] = selectProp(data.category);
      if (data.topic !== undefined)    props['Topic']    = richTextProp(data.topic);
      if (data.source !== undefined)   props['Source']   = richTextProp(data.source);
      if (data.priority !== undefined) props['Priority'] = selectProp(data.priority);
      if (data.revision !== undefined) props['Revision'] = selectProp(data.revision);
      if (data.status !== undefined)   props['Status']   = selectProp(data.status);
      if (data.saved !== undefined)    props['Saved']    = checkboxProp(data.saved);
      if (data.tags !== undefined)     props['Tags']     = multiSelectProp(data.tags);
      break;

    case 'current-affairs':
      if (data.content !== undefined)  props['Content']  = richTextProp(data.content);
      if (data.category !== undefined) props['Category'] = selectProp(data.category);
      if (data.topic !== undefined)    props['Topic']    = richTextProp(data.topic);
      if (data.date !== undefined)     props['Date']     = dateProp(data.date);
      if (data.source !== undefined)   props['Source']   = richTextProp(data.source);
      if (data.priority !== undefined) props['Priority'] = selectProp(data.priority);
      if (data.revision !== undefined) props['Revision'] = selectProp(data.revision);
      if (data.status !== undefined)   props['Status']   = selectProp(data.status);
      if (data.saved !== undefined)    props['Saved']    = checkboxProp(data.saved);
      if (data.tags !== undefined)     props['Tags']     = multiSelectProp(data.tags);
      break;

    case 'editorials':
      if (data.summary !== undefined)   props['Summary']    = richTextProp(data.summary);
      if (data.keyPoints !== undefined) props['Key Points'] = richTextProp(data.keyPoints);
      if (data.source !== undefined)    props['Source']      = selectProp(data.source);
      if (data.url !== undefined)       props['URL']         = urlProp(data.url);
      if (data.date !== undefined)      props['Date']        = dateProp(data.date);
      if (data.topic !== undefined)     props['Topic']       = richTextProp(data.topic);
      if (data.priority !== undefined)  props['Priority']    = selectProp(data.priority);
      if (data.revision !== undefined)  props['Revision']    = selectProp(data.revision);
      if (data.status !== undefined)    props['Status']      = selectProp(data.status);
      if (data.saved !== undefined)     props['Saved']       = checkboxProp(data.saved);
      if (data.tags !== undefined)      props['Tags']        = multiSelectProp(data.tags);
      break;

    case 'vocabulary':
      if (data.meaning !== undefined)    props['Meaning']    = richTextProp(data.meaning);
      if (data.usage !== undefined)      props['Usage']      = richTextProp(data.usage);
      if (data.synonyms !== undefined)   props['Synonyms']   = richTextProp(data.synonyms);
      if (data.source !== undefined)     props['Source']      = richTextProp(data.source);
      if (data.difficulty !== undefined) props['Difficulty']  = selectProp(data.difficulty);
      if (data.revision !== undefined)   props['Revision']    = selectProp(data.revision);
      if (data.status !== undefined)     props['Status']      = selectProp(data.status);
      if (data.mastered !== undefined)   props['Mastered']    = checkboxProp(data.mastered);
      if (data.saved !== undefined)      props['Saved']       = checkboxProp(data.saved);
      if (data.tags !== undefined)       props['Tags']        = multiSelectProp(data.tags);
      break;

    case 'oir':
      if (data.topic !== undefined)          props['Topic']            = selectProp(data.topic);
      if (data.totalQuestions !== undefined)  props['Total Questions']  = numberProp(data.totalQuestions);
      if (data.correctAnswers !== undefined)  props['Correct Answers'] = numberProp(data.correctAnswers);
      if (data.timeTaken !== undefined)       props['Time Taken (min)'] = numberProp(data.timeTaken);
      if (data.difficulty !== undefined)      props['Difficulty']       = selectProp(data.difficulty);
      if (data.notes !== undefined)           props['Notes']            = richTextProp(data.notes);
      if (data.status !== undefined)          props['Status']           = selectProp(data.status);
      if (data.revision !== undefined)        props['Revision']         = selectProp(data.revision);
      if (data.saved !== undefined)           props['Saved']            = checkboxProp(data.saved);
      break;

    case 'resources':
      if (data.url !== undefined)         props['URL']         = urlProp(data.url);
      if (data.type !== undefined)        props['Type']        = selectProp(data.type);
      if (data.category !== undefined)    props['Category']    = richTextProp(data.category);
      if (data.description !== undefined) props['Description'] = richTextProp(data.description);
      if (data.priority !== undefined)    props['Priority']    = selectProp(data.priority);
      if (data.status !== undefined)      props['Status']      = selectProp(data.status);
      if (data.completed !== undefined)   props['Completed']   = checkboxProp(data.completed);
      if (data.revision !== undefined)    props['Revision']    = selectProp(data.revision);
      if (data.saved !== undefined)       props['Saved']       = checkboxProp(data.saved);
      if (data.tags !== undefined)        props['Tags']        = multiSelectProp(data.tags);
      break;
  }

  return props;
}

// ─── Validation ───────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

const STATUS_VALUES: Status[] = ['Active', 'Archived', 'Draft'];
const PRIORITY_VALUES: Priority[] = ['High', 'Medium', 'Low'];
const REVISION_VALUES: RevisionStatus[] = ['Unread', 'Reading', 'Reviewed', 'Revised'];
const DIFFICULTY_VALUES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

const GA_CATEGORIES = ['Polity', 'Geography', 'History', 'Economy', 'Science', 'Environment', 'Culture', 'International', 'Other'];
const DEF_CATEGORIES = ['Army', 'Navy', 'Air Force', 'DRDO', 'Joint', 'International', 'Policy', 'Other'];
const CA_CATEGORIES = ['National', 'International', 'Economy', 'Science & Tech', 'Environment', 'Sports', 'Awards', 'Appointments', 'Other'];
const ED_SOURCES = ['The Hindu', 'Indian Express', 'Hindustan Times', 'The Print', 'LiveMint', 'Other'];
const OIR_TOPICS = ['Verbal', 'Non-verbal', 'Numerical', 'Spatial', 'Mixed'];
const RES_TYPES = ['Article', 'Video', 'PDF', 'Book', 'Website', 'App', 'Other'];

function isValidUrl(s: string): boolean {
  if (!s) return true; // Empty is ok (optional)
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

export function validateContent(
  section: SectionKey,
  data: Record<string, any>,
  isUpdate = false,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Title required on create (for most sections)
  if (!isUpdate && section !== 'oir') {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title is required' });
    }
  }

  // OIR uses title but it's optional (auto-generated usually)
  if (!isUpdate && section === 'oir') {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      // Auto-generate a title for OIR
      data.title = `OIR Session — ${data.topic || 'Mixed'}`;
    }
  }

  // Title length
  if (data.title && typeof data.title === 'string' && data.title.length > 500) {
    errors.push({ field: 'title', message: 'Title must be under 500 characters' });
  }

  // WeekId required on create
  if (!isUpdate && !data.weekId) {
    errors.push({ field: 'weekId', message: 'Week assignment is required' });
  }

  // Common validators
  if (data.status && !STATUS_VALUES.includes(data.status)) {
    errors.push({ field: 'status', message: `Invalid status. Must be one of: ${STATUS_VALUES.join(', ')}` });
  }
  if (data.priority && !PRIORITY_VALUES.includes(data.priority)) {
    errors.push({ field: 'priority', message: `Invalid priority. Must be one of: ${PRIORITY_VALUES.join(', ')}` });
  }
  if (data.revision && !REVISION_VALUES.includes(data.revision)) {
    errors.push({ field: 'revision', message: `Invalid revision status. Must be one of: ${REVISION_VALUES.join(', ')}` });
  }
  if (data.difficulty && !DIFFICULTY_VALUES.includes(data.difficulty)) {
    errors.push({ field: 'difficulty', message: `Invalid difficulty. Must be one of: ${DIFFICULTY_VALUES.join(', ')}` });
  }
  if (data.saved !== undefined && typeof data.saved !== 'boolean') {
    errors.push({ field: 'saved', message: 'Saved must be a boolean' });
  }

  // Section-specific validation
  switch (section) {
    case 'general-awareness':
      if (data.category && !GA_CATEGORIES.includes(data.category)) {
        errors.push({ field: 'category', message: `Invalid category. Must be one of: ${GA_CATEGORIES.join(', ')}` });
      }
      break;

    case 'defence':
      if (data.category && !DEF_CATEGORIES.includes(data.category)) {
        errors.push({ field: 'category', message: `Invalid category. Must be one of: ${DEF_CATEGORIES.join(', ')}` });
      }
      break;

    case 'current-affairs':
      if (data.category && !CA_CATEGORIES.includes(data.category)) {
        errors.push({ field: 'category', message: `Invalid category. Must be one of: ${CA_CATEGORIES.join(', ')}` });
      }
      if (data.date && isNaN(new Date(data.date).getTime())) {
        errors.push({ field: 'date', message: 'Invalid date format' });
      }
      break;

    case 'editorials':
      if (data.source && !ED_SOURCES.includes(data.source)) {
        errors.push({ field: 'source', message: `Invalid source. Must be one of: ${ED_SOURCES.join(', ')}` });
      }
      if (data.url && !isValidUrl(data.url)) {
        errors.push({ field: 'url', message: 'Invalid URL format' });
      }
      if (data.date && isNaN(new Date(data.date).getTime())) {
        errors.push({ field: 'date', message: 'Invalid date format' });
      }
      break;

    case 'vocabulary':
      if (!isUpdate && (!data.meaning || typeof data.meaning !== 'string' || data.meaning.trim().length === 0)) {
        errors.push({ field: 'meaning', message: 'Meaning is required' });
      }
      break;

    case 'oir':
      if (data.topic && !OIR_TOPICS.includes(data.topic)) {
        errors.push({ field: 'topic', message: `Invalid topic. Must be one of: ${OIR_TOPICS.join(', ')}` });
      }
      if (data.totalQuestions !== undefined) {
        if (typeof data.totalQuestions !== 'number' || data.totalQuestions < 0) {
          errors.push({ field: 'totalQuestions', message: 'Total questions must be a non-negative number' });
        }
      }
      if (data.correctAnswers !== undefined) {
        if (typeof data.correctAnswers !== 'number' || data.correctAnswers < 0) {
          errors.push({ field: 'correctAnswers', message: 'Correct answers must be a non-negative number' });
        }
      }
      // Logical check: correct <= total
      if (
        typeof data.totalQuestions === 'number' &&
        typeof data.correctAnswers === 'number' &&
        data.correctAnswers > data.totalQuestions
      ) {
        errors.push({ field: 'correctAnswers', message: 'Correct answers cannot exceed total questions' });
      }
      if (data.timeTaken !== undefined) {
        if (typeof data.timeTaken !== 'number' || data.timeTaken < 0) {
          errors.push({ field: 'timeTaken', message: 'Time taken must be a non-negative number' });
        }
      }
      break;

    case 'resources':
      if (data.type && !RES_TYPES.includes(data.type)) {
        errors.push({ field: 'type', message: `Invalid type. Must be one of: ${RES_TYPES.join(', ')}` });
      }
      if (data.url && !isValidUrl(data.url)) {
        errors.push({ field: 'url', message: 'Invalid URL format' });
      }
      break;
  }

  return errors;
}

// ─── CRUD Operations ──────────────────────────────────────────

/**
 * List records for a section, with optional week filtering.
 */
export async function listContent(
  section: SectionKey,
  options: {
    weekId?: string;
    pageSize?: number;
    startCursor?: string;
  } = {},
) {
  const dsId = getDataSourceIdForSection(section);

  const filter: any = options.weekId
    ? { property: 'Week', relation: { contains: options.weekId } }
    : undefined;

  const sorts: any[] = [{ timestamp: 'created_time', direction: 'descending' }];

  const response = await queryDatabase(dsId, {
    filter,
    sorts,
    pageSize: options.pageSize ?? 50,
    startCursor: options.startCursor,
  });

  return {
    items: response.results.map((page: any) => pageToContentRecord(page, section)),
    hasMore: response.has_more,
    nextCursor: response.next_cursor ?? undefined,
  };
}

/**
 * Get a single record by ID.
 */
export async function getContent(section: SectionKey, recordId: string): Promise<ContentRecord> {
  const page = await getPage(recordId);
  return pageToContentRecord(page, section);
}

/**
 * Create a new record.
 */
export async function createContent(
  section: SectionKey,
  data: Record<string, any>,
): Promise<ContentRecord> {
  const dsId = getDataSourceIdForSection(section);
  const weekId = data.weekId;
  const props = buildSectionProperties(section, data, weekId);

  // Set default status if not provided
  if (!props['Status']) {
    props['Status'] = selectProp('Active');
  }

  const page = await createPage(dsId, props);
  return pageToContentRecord(page, section);
}

/**
 * Update an existing record.
 */
export async function updateContent(
  section: SectionKey,
  recordId: string,
  data: Record<string, any>,
): Promise<ContentRecord> {
  const weekId = data.weekId;
  const props = buildSectionProperties(section, data, weekId);

  const page = await updatePage(recordId, props);
  return pageToContentRecord(page, section);
}

/**
 * Archive (soft-delete) a record.
 */
export async function archiveContent(recordId: string): Promise<void> {
  await archivePage(recordId);
}

// ─── Schema Metadata (for UI forms) ──────────────────────────

export function getSectionSchema(section: SectionKey) {
  const base = {
    statuses: STATUS_VALUES,
    priorities: PRIORITY_VALUES,
    revisions: REVISION_VALUES,
    difficulties: DIFFICULTY_VALUES,
  };

  switch (section) {
    case 'general-awareness':
      return { ...base, categories: GA_CATEGORIES };
    case 'defence':
      return { ...base, categories: DEF_CATEGORIES };
    case 'current-affairs':
      return { ...base, categories: CA_CATEGORIES };
    case 'editorials':
      return { ...base, sources: ED_SOURCES };
    case 'vocabulary':
      return { ...base };
    case 'oir':
      return { ...base, topics: OIR_TOPICS };
    case 'resources':
      return { ...base, types: RES_TYPES };
    default:
      return base;
  }
}
