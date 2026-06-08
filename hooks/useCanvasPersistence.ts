"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  classifyCanvasPersistChange,
  pickCanvasPersistSlice,
} from "@/lib/canvasPersistDirty";
import {
  createCanvas,
  createDefaultCanvas,
  fetchCanvasById,
  fetchCanvasList,
  fetchUserPreferences,
  generateUntitledCanvasTitle,
  resolveInitialCanvasId,
  saveCanvasState,
  sortCanvasesByContentEditedAt,
  updateCanvasTitle,
  updateLastActiveCanvas,
  type CanvasMeta,
  type CanvasRow,
} from "@/lib/canvasPersistence";
import {
  formatPersistenceError,
  isStatementTimeoutError,
  SAVE_PAYLOAD_WARN_BYTES,
  withSaveRetry,
} from "@/lib/canvasSaveRetry";
import { fetchSharedCanvasList } from "@/lib/collaborationPersistence";
import {
  markViewportRestoredFromSnapshot,
  resetViewportBootstrap,
} from "@/lib/canvasViewportBootstrap";
import type { Viewport } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { useCanvasStore } from "@/lib/store";
import type { PersistenceStatus, SaveStatus } from "@/lib/authTypes";

const SAVE_DEBOUNCE_MS = 800;
/** Persist viewport after pan/zoom settles so switch-time flush is lighter. */
const VIEWPORT_SAVE_DEBOUNCE_MS = 2000;
/** Max wait for pre-switch save; avoids hanging on large payloads / DB timeouts. */
const FLUSH_SAVE_DEADLINE_MS = 4_000;

function hasMeaningfulSavedViewport(viewport: Viewport): boolean {
  return viewport.x !== 0 || viewport.y !== 0 || viewport.scale !== 1;
}

interface UseCanvasPersistenceOptions {
  user: User | null;
  supabaseConfigured: boolean;
  persistenceStatus: PersistenceStatus;
  setPersistenceStatus: (status: PersistenceStatus) => void;
  setSaveStatus: (status: SaveStatus) => void;
  isRemoteUpdateRef?: React.MutableRefObject<boolean>;
}

