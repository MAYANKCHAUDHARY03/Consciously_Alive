/**
 * SWR hook for OIR Analytics data.
 * Fetches from /api/notion/analytics/oir with configurable range.
 */

import useSWR from 'swr';
import type { OirAnalyticsPayload, AnalyticsRange } from '@/lib/notion/oirAnalytics';

import { fetcher } from './fetcher';

export function useOirAnalytics(range: AnalyticsRange = '12w') {
  const key = `/api/notion/analytics/oir?range=${range}`;

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: OirAnalyticsPayload;
  }>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // 30s dedup — analytics data doesn't change rapidly
  });

  return {
    analytics: data?.data ?? null,
    error,
    isLoading,
    mutate,
  };
}
