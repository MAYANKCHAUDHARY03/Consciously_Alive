import useSWR from 'swr';
import { fetcher } from './fetcher';
import { RelatedRecord, TopicContinuity, RevisionPriorityRecord, SynthesisSavedPayload } from '../notion/synthesis';
import { ContentRecord } from '../notion/content';

export function useRelatedIntelligence(section: string, id: string) {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: RelatedRecord[] }>(
    `/api/notion/content/${section}/${id}/related`,
    fetcher
  );

  return {
    related: data?.success ? data.data : undefined,
    isLoading,
    error
  };
}

export function useRecurringTopics() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: TopicContinuity[] }>(
    `/api/notion/topics`,
    fetcher
  );

  return {
    topics: data?.success ? data.data : undefined,
    isLoading,
    error
  };
}

export function useTopicTimeline(topic: string) {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: ContentRecord[] }>(
    topic ? `/api/notion/topics/${encodeURIComponent(topic)}` : null,
    fetcher
  );

  return {
    timeline: data?.success ? data.data : undefined,
    isLoading,
    error
  };
}

export function useRevisionIntelligence() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: RevisionPriorityRecord[] }>(
    `/api/notion/revision/intelligence`,
    fetcher
  );

  return {
    priorities: data?.success ? data.data : undefined,
    isLoading,
    error
  };
}

export function useSavedSynthesis() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: SynthesisSavedPayload }>(
    `/api/notion/saved/synthesis`,
    fetcher
  );

  return {
    synthesis: data?.success ? data.data : undefined,
    isLoading,
    error
  };
}
