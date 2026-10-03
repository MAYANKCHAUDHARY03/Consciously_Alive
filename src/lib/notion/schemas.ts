/**
 * Notion database property schemas.
 * Defines the columns for each of the 8 databases.
 *
 * Notion v5 flow:
 *   1. databases.create → creates the database with Title property only
 *   2. dataSources.update → adds all remaining properties to the data source
 *
 * The schemas here are used in step 2.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Schema Type ──────────────────────────────────────────────

export interface DatabaseSchema {
  title: string;
  icon: string;
  /** Properties to add via dataSources.update (Title is auto-created) */
  properties: Record<string, any>;
}

// ─── Helper: Common property definitions ──────────────────────

const statusSelect = {
  select: {
    options: [
      { name: 'Active', color: 'green' },
      { name: 'Archived', color: 'default' },
      { name: 'Draft', color: 'yellow' },
    ],
  },
};

const prioritySelect = {
  select: {
    options: [
      { name: 'High', color: 'red' },
      { name: 'Medium', color: 'yellow' },
      { name: 'Low', color: 'blue' },
    ],
  },
};

const revisionSelect = {
  select: {
    options: [
      { name: 'Unread', color: 'default' },
      { name: 'Reading', color: 'yellow' },
      { name: 'Reviewed', color: 'blue' },
      { name: 'Revised', color: 'green' },
    ],
  },
};

const difficultySelect = {
  select: {
    options: [
      { name: 'Easy', color: 'green' },
      { name: 'Medium', color: 'yellow' },
      { name: 'Hard', color: 'red' },
    ],
  },
};

const richText = { rich_text: {} };
const number = { number: {} };
const url = { url: {} };
const checkbox = { checkbox: {} };
const date = { date: {} };

function multiSelect(options: string[]) {
  return {
    multi_select: {
      options: options.map((name) => ({ name })),
    },
  };
}

function select(options: { name: string; color?: string }[]) {
  return { select: { options } };
}

// ─── 1. Weekly Archive ────────────────────────────────────────

export const weeklyArchiveSchema: DatabaseSchema = {
  title: '📅 Weekly Archive',
  icon: '📅',
  properties: {
    'Week Number': number,
    'Start Date': date,
    'End Date': date,
    'Status': statusSelect,
    'Takeaways': richText,
  },
};

// ─── 2. General Awareness ─────────────────────────────────────

export const generalAwarenessSchema: DatabaseSchema = {
  title: '🌍 General Awareness',
  icon: '🌍',
  properties: {
    'Content': richText,
    'Category': select([
      { name: 'Polity', color: 'blue' },
      { name: 'Geography', color: 'green' },
      { name: 'History', color: 'brown' },
      { name: 'Economy', color: 'yellow' },
      { name: 'Science', color: 'purple' },
      { name: 'Environment', color: 'green' },
      { name: 'Culture', color: 'orange' },
      { name: 'International', color: 'pink' },
      { name: 'Other', color: 'default' },
    ]),
    'Topic': richText,
    'Source': richText,
    'Priority': prioritySelect,
    'Revision': revisionSelect,
    'Status': statusSelect,
    'Saved': checkbox,
    'Tags': multiSelect(['Important', 'Frequently Asked', 'Trending', 'Static']),
  },
};

// ─── 3. Defence Updates ───────────────────────────────────────

export const defenceUpdatesSchema: DatabaseSchema = {
  title: '🛡️ Defence Updates',
  icon: '🛡️',
  properties: {
    'Content': richText,
    'Category': select([
      { name: 'Army', color: 'green' },
      { name: 'Navy', color: 'blue' },
      { name: 'Air Force', color: 'purple' },
      { name: 'DRDO', color: 'orange' },
      { name: 'Joint', color: 'yellow' },
      { name: 'International', color: 'pink' },
      { name: 'Policy', color: 'default' },
      { name: 'Other', color: 'default' },
    ]),
    'Topic': richText,
    'Source': richText,
    'Priority': prioritySelect,
    'Revision': revisionSelect,
    'Status': statusSelect,
    'Saved': checkbox,
    'Tags': multiSelect(['Exercise', 'Acquisition', 'Deployment', 'Treaty', 'Indigenous']),
  },
};

// ─── 4. Current Affairs ───────────────────────────────────────

