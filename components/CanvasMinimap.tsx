"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  computeCanvasContentBounds,
  type ContentBounds,
} from "@/lib/canvasContentBounds";
import { getArtifactBounds, getCardBounds } from "@/lib/canvasNodeBounds";
import { markUserViewportInteraction } from "@/lib/canvasViewportGuard";
import { useCanvasStore } from "@/lib/store";
import { viewportCenteredOnWorldPoint } from "@/lib/viewport";

const MINIMAP_W = 160;
const MINIMAP_H = 100;
const CHAT_DOT_SIZE = 4;
const ARTIFACT_DOT_SIZE = 8;

interface CanvasMinimapProps {
  containerRef: RefObject<HTMLDivElement | null>;
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

export function CanvasMinimap({ containerRef }: CanvasMinimapProps) {
  const setViewport = useCanvasStore((s) => s.setViewport);
  const cards = useCanvasStore((s) => s.cards);
  const cardOrder = useCanvasStore((s) => s.cardOrder);
  const canvasArtifactNodes = useCanvasStore((s) => s.canvasArtifactNodes);
  const canvasArtifactOrder = useCanvasStore((s) => s.canvasArtifactOrder);
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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({ w: rect.width, h: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  const bounds = useMemo(
    () =>
      computeCanvasContentBounds({
        cards,
        cardOrder,
        canvasArtifactNodes,
        canvasArtifactOrder,
        canvasTextLabels,
        canvasTextLabelOrder,
        sessionArtifacts,
      }),
    [
      cards,
      cardOrder,
      canvasArtifactNodes,
      canvasArtifactOrder,
      canvasTextLabels,
      canvasTextLabelOrder,
      sessionArtifacts,
    ],
  );

  const transform = useMemo(() => minimapTransform(bounds), [bounds]);

  const cardDots = useMemo(() => {
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
  }, [cardOrder, cards, bounds, transform]);

  const artifactDots = useMemo(() => {
    const dots: { id: string; left: number; top: number }[] = [];
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
      dots.push({
        id,
        left: pos.x - ARTIFACT_DOT_SIZE / 2,
        top: pos.y - ARTIFACT_DOT_SIZE / 2,
      });
    }
    return dots;
  }, [canvasArtifactOrder, canvasArtifactNodes, sessionArtifacts, bounds, transform]);

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

  return (
    <div
      className="pointer-events-auto absolute bottom-5 right-5 z-[55] overflow-hidden rounded-lg border border-canvas-border bg-canvas-card/95 p-1 shadow-card backdrop-blur-sm"
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
            className="pointer-events-none absolute rounded-sm bg-canvas-ink/40"
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
            className="pointer-events-none absolute rounded-sm bg-canvas-ink/25"
            style={{
              left: dot.left,
              top: dot.top,
              width: ARTIFACT_DOT_SIZE,
              height: ARTIFACT_DOT_SIZE,
            }}
          />
        ))}
        {viewportRect && (
          <div
            aria-hidden
            className="pointer-events-none absolute border border-canvas-ink/60 bg-canvas-ink/10"
            style={{
              left: viewportRect.left,
              top: viewportRect.top,
              width: viewportRect.width,
              height: viewportRect.height,
            }}
          />
        )}
      </div>
    </div>
  );
}
