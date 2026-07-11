"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { useArtifactMenuDisplayExtras } from "@/components/artifacts/ArtifactMenuControlsContext";
import { ArtifactMenuTimelineControls } from "@/components/artifacts/menu/ArtifactMenuControlRows";
import { TimelinePendingMarker } from "@/components/timeline/TimelinePendingMarker";
import { TimelineAddPopover } from "@/components/timeline/TimelineAddPopover";
import { TimelineAxis } from "@/components/timeline/TimelineAxis";
import { TimelineEventNode } from "@/components/timeline/TimelineEventNode";
import type { ArtifactPayload, TimelineEvent, TimelineScale } from "@/lib/artifactTypes";
import { TIMELINE_ARTIFACT_BODY_MIN_HEIGHT, TIMELINE_ARTIFACT_STAGE_WIDTH } from "@/lib/canvasNodeBounds";
import { useTimelineViewport } from "@/hooks/useTimelineViewport";
import {
  createTimelineEvent,
  normalizeTimelineArtifactData,
  timelineDefaultCenterMs,
} from "@/lib/timelineArtifact";
import {
  LABEL_MAX_WIDTH,
  TRACK_HEIGHT,
  axisY,
  buildTimelineSegments,
  computeVisibleLabels,
  estimateLabelWidth,
  eventColor,
  eventSide,
  generateVisibleTicks,
  screenXToTime,
  snapToNearestTick,
  timeToScreenX,
} from "@/lib/timelineLayout";
import { useCanvasStore } from "@/lib/store";
import { durations } from "@/lib/motion/tokens";

type PopoverState =
  | { mode: "add"; at: string; x: number; y: number }
  | { mode: "edit"; event: TimelineEvent; x: number; y: number };

