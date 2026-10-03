/**
 * Centralized error handling for Notion API operations.
 */

import { APIResponseError, isNotionClientError } from '@notionhq/client';

// ─── Error Types ──────────────────────────────────────────────

export class NotionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotionConfigError';
  }
}

export class NotionConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotionConnectionError';
  }
}

export class NotionNotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`);
    this.name = 'NotionNotFoundError';
  }
}

export class NotionRateLimitError extends Error {
  public retryAfterMs: number;
  constructor(retryAfterMs: number) {
    super(`Rate limited by Notion API. Retry after ${retryAfterMs}ms.`);
    this.name = 'NotionRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export class NotionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotionValidationError';
  }
}

// ─── Safe Error Response ──────────────────────────────────────

export interface SafeErrorResponse {
  error: string;
  code: string;
  status: number;
}

/**
 * Converts any Notion-related error into a safe response
 * that never exposes credentials or internal details.
 */
export function toSafeError(err: unknown): SafeErrorResponse {
  // Known Notion SDK errors
  if (err instanceof APIResponseError) {
    const status = err.status;
    const code = err.code;

    if (status === 401) {
      return {
        error: 'Notion authentication failed. Check your API key.',
        code: 'unauthorized',
        status: 401,
      };
    }
    if (status === 403) {
      return {
        error: 'Access denied. Ensure the integration has access to the page.',
        code: 'forbidden',
        status: 403,
      };
    }
    if (status === 404) {
      return {
        error: 'Resource not found in Notion.',
        code: 'not_found',
        status: 404,
      };
    }
    if (status === 429) {
      return {
        error: 'Rate limited by Notion. Please try again shortly.',
        code: 'rate_limited',
        status: 429,
      };
    }
    if (status === 400) {
      return {
        error: `Invalid request: ${sanitizeMessage(err.message)}`,
        code: 'validation_error',
        status: 400,
      };
    }

    return {
      error: `Notion API error: ${sanitizeMessage(err.message)}`,
      code: code || 'notion_error',
      status: status || 500,
    };
  }

  // Our custom errors
  if (err instanceof NotionConfigError) {
    return { error: err.message, code: 'config_error', status: 500 };
  }
  if (err instanceof NotionNotFoundError) {
    return { error: err.message, code: 'not_found', status: 404 };
  }
  if (err instanceof NotionRateLimitError) {
    return { error: err.message, code: 'rate_limited', status: 429 };
  }
  if (err instanceof NotionValidationError) {
    return { error: err.message, code: 'validation_error', status: 400 };
  }

  // Generic Notion client errors
  if (isNotionClientError(err)) {
    return {
      error: 'An error occurred communicating with Notion.',
      code: 'notion_client_error',
      status: 500,
    };
  }

  // Network / unknown errors
  if (err instanceof Error) {
    if (err.message.includes('fetch') || err.message.includes('ECONNREFUSED')) {
      return {
        error: 'Cannot connect to Notion. Check your network connection.',
        code: 'network_error',
        status: 503,
      };
    }
    return {
      error: 'An unexpected error occurred.',
      code: 'internal_error',
      status: 500,
    };
  }

  return {
    error: 'An unexpected error occurred.',
    code: 'internal_error',
    status: 500,
  };
}

// ─── Retry Helper ─────────────────────────────────────────────

/**
 * Retries an async operation with exponential backoff.
 * Handles Notion rate limits automatically.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
  retryServerErrors: boolean = true
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Don't retry config or validation errors
      if (err instanceof NotionConfigError || err instanceof NotionValidationError) {
        throw err;
      }

      // Rate limit — use retry-after if available
      if (err instanceof APIResponseError && err.status === 429) {
        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }
      }

      // Server errors — retry with backoff if allowed
      if (
        retryServerErrors &&
        err instanceof APIResponseError &&
        err.status >= 500 &&
        attempt < maxRetries
      ) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }

      // Non-retryable errors
      throw err;
    }
  }

  throw lastError;
}

// ─── Helpers ──────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Removes any potential credential leaks from error messages.
 */
function sanitizeMessage(message: string): string {
  // Strip anything that looks like a token or secret
  return message
    .replace(/secret_[A-Za-z0-9]+/g, '[REDACTED]')
    .replace(/ntn_[A-Za-z0-9]+/g, '[REDACTED]')
    .replace(/Bearer\s+\S+/g, 'Bearer [REDACTED]');
}
