"use client";

import { type RefObject, useEffect, useState } from "react";
import { getFamilyCardIds } from "@/lib/chatThreads";
import { isMarqueeSelecting } from "@/lib/gesture/gestureLayer";
import {
  CanvasSpatialIndexManager,
  quantizedVisibleRect,
  shouldEnableViewportCulling,
  visibleNodesEqual,
  type AlwaysVisibleSets,
  type VisibleNodes,
} from "@/lib/canvasSpatialIndex";
import { useCanvasStore } from "@/lib/store";

type StoreState = ReturnType<typeof useCanvasStore.getState>;

/** Selection / composer-draft overlay — nodes forced visible while culled. */
function computeAlwaysVisible(
  state: StoreState,
  landingCardId?: string | null,
): AlwaysVisibleSets {
  const cards = new Set<string>();
  if (landingCardId) cards.add(landingCardId);

  // Mid-marquee the selection can grow to hundreds of nodes per frame;
  // force-mounting all of them during the sweep was the last big jank
  // source at 300 nodes (p99 seconds). Selection rings still render for
  // on-screen nodes; offscreen selected nodes mount on release, before any
  // multi-drag can start.
  if (isMarqueeSelecting()) {
    return { cards };
  }

  for (const rootId of state.selectedFamilyRootIds) {
    for (const id of getFamilyCardIds(state, rootId)) {
      cards.add(id);
    }
  }

  const artifacts = new Set<string>();
  if (state.selectedCanvasArtifactId) {
    artifacts.add(state.selectedCanvasArtifactId);
  }
  const assets = new Set<string>();
  if (state.selectedCanvasAssetId) assets.add(state.selectedCanvasAssetId);
  const gifs = new Set<string>();
  if (state.selectedCanvasGifId) gifs.add(state.selectedCanvasGifId);
  const threeD = new Set<string>();
  if (state.selectedCanvas3DId) threeD.add(state.selectedCanvas3DId);
  const skills = new Set<string>();
  if (state.selectedCanvasSkillId) skills.add(state.selectedCanvasSkillId);
  const labels = new Set<string>();
  if (state.selectedCanvasTextLabelId) {
    labels.add(state.selectedCanvasTextLabelId);
  }

  // Multi-selected nodes always render so batch drags stay coherent.
  for (const item of state.canvasSelection) {
    if (item.kind === "artifact") artifacts.add(item.id);
    else if (item.kind === "asset") assets.add(item.id);
    else if (item.kind === "gif") gifs.add(item.id);
    else if (item.kind === "3d") threeD.add(item.id);
    else if (item.kind === "skill") skills.add(item.id);
    else labels.add(item.id);
  }

  for (const id of Object.keys(state.composerDraftsByCardId)) {
    const draft = state.composerDraftsByCardId[id]?.trim();
    if (draft) cards.add(id);
  }

  return { cards, artifacts, assets, gifs, threeD, skills, labels };
}

function geometryChanged(state: StoreState, prev: StoreState): boolean {
  return (
    state.cards !== prev.cards ||
    state.cardOrder !== prev.cardOrder ||
    state.canvasArtifactNodes !== prev.canvasArtifactNodes ||
    state.canvasArtifactOrder !== prev.canvasArtifactOrder ||
    state.canvasAssets !== prev.canvasAssets ||
    state.canvasAssetNodes !== prev.canvasAssetNodes ||
    state.canvasAssetOrder !== prev.canvasAssetOrder ||
    state.canvasGifNodes !== prev.canvasGifNodes ||
    state.canvasGifOrder !== prev.canvasGifOrder ||
    state.canvas3DNodes !== prev.canvas3DNodes ||
    state.canvas3DOrder !== prev.canvas3DOrder ||
    state.canvasSkills !== prev.canvasSkills ||
    state.canvasSkillNodes !== prev.canvasSkillNodes ||
    state.canvasSkillOrder !== prev.canvasSkillOrder ||
    state.canvasTextLabels !== prev.canvasTextLabels ||
    state.canvasTextLabelOrder !== prev.canvasTextLabelOrder ||
    state.sessionArtifacts !== prev.sessionArtifacts
  );
}

function overlayChanged(state: StoreState, prev: StoreState): boolean {
  return (
    state.selectedFamilyRootIds !== prev.selectedFamilyRootIds ||
    state.canvasSelection !== prev.canvasSelection ||
    state.selectedCanvasArtifactId !== prev.selectedCanvasArtifactId ||
    state.selectedCanvasAssetId !== prev.selectedCanvasAssetId ||
    state.selectedCanvasGifId !== prev.selectedCanvasGifId ||
    state.selectedCanvas3DId !== prev.selectedCanvas3DId ||
    state.selectedCanvasSkillId !== prev.selectedCanvasSkillId ||
    state.selectedCanvasTextLabelId !== prev.selectedCanvasTextLabelId ||
    state.composerDraftsByCardId !== prev.composerDraftsByCardId
  );
}

