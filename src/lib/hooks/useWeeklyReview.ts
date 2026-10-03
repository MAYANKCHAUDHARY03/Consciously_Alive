import useSWR from 'swr';
import { fetcher } from './fetcher';
import { WeeklyReviewPayload } from '../notion/weeklyReview';

export function useWeeklyReview(weekId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: WeeklyReviewPayload }>(
    weekId ? `/api/notion/weeks/${weekId}/review` : null,
    fetcher
  );

  return {
    review: data?.success ? data.data : undefined,
    error,
    isLoading,
    mutate
  };
}
