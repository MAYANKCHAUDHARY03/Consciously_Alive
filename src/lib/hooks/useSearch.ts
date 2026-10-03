import useSWR from 'swr';
import { SearchResult, SearchParams } from '../notion/search';

import { fetcher } from './fetcher';

export function useSearch(params: SearchParams, shouldFetch = true) {
  // Build query string
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.section && params.section !== 'all') qs.set('section', params.section);
  if (params.weekId && params.weekId !== 'all') qs.set('weekId', params.weekId);
  if (params.topic && params.topic !== 'all') qs.set('topic', params.topic);
  if (params.type && params.type !== 'all') qs.set('type', params.type);
  if (params.includeArchived) qs.set('includeArchived', 'true');
  if (params.saved !== undefined) qs.set('saved', params.saved ? 'true' : 'false');
  if (params.revision && params.revision !== 'all') qs.set('revision', params.revision);
  if (params.limit) qs.set('limit', params.limit.toString());

  const queryUrl = `/api/notion/search?${qs.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<{ results: SearchResult[] }>(
    shouldFetch ? queryUrl : null,
    fetcher
  );

  return {
    results: data?.results || [],
    isLoading,
    isError: !!error,
    error,
    mutate
  };
}
