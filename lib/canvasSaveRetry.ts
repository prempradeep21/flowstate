/** Helpers for resilient canvas persistence to Supabase. */

export const SAVE_PAYLOAD_WARN_BYTES = 900_000;

const SAVE_RETRY_ATTEMPTS = 3;
const SAVE_RETRY_BASE_MS = 400;

export function formatPersistenceError(error: unknown): string {
  if (!error || typeof error !== "object") return String(error);
  const e = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
    status?: number;
  };
  return [
    e.message,
    e.code ? `code=${e.code}` : null,
    e.status ? `status=${e.status}` : null,
    e.details,
    e.hint,
  ]
    .filter(Boolean)
    .join(" | ");
}

export function isStatementTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  if (e.code === "57014") return true;
  const msg = (e.message ?? "").toLowerCase();
  return (
    msg.includes("statement timeout") ||
    msg.includes("canceling statement due to statement timeout")
  );
}

export function isRetryableSaveError(error: unknown): boolean {
  if (isStatementTimeoutError(error)) return false;
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string; status?: number };
  if (e.status && [408, 429, 500, 502, 503, 504].includes(e.status)) {
    return true;
  }
  const msg = (e.message ?? "").toLowerCase();
  return (
    msg.includes("timeout") ||
    msg.includes("network") ||
    msg.includes("fetch failed") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504") ||
    msg.includes("connection")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Runs an async save with exponential backoff on transient failures. */
export async function withSaveRetry<T>(
  operation: () => Promise<T>,
  options: { attempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const attempts = options.attempts ?? SAVE_RETRY_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? SAVE_RETRY_BASE_MS;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (attempt < attempts - 1 && isRetryableSaveError(err)) {
        await sleep(baseDelayMs * (attempt + 1));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}
