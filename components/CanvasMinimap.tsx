"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import type { ArtifactKind } from "@/lib/artifactTypes";
import {
  computeCanvasContentBounds,
  type ContentBounds,
} from "@/lib/canvasContentBounds";
import { getArtifactBounds, getCardBounds } from "@/lib/canvasNodeBounds";
import { getCanvasAssetBounds } from "@/lib/canvasAssetBounds";
import { markUserViewportInteraction } from "@/lib/canvasViewportGuard";
import { useCanvasStore } from "@/lib/store";
import { viewportCenteredOnWorldPoint } from "@/lib/viewport";
import { formatViewportZoomPercent } from "@/lib/zoomDisplay";

const MINIMAP_W = 160;
const MINIMAP_H = 100;
const CHAT_DOT_SIZE = 4;
const ARTIFACT_DOT_SIZE = 8;
const ASSET_DOT_SIZE = 7;

/** Subtle minimap fills per artifact kind — low opacity so they read on dark card bg. */
const ARTIFACT_MINIMAP_COLORS: Record<ArtifactKind, string> = {
  table: "rgb(var(--canvas-info) / 0.42)",
  code: "rgb(var(--canvas-muted) / 0.48)",
  custom: "rgb(var(--canvas-muted) / 0.38)",
  images: "rgb(var(--canvas-warning) / 0.38)",
  "3d": "rgb(var(--canvas-accent) / 0.42)",
  todo: "rgb(var(--canvas-success) / 0.38)",
  calendar: "rgb(var(--canvas-info) / 0.34)",
  map: "rgb(var(--canvas-map-primary) / 0.42)",
  streetview: "rgb(var(--canvas-map-saved) / 0.38)",
  website: "rgb(var(--canvas-accent) / 0.32)",
  "google-doc": "rgb(var(--canvas-accent) / 0.36)",
  repo: "rgb(var(--canvas-syntax-keyword) / 0.35)",
  embed: "rgb(var(--canvas-warning) / 0.32)",
  timeline: "rgb(var(--canvas-success) / 0.32)",
  chart: "rgb(var(--canvas-accent) / 0.38)",
  audio: "rgb(var(--canvas-warning) / 0.36)",
  stickynote: "rgb(var(--canvas-warning) / 0.44)",
};

const ARTIFACT_MINIMAP_FALLBACK = "rgb(var(--canvas-ink) / 0.25)";

interface CanvasMinimapProps {
  containerRef: RefObject<HTMLDivElement | null>;
  /** Bumps container resize observation when the canvas remounts. */
  canvasKey?: string;
}

interface MinimapTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

function minimapTransform(bounds: ContentBounds): MinimapTransform {
  const scale = Math.min(MINIMAP_W / bounds.w, MINIMAP_H / bounds.h);
  return {
    scale,
    offsetX: (MINIMAP_W - bounds.w * scale) / 2,
    offsetY: (MINIMAP_H - bounds.h * scale) / 2,
  };
}

function worldToMinimap(
  worldX: number,
  worldY: number,
  bounds: ContentBounds,
  transform: MinimapTransform,
) {
  return {
    x: (worldX - bounds.x) * transform.scale + transform.offsetX,
    y: (worldY - bounds.y) * transform.scale + transform.offsetY,
  };
}

function minimapToWorld(
  minimapX: number,
  minimapY: number,
  bounds: ContentBounds,
  transform: MinimapTransform,
) {
  return {
    worldX: (minimapX - transform.offsetX) / transform.scale + bounds.x,
    worldY: (minimapY - transform.offsetY) / transform.scale + bounds.y,
  };
}

