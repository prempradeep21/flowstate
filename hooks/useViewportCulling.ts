"use client";

import { type RefObject, startTransition, useEffect, useState } from "react";
import { getFamilyCardIds } from "@/lib/chatThreads";
import { isMarqueeSelecting } from "@/lib/gesture/gestureLayer";
import {
  CanvasSpatialIndexManager,
  emptyVisibleNodes,
  quantizedVisibleRect,
  shouldEnableViewportCulling,
  visibleNodesEqual,
  visibleSetFor,
  WARM_NODE_BUDGET,
  type AlwaysVisibleSets,
  type CanvasSpatialInput,
  type SpatialNodeKind,
  type VisibleNodes,
} from "@/lib/canvasSpatialIndex";
import { useCanvasStore } from "@/lib/store";
import {
  getLiveViewport,
  isViewportGestureActive,
  isViewportZoomGesture,
  subscribeViewportPaint,
} from "@/lib/viewportGesture";

type StoreState = ReturnType<typeof useCanvasStore.getState>;

const NODE_KINDS: readonly SpatialNodeKind[] = [
  "card",
  "artifact",
  "asset",
  "gif",
  "3d",
  "skill",
  "label",
];

/** Rest time after the last viewport change before warm-up resumes. */
const WARM_IDLE_DELAY_MS = 300;
/**
 * The warm set belongs to the zoom it was built at: a zoom beyond this ratio
 * drops it (zoom-tier swaps and re-measures would otherwise hit every resident
 * node at once), and warm-up rebuilds once the view rests at the new zoom.
 */
const WARM_ZOOM_TOLERANCE = 1.2;
/** Nodes mounted per warm-up step (one idle callback each). */
const WARM_STEP_NODES = 4;

function spatialInput(
  state: StoreState,
  viewport: CanvasSpatialInput["viewport"],
): CanvasSpatialInput {
  return {
    viewport,
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
  };
}

function cloneVisibleNodes(v: VisibleNodes): VisibleNodes {
  return {
    cards: new Set(v.cards),
    artifacts: new Set(v.artifacts),
    assets: new Set(v.assets),
    gifs: new Set(v.gifs),
    threeD: new Set(v.threeD),
    skills: new Set(v.skills),
    labels: new Set(v.labels),
  };
}

const requestIdle: (cb: () => void) => number =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? (cb) => window.requestIdleCallback(cb, { timeout: 250 })
    : (cb) => window.setTimeout(cb, 50);