export function TimelineArtifactContent({
  payload,
  artifactId,
  canEdit = false,
  fill = false,
  sidebar = false,
  layout = "panel",
}: {
  payload: Extract<ArtifactPayload, { type: "timeline" }>;
  artifactId?: string;
  canEdit?: boolean;
  fill?: boolean;
  sidebar?: boolean;
  layout?: "canvas" | "panel" | "sidebar";
}) {
  const saveTimelineArtifactVersion = useCanvasStore(
    (s) => s.saveTimelineArtifactVersion,
  );

  const data = payload.data;
  const [scale, setScale] = useState<TimelineScale>(data.scale ?? "year");
  const [scaleAnimating, setScaleAnimating] = useState(false);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [trackHeight, setTrackHeight] = useState(TRACK_HEIGHT);
  const trackAreaRef = useRef<HTMLDivElement>(null);
  const initialCenterRef = useRef<number | null>(null);
  if (initialCenterRef.current == null) {
    initialCenterRef.current = timelineDefaultCenterMs(data);
  }

  useEffect(() => {
    setScale(data.scale ?? "year");
  }, [data.scale, payload]);

  useEffect(() => {
    const el = trackAreaRef.current;
    if (!el) return;
    const minTrackHeight = fill ? TIMELINE_ARTIFACT_BODY_MIN_HEIGHT : 240;
    const sync = () => {
      const next = Math.max(minTrackHeight, Math.floor(el.clientHeight));
      setTrackHeight((prev) => (prev === next ? prev : next));
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fill]);

  const isCanvas = layout === "canvas";
  const interactive = canEdit && isCanvas && !sidebar;
  const viewportEnabled = isCanvas && !sidebar;

  const persist = useCallback(
    (nextEvents: TimelineEvent[], nextScale: TimelineScale = scale) => {
      if (!artifactId) return;
      const nextPayload: Extract<ArtifactPayload, { type: "timeline" }> = {
        ...payload,
        data: normalizeTimelineArtifactData({
          ...data,
          events: nextEvents,
          scale: nextScale,
        }),
      };
      saveTimelineArtifactVersion(artifactId, nextPayload);
    },
    [artifactId, data, payload, saveTimelineArtifactVersion, scale],
  );

  const {
    containerRef,
    trackRef,
    zoom,
    centerMs,
    zoomByButton,
    zoomPercent,
    viewportWidth,
    zoomAnimating,
    isPanning,
    consumeDidPan,
  } = useTimelineViewport({
    initialCenterMs: initialCenterRef.current,
    initialZoom: 1,
    scale,
    enabled: viewportEnabled,
  });

  const ticks = useMemo(
    () => generateVisibleTicks(centerMs, viewportWidth, scale, zoom),
    [centerMs, scale, viewportWidth, zoom],
  );

  const centerY = axisY(trackHeight);
  const animating = scaleAnimating || zoomAnimating;

  const displayEvents = sidebar
    ? data.events.slice(0, 5)
    : data.events;

  const eventScreenX = useCallback(
    (at: string) =>
      timeToScreenX(new Date(at).getTime(), centerMs, viewportWidth, scale, zoom),
    [centerMs, scale, viewportWidth, zoom],
  );

  const eventPoints = useMemo(
    () =>
      displayEvents.map((event, index) => ({
        index,
        x: eventScreenX(event.at),
        color: eventColor(index),
        side: eventSide(index, event.side),
        highlight: event.highlight,
        width: estimateLabelWidth(event.label),
      })),
    [displayEvents, eventScreenX],
  );

  // Colour-segmented axis, computed from every event (even off-screen ones) so
  // the coloured line runs continuously across the viewport.
  const axisSegments = useMemo(
    () =>
      buildTimelineSegments(
        eventPoints.map((p) => ({ x: p.x, color: p.color })),
        viewportWidth,
      ),
    [eventPoints, viewportWidth],
  );

  // Level-of-detail: which labels are shown at the current zoom. Always ≥1 when
  // an event is on screen; more reveal as zooming in spreads events apart.
  const visibleLabels = useMemo(() => {
    const candidates = eventPoints
      .filter((p) => p.x >= -LABEL_MAX_WIDTH && p.x <= viewportWidth + LABEL_MAX_WIDTH)
      .map((p) => ({
        index: p.index,
        x: p.x,
        side: p.side,
        width: p.width,
        highlight: p.highlight,
        centerBias: Math.abs(p.x - viewportWidth / 2),
      }));
    return computeVisibleLabels(candidates);
  }, [eventPoints, viewportWidth]);

  const pendingX =
    popover?.mode === "add"
      ? eventScreenX(popover.at)
      : null;

  const handleScaleChange = useCallback(
    (next: TimelineScale) => {
      setScaleAnimating(true);
      setScale(next);
      if (artifactId && interactive) {
        persist(data.events, next);
      }
      window.setTimeout(() => setScaleAnimating(false), durations.slow);
    },
    [artifactId, data.events, interactive, persist],
  );

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!interactive || popover || consumeDidPan()) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const atRaw = screenXToTime(screenX, centerMs, viewportWidth, scale, zoom);
      const at = snapToNearestTick(atRaw, ticks);
      setPopover({
        mode: "add",
        at,
        x: screenX,
        y: e.clientY - rect.top,
      });
    },
    [
      centerMs,
      consumeDidPan,
      containerRef,
      interactive,
      popover,
      scale,
      ticks,
      viewportWidth,
      zoom,
    ],
  );

  const handleSaveNew = useCallback(
    (label: string, at: string) => {
      const event = createTimelineEvent({ at, label });
      persist([...data.events, event]);
      setPopover(null);
    },
    [data.events, persist],
  );

  const handleSaveEdit = useCallback(
    (label: string, at: string) => {
      if (popover?.mode !== "edit") return;
      persist(
        data.events.map((ev) =>
          ev.id === popover.event.id ? { ...ev, label, at } : ev,
        ),
      );
      setPopover(null);
    },
    [data.events, persist, popover],
  );

  const handleDelete = useCallback(() => {
    if (popover?.mode !== "edit") return;
    persist(data.events.filter((ev) => ev.id !== popover.event.id));
    setPopover(null);
  }, [data.events, persist, popover]);

  useArtifactMenuDisplayExtras(
    !sidebar,
    () => (
      <ArtifactMenuTimelineControls
        scale={scale}
        onScaleChange={handleScaleChange}
        zoomPercent={zoomPercent}
        onZoomIn={() => zoomByButton(1.15)}
        onZoomOut={() => zoomByButton(1 / 1.15)}
        disabled={!interactive}
        zoomDisabled={!viewportEnabled}
      />
    ),
    [
      handleScaleChange,
      interactive,
      scale,
      sidebar,
      viewportEnabled,
      zoomByButton,
      zoomPercent,
    ],
  );

  return (
    <ArtifactContentStage
      fill={fill}
      artifactId={artifactId}
      className={fill ? "flex min-h-0 flex-col" : "aspect-[21/9] min-h-[280px]"}
    >
      <div
        ref={trackAreaRef}
        className={`relative min-h-0 flex-1 ${fill ? "flex flex-col" : ""} ${viewportEnabled ? "" : "pointer-events-none"}`}
        style={
          fill
            ? {
                minWidth: TIMELINE_ARTIFACT_STAGE_WIDTH,
                minHeight: TIMELINE_ARTIFACT_BODY_MIN_HEIGHT,
              }
            : undefined
        }
      >
        <div
          ref={containerRef}
          data-canvas-scroll
          className={`min-h-0 flex-1 overflow-hidden ${
            isPanning ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <div
            ref={trackRef}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? "Timeline — click to add an event" : undefined}
            className="relative w-full"
            style={{
              height: trackHeight,
              minHeight: trackHeight,
            }}
            onClick={handleTrackClick}
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                    }
                  }
                : undefined
            }
          >
            <TimelineAxis
              ticks={ticks}
              segments={axisSegments}
              trackWidth={viewportWidth}
              trackHeight={trackHeight}
              axisY={centerY}
              animating={animating}
            />

            {pendingX != null && (
              <TimelinePendingMarker
                x={pendingX}
                eventIndex={data.events.length}
                axisY={centerY}
              />
            )}

            {displayEvents.map((event, index) => {
              const x = eventPoints[index]?.x ?? eventScreenX(event.at);
              if (
                x < -LABEL_MAX_WIDTH ||
                x > viewportWidth + LABEL_MAX_WIDTH
              )
                return null;
              return (
                <TimelineEventNode
                  key={event.id}
                  event={event}
                  index={index}
                  x={x}
                  scale={scale}
                  axisY={centerY}
                  trackHeight={trackHeight}
                  viewportWidth={viewportWidth}
                  animating={animating}
                  interactive={interactive}
                  showLabel={visibleLabels.has(index)}
                  onDoubleClick={(ev) => {
                    setPopover({
                      mode: "edit",
                      event: ev,
                      x: eventScreenX(ev.at),
                      y: centerY,
                    });
                  }}
                />
              );
            })}

            {interactive && data.events.length === 0 && !popover && (
              <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-canvas-compact text-canvas-muted">
                Click the timeline to add an event
              </p>
            )}

            {popover && interactive && (
              <div data-timeline-no-pan className="contents">
                <TimelineAddPopover
                  at={popover.mode === "add" ? popover.at : popover.event.at}
                  initialLabel={
                    popover.mode === "edit" ? popover.event.label : ""
                  }
                  title={popover.mode === "add" ? "Add event" : "Edit event"}
                  onSave={popover.mode === "add" ? handleSaveNew : handleSaveEdit}
                  onCancel={() => setPopover(null)}
                  onDelete={popover.mode === "edit" ? handleDelete : undefined}
                  onAtChange={
                    popover.mode === "add"
                      ? (at) => setPopover({ ...popover, at })
                      : undefined
                  }
                  style={{
                    left: Math.min(
                      Math.max(pendingX ?? popover.x, 112),
                      Math.max(viewportWidth - 112, 112),
                    ),
                    top: Math.min(popover.y, trackHeight - 160),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </ArtifactContentStage>
  );
}
