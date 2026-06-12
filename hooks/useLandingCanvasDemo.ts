"use client";

import { useCallback, useEffect, useRef } from "react";
import { buildCanvasSnapshot } from "@/lib/canvasSnapshot";
import {
  beginLandingCanvasSession,
  endLandingCanvasSession,
} from "@/lib/landingCanvasSession";
import {
  markViewportRestoredFromSnapshot,
  resetViewportBootstrap,
} from "@/lib/canvasViewportBootstrap";
import { viewportCenteredOnWorldPoint } from "@/lib/viewport";
import { getCardBounds } from "@/lib/canvasNodeBounds";
import { usePersistenceReady } from "@/components/AuthProvider";
import type { CanvasSnapshot } from "@/lib/canvasSnapshot";
import { useCanvasStore } from "@/lib/store";

function fitViewportToCards(
  container: HTMLElement,
  snapshot: CanvasSnapshot,
  padding = 120,
): void {
  const rects: { x: number; y: number; w: number; h: number }[] = [];

  for (const id of snapshot.cardOrder) {
    const card = snapshot.cards[id];
    if (!card) continue;
    const { w, h } = getCardBounds(card);
    rects.push({ x: card.position.x, y: card.position.y, w, h });
  }

  if (rects.length === 0) return;

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
  const scale = Math.min(1, Math.min(width / contentW, height / contentH));

  useCanvasStore
    .getState()
    .setViewport(viewportCenteredOnWorldPoint(cx, cy, width, height, scale));
  markViewportRestoredFromSnapshot();
}

export function useLandingCanvasDemo(
  buildSnapshot: () => CanvasSnapshot,
  containerRef: React.RefObject<HTMLElement | null>,
) {
  const persistenceReady = usePersistenceReady();
  const hydrateFromSnapshot = useCanvasStore((s) => s.hydrateFromSnapshot);
  const sessionStartedRef = useRef(false);
  const buildRef = useRef(buildSnapshot);
  buildRef.current = buildSnapshot;

  const loadDemo = useCallback(() => {
    const snapshot = buildRef.current();
    resetViewportBootstrap();
    hydrateFromSnapshot(snapshot, {
      applyViewport: false,
      canvasReveal: false,
    });
    requestAnimationFrame(() => {
      const el = containerRef.current;
      if (el) fitViewportToCards(el, snapshot);
    });
  }, [containerRef, hydrateFromSnapshot]);

  useEffect(() => {
    if (!persistenceReady) return;

    if (!sessionStartedRef.current) {
      beginLandingCanvasSession(
        useCanvasStore.getState().getCanvasSnapshotSource(),
      );
      sessionStartedRef.current = true;
    }

    loadDemo();
  }, [persistenceReady, loadDemo]);

  useEffect(() => {
    return () => {
      if (!sessionStartedRef.current) return;
      const restore = endLandingCanvasSession();
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
}
