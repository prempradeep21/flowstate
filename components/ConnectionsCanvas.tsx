"use client";

import { useEffect, useRef, type RefObject } from "react";
import { getHiddenCardIds, isCardInSelectedFamilies } from "@/lib/chatThreads";
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
import {
  PACK_CONNECTOR_ACTIVE_STROKE_PX,
  PACK_CONNECTOR_DASH,
  PACK_CONNECTOR_STROKE_PX,
  usePackConnector,
} from "@/hooks/usePackConnector";
import type { ArtifactStyleConnectorTokens } from "@/lib/design/style/types";

const DRAW_IN_MS = 480;
/** Pack plug disc: radius (world px) = the vanilla plug's outer radius. */
const PLUG_DISC_R = 5;
/** Contact shadow under a pack plug disc (cheap: no blur), light / dark —
 *  the contact layer of --frost-raised-shadow. */
const PLUG_DISC_SHADOW = { light: "rgba(24, 24, 40, 0.16)", dark: "rgba(0, 0, 0, 0.5)" };
/** Mark on a lime (live) disc — fallback for --frost-lime-ink. */
const PLUG_DISC_ON_LIME = "#1C1C1E";

/** Resolves the plug fill through the theme CSS variable at draw time. */
function plugFillColor(el: HTMLElement): string {
  const raw = getComputedStyle(el).getPropertyValue("--canvas-plug-fill");
  return raw ? `rgb(${raw.trim()})` : "#ffffff";
}

