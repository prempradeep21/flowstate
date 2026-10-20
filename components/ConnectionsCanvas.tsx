"use client";

import { useEffect, useRef, type RefObject } from "react";
import { getHiddenCardIds } from "@/lib/chatThreads";
import {
  resolveConnectionRender,
  type RenderableConnection,
} from "@/lib/connectionsGeometry";
import {
  getNodeDragFrame,
  subscribeToNodeDrag,
} from "@/lib/gesture/gestureLayer";
import {
  CONNECTOR_STROKE_PX,
  connectorMarkerSizes,
  connectorPlugCirclePath,
} from "@/lib/plugConnector";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import {
  isViewportGestureOwned,
  subscribeViewportPaint,
} from "@/lib/viewportGesture";
import { useCanvasStore } from "@/lib/store";

const DRAW_IN_MS = 480;

/** Resolves the plug fill through the theme CSS variable at draw time. */
function plugFillColor(el: HTMLElement): string {
  const raw = getComputedStyle(el).getPropertyValue("--canvas-plug-fill");
  return raw ? `rgb(${raw.trim()})` : "#ffffff";
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
 * redrew only at the settled scale).
 *
 * `layer` splits the drawing when lines sit behind cards: the plug rings are
 * centred on card edges, so a ring drawn behind its card loses half of itself
 * under the card. Canvas renders a "lines" instance behind the node layer and
 * a "markers" instance above it; with nothing to hide behind, one "all"
 * instance draws both.
 */
export function ConnectionsCanvas({
  containerRef,
  layer = "all",
}: {
  containerRef: RefObject<HTMLElement | null>;
  layer?: "all" | "lines" | "markers";
}) {
  const drawLines = layer !== "markers";
  const drawMarkers = layer !== "lines";
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    // Marker Path2D cache — building them per connection per draw allocated
    // hundreds of objects per frame. Rebuilt on geometry invalidation only.
    let plugPaths = new Map<string, Path2D>();
    let markersBuilt = false;
    let markerRingWidth = 0;
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
      markersBuilt = false; // markers derive from geometry — force rebuild
    };

    const rebuildMarkers = () => {
      markersBuilt = true;
      const { plugRadius, plugRingWidth } = connectorMarkerSizes(1);
      markerRingWidth = plugRingWidth;
      plugPaths = new Map();
      for (const g of geometry) {
        // Both ends share one Path2D — fill and stroke them in a single pass.
        const rings = new Path2D();
        if (g.showSourcePlug) {
          rings.addPath(
            new Path2D(
              connectorPlugCirclePath(g.fromAnchor.px, g.fromAnchor.py, plugRadius),
            ),
          );
        }
        if (g.showTargetPlug) {
          rings.addPath(
            new Path2D(
              connectorPlugCirclePath(g.toAnchor.px, g.toAnchor.py, plugRadius),
            ),
          );
        }
        if (g.showSourcePlug || g.showTargetPlug) plugPaths.set(g.connId, rings);
      }
    };

    const drawNow = (viewportOverride?: {
      x: number;
      y: number;
      scale: number;
    }) => {
      const state = useCanvasStore.getState();
      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (geometryDirty) rebuildGeometry();

      const { x: vx, y: vy, scale } = viewportOverride ?? state.viewport;
      // Markers are a fixed world size — rebuilt only when geometry changes.
      if (!markersBuilt) rebuildMarkers();
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * vx, dpr * vy);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // World-space stroke: scales with the canvas, never restyled on zoom.
      ctx.lineWidth = CONNECTOR_STROKE_PX;

      const plugFill = plugFillColor(container);
      // Opaque fill so a ring reads as a solid plug over the card edge it
      // straddles, matching the DOM <Plug>; dashed stubs keep their fade.
      const drawRings = (rings: Path2D, stroke: string, alpha: number) => {
        ctx.globalAlpha = 1;
        ctx.fillStyle = plugFill;
        ctx.fill(rings);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = markerRingWidth;
        ctx.stroke(rings);
        ctx.lineWidth = CONNECTOR_STROKE_PX;
      };
      const now = performance.now();
      let animating = false;

      for (const g of geometry) {
        const path = paths.get(g.connId);
        if (!path) continue;

        if (drawLines) {
          ctx.globalAlpha = g.opacity;
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
        }

        // Markers reuse the SVG path builders via Path2D — pixel-identical
        // to the legacy ConnectorPathGroup rendering (cached with geometry).
        if (drawMarkers) {
          const rings = plugPaths.get(g.connId);
          if (rings) drawRings(rings, g.stroke, g.dashed ? g.opacity : 1);
        }
      }
      ctx.globalAlpha = 1;

      if (animating) schedule();
    };

    const draw = () => {
      raf = 0;
      drawNow();
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    // Gesture paints: redraw with the TRANSIENT viewport in the same frame
    // as the card transform — the store-commit path is one rAF behind, which
    // read as connections trailing their cards during fast pan/zoom.
    // Deliberately UNTHROTTLED: 120Hz trackpads emit two wheel events per
    // 60Hz display frame, and the card transform takes the LAST event's
    // value at style-flush. A once-per-frame guard here froze connections at
    // the FIRST event's transform — a constant intra-frame offset that
    // oscillated against the cards and read as shudder while scrolling.
    // Drawing per paint (sub-ms) keeps both in lockstep; the browser only
    // presents the final state per display frame.
    const unsubPaint = subscribeViewportPaint((v) => {
      drawNow(v);
    });

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
        state.chatsGloballyHidden !== prev.chatsGloballyHidden
      ) {
        invalidateGeometry();
        return;
      }
      // While a gesture owns the viewport the paint listener already drew
      // this frame's transform — the commit echo would draw a frame behind.
      if (state.viewport !== prev.viewport && !isViewportGestureOwned()) {
        schedule();
      }
      if (drawLines && state.recentConnectionId !== prev.recentConnectionId) {
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

    schedule();

    return () => {
      unsubStore();
      unsubDrag();
      unsubPaint();
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, drawLines, drawMarkers]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      data-connections-canvas
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
