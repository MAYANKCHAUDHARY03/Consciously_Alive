/**
 * Shared fetcher utility for SWR hooks.
 * Parses JSON response and throws an error on non-ok responses.
 */
export const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
};
