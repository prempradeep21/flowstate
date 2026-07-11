"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { getHiddenCardIds } from "@/lib/chatThreads";
import {
  resolveConnectionRender,
  type RenderableConnection,
} from "@/lib/connectionsGeometry";
import {
  getNodeDragFrame,
  isNodeDragActive,
  subscribeToNodeDrag,
} from "@/lib/gesture/gestureLayer";
import {
  connectorArrowPath,
  connectorMarkerSizes,
  connectorPlugCirclePath,
} from "@/lib/plugConnector";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import { ConnectorStylePicker } from "@/components/ConnectorStylePicker";
import { useCanvasStore } from "@/lib/store";

const BASE_STROKE_SCREEN = 1.75;
const HIT_STROKE_SCREEN = 14;
const DRAW_IN_MS = 480;

/** Resolves the plug fill through the theme CSS variable at draw time. */
function plugFillColor(el: HTMLElement): string {
  const raw = getComputedStyle(el).getPropertyValue("--canvas-plug-fill");
  return raw ? `rgb(${raw.trim()})` : "#ffffff";
}

interface HoverState {
  connId: string;
  screenX: number;
  screenY: number;
}

/**
 * Screen-space canvas2d renderer for card connections — replaces the SVG
 * layer that re-rendered every path through React on any hover/viewport/card
 * change. One rAF redraw per invalidation; hundreds of beziers stroke in
 * well under a millisecond. Uses the exact SVG path strings via Path2D, so
 * geometry is pixel-identical to the legacy renderer (kill-switch:
 * NEXT_PUBLIC_SVG_CONNECTIONS=1 restores the old component).
 *
 * Tracks live gestures: node drags offset endpoints per frame through the
 * gesture layer, and pan/zoom redraws use the LIVE viewport (the SVG layer
 * compensated stroke widths against the settled scale only).
 */
