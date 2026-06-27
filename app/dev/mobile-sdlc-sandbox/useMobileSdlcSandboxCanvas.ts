"use client";

import { useCallback, useEffect, useRef } from "react";
import { buildCanvasSnapshot } from "@/lib/canvasSnapshot";
import {
  classifyCanvasPersistChange,
  pickCanvasPersistSlice,
} from "@/lib/canvasPersistDirty";
import {
  buildMobileSdlcSnapshot,
  mobileSdlcContentCenter,
} from "@/lib/buildMobileSdlcCanvas";
import {
  beginMobileSdlcSandboxSession,
  endMobileSdlcSandboxSession,
} from "@/lib/mobileSdlcSandboxSession";
import {
  clearMobileSdlcSandboxSnapshot,
  readMobileSdlcSandboxSnapshot,
  writeMobileSdlcSandboxSnapshot,
} from "@/lib/mobileSdlcSandboxStorage";
import {
  markViewportRestoredFromSnapshot,
  resetViewportBootstrap,
} from "@/lib/canvasViewportBootstrap";
import { getArtifactBounds, getCardBounds } from "@/lib/canvasNodeBounds";
import { getCanvasAssetBounds } from "@/lib/canvasAssetBounds";
import { viewportCenteredOnWorldPoint } from "@/lib/viewport";
import { usePersistenceReady } from "@/components/AuthProvider";
import { useCanvasStore } from "@/lib/store";

const CONTENT_SAVE_DEBOUNCE_MS = 600;
const VIEWPORT_SAVE_DEBOUNCE_MS = 3000;
/** Never zoom out far enough to mount every column at once. */
const MIN_FIT_SCALE = 0.42;

function fitViewportToSandbox(
  container: HTMLElement,
  padding = 320,
): void {
  const state = useCanvasStore.getState();
  const rects: { x: number; y: number; w: number; h: number }[] = [];

  for (const id of state.cardOrder) {
    const card = state.cards[id];
    if (!card) continue;
    const { w, h } = getCardBounds(card);
    rects.push({ x: card.position.x, y: card.position.y, w, h });
  }

  for (const id of state.canvasArtifactOrder) {
    const node = state.canvasArtifactNodes[id];
    if (!node) continue;
    const art = state.sessionArtifacts[node.artifactId];
    const { w, h } = getArtifactBounds(node, art);
    rects.push({ x: node.position.x, y: node.position.y, w, h });
  }

  for (const id of state.canvasAssetOrder) {
    const node = state.canvasAssetNodes[id];
    if (!node) continue;
    const asset = state.canvasAssets[node.assetId];
    const { w, h } = getCanvasAssetBounds(node, asset);
    rects.push({ x: node.position.x, y: node.position.y, w, h });
  }

  for (const id of state.canvasSkillOrder) {
    const node = state.canvasSkillNodes[id];
    if (!node) continue;
    rects.push({ x: node.position.x, y: node.position.y, w: 280, h: 120 });
  }

  if (rects.length === 0) {
    const center = mobileSdlcContentCenter(buildMobileSdlcSnapshot());
    const rect = container.getBoundingClientRect();
    state.setViewport(
      viewportCenteredOnWorldPoint(
        center.x,
        center.y,
        rect.width,
        rect.height,
        0.35,
      ),
    );
    markViewportRestoredFromSnapshot();
    return;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.w);
    maxY = Math.max(maxY, rect.y + rect.h);
  }

  const contentW = maxX - minX + padding;
  const contentH = maxY - minY + padding;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const { width, height } = container.getBoundingClientRect();
  const scale = Math.min(
    1,
    Math.max(
      MIN_FIT_SCALE,
      Math.min(width / contentW, height / contentH),
    ),
  );

  state.setViewport(
    viewportCenteredOnWorldPoint(cx, cy, width, height, scale),
  );
  markViewportRestoredFromSnapshot();
}

