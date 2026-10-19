"use client";

import { type RefObject, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  canvasHasThumbnailContent,
  captureCanvasThumbnail,
  ThumbnailCaptureAborted,
} from "@/lib/canvasSnapshotThumbnail/captureCanvasThumbnail";
import {
  type CanvasSnapshotThumbnail,
  clearCanvasSnapshotThumbnail,
  fetchCanvasSnapshotThumbnails,
  saveCanvasSnapshotThumbnail,
} from "@/lib/canvasSnapshotThumbnail/snapshotThumbnailPersistence";
import { emitCanvasSnapshotThumbnailChanged } from "@/lib/canvasSnapshotThumbnail/thumbnailEvents";
import { isEphemeralFixtureSessionActive } from "@/lib/ephemeralCanvasSessions";
import { useCanvasStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

/** Quiet period (no input, no content change) before a capture starts. */
const IDLE_MS = 4000;
/**
 * A capture costs ~1–2s of main-thread work on a large canvas, so while the
 * user keeps editing, refresh at most this often. The thumbnail only has to
 * be right when they next look at Home.
 */
const MIN_INTERVAL_MS = 60_000;

type StoreState = ReturnType<typeof useCanvasStore.getState>;

/** Anything that changes what the thumbnail would look like. */
function thumbnailInputsChanged(state: StoreState, prev: StoreState): boolean {
  return (
    state.cards !== prev.cards ||
    state.cardOrder !== prev.cardOrder ||
    state.connections !== prev.connections ||
    state.threads !== prev.threads ||
    state.groups !== prev.groups ||
    state.collapsedCardIds !== prev.collapsedCardIds ||
    state.sessionArtifacts !== prev.sessionArtifacts ||
    state.canvasArtifactNodes !== prev.canvasArtifactNodes ||
    state.canvasArtifactOrder !== prev.canvasArtifactOrder ||
    state.canvasAssets !== prev.canvasAssets ||
    state.canvasAssetNodes !== prev.canvasAssetNodes ||
    state.canvasAssetOrder !== prev.canvasAssetOrder ||
    state.canvasGifNodes !== prev.canvasGifNodes ||
    state.canvasGifOrder !== prev.canvasGifOrder ||
    state.canvas3DNodes !== prev.canvas3DNodes ||
    state.canvas3DOrder !== prev.canvas3DOrder ||
    state.canvasSkillNodes !== prev.canvasSkillNodes ||
    state.canvasSkillOrder !== prev.canvasSkillOrder ||
    state.canvasTextLabels !== prev.canvasTextLabels ||
    state.canvasTextLabelOrder !== prev.canvasTextLabelOrder ||
    state.canvasStrokes !== prev.canvasStrokes ||
    state.canvasStrokeOrder !== prev.canvasStrokeOrder ||
    state.canvasTheme !== prev.canvasTheme ||
    state.canvasBackgroundStyle !== prev.canvasBackgroundStyle ||
    state.canvasBackgroundImageId !== prev.canvasBackgroundImageId ||
    state.canvasArtifactStyle !== prev.canvasArtifactStyle ||
    state.connectorStyle !== prev.connectorStyle
  );
}

/**
 * Keeps the open canvas's Home thumbnail current: a fit-to-content render in
 * its own theme, captured once the canvas has sat idle after a change (or on
 * first open when it has no thumbnail yet — which backfills existing canvases
 * as they are visited). Any input aborts a capture that hasn't started
 * rendering, so it never competes with the user.
 */
export function useCanvasSnapshotThumbnailCapture(
  containerRef: RefObject<HTMLDivElement | null>,
): void {
  const {
    user,
    activeCanvasId,
    canvases,
    isSwitchingCanvas,
    localReadOnly,
    persistenceStatus,
  } = useAuth();
  const viewMode = useCanvasStore((s) => s.viewMode);
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);

  // Read through a ref: the list re-renders on every save (recency bump), and
  // the effect must not restart — that would cancel a pending capture.
  const contentEditedAtRef = useRef<string | undefined>(undefined);
  contentEditedAtRef.current = canvases.find(
    (c) => c.id === activeCanvasId,
  )?.contentEditedAt;

  const userId = user?.id ?? null;
  const enabled =
    !!userId &&
    !!activeCanvasId &&
    !isSwitchingCanvas &&
    !localReadOnly &&
    !canvasReadOnly &&
    persistenceStatus === "ready" &&
    viewMode === "canvas";

  useEffect(() => {
    if (!enabled || !userId || !activeCanvasId) return;
    const canvasId = activeCanvasId;
    const supabase = createClient();

    let disposed = false;
    let dirty = false;
    let running = false;
    let lastCaptureAt = 0;
    /** undefined until the current row has been read. */
    let known: CanvasSnapshotThumbnail | null | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let abort: AbortController | null = null;

    const schedule = () => {
      clearTimeout(timer);
      if (disposed || !dirty || known === undefined) return;
      const wait = Math.max(IDLE_MS, lastCaptureAt + MIN_INTERVAL_MS - Date.now());
      timer = setTimeout(() => void run(), wait);
    };

    const run = async () => {
      if (disposed || running || !dirty) return;
      if (document.visibilityState !== "visible") return; // resumes on visibilitychange
      if (
        isEphemeralFixtureSessionActive() ||
        useCanvasStore.getState().canvasReadOnly
      ) {
        return;
      }
      const container = containerRef.current;
      if (!container) {
        schedule();
        return;
      }

      running = true;
      dirty = false;
      abort = new AbortController();
      const signal = abort.signal;
      try {
        if (!canvasHasThumbnailContent(useCanvasStore.getState())) {
          // Emptied canvas: drop the stale picture, Home falls back to the
          // placeholder.
          if (known) {
            await clearCanvasSnapshotThumbnail(supabase, known);
            known = null;
            emitCanvasSnapshotThumbnailChanged(canvasId, null);
          }
          return;
        }

        const blob = await captureCanvasThumbnail({ container, signal });
        // Torn down mid-render (canvas switched / went Home): the clone may
        // have read a detached or different DOM — don't keep it.
        if (!blob || disposed) return;
        lastCaptureAt = Date.now();

        // The upload outlives the canvas on purpose: going Home right after
        // an edit should still land the fresh image.
        const saved = await saveCanvasSnapshotThumbnail(supabase, {
          userId,
          canvasId,
          blob,
          previousPath: known?.storagePath,
        });
        if (saved) {
          known = saved;
          emitCanvasSnapshotThumbnailChanged(canvasId, saved);
        }
      } catch (error) {
        if (error instanceof ThumbnailCaptureAborted) {
          dirty = true;
        } else {
          console.warn("[canvas-thumbnail] capture failed", error);
        }
      } finally {
        running = false;
        abort = null;
        if (dirty) schedule();
      }
    };

    const markDirty = () => {
      dirty = true;
      schedule();
    };

    // Input restarts the idle wait and aborts a capture still settling.
    const onActivity = () => {
      abort?.abort();
      schedule();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") schedule();
    };

    const unsubscribe = useCanvasStore.subscribe((state, prev) => {
      if (thumbnailInputsChanged(state, prev)) markDirty();
    });
    const activityOpts = { capture: true, passive: true } as const;
    window.addEventListener("pointerdown", onActivity, activityOpts);
    window.addEventListener("wheel", onActivity, activityOpts);
    window.addEventListener("keydown", onActivity, activityOpts);
    document.addEventListener("visibilitychange", onVisibility);

    void (async () => {
      try {
        const rows = await fetchCanvasSnapshotThumbnails(supabase, [canvasId]);
        if (disposed) return;
        known = rows[canvasId] ?? null;
        const editedAt = contentEditedAtRef.current;
        if (
          !known ||
          (editedAt && Date.parse(editedAt) > Date.parse(known.capturedAt))
        ) {
          dirty = true;
        }
        schedule();
      } catch (error) {
        console.warn("[canvas-thumbnail] could not read thumbnail state", error);
      }
    })();

    return () => {
      disposed = true;
      clearTimeout(timer);
      abort?.abort();
      unsubscribe();
      window.removeEventListener("pointerdown", onActivity, activityOpts);
      window.removeEventListener("wheel", onActivity, activityOpts);
      window.removeEventListener("keydown", onActivity, activityOpts);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, userId, activeCanvasId, containerRef]);
}