export function ConnectionsCanvas({
  containerRef,
}: {
  containerRef: RefObject<HTMLElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const hoverRef = useRef<HoverState | null>(null);
  hoverRef.current = hover;
  const pickerHoveredRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connectorStyle = useCanvasStore((s) => s.connectorStyle);
  const setConnectorStyle = useCanvasStore((s) => s.setConnectorStyle);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      if (!pickerHoveredRef.current) setHover(null);
    }, 120);
  }, [clearHideTimer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let geometry: RenderableConnection[] = [];
    let geometryDirty = true;
    let paths = new Map<string, Path2D>();
    // Draw-in animation state for freshly created connections.
    let drawIn: { connId: string; startedAt: number } | null = null;

    const rebuildGeometry = () => {
      const state = useCanvasStore.getState();
      const dragFrame = getNodeDragFrame();
      const dragOffsets =
        dragFrame && (dragFrame.dx !== 0 || dragFrame.dy !== 0)
          ? new Map(
              dragFrame.nodes
                .filter((n) => n.kind === "card")
                .map((n) => [n.id, { dx: dragFrame.dx, dy: dragFrame.dy }]),
            )
          : undefined;
      const geomState = {
        cards: state.cards,
        threads: state.threads,
        connectorStyle: state.connectorStyle,
        collapsedCardIds: state.collapsedCardIds,
        hiddenCardIds: getHiddenCardIds(state),
        hiddenCheckState: state,
      };
      geometry = [];
      paths = new Map();
      for (const conn of state.connections) {
        const render = resolveConnectionRender(
          conn,
          geomState,
          RESOLVED_CANVAS_TUNING,
          state.viewport.scale,
          dragOffsets,
        );
        if (!render) continue;
        geometry.push(render);
        paths.set(render.connId, new Path2D(render.d));
      }
      geometryDirty = false;
    };

    const draw = () => {
      raf = 0;
      const state = useCanvasStore.getState();
      const reveal = state.canvasLoadReveal;
      const hideForLoadReveal =
        reveal?.phase === "pending" || reveal?.phase === "running";

      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (hideForLoadReveal) return;

      if (geometryDirty) rebuildGeometry();

      const { x: vx, y: vy, scale } = state.viewport;
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * vx, dpr * vy);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // Screen-constant stroke (SVG used vector-effect: non-scaling-stroke).
      ctx.lineWidth = BASE_STROKE_SCREEN / scale;

      const plugFill = plugFillColor(container);
      const { plugRadius, arrowSize } = connectorMarkerSizes(scale);
      const hovered = hoverRef.current?.connId ?? null;
      const now = performance.now();
      let animating = false;

      for (const g of geometry) {
        const path = paths.get(g.connId);
        if (!path) continue;

        ctx.globalAlpha = g.connId === hovered ? 0.95 : g.opacity;
        ctx.strokeStyle = g.stroke;
        ctx.setLineDash(g.dashed ? [6, 5] : []);

        if (drawIn?.connId === g.connId) {
          // Dash-offset reveal matching the SVG connection-draw-in keyframes.
          const t = Math.min((now - drawIn.startedAt) / DRAW_IN_MS, 1);
          // Path length unknown on canvas — approximate with anchor distance
          // ×1.6 (bezier overshoot); visually indistinguishable at 480ms.
          const approxLen =
            Math.hypot(
              g.toAnchor.px - g.fromAnchor.px,
              g.toAnchor.py - g.fromAnchor.py,
            ) * 1.6 || 1;
          ctx.setLineDash([approxLen, approxLen]);
          ctx.lineDashOffset = approxLen * (1 - t);
          if (t >= 1) {
            drawIn = null;
            useCanvasStore.getState().clearRecentConnection();
          } else {
            animating = true;
          }
        } else {
          ctx.lineDashOffset = 0;
        }

        ctx.stroke(path);
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;

        // Markers reuse the SVG path builders via Path2D — pixel-identical
        // to the legacy ConnectorPathGroup rendering.
        if (g.showSourcePlug) {
          const plug = new Path2D(
            connectorPlugCirclePath(g.fromAnchor.px, g.fromAnchor.py, plugRadius),
          );
          ctx.fillStyle = plugFill;
          ctx.fill(plug);
          ctx.stroke(plug);
        }
        if (g.showTargetArrow) {
          const arrow = new Path2D(
            connectorArrowPath(g.toAnchor.px, g.toAnchor.py, g.toSide, arrowSize),
          );
          ctx.fillStyle = g.stroke;
          ctx.globalAlpha = g.opacity;
          ctx.fill(arrow);
        }
      }
      ctx.globalAlpha = 1;

      if (animating) schedule();
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const invalidateGeometry = () => {
      geometryDirty = true;
      schedule();
    };

    // Store subscription: geometry-bearing slices invalidate; viewport just
    // redraws with the new transform.
    const unsubStore = useCanvasStore.subscribe((state, prev) => {
      if (
        state.cards !== prev.cards ||
        state.connections !== prev.connections ||
        state.threads !== prev.threads ||
        state.connectorStyle !== prev.connectorStyle ||
        state.collapsedCardIds !== prev.collapsedCardIds ||
        state.collapsedBranchThreadIds !== prev.collapsedBranchThreadIds ||
        state.chatsGloballyHidden !== prev.chatsGloballyHidden ||
        state.canvasLoadReveal !== prev.canvasLoadReveal
      ) {
        invalidateGeometry();
        return;
      }
      if (state.viewport !== prev.viewport) schedule();
      if (state.recentConnectionId !== prev.recentConnectionId) {
        if (state.recentConnectionId) {
          drawIn = {
            connId: state.recentConnectionId,
            startedAt: performance.now(),
          };
        }
        schedule();
      }
    });

    // Live drag frames: dragged cards' connections follow at frame rate.
    const unsubDrag = subscribeToNodeDrag(() => invalidateGeometry());

    const ro = new ResizeObserver(schedule);
    ro.observe(container);

    // Hover probe: hit-test with the canvas API itself (isPointInStroke on
    // the hit width) — replaces the SVG 14px transparent hit paths.
    const onPointerMove = (e: PointerEvent) => {
      if (e.buttons !== 0 || isNodeDragActive()) return;
      const rect = container.getBoundingClientRect();
      const state = useCanvasStore.getState();
      const { x: vx, y: vy, scale } = state.viewport;
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wx = (sx - vx) / scale;
      const wy = (sy - vy) / scale;

      if (geometryDirty) rebuildGeometry();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.lineWidth = HIT_STROKE_SCREEN / scale;
      let hit: RenderableConnection | null = null;
      for (const g of geometry) {
        if (!g.hoverable) continue;
        const path = paths.get(g.connId);
        if (path && ctx.isPointInStroke(path, wx, wy)) {
          hit = g;
          break;
        }
      }
      ctx.restore();

      const current = hoverRef.current;
      if (hit && hit.midX != null && hit.midY != null) {
        clearHideTimer();
        const screenX = hit.midX * scale + vx;
        const screenY = hit.midY * scale + vy;
        if (
          !current ||
          current.connId !== hit.connId ||
          Math.abs(current.screenX - screenX) > 1 ||
          Math.abs(current.screenY - screenY) > 1
        ) {
          setHover({ connId: hit.connId, screenX, screenY });
        }
      } else if (current) {
        scheduleHide();
      }
    };
    container.addEventListener("pointermove", onPointerMove, {
      passive: true,
    });

    schedule();

    return () => {
      unsubStore();
      unsubDrag();
      ro.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, clearHideTimer, scheduleHide]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        data-connections-canvas
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      {hover && (
        <ConnectorStylePicker
          x={hover.screenX}
          y={hover.screenY}
          scale={1}
          activeStyle={connectorStyle}
          onSelect={setConnectorStyle}
          onHoverChange={(hoveredNow) => {
            pickerHoveredRef.current = hoveredNow;
            if (hoveredNow) clearHideTimer();
            else scheduleHide();
          }}
        />
      )}
    </>
  );
}