const cancelIdle: (h: number) => void =
  typeof window !== "undefined" && "cancelIdleCallback" in window
    ? (h) => window.cancelIdleCallback(h)
    : (h) => window.clearTimeout(h);

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
 *
 * Idle warm-up (`warm`): a static canvas should not rebuild what it already
 * showed — or could have prepared — every time you pan. Once the view rests,
 * the nodes nearest it are added a few per idle callback (up to
 * WARM_NODE_BUDGET, farthest evicted first). Callers mount warm nodes fully
 * rendered but content-visibility:hidden, so a later pan or zoom reveals
 * finished content (images already fetched) instead of building it on
 * arrival. Any gesture pauses warm-up; it never adds work mid-gesture.
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
  const [warm, setWarm] = useState<VisibleNodes | null>(null);
  const landingCardId = options?.landingCardId;

  useEffect(() => {
    if (!enabled) {
      setVisible(null);
      setWarm(null);
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

    // Idle warm-up state (see the hook docs).
    const warmIds = emptyVisibleNodes();
    let warmCount = 0;
    let warmTimer: ReturnType<typeof setTimeout> | null = null;
    let warmIdle = 0;
    let warmDone = false;
    /** Scale the current warm set was built at; null while it is empty. */
    let warmScale: number | null = null;
    const sameZoom = (scale: number) =>
      warmScale === null ||
      Math.abs(Math.log(scale / warmScale)) <=
        Math.log(WARM_ZOOM_TOLERANCE);
    const clearWarm = () => {
      for (const kind of NODE_KINDS) visibleSetFor(warmIds, kind).clear();
      warmCount = 0;
      warmScale = null;
      warmDone = false;
      // Unmounting the hidden residents is time-sliced like mounting was.
      startTransition(() => setWarm(null));
    };

    const update = () => {
      // Keep an already-scheduled query: it reads live state when it runs.
      // Cancel-and-reschedule starved it during a gesture — the store's
      // commit rAF re-triggers update() inside each frame, pushing the
      // query to the next frame, forever, while input keeps arriving.
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const container = containerRef.current;
        if (!container) return;

        const state = useCanvasStore.getState();
        // The PAINTED viewport: mid-gesture the store commit trails the
        // transform by a frame, which during a zoom-out left freshly
        // on-screen nodes unmounted (or still hidden) for a frame or two.
        const viewport = getLiveViewport();
        const rect = container.getBoundingClientRect();
        const containerSize = { width: rect.width, height: rect.height };
        const qRect = quantizedVisibleRect(viewport, containerSize);
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
          spatialInput(state, viewport),
          containerSize,
          computeAlwaysVisible(state, landingCardId),
        );
        if (warmCount > 0 && !sameZoom(viewport.scale)) clearWarm();
        if (visibleNodesEqual(lastVisible, next)) return;
        // Nodes scrolling out of the band stay resident (hidden) instead of
        // unmounting — panning back must not rebuild them. Not while zooming:
        // that set is about to be dropped anyway.
        let warmGrew = false;
        if (
          lastVisible &&
          !isViewportZoomGesture() &&
          sameZoom(viewport.scale)
        ) {
          for (const kind of NODE_KINDS) {
            const now = visibleSetFor(next, kind);
            const warmSet = visibleSetFor(warmIds, kind);
            for (const id of visibleSetFor(lastVisible, kind)) {
              if (now.has(id) || warmSet.has(id)) continue;
              if (warmCount >= WARM_NODE_BUDGET) break;
              warmSet.add(id);
              warmCount++;
              warmGrew = true;
              warmScale ??= viewport.scale;
            }
          }
        }
        lastVisible = next;
        setVisible(next);
        if (warmGrew) setWarm(cloneVisibleNodes(warmIds));
      });
    };

    // --- Idle warm-up -----------------------------------------------------
    const stopWarm = () => {
      if (warmTimer) clearTimeout(warmTimer);
      warmTimer = null;
      if (warmIdle) cancelIdle(warmIdle);
      warmIdle = 0;
    };
    /** (Re)start the rest timer — any viewport or geometry change calls this. */
    const scheduleWarm = (delay = WARM_IDLE_DELAY_MS) => {
      stopWarm();
      warmTimer = setTimeout(() => {
        warmTimer = null;
        warmIdle = requestIdle(warmStep);
      }, delay);
    };
    const warmStep = () => {
      warmIdle = 0;
      // Never add work while the user is moving the canvas.
      if (isViewportGestureActive()) {
        scheduleWarm();
        return;
      }
      const container = containerRef.current;
      if (!container) return;
      const state = useCanvasStore.getState();
      const viewport = getLiveViewport();
      const input = spatialInput(state, viewport);
      if (warmCount > 0 && !sameZoom(viewport.scale)) clearWarm();
      warmScale ??= viewport.scale;
      const rect = container.getBoundingClientRect();
      const cx = (rect.width / 2 - viewport.x) / viewport.scale;
      const cy = (rect.height / 2 - viewport.y) / viewport.scale;
      // Drop ids that no longer exist (deleted nodes, a switched canvas).
      let pruned = false;
      for (const kind of NODE_KINDS) {
        const set = visibleSetFor(warmIds, kind);
        for (const id of set) {
          if (manager.distanceTo(input, kind, id, cx, cy) === Infinity) {
            set.delete(id);
            warmCount--;
            pruned = true;
          }
        }
      }
      const picks = manager.nearest(
        input,
        cx,
        cy,
        (kind, id) => visibleSetFor(warmIds, kind).has(id),
        WARM_STEP_NODES,
      );
      let changed = pruned;
      for (const pick of picks) {
        if (warmCount >= WARM_NODE_BUDGET) {
          // Large canvas: trade the farthest warm node for a nearer one.
          let far: { kind: SpatialNodeKind; id: string; dist: number } | null =
            null;
          for (const kind of NODE_KINDS) {
            for (const id of visibleSetFor(warmIds, kind)) {
              const dist = manager.distanceTo(input, kind, id, cx, cy);
              if (!far || dist > far.dist) far = { kind, id, dist };
            }
          }
          if (!far || far.dist <= pick.dist) break;
          visibleSetFor(warmIds, far.kind).delete(far.id);
          warmCount--;
        }
        visibleSetFor(warmIds, pick.kind).add(pick.id);
        warmCount++;
        changed = true;
      }
      if (changed) {
        const snapshot = cloneVisibleNodes(warmIds);
        // A transition: the mount is time-sliced and yields to any input.
        startTransition(() => setWarm(snapshot));
        if (picks.length > 0) warmIdle = requestIdle(warmStep);
        else warmDone = true;
      } else {
        warmDone = true; // everything near enough is warm; wait for a move
      }
    };
    // ---------------------------------------------------------------------

    pendingOther = true; // first run always queries
    update();
    scheduleWarm();

    const unsubscribe = useCanvasStore.subscribe((state, prevState) => {
      const geom = geometryChanged(state, prevState);
      if (geom) {
        manager.markDirty();
        warmDone = false;
      }
      const overlay = overlayChanged(state, prevState);
      if (geom || overlay) pendingOther = true;
      const moved = state.viewport !== prevState.viewport;
      if (geom || overlay || moved) {
        update();
      }
      // Restart the rest timer on movement; geometry changes resume a
      // finished warm-up (new or moved nodes may now be nearest).
      if (moved || (geom && !warmTimer && !warmIdle)) {
        if (moved) warmDone = false;
        if (!warmDone) scheduleWarm();
      }
    });

    // Gesture paints land before their store commit — query off them.
    const unsubscribePaint = subscribeViewportPaint(() => {
      update();
      stopWarm();
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
      unsubscribePaint();
      ro.disconnect();
      cancelAnimationFrame(raf);
      stopWarm();
    };
  }, [containerRef, enabled, landingCardId]);

  return { enabled, visible, warm };
}