export function CanvasMinimap({
  containerRef,
  canvasKey,
}: CanvasMinimapProps) {
  const setViewport = useCanvasStore((s) => s.setViewport);
  const cards = useCanvasStore((s) => s.cards);
  const cardOrder = useCanvasStore((s) => s.cardOrder);
  const chatsGloballyHidden = useCanvasStore((s) => s.chatsGloballyHidden);
  const canvasArtifactNodes = useCanvasStore((s) => s.canvasArtifactNodes);
  const canvasArtifactOrder = useCanvasStore((s) => s.canvasArtifactOrder);
  const canvasAssets = useCanvasStore((s) => s.canvasAssets);
  const canvasAssetNodes = useCanvasStore((s) => s.canvasAssetNodes);
  const canvasAssetOrder = useCanvasStore((s) => s.canvasAssetOrder);
  const canvasGifNodes = useCanvasStore((s) => s.canvasGifNodes);
  const canvasGifOrder = useCanvasStore((s) => s.canvasGifOrder);
  const canvas3DNodes = useCanvasStore((s) => s.canvas3DNodes);
  const canvas3DOrder = useCanvasStore((s) => s.canvas3DOrder);
  const canvasSkills = useCanvasStore((s) => s.canvasSkills);
  const canvasSkillNodes = useCanvasStore((s) => s.canvasSkillNodes);
  const canvasSkillOrder = useCanvasStore((s) => s.canvasSkillOrder);
  const canvasTextLabels = useCanvasStore((s) => s.canvasTextLabels);
  const canvasTextLabelOrder = useCanvasStore((s) => s.canvasTextLabelOrder);
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);

  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [displayViewport, setDisplayViewport] = useState(
    () => useCanvasStore.getState().viewport,
  );

  useEffect(() => {
    let rafId = 0;
    let pending = useCanvasStore.getState().viewport;

    const flush = () => {
      rafId = 0;
      setDisplayViewport(pending);
    };

    const unsubscribe = useCanvasStore.subscribe((state) => {
      pending = state.viewport;
      if (!rafId) {
        rafId = requestAnimationFrame(flush);
      }
    });

    return () => {
      unsubscribe();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useLayoutEffect(() => {
    let ro: ResizeObserver | null = null;
    let observed: HTMLDivElement | null = null;
    let rafId = 0;
    let cancelled = false;

    const updateSize = (el: HTMLDivElement) => {
      const rect = el.getBoundingClientRect();
      setContainerSize({ w: rect.width, h: rect.height });
    };

    const attach = (el: HTMLDivElement) => {
      if (observed === el) return;
      ro?.disconnect();
      observed = el;
      updateSize(el);
      ro = new ResizeObserver(() => updateSize(el));
      ro.observe(el);
    };

    const sync = () => {
      if (cancelled) return;
      const el = containerRef.current;
      if (el) {
        attach(el);
        return;
      }
      rafId = requestAnimationFrame(sync);
    };

    sync();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      ro?.disconnect();
    };
  }, [containerRef, canvasKey]);

  const bounds = useMemo(
    () =>
      computeCanvasContentBounds({
        cards,
        cardOrder,
        canvasArtifactNodes,
        canvasArtifactOrder,
        canvasAssets,
        canvasAssetNodes,
        canvasAssetOrder,
        canvasGifNodes,
        canvasGifOrder,
        canvas3DNodes,
        canvas3DOrder,
        canvasSkills,
        canvasSkillNodes,
        canvasSkillOrder,
        canvasTextLabels,
        canvasTextLabelOrder,
        sessionArtifacts,
      }),
    [
      cards,
      cardOrder,
      canvasArtifactNodes,
      canvasArtifactOrder,
      canvasAssets,
      canvasAssetNodes,
      canvasAssetOrder,
      canvasGifNodes,
      canvasGifOrder,
      canvas3DNodes,
      canvas3DOrder,
      canvasSkills,
      canvasSkillNodes,
      canvasSkillOrder,
      canvasTextLabels,
      canvasTextLabelOrder,
      sessionArtifacts,
    ],
  );

  const transform = useMemo(() => minimapTransform(bounds), [bounds]);

  const cardDots = useMemo(() => {
    if (chatsGloballyHidden) return [];
    const dots: { id: string; left: number; top: number }[] = [];
    for (const id of cardOrder) {
      const card = cards[id];
      if (!card) continue;
      const { w, h } = getCardBounds(card);
      const pos = worldToMinimap(
        card.position.x + w / 2,
        card.position.y + h / 2,
        bounds,
        transform,
      );
      dots.push({
        id,
        left: pos.x - CHAT_DOT_SIZE / 2,
        top: pos.y - CHAT_DOT_SIZE / 2,
      });
    }
    return dots;
  }, [cardOrder, cards, bounds, transform, chatsGloballyHidden]);

  const artifactDots = useMemo(() => {
    const dots: { id: string; left: number; top: number; color: string }[] =
      [];
    for (const id of canvasArtifactOrder) {
      const node = canvasArtifactNodes[id];
      if (!node) continue;
      const artifact = sessionArtifacts[node.artifactId];
      const { w, h } = getArtifactBounds(node, artifact);
      const pos = worldToMinimap(
        node.position.x + w / 2,
        node.position.y + h / 2,
        bounds,
        transform,
      );
      const kind = artifact?.kind;
      dots.push({
        id,
        left: pos.x - ARTIFACT_DOT_SIZE / 2,
        top: pos.y - ARTIFACT_DOT_SIZE / 2,
        color:
          kind && kind in ARTIFACT_MINIMAP_COLORS
            ? ARTIFACT_MINIMAP_COLORS[kind]
            : ARTIFACT_MINIMAP_FALLBACK,
      });
    }
    return dots;
  }, [canvasArtifactOrder, canvasArtifactNodes, sessionArtifacts, bounds, transform]);

  const assetDots = useMemo(() => {
    const dots: { id: string; left: number; top: number }[] = [];
    for (const id of canvasAssetOrder) {
      const node = canvasAssetNodes[id];
      if (!node) continue;
      const asset = canvasAssets[node.assetId];
      const { w, h } = getCanvasAssetBounds(node, asset);
      const pos = worldToMinimap(
        node.position.x + w / 2,
        node.position.y + h / 2,
        bounds,
        transform,
      );
      dots.push({
        id,
        left: pos.x - ASSET_DOT_SIZE / 2,
        top: pos.y - ASSET_DOT_SIZE / 2,
      });
    }
    return dots;
  }, [canvasAssetOrder, canvasAssetNodes, canvasAssets, bounds, transform]);

  const viewportRect = useMemo(() => {
    if (containerSize.w <= 0 || containerSize.h <= 0) return null;
    const worldX = -displayViewport.x / displayViewport.scale;
    const worldY = -displayViewport.y / displayViewport.scale;
    const worldW = containerSize.w / displayViewport.scale;
    const worldH = containerSize.h / displayViewport.scale;

    const topLeft = worldToMinimap(worldX, worldY, bounds, transform);
    const bottomRight = worldToMinimap(
      worldX + worldW,
      worldY + worldH,
      bounds,
      transform,
    );

    return {
      left: topLeft.x,
      top: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }, [containerSize, displayViewport, bounds, transform]);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const { worldX, worldY } = minimapToWorld(
        localX,
        localY,
        bounds,
        transform,
      );
      markUserViewportInteraction();
      const { scale } = useCanvasStore.getState().viewport;
      setViewport(
        viewportCenteredOnWorldPoint(
          worldX,
          worldY,
          containerSize.w,
          containerSize.h,
          scale,
        ),
      );
    },
    [bounds, transform, containerSize, setViewport],
  );

  const zoomPercent = formatViewportZoomPercent(displayViewport.scale);

  return (
    <div
      className="pointer-events-auto absolute bottom-5 right-5 z-[55] overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card/95 p-1 shadow-card backdrop-blur-sm"
      aria-label="Canvas minimap"
    >
      <div
        className="relative cursor-pointer"
        style={{ width: MINIMAP_W, height: MINIMAP_H }}
        onPointerDown={handlePointerDown}
      >
        {cardDots.map((dot) => (
          <div
            key={dot.id}
            aria-hidden
            className="pointer-events-none absolute rounded-canvas-xs bg-canvas-ink/40"
            style={{
              left: dot.left,
              top: dot.top,
              width: CHAT_DOT_SIZE,
              height: CHAT_DOT_SIZE,
            }}
          />
        ))}
        {artifactDots.map((dot) => (
          <div
            key={dot.id}
            aria-hidden
            className="pointer-events-none absolute rounded-canvas-xs"
            style={{
              left: dot.left,
              top: dot.top,
              width: ARTIFACT_DOT_SIZE,
              height: ARTIFACT_DOT_SIZE,
              backgroundColor: dot.color,
            }}
          />
        ))}
        {assetDots.map((dot) => (
          <div
            key={dot.id}
            aria-hidden
            className="pointer-events-none absolute rounded-canvas-xs bg-canvas-accent/45"
            style={{
              left: dot.left,
              top: dot.top,
              width: ASSET_DOT_SIZE,
              height: ASSET_DOT_SIZE,
            }}
          />
        ))}
        {viewportRect && (
          <div
            aria-hidden
            className="pointer-events-none absolute z-10 rounded-[2px] border border-canvas-ink/70 bg-canvas-ink/12 shadow-[inset_0_0_0_1px_rgb(var(--canvas-ink)/0.12)]"
            style={{
              left: viewportRect.left,
              top: viewportRect.top,
              width: Math.max(viewportRect.width, 2),
              height: Math.max(viewportRect.height, 2),
            }}
          />
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0.5 left-1 z-20 text-canvas-caption font-medium tabular-nums leading-none text-canvas-muted/90"
        >
          {zoomPercent}%
        </span>
      </div>
    </div>
  );
}