/**
 * Viewport culling with a PERSISTENT spatial index:
 *  - geometry changes mark the tree dirty (one rebuild, lazily);
 *  - viewport changes only SEARCH the tree (rAF-coalesced);
 *  - the React state update is skipped when the visible set is unchanged —
 *    on most pan/zoom frames nothing crosses the 240px padding band, so the
 *    canvas subtree no longer re-renders per frame (the old hook rebuilt the
 *    RBush AND committed new Sets every frame).
 */
export function useViewportCulling(
  containerRef: RefObject<HTMLElement | null>,
  options?: { landingCardId?: string | null },
) {
  const nodeCount = useCanvasStore(
    (s) =>
      s.cardOrder.length +
      s.canvasArtifactOrder.length +
      s.canvasAssetOrder.length +
      s.canvasGifOrder.length +
      s.canvas3DOrder.length +
      s.canvasSkillOrder.length +
      s.canvasTextLabelOrder.length,
  );
  const enabled = shouldEnableViewportCulling(nodeCount);
  const [visible, setVisible] = useState<VisibleNodes | null>(null);
  const landingCardId = options?.landingCardId;

  useEffect(() => {
    if (!enabled) {
      setVisible(null);
      return;
    }

    const manager = new CanvasSpatialIndexManager();
    let raf = 0;
    let lastVisible: VisibleNodes | null = null;
    // Viewport-only fast path: reasons accumulate between rAFs; when ONLY
    // the viewport moved AND the quantized query rect + tree epoch match the
    // last query, the previous result still holds — skip the RBush search
    // (and the alwaysVisible set-building) entirely. During a steady pan
    // this turns the per-commit-frame query into a key comparison.
    let pendingOther = false; // geometry / overlay / resize / first run
    let lastRectKey = "";
    let lastVersion = -1;

    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;

        const state = useCanvasStore.getState();
        const rect = container.getBoundingClientRect();
        const containerSize = { width: rect.width, height: rect.height };
        const qRect = quantizedVisibleRect(state.viewport, containerSize);
        const rectKey = `${qRect.minX},${qRect.minY},${qRect.maxX},${qRect.maxY},${containerSize.width}x${containerSize.height}`;
        if (
          !pendingOther &&
          rectKey === lastRectKey &&
          manager.version === lastVersion
        ) {
          return;
        }
        pendingOther = false;
        lastRectKey = rectKey;
        lastVersion = manager.version;
        const next = manager.query(
          {
            viewport: state.viewport,
            cards: state.cards,
            cardOrder: state.cardOrder,
            canvasArtifactNodes: state.canvasArtifactNodes,
            canvasArtifactOrder: state.canvasArtifactOrder,
            canvasAssets: state.canvasAssets,
            canvasAssetNodes: state.canvasAssetNodes,
            canvasAssetOrder: state.canvasAssetOrder,
            canvasGifNodes: state.canvasGifNodes,
            canvasGifOrder: state.canvasGifOrder,
            canvas3DNodes: state.canvas3DNodes,
            canvas3DOrder: state.canvas3DOrder,
            canvasSkills: state.canvasSkills,
            canvasSkillNodes: state.canvasSkillNodes,
            canvasSkillOrder: state.canvasSkillOrder,
            canvasTextLabels: state.canvasTextLabels,
            canvasTextLabelOrder: state.canvasTextLabelOrder,
            sessionArtifacts: state.sessionArtifacts,
          },
          containerSize,
          computeAlwaysVisible(state, landingCardId),
        );
        if (visibleNodesEqual(lastVisible, next)) return;
        lastVisible = next;
        setVisible(next);
      });
    };

    pendingOther = true; // first run always queries
    update();

    const unsubscribe = useCanvasStore.subscribe((state, prevState) => {
      const geom = geometryChanged(state, prevState);
      if (geom) manager.markDirty();
      const overlay = overlayChanged(state, prevState);
      if (geom || overlay) pendingOther = true;
      if (geom || overlay || state.viewport !== prevState.viewport) {
        update();
      }
    });

    const ro = new ResizeObserver(() => {
      pendingOther = true;
      update();
    });
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => {
      unsubscribe();
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [containerRef, enabled, landingCardId]);

  return { enabled, visible };
}
