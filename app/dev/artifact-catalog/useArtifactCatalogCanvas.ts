"use client";

import { useCallback, useEffect, useRef } from "react";
import { buildCanvasSnapshot } from "@/lib/canvasSnapshot";
import {
  buildArtifactCatalogSnapshot,
  catalogContentCenter,
} from "@/lib/buildArtifactCatalogCanvas";
import {
  beginArtifactCatalogSession,
  endArtifactCatalogSession,
} from "@/lib/artifactCatalogSession";
import type { ArtifactCatalogCategory } from "@/lib/artifactCatalogSamples";
import {
  markViewportRestoredFromSnapshot,
  resetViewportBootstrap,
} from "@/lib/canvasViewportBootstrap";
import { viewportCenteredOnWorldPoint } from "@/lib/viewport";
import { getCardBounds, getArtifactBounds } from "@/lib/canvasNodeBounds";
import { usePersistenceReady } from "@/components/AuthProvider";
import { useCanvasStore } from "@/lib/store";

function fitViewportToCatalog(
  container: HTMLElement,
  padding = 160,
): void {
  const state = useCanvasStore.getState();
  const rects: { x: number; y: number; w: number; h: number }[] = [];

  for (const id of state.cardOrder) {
    const card = state.cards[id];
    if (!card || id === "catalog-source-card") continue;
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

  if (rects.length === 0) {
    const center = catalogContentCenter(
      buildArtifactCatalogSnapshot("flowstate"),
    );
    const rect = container.getBoundingClientRect();
    state.setViewport(
      viewportCenteredOnWorldPoint(
        center.x,
        center.y,
        rect.width,
        rect.height,
        1,
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
  const scale = Math.min(1, Math.min(width / contentW, height / contentH));

  state.setViewport(
    viewportCenteredOnWorldPoint(cx, cy, width, height, scale),
  );
  markViewportRestoredFromSnapshot();
}

export function useArtifactCatalogCanvas(
  category: ArtifactCatalogCategory,
  containerRef: React.RefObject<HTMLElement | null>,
) {
  const persistenceReady = usePersistenceReady();
  const hydrateFromSnapshot = useCanvasStore((s) => s.hydrateFromSnapshot);
  const sessionStartedRef = useRef(false);

  const loadCategory = useCallback(
    (nextCategory: ArtifactCatalogCategory) => {
      const state = useCanvasStore.getState();
      const snapshot = buildArtifactCatalogSnapshot(nextCategory, {
        canvasTheme: state.canvasTheme,
        canvasBackgroundStyle: state.canvasBackgroundStyle,
      });

      resetViewportBootstrap();
      hydrateFromSnapshot(snapshot, {
        applyViewport: false,
        canvasReveal: false,
      });

      requestAnimationFrame(() => {
        const el = containerRef.current;
        if (el) fitViewportToCatalog(el);
      });
    },
    [containerRef, hydrateFromSnapshot],
  );

  useEffect(() => {
    if (!persistenceReady) return;

    if (!sessionStartedRef.current) {
      beginArtifactCatalogSession(
        useCanvasStore.getState().getCanvasSnapshotSource(),
      );
      sessionStartedRef.current = true;
    }

    loadCategory(category);
  }, [persistenceReady, category, loadCategory]);

  useEffect(() => {
    return () => {
      if (!sessionStartedRef.current) return;
      const restore = endArtifactCatalogSession();
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
