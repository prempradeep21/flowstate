"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { User } from "@supabase/supabase-js";
import {
  createCanvas,
  createDefaultCanvas,
  fetchCanvasById,
  fetchCanvasList,
  fetchUserPreferences,
  generateUntitledCanvasTitle,
  resolveInitialCanvasId,
  saveCanvasState,
  sortCanvasesByUpdatedAt,
  updateCanvasTitle,
  updateLastActiveCanvas,
  type CanvasMeta,
} from "@/lib/canvasPersistence";
import { fetchSharedCanvasList } from "@/lib/collaborationPersistence";
import { resetViewportBootstrap } from "@/lib/canvasViewportBootstrap";
import { createClient } from "@/lib/supabase/client";
import { useCanvasStore } from "@/lib/store";
import type { PersistenceStatus, SaveStatus } from "@/lib/authTypes";

const SAVE_DEBOUNCE_MS = 800;

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
  const isHydratingRef = useRef(false);
  const isSwitchingRef = useRef(false);
  const isDirtyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);
  const [canvases, setCanvases] = useState<CanvasMeta[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);

  const hydrateFromSnapshot = useCanvasStore((s) => s.hydrateFromSnapshot);
  const getSnapshotSource = useCanvasStore((s) => s.getCanvasSnapshotSource);
  const resetCanvasState = useCanvasStore((s) => s.resetCanvasState);
  const closeArtifact = useCanvasStore((s) => s.closeArtifact);

  const bumpCanvasInList = useCallback((canvasId: string, patch?: Partial<CanvasMeta>) => {
    const now = new Date().toISOString();
    setCanvases((prev) =>
      sortCanvasesByUpdatedAt(
        prev.map((c) =>
          c.id === canvasId ? { ...c, ...patch, updatedAt: now } : c,
        ),
      ),
    );
  }, []);

  const performSave = useCallback(async () => {
    const canvasId = canvasIdRef.current;
    if (!canvasId || !user || !supabaseConfigured) return;

    if (useCanvasStore.getState().canvasReadOnly) {
      return;
    }

    if (!isDirtyRef.current) {
      setSaveStatus("saved");
      return;
    }

    setSaveStatus("saving");
    try {
      const supabase = createClient();
      await saveCanvasState(supabase, canvasId, getSnapshotSource());
      isDirtyRef.current = false;
      bumpCanvasInList(canvasId);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, [bumpCanvasInList, getSnapshotSource, setSaveStatus, supabaseConfigured, user]);

  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await performSave();
  }, [performSave]);

  const loadCanvasRow = useCallback(
    async (canvasId: string, userId: string) => {
      const supabase = createClient();
      const row = await fetchCanvasById(supabase, canvasId);
      if (!row) throw new Error("Canvas not found");

      isHydratingRef.current = true;
      resetViewportBootstrap();
      closeArtifact();
      hydrateFromSnapshot(row.state);
      canvasIdRef.current = row.id;
      setActiveCanvasId(row.id);
      isDirtyRef.current = false;
      await updateLastActiveCanvas(supabase, userId, row.id);
      isHydratingRef.current = false;
    },
    [closeArtifact, hydrateFromSnapshot],
  );

  const loadCanvasForUser = useCallback(
    async (nextUser: User) => {
      if (!supabaseConfigured) {
        setPersistenceStatus("ready");
        return;
      }

      setPersistenceStatus("loading");
      isHydratingRef.current = true;

      try {
        const supabase = createClient();
        const [list, preferences, shared] = await Promise.all([
          fetchCanvasList(supabase, nextUser.id),
          fetchUserPreferences(supabase, nextUser.id),
          fetchSharedCanvasList(supabase, nextUser.id),
        ]);

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
          await loadCanvasRow(canvasId, nextUser.id);
        } else {
          const created = await createDefaultCanvas(
            supabase,
            nextUser.id,
            getSnapshotSource(),
          );
          canvasIdRef.current = created.id;
          setActiveCanvasId(created.id);
          isDirtyRef.current = false;
          await updateLastActiveCanvas(supabase, nextUser.id, created.id);
          const refreshed = await fetchCanvasList(supabase, nextUser.id);
          setCanvases(refreshed);
        }

        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      } finally {
        isHydratingRef.current = false;
        setPersistenceStatus("ready");
      }
    },
    [
      getSnapshotSource,
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

      isSwitchingRef.current = true;
      setIsSwitching(true);

      try {
        await flushSave();
        await loadCanvasRow(canvasId, user.id);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      } finally {
        isSwitchingRef.current = false;
        setIsSwitching(false);
      }
    },
    [flushSave, loadCanvasRow, setSaveStatus, supabaseConfigured, user],
  );

  const createNewCanvas = useCallback(async () => {
    if (!user || !supabaseConfigured) return null;

    isSwitchingRef.current = true;
    setIsSwitching(true);

    try {
      await flushSave();
      resetCanvasState();
      resetViewportBootstrap();
      closeArtifact();

      const supabase = createClient();
      const list = await fetchCanvasList(supabase, user.id);
      const title = generateUntitledCanvasTitle(list.map((c) => c.title));
      const created = await createCanvas(supabase, user.id, title);

      canvasIdRef.current = created.id;
      setActiveCanvasId(created.id);
      isDirtyRef.current = false;
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
    }
  }, [
    closeArtifact,
    flushSave,
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
      bumpCanvasInList(canvasId, { title: trimmed });
    },
    [bumpCanvasInList, supabaseConfigured, user],
  );

  useEffect(() => {
    if (!supabaseConfigured) {
      setPersistenceStatus("ready");
      return;
    }

    if (!user) {
      canvasIdRef.current = null;
      setActiveCanvasId(null);
      setCanvases([]);
      isDirtyRef.current = false;
      resetCanvasState();
      resetViewportBootstrap();
      setPersistenceStatus("ready");
      setSaveStatus("idle");
      return;
    }

    void loadCanvasForUser(user);
  }, [
    loadCanvasForUser,
    resetCanvasState,
    setPersistenceStatus,
    setSaveStatus,
    supabaseConfigured,
    user,
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

    const scheduleSave = () => {
      if (
        isHydratingRef.current ||
        isSwitchingRef.current ||
        isRemoteUpdateRef?.current ||
        !canvasIdRef.current
      ) {
        return;
      }

      isDirtyRef.current = true;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void performSave();
      }, SAVE_DEBOUNCE_MS);
    };

    const unsubscribe = useCanvasStore.subscribe(scheduleSave);

    return () => {
      unsubscribe();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
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
    activeCanvasId,
    canvases,
    setCanvases,
    refreshOwnedCanvasList,
    switchCanvas,
    createNewCanvas,
    renameCanvas,
    isSwitching,
  };
}
