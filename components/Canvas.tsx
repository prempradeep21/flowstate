"use client";

import {
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useCanvasStore } from "@/lib/store";
import { viewportCenteredOnWorldPoint } from "@/lib/viewport";
import {
  CanvasContextMenu,
  ContextMenuState,
} from "@/components/CanvasContextMenu";
import { CanvasViewport } from "@/components/CanvasViewport";
import { Card } from "@/components/Card";
import { Connections } from "@/components/Connections";

const CARD_WIDTH = 420;
const INITIAL_CARD_HEIGHT_GUESS = 180;
const Q_DROP_Y_OFFSET = 30;

/** Avoid re-panning on resize once the initial viewport has been applied. */
let initialViewportApplied = false;

interface PlacementState {
  x: number;
  y: number;
}

export function Canvas() {
  const cards = useCanvasStore((s) => s.cards);
  const cardOrder = useCanvasStore((s) => s.cardOrder);
  const panBy = useCanvasStore((s) => s.panBy);
  const zoomAt = useCanvasStore((s) => s.zoomAt);
  const viewport = useCanvasStore((s) => s.viewport);
  const createRootCard = useCanvasStore((s) => s.createRootCard);
  const setViewport = useCanvasStore((s) => s.setViewport);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const panState = useRef<{ pointerId: number; lastX: number; lastY: number } | null>(
    null,
  );
  // Latest cursor position in screen space, kept in a ref so a window keydown
  // listener can read it without re-binding on every mousemove.
  const cursorRef = useRef<{ x: number; y: number } | null>(null);

  // Two-step Q placement: press Q -> ghost follows cursor; click -> anchor;
  // Esc -> cancel. Holding both state (for re-render) and a ref (for stable
  // handler closures).
  const [placement, setPlacement] = useState<PlacementState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const placementRef = useRef<PlacementState | null>(null);
  useEffect(() => {
    placementRef.current = placement;
  }, [placement]);

  const computeWorldFromClient = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const { x: vx, y: vy, scale } = useCanvasStore.getState().viewport;
    return {
      x: (clientX - rect.left - vx) / scale,
      y: (clientY - rect.top - vy) / scale,
    };
  };

  // Seed the first question card and pan so it sits at the canvas center.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const bootstrap = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const state = useCanvasStore.getState();

      // Always seed when the canvas is empty (handles HMR / stale bootstrap flags).
      if (state.cardOrder.length === 0) {
        initialViewportApplied = false;
        createRootCard({
          x: -CARD_WIDTH / 2,
          y: -INITIAL_CARD_HEIGHT_GUESS / 2,
        });
        setViewport(
          viewportCenteredOnWorldPoint(0, 0, rect.width, rect.height, 1),
        );
        initialViewportApplied = true;
        return;
      }

      if (initialViewportApplied) return;

      const first = state.cards[state.cardOrder[0]];
      if (!first) return;

      const w = first.size?.w ?? CARD_WIDTH;
      const h = first.size?.h ?? INITIAL_CARD_HEIGHT_GUESS;
      setViewport(
        viewportCenteredOnWorldPoint(
          first.position.x + w / 2,
          first.position.y + h / 2,
          rect.width,
          rect.height,
          1,
        ),
      );
      initialViewportApplied = true;
    };

    bootstrap();
    const ro = new ResizeObserver(bootstrap);
    ro.observe(el);
    return () => ro.disconnect();
  }, [createRootCard, setViewport]);

  // Prevent native page zoom (pinch / Ctrl+wheel) while interacting with the canvas.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const preventGesture = (e: Event) => e.preventDefault();
    el.addEventListener("gesturestart", preventGesture);
    el.addEventListener("gesturechange", preventGesture);
    el.addEventListener("gestureend", preventGesture);
    return () => {
      el.removeEventListener("gesturestart", preventGesture);
      el.removeEventListener("gesturechange", preventGesture);
      el.removeEventListener("gestureend", preventGesture);
    };
  }, []);

  // Track cursor position globally; also update ghost position when in placement.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
      if (placementRef.current) {
        const world = computeWorldFromClient(e.clientX, e.clientY);
        if (world) setPlacement(world);
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Q (enter placement) / Esc (cancel placement). Capture phase so Q works as a
  // canvas tool shortcut even when an empty question field is focused.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (placementRef.current) {
          e.preventDefault();
          setPlacement(null);
        }
        setContextMenu(null);
        return;
      }

      if (e.code !== "KeyQ" || e.repeat || e.ctrlKey || e.metaKey || e.altKey)
        return;

      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") {
          const field = target as HTMLInputElement | HTMLTextAreaElement;
          if (field.value.trim().length > 0) return;
        } else if (target.isContentEditable) {
          return;
        }
      }

      if (placementRef.current) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cursor = cursorRef.current;
      const clientX = cursor?.x ?? rect.left + rect.width / 2;
      const clientY = cursor?.y ?? rect.top + rect.height / 2;
      const world = computeWorldFromClient(clientX, clientY);
      if (!world) return;

      e.preventDefault();
      e.stopPropagation();
      setContextMenu(null);
      target?.blur();
      setPlacement(world);
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  // Window-level click handler that finalises placement and consumes the event
  // so it doesn't focus inputs or trigger pan on the underlying surface.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const p = placementRef.current;
      if (!p) return;
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      createRootCard({
        x: p.x - CARD_WIDTH / 2,
        y: p.y - Q_DROP_Y_OFFSET,
      });
      setPlacement(null);
    };
    // Capture phase so we run before any element's own listeners (including
    // textareas trying to receive focus on click).
    window.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      window.removeEventListener("pointerdown", onPointerDown, true);
  }, [createRootCard]);

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (placementRef.current) return;
    if ((e.target as HTMLElement).closest("[data-canvas-card]")) return;
    setContextMenu({ screenX: e.clientX, screenY: e.clientY });
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (placementRef.current) return;
    if (e.target !== e.currentTarget) return;
    setContextMenu(null);
    if (e.button !== 0) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    panState.current = {
      pointerId: e.pointerId,
      lastX: e.clientX,
      lastY: e.clientY,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const ps = panState.current;
    if (!ps || ps.pointerId !== e.pointerId) return;
    const dx = e.clientX - ps.lastX;
    const dy = e.clientY - ps.lastY;
    ps.lastX = e.clientX;
    ps.lastY = e.clientY;
    panBy(dx, dy);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const ps = panState.current;
    if (!ps || ps.pointerId !== e.pointerId) return;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    panState.current = null;
  };

  const handleWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    // Ctrl/Meta + wheel = zoom (also trackpad pinch comes through as ctrl+wheel).
    // Plain wheel = also zoom on the canvas to keep the interaction simple in V1.
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pivotX = e.clientX - rect.left;
    const pivotY = e.clientY - rect.top;
    const intensity = e.ctrlKey || e.metaKey ? 0.0125 : 0.0015;
    const factor = Math.exp(-e.deltaY * intensity);
    zoomAt(factor, pivotX, pivotY);
  };

  // Dot grid that pans and scales with the viewport.
  const dotSize = 22 * viewport.scale;
  const offsetX = viewport.x % dotSize;
  const offsetY = viewport.y % dotSize;

  return (
    <div
      ref={containerRef}
      data-canvas-container
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
      className={`relative h-full w-full overflow-hidden bg-canvas-bg select-none touch-none ${
        placement
          ? "cursor-crosshair"
          : "cursor-grab active:cursor-grabbing"
      }`}
      style={{
        backgroundImage:
          "radial-gradient(circle, var(--dot-color) 1px, transparent 1px)",
        backgroundSize: `${dotSize}px ${dotSize}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
      }}
    >
      <CanvasViewport>
        <Connections />
        {cardOrder.map((id) => {
          const card = cards[id];
          if (!card) return null;
          return <Card key={id} card={card} />;
        })}
        {placement && <GhostCard world={placement} />}
      </CanvasViewport>
      {contextMenu && (
        <CanvasContextMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

function GhostCard({ world }: { world: PlacementState }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute rounded-2xl border border-dashed border-canvas-border bg-canvas-card/85 shadow-card"
      style={{
        left: world.x - CARD_WIDTH / 2,
        top: world.y - Q_DROP_Y_OFFSET,
        width: CARD_WIDTH,
      }}
    >
      <div className="px-5 pt-4 pb-3">
        <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-canvas-muted">
          Question
        </div>
        <div className="text-[15px] leading-snug text-canvas-muted/60">
          Ask anything...
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-canvas-border px-5 py-2.5">
        <span className="text-[11px] text-canvas-muted">
          Click to place, Esc to cancel
        </span>
        <span className="rounded-md bg-canvas-ink/70 px-3 py-1.5 text-[12px] font-medium text-canvas-card opacity-80">
          Send
        </span>
      </div>
    </div>
  );
}
