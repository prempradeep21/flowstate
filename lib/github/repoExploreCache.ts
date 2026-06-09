import type { RepoExplorerData } from "@/lib/github/types";

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  expiresAt: number;
  data?: RepoExplorerData;
  error?: { message: string; status: number };
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<RepoExplorerData>>();

function cacheKey(url: string): string {
  return url.trim().toLowerCase().replace(/\/+$/, "");
}

export function peekRepoExploreCache(url: string): RepoExplorerData | null {
  const hit = cache.get(cacheKey(url));
  if (!hit || hit.expiresAt < Date.now() || !hit.data) return null;
  return hit.data;
}

/** One explore fetch per URL per minute — avoids rate-limit storms from duplicate artifacts. */
export async function fetchRepoExploreCached(
  url: string,
  fetcher: () => Promise<RepoExplorerData>,
): Promise<RepoExplorerData> {
  const key = cacheKey(url);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now && hit.data) return hit.data;

  const pending = inflight.get(key);
  if (pending) return pending;

  const task = fetcher()
    .then((data) => {
      cache.set(key, { expiresAt: now + CACHE_TTL_MS, data });
      inflight.delete(key);
      return data;
    })
    .catch((err: unknown) => {
      inflight.delete(key);
      const message = err instanceof Error ? err.message : "Explore failed";
      const status =
        err && typeof err === "object" && "status" in err
          ? Number((err as { status: number }).status)
          : 500;
      cache.set(key, {
        expiresAt: now + 10_000,
        error: { message, status },
      });
      throw err;
    });

  inflight.set(key, task);
  return task;
}
