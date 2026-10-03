import useSWR from 'swr';
import { fetcher } from './fetcher';
import { WeeklyRecord } from '../notion/types';

export interface ArchiveWeekItem {
  week: WeeklyRecord;
  summary: {
    total: number;
    covered: number;
    saved: number;
    toRevise: number;
    revised: number;
  };
  coveragePercentage: number;
}

export interface ArchivePayload {
  items: ArchiveWeekItem[];
  hasMore: boolean;
  nextCursor?: string;
}

export function useArchiveWeeks(cursor?: string) {
  const url = cursor 
    ? `/api/notion/weeks/archive?limit=10&cursor=${cursor}`
    : `/api/notion/weeks/archive?limit=10`;
    
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: ArchivePayload }>(
    url,
    fetcher
  );

  return {
    archive: data?.success ? data.data : undefined,
    error,
    isLoading,
    mutate
  };
}
