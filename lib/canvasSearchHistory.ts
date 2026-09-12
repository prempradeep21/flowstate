/**
 * Recent canvas-search queries, kept per canvas so switching canvases switches
 * history. Written only when a query is committed (result picked), never per
 * keystroke.
 */
const HISTORY_PREFIX = "flowstate:canvas-search-history:v1:";

export const MAX_SEARCH_HISTORY = 5;

interface PersistedSearchHistory {
  v: 1;
  queries: string[];
}

function historyKey(canvasId: string): string {
  return `${HISTORY_PREFIX}${canvasId}`;
}

export function readSearchHistory(canvasId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(historyKey(canvasId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<PersistedSearchHistory> | null;
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.queries)) return [];
    return parsed.queries
      .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
      .slice(0, MAX_SEARCH_HISTORY);
  } catch {
    return [];
  }
}

/** Push to the front, case-insensitively deduped, capped at MAX_SEARCH_HISTORY. */
export function pushSearchHistory(canvasId: string, query: string): void {
  if (typeof window === "undefined") return;
  const trimmed = query.trim();
  if (!trimmed) return;
  try {
    const existing = readSearchHistory(canvasId).filter(
      (q) => q.toLowerCase() !== trimmed.toLowerCase(),
    );
    const payload: PersistedSearchHistory = {
      v: 1,
      queries: [trimmed, ...existing].slice(0, MAX_SEARCH_HISTORY),
    };
    window.localStorage.setItem(historyKey(canvasId), JSON.stringify(payload));
  } catch {
    // Storage unavailable (private mode, quota) — history stays session-only.
  }
}

export function clearSearchHistory(canvasId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(historyKey(canvasId));
  } catch {
    // ignore
  }
}
