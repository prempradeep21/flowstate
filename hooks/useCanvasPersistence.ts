"use client";

import { useCallback, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import {
  createDefaultCanvas,
  fetchDefaultCanvas,
  saveCanvasState,
} from "@/lib/canvasPersistence";
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
}

export function useCanvasPersistence({
  user,
  supabaseConfigured,
  persistenceStatus,
  setPersistenceStatus,
  setSaveStatus,
}: UseCanvasPersistenceOptions) {
  const canvasIdRef = useRef<string | null>(null);
  const isHydratingRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hydrateFromSnapshot = useCanvasStore((s) => s.hydrateFromSnapshot);
  const getSnapshotSource = useCanvasStore((s) => s.getCanvasSnapshotSource);

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
        const existing = await fetchDefaultCanvas(supabase, nextUser.id);

        if (existing) {
          canvasIdRef.current = existing.id;
          hydrateFromSnapshot(existing.state);
        } else {
          const created = await createDefaultCanvas(
            supabase,
            nextUser.id,
            getSnapshotSource(),
          );
          canvasIdRef.current = created.id;
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
      hydrateFromSnapshot,
      setPersistenceStatus,
      setSaveStatus,
      supabaseConfigured,
    ],
  );

  useEffect(() => {
    if (!supabaseConfigured) {
      setPersistenceStatus("ready");
      return;
    }

    if (!user) {
      canvasIdRef.current = null;
      setPersistenceStatus("ready");
      setSaveStatus("idle");
      return;
    }

    void loadCanvasForUser(user);
  }, [loadCanvasForUser, setPersistenceStatus, setSaveStatus, supabaseConfigured, user]);

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
      if (isHydratingRef.current || !canvasIdRef.current) return;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        const canvasId = canvasIdRef.current;
        if (!canvasId || isHydratingRef.current) return;

        setSaveStatus("saving");
        try {
          const supabase = createClient();
          await saveCanvasState(supabase, canvasId, getSnapshotSource());
          setSaveStatus("saved");
        } catch {
          setSaveStatus("error");
        }
      }, SAVE_DEBOUNCE_MS);
    };

    const unsubscribe = useCanvasStore.subscribe(scheduleSave);

    return () => {
      unsubscribe();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [getSnapshotSource, persistenceStatus, setSaveStatus, supabaseConfigured, user]);

  return { loadCanvasForUser, canvasIdRef };
}