export function useCanvasPersistence({
  user,
  supabaseConfigured,
  persistenceStatus,
  setPersistenceStatus,
  setSaveStatus,
  isRemoteUpdateRef,
}: UseCanvasPersistenceOptions) {
  const canvasIdRef = useRef<string | null>(null);
  /** Bumps on user change / effect cleanup so stale in-flight loads cannot hydrate. */
  const loadGenerationRef = useRef(0);
  const isHydratingRef = useRef(false);
  const isSwitchingRef = useRef(false);
  const isDirtyRef = useRef(false);
  const contentEditDirtyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewportSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const saveInFlightRef = useRef<Promise<void> | null>(null);
  /** Pause viewport-only auto-save after DB statement timeout (large payload). */
  const viewportSaveBlockedUntilRef = useRef(0);

  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);
  const [canvases, setCanvases] = useState<CanvasMeta[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchingCanvasId, setSwitchingCanvasId] = useState<string | null>(
    null,
  );
  const [switchingCanvasTitle, setSwitchingCanvasTitle] = useState<
    string | null
  >(null);

  const hydrateFromSnapshot = useCanvasStore((s) => s.hydrateFromSnapshot);
  const getSnapshotSource = useCanvasStore((s) => s.getCanvasSnapshotSource);
  const resetCanvasState = useCanvasStore((s) => s.resetCanvasState);
  const closeArtifact = useCanvasStore((s) => s.closeArtifact);

  const bumpCanvasInList = useCallback(
    (canvasId: string, patch?: Partial<CanvasMeta>) => {
      const now = new Date().toISOString();
      setCanvases((prev) =>
        sortCanvasesByContentEditedAt(
          prev.map((c) =>
            c.id === canvasId
              ? {
                  ...c,
                  ...patch,
                  contentEditedAt: now,
                }
              : c,
          ),
        ),
      );
    },
    [],
  );

  const executeSave = useCallback(
    async (
      targetCanvasId: string,
      snapshotSource: ReturnType<typeof getSnapshotSource>,
      touchContentEditedAt: boolean,
    ) => {
      const payloadBytes = JSON.stringify(snapshotSource).length;

      setSaveStatus("saving");
      try {
        const supabase = createClient();
        await withSaveRetry(() =>
          saveCanvasState(supabase, targetCanvasId, snapshotSource, {
            touchContentEditedAt,
          }),
        );

        if (canvasIdRef.current === targetCanvasId) {
          isDirtyRef.current = false;
          contentEditDirtyRef.current = false;
          setSaveStatus("saved");
        }

        if (touchContentEditedAt) {
          bumpCanvasInList(targetCanvasId);
        }
      } catch (err) {
        console.warn("[canvas] save failed:", formatPersistenceError(err), {
          payloadBytes,
          canvasId: targetCanvasId,
          touchContentEditedAt,
          ...(payloadBytes >= SAVE_PAYLOAD_WARN_BYTES
            ? {
                hint: "Payload may exceed Supabase row limits — consider splitting artifacts",
              }
            : {}),
        });
        if (canvasIdRef.current === targetCanvasId) {
          setSaveStatus("error");
        }
        if (!touchContentEditedAt && isStatementTimeoutError(err)) {
          // Avoid hammering Postgres with repeated full-state writes after timeout.
          viewportSaveBlockedUntilRef.current = Date.now() + 60_000;
        }
        throw err;
      }
    },
    [bumpCanvasInList, setSaveStatus],
  );

  const performSave = useCallback(async () => {
    if (!user || !supabaseConfigured) return;

    if (useCanvasStore.getState().canvasReadOnly) {
      return;
    }

    if (!isDirtyRef.current) {
      setSaveStatus("saved");
      return;
    }

    if (saveInFlightRef.current) {
      await saveInFlightRef.current;
      if (!isDirtyRef.current) {
        setSaveStatus("saved");
        return;
      }
    }

    const targetCanvasId = canvasIdRef.current;
    if (!targetCanvasId) return;

    const touchContentEditedAt = contentEditDirtyRef.current;
    const snapshotSource = getSnapshotSource();

    const savePromise = executeSave(
      targetCanvasId,
      snapshotSource,
      touchContentEditedAt,
    );

    saveInFlightRef.current = savePromise;
    try {
      await savePromise;
    } finally {
      if (saveInFlightRef.current === savePromise) {
        saveInFlightRef.current = null;
      }
    }
  }, [executeSave, getSnapshotSource, setSaveStatus, supabaseConfigured, user]);

  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (viewportSaveTimerRef.current) {
      clearTimeout(viewportSaveTimerRef.current);
      viewportSaveTimerRef.current = null;
    }
    await performSave();
  }, [performSave]);

  /** Flush dirty state; content edits always complete before switch, viewport may use a deadline. */
  const flushSaveWithDeadline = useCallback(
    async (deadlineMs = FLUSH_SAVE_DEADLINE_MS) => {
      if (!isDirtyRef.current) return;

      if (Date.now() < viewportSaveBlockedUntilRef.current) {
        void flushSave().catch(() => setSaveStatus("error"));
        return;
      }

      if (contentEditDirtyRef.current) {
        const leavingCanvasId = canvasIdRef.current;
        if (!leavingCanvasId) return;

        const snapshotSource = getSnapshotSource();
        const touchContentEditedAt = contentEditDirtyRef.current;
        try {
          await executeSave(
            leavingCanvasId,
            snapshotSource,
            touchContentEditedAt,
          );
        } catch {
          setSaveStatus("error");
        }
        return;
      }

      const savePromise = flushSave().catch(() => setSaveStatus("error"));
      let timer: ReturnType<typeof setTimeout> | undefined;
      await Promise.race([
        savePromise,
        new Promise<void>((resolve) => {
          timer = setTimeout(resolve, deadlineMs);
        }),
      ]);
      if (timer) clearTimeout(timer);
      void savePromise;
    },
    [executeSave, flushSave, getSnapshotSource, setSaveStatus],
  );

  const isStaleLoad = useCallback((generation: number) => {
    return generation !== loadGenerationRef.current;
  }, []);

  const applyCanvasRow = useCallback(
    async (
      row: CanvasRow,
      userId: string,
      options?: { awaitLastActive?: boolean; generation?: number },
    ) => {
      const generation = options?.generation ?? loadGenerationRef.current;
      if (isStaleLoad(generation)) return;

      isHydratingRef.current = true;
      resetViewportBootstrap();
      closeArtifact();
      if (isStaleLoad(generation)) {
        isHydratingRef.current = false;
        return;
      }
      hydrateFromSnapshot(row.state, {
        applyViewport: true,
        canvasReveal: true,
      });
      if (hasMeaningfulSavedViewport(row.state.viewport)) {
        markViewportRestoredFromSnapshot();
      }
      canvasIdRef.current = row.id;
      setActiveCanvasId(row.id);
      isDirtyRef.current = false;
      contentEditDirtyRef.current = false;

      const supabase = createClient();
      const lastActive = updateLastActiveCanvas(supabase, userId, row.id);
      if (options?.awaitLastActive === false) {
        void lastActive.catch(() => {});
      } else {
        await lastActive;
      }

      if (!isStaleLoad(generation)) {
        isHydratingRef.current = false;
      }
    },
    [closeArtifact, hydrateFromSnapshot, isStaleLoad],
  );

  const loadCanvasRow = useCallback(
    async (
      canvasId: string,
      userId: string,
      generation = loadGenerationRef.current,
    ) => {
      const supabase = createClient();
      const row = await fetchCanvasById(supabase, canvasId);
      if (!row) throw new Error("Canvas not found");
      if (isStaleLoad(generation)) return;
      await applyCanvasRow(row, userId, { generation });
    },
    [applyCanvasRow, isStaleLoad],
  );

  const loadCanvasForUser = useCallback(
    async (nextUser: User, generation = loadGenerationRef.current) => {
      if (!supabaseConfigured) {
        setPersistenceStatus("ready");
        return;
      }

      if (isStaleLoad(generation)) return;

      setPersistenceStatus("loading");
      isHydratingRef.current = true;

      try {
        const supabase = createClient();
        const [list, preferences, shared] = await Promise.all([
          fetchCanvasList(supabase, nextUser.id),
          fetchUserPreferences(supabase, nextUser.id),
          fetchSharedCanvasList(supabase, nextUser.id),
        ]);

        if (isStaleLoad(generation)) return;

        setCanvases(list);

        const allIds = [
          ...list.map((c) => c.id),
          ...shared.map((c) => c.id),
        ];
        let canvasId = resolveInitialCanvasId(list, preferences);
        if (
          canvasId &&
          !allIds.includes(canvasId) &&
          preferences.lastActiveCanvasId
        ) {
          canvasId = allIds.includes(preferences.lastActiveCanvasId)
            ? preferences.lastActiveCanvasId
            : canvasId;
        } else if (!canvasId && preferences.lastActiveCanvasId) {
          canvasId = allIds.includes(preferences.lastActiveCanvasId)
            ? preferences.lastActiveCanvasId
            : null;
        }

        if (canvasId) {
          await loadCanvasRow(canvasId, nextUser.id, generation);
        } else {
          if (isStaleLoad(generation)) return;
          const created = await createDefaultCanvas(
            supabase,
            nextUser.id,
            getSnapshotSource(),
          );
          canvasIdRef.current = created.id;
          setActiveCanvasId(created.id);
          isDirtyRef.current = false;
          contentEditDirtyRef.current = false;
          await updateLastActiveCanvas(supabase, nextUser.id, created.id);
          const refreshed = await fetchCanvasList(supabase, nextUser.id);
          setCanvases(refreshed);
        }

        if (!isStaleLoad(generation)) {
          setSaveStatus("saved");
        }
      } catch {
        if (!isStaleLoad(generation)) {
          setSaveStatus("error");
        }
      } finally {
        if (!isStaleLoad(generation)) {
          isHydratingRef.current = false;
          setPersistenceStatus("ready");
        }
      }
    },
    [
      getSnapshotSource,
      isStaleLoad,
      loadCanvasRow,
      setPersistenceStatus,
      setSaveStatus,
      supabaseConfigured,
    ],
  );

  const switchCanvas = useCallback(
    async (canvasId: string) => {
      if (!user || !supabaseConfigured) return;
      if (canvasIdRef.current === canvasId) return;

      const title =
        canvases.find((c) => c.id === canvasId)?.title ?? "Canvas";
      setSwitchingCanvasId(canvasId);
      setSwitchingCanvasTitle(title);
      isSwitchingRef.current = true;
      setIsSwitching(true);

      try {
        const supabase = createClient();
        const [, row] = await Promise.all([
          flushSaveWithDeadline(),
          fetchCanvasById(supabase, canvasId),
        ]);
        if (!row) throw new Error("Canvas not found");
        await applyCanvasRow(row, user.id, { awaitLastActive: false });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      } finally {
        isSwitchingRef.current = false;
        setIsSwitching(false);
        setSwitchingCanvasId(null);
        setSwitchingCanvasTitle(null);
      }
    },
    [
      applyCanvasRow,
      canvases,
      flushSaveWithDeadline,
      setSaveStatus,
      supabaseConfigured,
      user,
    ],
  );

  const createNewCanvas = useCallback(async () => {
    if (!user || !supabaseConfigured) return null;

    isSwitchingRef.current = true;
    setIsSwitching(true);
    setSwitchingCanvasTitle("New canvas");

    try {
      await flushSaveWithDeadline();

      resetCanvasState();
      resetViewportBootstrap();
      closeArtifact();

      const supabase = createClient();
      const title = generateUntitledCanvasTitle(canvases.map((c) => c.title));
      const created = await createCanvas(supabase, user.id, title);

      canvasIdRef.current = created.id;
      setActiveCanvasId(created.id);
      isDirtyRef.current = false;
      contentEditDirtyRef.current = false;
      await updateLastActiveCanvas(supabase, user.id, created.id);

      const refreshed = await fetchCanvasList(supabase, user.id);
      setCanvases(refreshed);
      setSaveStatus("saved");
      return created.id;
    } catch {
      setSaveStatus("error");
      return null;
    } finally {
      isSwitchingRef.current = false;
      setIsSwitching(false);
      setSwitchingCanvasTitle(null);
    }
  }, [
    canvases,
    closeArtifact,
    flushSaveWithDeadline,
    resetCanvasState,
    setSaveStatus,
    supabaseConfigured,
    user,
  ]);

  const renameCanvas = useCallback(
    async (canvasId: string, title: string) => {
      if (!user || !supabaseConfigured) return;

      const trimmed = title.trim();
      if (!trimmed) return;

      const supabase = createClient();
      await updateCanvasTitle(supabase, canvasId, trimmed);
      setCanvases((prev) =>
        prev.map((c) => (c.id === canvasId ? { ...c, title: trimmed } : c)),
      );
    },
    [supabaseConfigured, user],
  );

  useEffect(() => {
    if (!supabaseConfigured) {
      setPersistenceStatus("ready");
      return;
    }

    if (!user) {
      loadGenerationRef.current += 1;
      canvasIdRef.current = null;
      setActiveCanvasId(null);
      setCanvases([]);
      isDirtyRef.current = false;
      contentEditDirtyRef.current = false;
      resetCanvasState();
      resetViewportBootstrap();
      setPersistenceStatus("ready");
      setSaveStatus("idle");
      return;
    }

    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;
    void loadCanvasForUser(user, generation);

    return () => {
      loadGenerationRef.current += 1;
    };
  }, [
    loadCanvasForUser,
    resetCanvasState,
    setPersistenceStatus,
    setSaveStatus,
    supabaseConfigured,
    user?.id,
  ]);

  useEffect(() => {
    if (
      !supabaseConfigured ||
      !user ||
      persistenceStatus !== "ready" ||
      !canvasIdRef.current
    ) {
      return;
    }

    let prevSlice = pickCanvasPersistSlice(useCanvasStore.getState());

    const scheduleSave = () => {
      if (
        isHydratingRef.current ||
        isSwitchingRef.current ||
        isRemoteUpdateRef?.current ||
        !canvasIdRef.current
      ) {
        return;
      }

      const nextState = useCanvasStore.getState();
      const nextSlice = pickCanvasPersistSlice(nextState);
      const { persist, contentEdit } = classifyCanvasPersistChange(
        prevSlice,
        nextSlice,
      );
      prevSlice = nextSlice;

      if (!persist) return;

      isDirtyRef.current = true;
      if (contentEdit) {
        contentEditDirtyRef.current = true;
      }

      if (contentEdit) {
        if (viewportSaveTimerRef.current) {
          clearTimeout(viewportSaveTimerRef.current);
          viewportSaveTimerRef.current = null;
        }
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          void performSave();
        }, SAVE_DEBOUNCE_MS);
        return;
      }

      // Viewport-only: debounce so pan/zoom doesn't spam saves; still flushed on switch.
      if (Date.now() < viewportSaveBlockedUntilRef.current) {
        return;
      }
      if (viewportSaveTimerRef.current) {
        clearTimeout(viewportSaveTimerRef.current);
      }
      viewportSaveTimerRef.current = setTimeout(() => {
        void performSave();
      }, VIEWPORT_SAVE_DEBOUNCE_MS);
    };

    const unsubscribe = useCanvasStore.subscribe(scheduleSave);

    return () => {
      unsubscribe();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (viewportSaveTimerRef.current) {
        clearTimeout(viewportSaveTimerRef.current);
      }
    };
  }, [isRemoteUpdateRef, performSave, persistenceStatus, supabaseConfigured, user]);

  const refreshOwnedCanvasList = useCallback(async () => {
    if (!user || !supabaseConfigured) return;
    const supabase = createClient();
    const list = await fetchCanvasList(supabase, user.id);
    setCanvases(list);
  }, [supabaseConfigured, user]);

  return {
    loadCanvasForUser,
    loadCanvasRow,
    canvasIdRef,
    isDirtyRef,
    isHydratingRef,
    activeCanvasId,
    canvases,
    setCanvases,
    refreshOwnedCanvasList,
    switchCanvas,
    createNewCanvas,
    renameCanvas,
    flushSave,
    isSwitching,
    switchingCanvasId,
    switchingCanvasTitle,
  };
}