/** Pack plug disc fill (Frost "raised"), read through the scoped CSS var. */
function packPlugFillColor(el: HTMLElement): string {
  const raw = getComputedStyle(el).getPropertyValue("--frost-raised-top").trim();
  return raw || "#ffffff";
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
  // Pack connector tokens (Frost): edges draw in the pack's line / emphasis /
  // active colours instead of thread colours. Null = today's rendering.
  const packConnector = usePackConnector();
  const packConnectorRef = useRef<ArtifactStyleConnectorTokens | null>(
    packConnector,
  );
  const redrawRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    packConnectorRef.current = packConnector;
    redrawRef.current?.();
  }, [packConnector]);

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
    // Pack edge states: the card under the pointer (emphasis).
    let hoveredCardId: string | null = null;

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

      const pack = packConnectorRef.current;
      const plugFill = pack ? packPlugFillColor(container) : plugFillColor(container);
      const onLime = pack
        ? getComputedStyle(container).getPropertyValue("--frost-lime-ink").trim() ||
          PLUG_DISC_ON_LIME
        : PLUG_DISC_ON_LIME;
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
      // Pack plug ends: a raised disc (contact shadow + raised fill) with a
      // small mark in the edge's colour — no ring stroke.
      const drawPackDiscs = (
        g: RenderableConnection,
        mark: string,
        live: boolean,
      ) => {
        const r = PLUG_DISC_R;
        const ends: { px: number; py: number }[] = [];
        if (g.showSourcePlug) ends.push(g.fromAnchor);
        if (g.showTargetPlug) ends.push(g.toAnchor);
        for (const a of ends) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = PLUG_DISC_SHADOW[state.canvasTheme];
          ctx.beginPath();
          ctx.arc(a.px, a.py + 0.75, r + 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = live && pack ? pack.active : plugFill;
          ctx.beginPath();
          ctx.arc(a.px, a.py, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = live ? onLime : mark;
          ctx.beginPath();
          ctx.arc(a.px, a.py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      // Edge state per connection: selected families + hovered card →
      // emphasis; into a thinking / streaming card → active (the live thread).
      const selectedRoots = state.selectedFamilyRootIds;
      const connById = pack
        ? new Map(state.connections.map((c) => [c.id, c]))
        : null;
      const edgeState = (connId: string): "line" | "emphasis" | "active" => {
        const conn = connById?.get(connId);
        if (!conn) return "line";
        const to = state.cards[conn.to];
        if (to && (to.status === "thinking" || to.status === "streaming")) {
          return "active";
        }
        if (hoveredCardId && (conn.from === hoveredCardId || conn.to === hoveredCardId)) {
          return "emphasis";
        }
        if (
          selectedRoots.length > 0 &&
          (isCardInSelectedFamilies(state, conn.from, selectedRoots) ||
            isCardInSelectedFamilies(state, conn.to, selectedRoots))
        ) {
          return "emphasis";
        }
        return "line";
      };
      const now = performance.now();
      let animating = false;

      // A selection's edges rise with it: when lines sit behind the cards,
      // the edges of the selected family draw in the top ("markers") layer
      // instead, so no card or group well ever covers them.
      const connByIdAll =
        layer === "all" ? null : new Map(state.connections.map((c) => [c.id, c]));
      const isLifted = (connId: string): boolean => {
        if (!connByIdAll || selectedRoots.length === 0) return false;
        const conn = connByIdAll.get(connId);
        if (!conn) return false;
        return (
          isCardInSelectedFamilies(state, conn.from, selectedRoots) ||
          isCardInSelectedFamilies(state, conn.to, selectedRoots)
        );
      };

      for (const g of geometry) {
        const path = paths.get(g.connId);
        if (!path) continue;

        const packState = pack ? edgeState(g.connId) : null;
        const packStroke = pack && packState ? pack[packState] : null;
        const lifted = isLifted(g.connId);
        const strokeThisLine =
          layer === "all" || (layer === "lines" ? !lifted : lifted);

        if (strokeThisLine) {
          if (packStroke) {
            // Pack colours carry their own alpha; only collapsed stubs fade.
            ctx.globalAlpha = g.dashed ? g.opacity : 1;
            ctx.strokeStyle = packStroke;
            ctx.lineWidth =
              packState === "active"
                ? PACK_CONNECTOR_ACTIVE_STROKE_PX
                : PACK_CONNECTOR_STROKE_PX;
            ctx.setLineDash(g.dashed ? [...PACK_CONNECTOR_DASH] : []);
          } else {
            ctx.globalAlpha = g.opacity;
            ctx.strokeStyle = g.stroke;
            ctx.setLineDash(g.dashed ? [6, 5] : []);
          }

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
          ctx.lineWidth = CONNECTOR_STROKE_PX;
        }

        // Markers reuse the SVG path builders via Path2D — pixel-identical
        // to the legacy ConnectorPathGroup rendering (cached with geometry).
        if (drawMarkers) {
          if (pack && packStroke) {
            if (g.showSourcePlug || g.showTargetPlug) {
              drawPackDiscs(
                g,
                packState === "line" ? pack.emphasis : packStroke,
                packState === "active",
              );
            }
          } else {
            const rings = plugPaths.get(g.connId);
            if (rings) drawRings(rings, g.stroke, g.dashed ? g.opacity : 1);
          }
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
    redrawRef.current = schedule;

    // Hovered card → emphasised edges (pack connectors only).
    const onPointerOver = (e: PointerEvent) => {
      if (!packConnectorRef.current) return;
      const el = (e.target as Element | null)?.closest?.("[data-canvas-card]");
      const id = el?.getAttribute("data-canvas-card") ?? null;
      if (id !== hoveredCardId) {
        hoveredCardId = id;
        schedule();
      }
    };
    const onPointerLeave = () => {
      if (hoveredCardId === null) return;
      hoveredCardId = null;
      schedule();
    };
    container.addEventListener("pointerover", onPointerOver);
    container.addEventListener("pointerleave", onPointerLeave);

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
        state.chatsGloballyHidden !== prev.chatsGloballyHidden ||
        // Node bounds depend on the style's body family (Frost's hugged box).
        state.canvasArtifactStyle !== prev.canvasArtifactStyle
      ) {
        invalidateGeometry();
        return;
      }
      if (
        state.selectedFamilyRootIds !== prev.selectedFamilyRootIds ||
        state.canvasTheme !== prev.canvasTheme
      ) {
        schedule();
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
      container.removeEventListener("pointerover", onPointerOver);
      container.removeEventListener("pointerleave", onPointerLeave);
      redrawRef.current = null;
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
