/**
 * Notion service barrel export.
 * Import everything from '@/lib/notion' in server-side code.
 */

export { getNotionClient } from './client';
export { notionConfig, getDatabaseIds, setDatabaseIds, getDataSourceIds } from './config';
export type { NotionConfig, NotionDatabaseIds, NotionDataSourceIds } from './config';

export {
  createDatabase,
  getDatabase,
  updateDatabase,
  getDataSource,
  updateDataSourceProperties,
  queryDatabase,
  queryAllPages,
  getDataSourceId,
} from './databases';
export type { QueryOptions } from './databases';

export {
  createPage,
  getPage,
  updatePage,
  archivePage,
  restorePage,
  getPageBlocks,
  appendBlocks,
} from './pages';

export {
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
  readDateEnd,
  readCheckbox,
  readUrl,
  readRelation,
  readFormula,
  readCreatedTime,
  readLastEditedTime,
  equalsFilter,
  containsFilter,
  titleContainsFilter,
  relationFilter,
  dateAfterFilter,
  dateBeforeFilter,
  checkboxFilter,
  selectEqualsFilter,
  multiSelectContainsFilter,
  numberGreaterThanFilter,
} from './properties';

export {
  NotionConfigError,
  NotionConnectionError,
  NotionNotFoundError,
  NotionRateLimitError,
  NotionValidationError,
  toSafeError,
  withRetry,
} from './errors';

export { ALL_SCHEMAS } from './schemas';
export type { DatabaseSchema, DatabaseName } from './schemas';

export { setupAllDatabases } from './setup';
export type { SetupResult } from './setup';

export type * from './types';

