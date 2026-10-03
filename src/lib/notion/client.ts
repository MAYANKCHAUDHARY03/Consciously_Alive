import { Client } from '@notionhq/client';
import { notionConfig } from './config';

/**
 * Singleton Notion client instance.
 * Server-side only — never import this in client components.
 */
let client: Client | null = null;

export function getNotionClient(): Client {
  if (client) return client;

  const { apiKey } = notionConfig();

  client = new Client({
    auth: apiKey,
    timeoutMs: 30_000,
  });

  return client;
}
