"use client";

import { m, useReducedMotion } from "framer-motion";
import type { TimelineEvent, TimelineScale } from "@/lib/artifactTypes";
import {
  LABEL_EDGE_FADE_PX,
  LABEL_MIN_ZOOM,
  STEM_LENGTH,
  eventColor,
  eventSide,
  formatEventDate,
} from "@/lib/timelineLayout";
import { dropVariants } from "@/lib/motion/variants";
import { formatRichTextForDisplay } from "@/lib/richTextDisplay";

function labelEdgeOpacity(screenX: number, viewportWidth: number): number {
  if (viewportWidth <= 0) return 0;
  const fade = LABEL_EDGE_FADE_PX;
  if (screenX < fade) return Math.max(0, screenX / fade);
  if (screenX > viewportWidth - fade) {
    return Math.max(0, (viewportWidth - screenX) / fade);
  }
  return 1;
}

function EventLabelBlock({
  label,
  at,
  scale,
}: {
  label: string;
  at: string;
  scale: TimelineScale;
}) {
  return (
    <div
      className="flex shrink-0 flex-col items-center text-center transition-opacity duration-200"
      style={{ maxWidth: 160 }}
    >
      <p className="rich-text line-clamp-3 text-xs font-semibold leading-snug text-canvas-ink">
        {formatRichTextForDisplay(label)}
      </p>
      <p className="mt-0.5 whitespace-nowrap text-[10px] text-canvas-muted">
        {formatEventDate(at, scale)}
      </p>
    </div>
  );
}

function EventStem({ color }: { color: string }) {
  return (
    <div
      className="shrink-0"
      style={{ width: 1, height: STEM_LENGTH, backgroundColor: color }}
    />
  );
}

export function TimelineEventNode({
  event,
  index,
  x,
  scale,
  axisY,
  trackHeight,
  zoom,
  viewportWidth,
  onDoubleClick,
  interactive,
  animating,
}: {
  event: TimelineEvent;
  index: number;
  x: number;
  scale: TimelineScale;
  axisY: number;
  trackHeight: number;
  zoom: number;
  viewportWidth: number;
  onDoubleClick?: (event: TimelineEvent) => void;
  interactive?: boolean;
  animating?: boolean;
}) {
  const reduced = useReducedMotion();
  const side = eventSide(index, event.side);
  const color = eventColor(index);
  const dotSize = event.highlight ? 12 : 8;
  const dotRadius = dotSize / 2;

  const showLabels = zoom >= LABEL_MIN_ZOOM;
  const labelOpacity = showLabels
    ? labelEdgeOpacity(x, viewportWidth)
    : 0;

  return (
    <m.div
      className="absolute z-10"
      style={{
        left: x,
        top: 0,
        width: 0,
        height: trackHeight,
        transition: animating
          ? "left 480ms cubic-bezier(0.12, 0.84, 0.27, 1)"
          : undefined,
      }}
      initial={reduced ? "reduced" : "initial"}
      animate={reduced ? "reduced" : "animate"}
      variants={dropVariants}
      data-no-drag={interactive ? true : undefined}
      onDoubleClick={
        interactive && onDoubleClick
          ? (e) => {
              e.stopPropagation();
              onDoubleClick(event);
            }
          : undefined
      }
    >
      {/* Anchor point on the axis — dot sits exactly on the timeline line. */}
      <div
        className="absolute"
        style={{ left: 0, top: axisY, width: 0, height: 0 }}
      >
        {side === "above" && (
          <div
            className="absolute flex flex-col items-center"
            style={{
              left: "50%",
              bottom: dotRadius,
              transform: "translateX(-50%)",
            }}
          >
            <div
              className="mb-2 transition-opacity duration-200"
              style={{
                opacity: labelOpacity,
                pointerEvents: labelOpacity > 0.05 ? "auto" : "none",
              }}
            >
              <EventLabelBlock label={event.label} at={event.at} scale={scale} />
            </div>
            <EventStem color={color} />
          </div>
        )}

        <div
          className="absolute rounded-full ring-2 ring-canvas-card"
          style={{
            width: dotSize,
            height: dotSize,
            left: -dotRadius,
            top: -dotRadius,
            backgroundColor: color,
          }}
        />

        {side === "below" && (
          <div
            className="absolute flex flex-col items-center"
            style={{
              left: "50%",
              top: dotRadius,
              transform: "translateX(-50%)",
            }}
          >
            <EventStem color={color} />
            <div
              className="mt-2 transition-opacity duration-200"
              style={{
                opacity: labelOpacity,
                pointerEvents: labelOpacity > 0.05 ? "auto" : "none",
              }}
            >
              <EventLabelBlock label={event.label} at={event.at} scale={scale} />
            </div>
          </div>
        )}
      </div>
    </m.div>
  );
}
