"use client";

import { m, useReducedMotion } from "framer-motion";
import type { TimelineEvent, TimelineScale } from "@/lib/artifactTypes";
import {
  LABEL_EDGE_FADE_PX,
  LABEL_MAX_WIDTH,
  STEM_LENGTH,
  eventColor,
  eventSide,
  eventTextColor,
  formatEventDate,
} from "@/lib/timelineLayout";
import { dropVariants } from "@/lib/motion/variants";
import { formatRichTextForDisplay } from "@/lib/richTextDisplay";

function labelEdgeOpacity(screenX: number, viewportWidth: number): number {
  if (viewportWidth <= 0) return 1;
  const fade = LABEL_EDGE_FADE_PX;
  if (screenX < fade) return Math.max(0, screenX / fade);
  if (screenX > viewportWidth - fade) {
    return Math.max(0, (viewportWidth - screenX) / fade);
  }
  return 1;
}

/** Dashed connector from the axis dot up/down to the label cluster. */
function EventConnector() {
  return (
    <div
      aria-hidden
      className="shrink-0 border-l border-dashed border-canvas-muted/45"
      style={{ height: STEM_LENGTH }}
    />
  );
}

function EventLabelBlock({
  label,
  at,
  scale,
  color,
  textColor,
}: {
  label: string;
  at: string;
  scale: TimelineScale;
  color: string;
  textColor: string;
}) {
  return (
    <div
      className="flex shrink-0 flex-col items-center text-center"
      style={{ maxWidth: LABEL_MAX_WIDTH }}
    >
      <p className="mb-1.5 whitespace-nowrap text-canvas-compact font-medium text-canvas-muted">
        {formatEventDate(at, scale)}
      </p>
      <div
        className="max-w-full truncate rounded-md px-2.5 py-1 text-canvas-body font-semibold leading-snug shadow-sm"
        style={{ backgroundColor: color, color: textColor }}
      >
        <span className="rich-text">{formatRichTextForDisplay(label)}</span>
      </div>
    </div>
  );
}

export function TimelineEventNode({
  event,
  index,
  x,
  scale,
  axisY,
  trackHeight,
  viewportWidth,
  onDoubleClick,
  interactive,
  animating,
  showLabel = true,
}: {
  event: TimelineEvent;
  index: number;
  x: number;
  scale: TimelineScale;
  axisY: number;
  trackHeight: number;
  viewportWidth: number;
  onDoubleClick?: (event: TimelineEvent) => void;
  interactive?: boolean;
  animating?: boolean;
  showLabel?: boolean;
}) {
  const reduced = useReducedMotion();
  const side = eventSide(index, event.side);
  const color = eventColor(index);
  const textColor = eventTextColor(index);
  const dotSize = event.highlight ? 15 : 11;
  const dotRadius = dotSize / 2;

  const labelOpacity = showLabel ? labelEdgeOpacity(x, viewportWidth) : 0;
  const labelInteractive = labelOpacity > 0.05;

  const labelCluster = (
    <div
      className="flex flex-col items-center transition-opacity duration-300 ease-out"
      style={{
        opacity: labelOpacity,
        pointerEvents: labelInteractive ? "auto" : "none",
      }}
    >
      {side === "above" ? (
        <>
          <EventLabelBlock
            label={event.label}
            at={event.at}
            scale={scale}
            color={color}
            textColor={textColor}
          />
          <EventConnector />
        </>
      ) : (
        <>
          <EventConnector />
          <EventLabelBlock
            label={event.label}
            at={event.at}
            scale={scale}
            color={color}
            textColor={textColor}
          />
        </>
      )}
    </div>
  );

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
            {labelCluster}
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
            {labelCluster}
          </div>
        )}
      </div>
    </m.div>
  );
}
