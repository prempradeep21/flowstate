"use client";

import { useEffect, useState } from "react";
import {
  fetchCanvasSnapshotThumbnails,
  signCanvasThumbnailPaths,
} from "@/lib/canvasSnapshotThumbnail/snapshotThumbnailPersistence";
import { onCanvasSnapshotThumbnailChanged } from "@/lib/canvasSnapshotThumbnail/thumbnailEvents";
import { createClient } from "@/lib/supabase/client";

/**
 * Signed image URLs for the auto-captured canvas thumbnails, keyed by canvas
 * id (owned and shared alike — RLS returns only rows the viewer can see).
 * Canvases with no capture yet are simply absent; the card shows its
 * placeholder. Captures that land while Home is open swap in live.
 */
export function useCanvasSnapshotThumbnailUrls(
  canvasIds: string[],
  enabled: boolean,
): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});

  // Stable key so the effect only re-runs when the set of ids actually changes.
  const idsKey = [...canvasIds].sort().join(",");

  useEffect(() => {
    if (!enabled || !idsKey) {
      setUrls({});
      return;
    }

    let cancelled = false;
    const ids = idsKey.split(",");
    const supabase = createClient();

    void (async () => {
      try {
        const rows = await fetchCanvasSnapshotThumbnails(supabase, ids);
        const entries = Object.values(rows);
        if (entries.length === 0) {
          if (!cancelled) setUrls({});
          return;
        }
        const signed = await signCanvasThumbnailPaths(
          supabase,
          entries.map((row) => row.storagePath),
        );
        if (cancelled) return;
        const next: Record<string, string> = {};
        for (const row of entries) {
          const url = signed[row.storagePath];
          if (url) next[row.canvasId] = url;
        }
        setUrls(next);
      } catch {
        if (!cancelled) setUrls({});
      }
    })();

    const unsubscribe = onCanvasSnapshotThumbnailChanged((canvasId, thumbnail) => {
      if (!ids.includes(canvasId)) return;
      if (!thumbnail) {
        setUrls((prev) => {
          const { [canvasId]: _removed, ...rest } = prev;
          return rest;
        });
        return;
      }
      void signCanvasThumbnailPaths(supabase, [thumbnail.storagePath])
        .then((signed) => {
          const url = signed[thumbnail.storagePath];
          if (url && !cancelled) {
            setUrls((prev) => ({ ...prev, [canvasId]: url }));
          }
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [enabled, idsKey]);

  return urls;
}