export const currentAffairsSchema: DatabaseSchema = {
  title: '📰 Current Affairs',
  icon: '📰',
  properties: {
    'Content': richText,
    'Category': select([
      { name: 'National', color: 'blue' },
      { name: 'International', color: 'pink' },
      { name: 'Economy', color: 'yellow' },
      { name: 'Science & Tech', color: 'purple' },
      { name: 'Environment', color: 'green' },
      { name: 'Sports', color: 'orange' },
      { name: 'Awards', color: 'red' },
      { name: 'Appointments', color: 'default' },
      { name: 'Other', color: 'default' },
    ]),
    'Topic': richText,
    'Date': date,
    'Source': richText,
    'Priority': prioritySelect,
    'Revision': revisionSelect,
    'Status': statusSelect,
    'Saved': checkbox,
    'Tags': multiSelect(['Breaking', 'Important', 'Recurring', 'One-time']),
  },
};

// ─── 5. Editorials ────────────────────────────────────────────

export const editorialsSchema: DatabaseSchema = {
  title: '✍️ Editorials',
  icon: '✍️',
  properties: {
    'Summary': richText,
    'Key Points': richText,
    'Source': select([
      { name: 'The Hindu', color: 'red' },
      { name: 'Indian Express', color: 'blue' },
      { name: 'Hindustan Times', color: 'yellow' },
      { name: 'The Print', color: 'purple' },
      { name: 'LiveMint', color: 'green' },
      { name: 'Other', color: 'default' },
    ]),
    'URL': url,
    'Date': date,
    'Topic': richText,
    'Priority': prioritySelect,
    'Revision': revisionSelect,
    'Status': statusSelect,
    'Saved': checkbox,
    'Tags': multiSelect(['Must Read', 'Opinion', 'Analysis', 'Policy']),
  },
};

// ─── 6. Vocabulary ────────────────────────────────────────────

export const vocabularySchema: DatabaseSchema = {
  title: '🧩 Vocabulary',
  icon: '🧩',
  properties: {
    'Meaning': richText,
    'Usage': richText,
    'Synonyms': richText,
    'Source': richText,
    'Difficulty': difficultySelect,
    'Revision': revisionSelect,
    'Status': statusSelect,
    'Mastered': checkbox,
    'Saved': checkbox,
    'Tags': multiSelect(['Editorial', 'Comprehension', 'Daily Use', 'Academic']),
  },
};

// ─── 7. OIR Sets ──────────────────────────────────────────────

export const oirSetsSchema: DatabaseSchema = {
  title: '🧠 OIR Practice',
  icon: '🧠',
  properties: {
    'Topic': select([
      { name: 'Verbal', color: 'blue' },
      { name: 'Non-verbal', color: 'green' },
      { name: 'Numerical', color: 'yellow' },
      { name: 'Spatial', color: 'purple' },
      { name: 'Mixed', color: 'default' },
    ]),
    'Total Questions': number,
    'Correct Answers': number,
    'Accuracy (%)': {
      formula: {
        expression: 'if(prop("Total Questions") > 0, round(prop("Correct Answers") / prop("Total Questions") * 100), 0)',
      },
    },
    'Time Taken (min)': number,
    'Difficulty': difficultySelect,
    'Notes': richText,
    'Revision': revisionSelect,
    'Status': statusSelect,
    'Saved': checkbox,
  },
};

// ─── 8. Resources ─────────────────────────────────────────────

export const resourcesSchema: DatabaseSchema = {
  title: '🔗 Resources',
  icon: '🔗',
  properties: {
    'URL': url,
    'Type': select([
      { name: 'Article', color: 'blue' },
      { name: 'Video', color: 'red' },
      { name: 'PDF', color: 'orange' },
      { name: 'Book', color: 'green' },
      { name: 'Website', color: 'purple' },
      { name: 'App', color: 'yellow' },
      { name: 'Other', color: 'default' },
    ]),
    'Category': richText,
    'Description': richText,
    'Priority': prioritySelect,
    'Status': statusSelect,
    'Revision': revisionSelect,
    'Saved': checkbox,
    'Completed': checkbox,
    'Tags': multiSelect(['Must Read', 'Reference', 'Practice', 'Theory']),
  },
};

// ─── All Schemas Map ──────────────────────────────────────────

export const ALL_SCHEMAS = {
  weeklyArchive: weeklyArchiveSchema,
  generalAwareness: generalAwarenessSchema,
  defenceUpdates: defenceUpdatesSchema,
  currentAffairs: currentAffairsSchema,
  editorials: editorialsSchema,
  vocabulary: vocabularySchema,
  oirSets: oirSetsSchema,
  resources: resourcesSchema,
} as const;

export type DatabaseName = keyof typeof ALL_SCHEMAS;
