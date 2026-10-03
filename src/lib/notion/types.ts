/**
 * Application-level types for the General Awareness system.
 * These are the clean types used throughout the app —
 * mapping to/from Notion properties happens in the helpers.
 */

// ─── Common ───────────────────────────────────────────────────

export type Priority = 'High' | 'Medium' | 'Low';
export type Status = 'Active' | 'Archived' | 'Draft';
export type RevisionStatus = 'Unread' | 'Reading' | 'Reviewed' | 'Revised';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: Status;
  saved?: boolean;
}

// ─── Weekly Record ────────────────────────────────────────────

export interface WeeklyRecord extends BaseRecord {
  title: string;          // "Week 01 — 5 Oct to 11 Oct 2026"
  weekNumber: number;
  startDate: string;      // ISO date
  endDate: string;        // ISO date
  takeaways: string;
  // Relation counts (computed)
  gaCount?: number;
  defenceCount?: number;
  caCount?: number;
  editorialCount?: number;
  vocabCount?: number;
  oirCount?: number;
  resourceCount?: number;
}

// ─── General Awareness ───────────────────────────────────────

export interface GeneralAwareness extends BaseRecord {
  title: string;
  content: string;
  category: string;
  topic: string;
  source: string;
  priority: Priority;
  revision: RevisionStatus;
  weekId: string;         // relation to Weekly
  tags: string[];
}

// ─── Defence Updates ──────────────────────────────────────────

export interface DefenceUpdate extends BaseRecord {
  title: string;
  content: string;
  category: string;       // e.g., Army, Navy, Air Force, DRDO, Joint, International
  topic: string;
  source: string;
  priority: Priority;
  revision: RevisionStatus;
  weekId: string;
  tags: string[];
}

// ─── Current Affairs ──────────────────────────────────────────

export interface CurrentAffair extends BaseRecord {
  title: string;
  content: string;
  category: string;       // e.g., National, International, Economy, Science, Sports
  topic: string;
  date: string;            // ISO date
  source: string;
  priority: Priority;
  revision: RevisionStatus;
  weekId: string;
  tags: string[];
}

// ─── Editorials ───────────────────────────────────────────────

export interface Editorial extends BaseRecord {
  title: string;
  summary: string;
  keyPoints: string;
  source: string;         // e.g., The Hindu, Indian Express
  url: string;
  date: string;
  topic: string;
  priority: Priority;
  revision: RevisionStatus;
  weekId: string;
  tags: string[];
}

// ─── Vocabulary ───────────────────────────────────────────────

export interface VocabularyWord extends BaseRecord {
  word: string;
  meaning: string;
  usage: string;
  synonyms: string;
  source: string;
  difficulty: Difficulty;
  revision: RevisionStatus;
  weekId: string;
  tags: string[];
}

// ─── OIR Set ──────────────────────────────────────────────────

export interface OIRSet extends BaseRecord {
  title: string;
  topic: string;           // e.g., Verbal, Non-verbal, Numerical, Spatial
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;         // calculated: correct / total * 100
  timeTaken: number;        // minutes
  difficulty: Difficulty;
  notes: string;
  revision: RevisionStatus;
  weekId: string;
}

// ─── Resources ────────────────────────────────────────────────

export interface Resource extends BaseRecord {
  title: string;
  url: string;
  type: string;            // e.g., Article, Video, PDF, Book, Website
  category: string;
  description: string;
  priority: Priority;
  revision: RevisionStatus;
  weekId: string;
  tags: string[];
}

// ─── Dashboard Stats ─────────────────────────────────────────

export interface WeeklyStats {
  currentAffairs: number;
  defenceUpdates: number;
  generalAwareness: number;
  editorials: number;
  vocabulary: number;
  oirSets: number;
  resources: number;
  averageOIRScore: number;
  averageAccuracy: number;
}

// ─── API Response Types ──────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  hasMore: boolean;
  nextCursor?: string;
  total?: number;
}

// ─── Create/Update DTOs ──────────────────────────────────────

export type CreateWeeklyRecord = Omit<WeeklyRecord, 'id' | 'createdAt' | 'updatedAt' | 'gaCount' | 'defenceCount' | 'caCount' | 'editorialCount' | 'vocabCount' | 'oirCount' | 'resourceCount'>;
export type UpdateWeeklyRecord = Partial<CreateWeeklyRecord>;

export type CreateGeneralAwareness = Omit<GeneralAwareness, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateGeneralAwareness = Partial<CreateGeneralAwareness>;

export type CreateDefenceUpdate = Omit<DefenceUpdate, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateDefenceUpdate = Partial<CreateDefenceUpdate>;

export type CreateCurrentAffair = Omit<CurrentAffair, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCurrentAffair = Partial<CreateCurrentAffair>;

export type CreateEditorial = Omit<Editorial, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEditorial = Partial<CreateEditorial>;

export type CreateVocabularyWord = Omit<VocabularyWord, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateVocabularyWord = Partial<CreateVocabularyWord>;

export type CreateOIRSet = Omit<OIRSet, 'id' | 'createdAt' | 'updatedAt' | 'accuracy'>;
export type UpdateOIRSet = Partial<CreateOIRSet>;

export type CreateResource = Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateResource = Partial<CreateResource>;
