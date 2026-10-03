/**
 * SWR hooks and mutation helpers for content CRUD operations.
 * Client-side only — used in React components.
 */

import useSWR, { mutate } from 'swr';
import type { ContentRecord } from '@/lib/notion/content';

import { fetcher } from './fetcher';

// ─── SWR Keys ─────────────────────────────────────────────────

export function contentListKey(section: string, weekId?: string) {
  const base = `/api/notion/content/${section}`;
  return weekId ? `${base}?weekId=${weekId}` : base;
}

export function contentRecordKey(section: string, id: string) {
  return `/api/notion/content/${section}/${id}`;
}

// ─── Hooks ────────────────────────────────────────────────────

export function useContentList(section: string, weekId?: string) {
  const key = contentListKey(section, weekId);
  const { data, error, isLoading, mutate: mutateList } = useSWR<{
    success: boolean;
    data: ContentRecord[];
    hasMore: boolean;
    nextCursor?: string;
  }>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  return {
    items: data?.data ?? [],
    hasMore: data?.hasMore ?? false,
    nextCursor: data?.nextCursor,
    error,
    isLoading,
    mutate: mutateList,
  };
}

export function useContentRecord(section: string, id: string | null) {
  const key = id ? contentRecordKey(section, id) : null;
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: ContentRecord;
  }>(key, fetcher);

  return {
    record: data?.data ?? null,
    error,
    isLoading,
    mutate,
  };
}

export function useSectionSchema(section: string) {
  const { data } = useSWR<{
    success: boolean;
    data: Record<string, unknown>;
  }>(`/api/notion/content/${section}?schema=true`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  return data?.data ?? null;
}

// ─── Mutation Helpers ─────────────────────────────────────────

export async function createContentRecord(
  section: string,
  data: Record<string, unknown>,
): Promise<ContentRecord> {
  const res = await fetch(`/api/notion/content/${section}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw {
      message: json.error || 'Failed to create record',
      details: json.details,
      status: res.status,
    };
  }

  // Invalidate related SWR caches
  await invalidateAfterMutation(section);

  return json.data;
}

export async function updateContentRecord(
  section: string,
  id: string,
  data: Record<string, unknown>,
): Promise<ContentRecord> {
  const res = await fetch(`/api/notion/content/${section}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw {
      message: json.error || 'Failed to update record',
      details: json.details,
      status: res.status,
    };
  }

  // Invalidate related SWR caches
  await invalidateAfterMutation(section);

  return json.data;
}

export async function deleteContentRecord(
  section: string,
  id: string,
): Promise<void> {
  const res = await fetch(`/api/notion/content/${section}/${id}`, {
    method: 'DELETE',
  });

  const json = await res.json();
  if (!res.ok) {
    throw { message: json.error || 'Failed to archive record', status: res.status };
  }

  // Invalidate related SWR caches
  await invalidateAfterMutation(section);
}

// ─── Cache Invalidation ──────────────────────────────────────

async function invalidateAfterMutation(section: string) {
  // Revalidate the content list for this section
  await mutate(
    (key) => typeof key === 'string' && key.startsWith(`/api/notion/content/${section}`),
    undefined,
    { revalidate: true },
  );

  // Revalidate dashboard data
  await mutate(
    (key) => typeof key === 'string' && key.startsWith('/api/notion/dashboard'),
    undefined,
    { revalidate: true },
  );

  // Revalidate weeks data (for counts)
  await mutate(
    (key) => typeof key === 'string' && key.startsWith('/api/notion/weeks'),
    undefined,
    { revalidate: true },
  );
}