export function useMobileSdlcSandboxCanvas(
  containerRef: React.RefObject<HTMLElement | null>,
) {
  const persistenceReady = usePersistenceReady();
  const hydrateFromSnapshot = useCanvasStore((s) => s.hydrateFromSnapshot);
  const sessionStartedRef = useRef(false);

  const loadTemplate = useCallback(
    (opts?: { fit?: boolean }) => {
      const state = useCanvasStore.getState();
      const snapshot = buildMobileSdlcSnapshot({
        canvasTheme: state.canvasTheme,
        canvasBackgroundStyle: state.canvasBackgroundStyle,
      });

      resetViewportBootstrap();
      hydrateFromSnapshot(snapshot, {
        applyViewport: false,
        canvasReveal: false,
      });

      if (opts?.fit !== false) {
        requestAnimationFrame(() => {
          const el = containerRef.current;
          if (el) fitViewportToSandbox(el);
        });
      }
    },
    [containerRef, hydrateFromSnapshot],
  );

  const loadFromStorageOrTemplate = useCallback(() => {
    const stored = readMobileSdlcSandboxSnapshot();
    const state = useCanvasStore.getState();

    resetViewportBootstrap();
    if (stored) {
      hydrateFromSnapshot(stored, {
        applyViewport: false,
        canvasReveal: false,
      });
    } else {
      const snapshot = buildMobileSdlcSnapshot({
        canvasTheme: state.canvasTheme,
        canvasBackgroundStyle: state.canvasBackgroundStyle,
      });
      hydrateFromSnapshot(snapshot, {
        applyViewport: false,
        canvasReveal: false,
      });
    }

    requestAnimationFrame(() => {
      const el = containerRef.current;
      if (el) fitViewportToSandbox(el);
    });
  }, [containerRef, hydrateFromSnapshot]);

  const resetToTemplate = useCallback(() => {
    clearMobileSdlcSandboxSnapshot();
    loadTemplate();
  }, [loadTemplate]);

  const fitAllZones = useCallback(() => {
    const el = containerRef.current;
    if (el) fitViewportToSandbox(el);
  }, [containerRef]);

  useEffect(() => {
    if (!persistenceReady) return;

    if (!sessionStartedRef.current) {
      beginMobileSdlcSandboxSession(
        useCanvasStore.getState().getCanvasSnapshotSource(),
      );
      sessionStartedRef.current = true;
    }

    loadFromStorageOrTemplate();
  }, [persistenceReady, loadFromStorageOrTemplate]);

  useEffect(() => {
    if (!persistenceReady) return;

    let contentTimer: ReturnType<typeof setTimeout> | null = null;
    let viewportTimer: ReturnType<typeof setTimeout> | null = null;
    let prevSlice = pickCanvasPersistSlice(useCanvasStore.getState());

    const flushSave = () => {
      const source = useCanvasStore.getState().getCanvasSnapshotSource();
      writeMobileSdlcSandboxSnapshot(buildCanvasSnapshot(source));
    };

    const unsub = useCanvasStore.subscribe((state) => {
      const nextSlice = pickCanvasPersistSlice(state);
      const { persist, contentEdit } = classifyCanvasPersistChange(
        prevSlice,
        nextSlice,
      );
      prevSlice = nextSlice;
      if (!persist) return;

      if (contentEdit) {
        if (viewportTimer) {
          clearTimeout(viewportTimer);
          viewportTimer = null;
        }
        if (contentTimer) clearTimeout(contentTimer);
        contentTimer = setTimeout(flushSave, CONTENT_SAVE_DEBOUNCE_MS);
        return;
      }

      if (viewportTimer) clearTimeout(viewportTimer);
      viewportTimer = setTimeout(flushSave, VIEWPORT_SAVE_DEBOUNCE_MS);
    });

    const onPageHide = () => flushSave();
    window.addEventListener("pagehide", onPageHide);

    return () => {
      unsub();
      if (contentTimer) clearTimeout(contentTimer);
      if (viewportTimer) clearTimeout(viewportTimer);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [persistenceReady]);

  useEffect(() => {
    return () => {
      if (!sessionStartedRef.current) return;
      const restore = endMobileSdlcSandboxSession();
      sessionStartedRef.current = false;
      if (restore) {
        resetViewportBootstrap();
        useCanvasStore.getState().hydrateFromSnapshot(buildCanvasSnapshot(restore), {
          applyViewport: true,
          canvasReveal: false,
        });
      }
    };
  }, [hydrateFromSnapshot]);

  return { resetToTemplate, fitAllZones };
}
