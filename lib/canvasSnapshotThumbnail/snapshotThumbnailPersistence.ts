import type { SupabaseClient } from "@supabase/supabase-js";
import { ASSET_STORAGE_BUCKET } from "@/lib/storageBuckets";
import type { Database } from "@/lib/supabase/database.types";

type Supabase = SupabaseClient<Database>;

export interface CanvasSnapshotThumbnail {
  canvasId: string;
  storagePath: string;
  capturedAt: string;
}

/**
 * Signed URLs live a day; each is reused (memory + localStorage, keyed by the
 * immutable storage path) until close to expiry, so Home hits the browser's
 * HTTP cache instead of re-downloading every thumbnail on each visit.
 */
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;
const SIGNED_URL_REUSE_MS = (SIGNED_URL_TTL_SECONDS - 60 * 60) * 1000;
const SIGNED_URL_STORAGE_KEY = "flowstate:canvas-thumbnail-urls";
/** PostgREST puts `.in()` ids in the URL — keep each request well under limits. */
const ID_CHUNK = 100;

/** Cached after the first response — avoids repeated errors pre-migration. */
let tableAvailable: boolean | undefined;

function isMissingTable(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (error.message ?? "").includes("canvas_thumbnails")
  );
}

export async function fetchCanvasSnapshotThumbnails(
  supabase: Supabase,
  canvasIds: string[],
): Promise<Record<string, CanvasSnapshotThumbnail>> {
  const out: Record<string, CanvasSnapshotThumbnail> = {};
  if (tableAvailable === false || canvasIds.length === 0) return out;

  for (let i = 0; i < canvasIds.length; i += ID_CHUNK) {
    const { data, error } = await supabase
      .from("canvas_thumbnails")
      .select("canvas_id, storage_path, captured_at")
      .in("canvas_id", canvasIds.slice(i, i + ID_CHUNK));
    if (error) {
      if (isMissingTable(error)) {
        tableAvailable = false;
        return out;
      }
      throw error;
    }
    tableAvailable = true;
    for (const row of data ?? []) {
      out[row.canvas_id] = {
        canvasId: row.canvas_id,
        storagePath: row.storage_path,
        capturedAt: row.captured_at,
      };
    }
  }
  return out;
}

type SignedUrlEntry = { url: string; signedAt: number };
let signedUrlCache: Map<string, SignedUrlEntry> | null = null;

function loadSignedUrlCache(): Map<string, SignedUrlEntry> {
  if (signedUrlCache) return signedUrlCache;
  signedUrlCache = new Map();
  try {
    const raw = window.localStorage.getItem(SIGNED_URL_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, SignedUrlEntry>) : {};
    const now = Date.now();
    for (const [path, entry] of Object.entries(parsed)) {
      if (entry?.url && now - entry.signedAt < SIGNED_URL_REUSE_MS) {
        signedUrlCache.set(path, entry);
      }
    }
  } catch {
    // Blocked storage — the in-memory cache still works for this session.
  }
  return signedUrlCache;
}

function persistSignedUrlCache(cache: Map<string, SignedUrlEntry>) {
  try {
    window.localStorage.setItem(
      SIGNED_URL_STORAGE_KEY,
      JSON.stringify(Object.fromEntries(cache)),
    );
  } catch {
    // Best effort.
  }
}

/** Signed URLs for thumbnail storage paths, keyed by path. */
export async function signCanvasThumbnailPaths(
  supabase: Supabase,
  paths: string[],
): Promise<Record<string, string>> {
  const cache = loadSignedUrlCache();
  const now = Date.now();
  const out: Record<string, string> = {};
  const missing: string[] = [];
  for (const path of paths) {
    const hit = cache.get(path);
    if (hit && now - hit.signedAt < SIGNED_URL_REUSE_MS) out[path] = hit.url;
    else missing.push(path);
  }
  if (missing.length === 0) return out;

  const { data, error } = await supabase.storage
    .from(ASSET_STORAGE_BUCKET)
    .createSignedUrls(missing, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;

  // Replaced paths aren't pruned here (a single-path call would evict every
  // other entry); loadSignedUrlCache drops anything past its reuse window.
  for (const item of data ?? []) {
    if (!item.path || !item.signedUrl || item.error) continue;
    out[item.path] = item.signedUrl;
    cache.set(item.path, { url: item.signedUrl, signedAt: now });
  }
  persistSignedUrlCache(cache);
  return out;
}

/**
 * Upload a fresh capture and point the canvas at it. Each capture gets a new
 * immutable path (the asset bucket has no UPDATE policy, so no upsert — and a
 * new path doubles as the cache key), then the previous file is removed.
 * The path's first segment is the CAPTURER's id, as the bucket's insert
 * policy requires, so editors on a shared canvas can refresh it too.
 */
export async function saveCanvasSnapshotThumbnail(
  supabase: Supabase,
  {
    userId,
    canvasId,
    blob,
    previousPath,
  }: {
    userId: string;
    canvasId: string;
    blob: Blob;
    previousPath?: string | null;
  },
): Promise<CanvasSnapshotThumbnail | null> {
  if (tableAvailable === false) return null;

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const storagePath = `${userId}/${canvasId}/canvas-thumbnail-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(ASSET_STORAGE_BUCKET)
    .upload(storagePath, blob, {
      contentType: blob.type,
      cacheControl: "31536000",
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const capturedAt = new Date().toISOString();
  const { error: rowError } = await supabase.from("canvas_thumbnails").upsert(
    {
      canvas_id: canvasId,
      storage_path: storagePath,
      captured_at: capturedAt,
      captured_by: userId,
    },
    { onConflict: "canvas_id" },
  );
  if (rowError) {
    await supabase.storage.from(ASSET_STORAGE_BUCKET).remove([storagePath]);
    if (isMissingTable(rowError)) {
      tableAvailable = false;
      return null;
    }
    throw rowError;
  }
  tableAvailable = true;

  if (previousPath && previousPath !== storagePath) {
    void supabase.storage.from(ASSET_STORAGE_BUCKET).remove([previousPath]);
  }
  return { canvasId, storagePath, capturedAt };
}

/** Forget a canvas's thumbnail (e.g. everything on it was deleted). */
export async function clearCanvasSnapshotThumbnail(
  supabase: Supabase,
  thumbnail: CanvasSnapshotThumbnail,
): Promise<void> {
  if (tableAvailable === false) return;
  const { error } = await supabase
    .from("canvas_thumbnails")
    .delete()
    .eq("canvas_id", thumbnail.canvasId);
  if (error) {
    if (isMissingTable(error)) tableAvailable = false;
    return;
  }
  void supabase.storage
    .from(ASSET_STORAGE_BUCKET)
    .remove([thumbnail.storagePath]);
}
