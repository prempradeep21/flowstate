"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { durations } from "@/lib/motion/tokens";
import {
  MAX_TIMELINE_ZOOM,
  MIN_TIMELINE_ZOOM,
  pxPerMsFor,
  type TimelineScale,
} from "@/lib/timelineLayout";

const PAN_DRAG_THRESHOLD_PX = 4;

function clampZoom(z: number): number {
  return Math.min(MAX_TIMELINE_ZOOM, Math.max(MIN_TIMELINE_ZOOM, z));
}

export function useTimelineViewport(opts: {
  initialCenterMs: number;
  initialZoom?: number;
  scale: TimelineScale;
  enabled?: boolean;
}) {
  const {
    initialCenterMs,
    initialZoom = 1,
    scale,
    enabled = true,
  } = opts;

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [centerMs, setCenterMs] = useState(initialCenterMs);
  const centerMsRef = useRef(centerMs);
  centerMsRef.current = centerMs;

  const [zoom, setZoomState] = useState(() => clampZoom(initialZoom));
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const [viewportWidth, setViewportWidth] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const wheelRaf = useRef<number | null>(null);
  const pendingWheel = useRef<number | null>(null);
  const panRef = useRef<{
    pointerId: number;
    startX: number;
    startCenterMs: number;
    didPan: boolean;
  } | null>(null);
  const didPanRef = useRef(false);

  const queueZoomAt = useCallback((factor: number, animate = false) => {
    const prev = zoomRef.current;
    const next = clampZoom(prev * factor);
    if (next === prev) return;
    if (animate) setAnimating(true);
    setZoomState(next);
    zoomRef.current = next;
  }, []);

  const zoomByButton = useCallback(
    (factor: number) => {
      queueZoomAt(factor, true);
      window.setTimeout(() => setAnimating(false), durations.standard);
    },
    [queueZoomAt],
  );

  const consumeDidPan = useCallback(() => {
    const did = didPanRef.current;
    didPanRef.current = false;
    return did;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    const syncViewportWidth = () => setViewportWidth(el.clientWidth);
    syncViewportWidth();

    const ro = new ResizeObserver(syncViewportWidth);
    ro.observe(el);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      pendingWheel.current = (pendingWheel.current ?? 0) + e.deltaY + e.deltaX;
      if (wheelRaf.current != null) return;
      wheelRaf.current = requestAnimationFrame(() => {
        wheelRaf.current = null;
        const pending = pendingWheel.current;
        pendingWheel.current = null;
        if (pending == null) return;
        const intensity = 0.002;
        const factor = Math.exp(-pending * intensity);
        queueZoomAt(factor);
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if ((e.target as Element).closest("[data-timeline-no-pan]")) return;

      panRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startCenterMs: centerMsRef.current,
        didPan: false,
      };
      didPanRef.current = false;
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const pan = panRef.current;
      if (!pan || pan.pointerId !== e.pointerId) return;

      const dx = e.clientX - pan.startX;
      if (!pan.didPan && Math.abs(dx) < PAN_DRAG_THRESHOLD_PX) return;

      pan.didPan = true;
      didPanRef.current = true;
      setIsPanning(true);

      const pxPerMs = pxPerMsFor(scale, zoomRef.current);
      if (pxPerMs <= 0) return;
      setCenterMs(pan.startCenterMs - dx / pxPerMs);
    };

    const endPan = (e: PointerEvent) => {
      const pan = panRef.current;
      if (!pan || pan.pointerId !== e.pointerId) return;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      panRef.current = null;
      setIsPanning(false);
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endPan);
    el.addEventListener("pointercancel", endPan);

    return () => {
      ro.disconnect();
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endPan);
      el.removeEventListener("pointercancel", endPan);
      if (wheelRaf.current != null) cancelAnimationFrame(wheelRaf.current);
    };
  }, [enabled, queueZoomAt, scale]);

  return {
    containerRef,
    trackRef,
    zoom,
    centerMs,
    zoomByButton,
    zoomPercent: Math.round(zoom * 100),
    viewportWidth,
    zoomAnimating: animating,
    isPanning,
    consumeDidPan,
  };
}
