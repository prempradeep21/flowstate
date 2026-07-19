"use client";

import { useCanvasStore } from "@/lib/store";
import {
  branchTargetAnchorY,
  getConnectionCardBounds,
} from "@/lib/canvasMeasure";
import { computeGroupBounds } from "@/lib/groupBounds";
import { useCanvasNodesState } from "@/hooks/useCanvasNodesState";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import { ConnectorPathGroup } from "@/components/ConnectorPathGroup";
import { buildPlugConnectorPath, plugAnchorAt } from "@/lib/plugConnector";
import { compensatedStrokeWidth } from "@/lib/zoomDisplay";

import { CANVAS_ACCENT } from "@/lib/design/tokens";

const BASE_STROKE_SCREEN = 1.75;

/** Persistent dashed lines from group containers to the cards they feed. */
export function GroupPlugConnections() {
  const groupPlugConnections = useCanvasStore((s) => s.groupPlugConnections);
  const groups = useCanvasStore((s) => s.groups);
  const connectorStyle = useCanvasStore((s) => s.connectorStyle);
  const viewportSettledScale = useCanvasStore((s) => s.viewportSettledScale);
  const canvasLoadReveal = useCanvasStore((s) => s.canvasLoadReveal);
  const chatsGloballyHidden = useCanvasStore((s) => s.chatsGloballyHidden);
  const nodesState = useCanvasNodesState();
  const hideForLoadReveal =
    canvasLoadReveal?.phase === "pending" ||
    canvasLoadReveal?.phase === "running";
  const tuning = RESOLVED_CANVAS_TUNING;

  if (groupPlugConnections.length === 0 || chatsGloballyHidden) return null;

  const strokeWidth = compensatedStrokeWidth(
    BASE_STROKE_SCREEN,
    viewportSettledScale,
    BASE_STROKE_SCREEN,
  );

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0 z-[14]"
      style={{
        overflow: "visible",
        opacity: hideForLoadReveal ? 0 : 1,
      }}
      width={1}
      height={1}
      aria-hidden
    >
      {groupPlugConnections.map((conn) => {
        const group = groups[conn.groupId];
        const card = nodesState.cards[conn.cardId];
        if (!group || !card) return null;

        const bounds = computeGroupBounds(nodesState, group);
        if (!bounds) return null;
        const { w: cardW, h: cardH } = getConnectionCardBounds(card, tuning);

        const fromAnchor = plugAnchorAt(
          bounds.x,
          bounds.y,
          bounds.w,
          bounds.h,
          conn.fromSide,
        );

        const toPyOverride =
          conn.toSide === "left" || conn.toSide === "right"
            ? branchTargetAnchorY(card.id, card.position.y, cardH)
            : undefined;

        const toAnchor = plugAnchorAt(
          card.position.x,
          card.position.y,
          cardW,
          cardH,
          conn.toSide,
          toPyOverride != null ? { pyOverride: toPyOverride } : undefined,
        );

        const { d } = buildPlugConnectorPath(
          fromAnchor,
          toAnchor,
          conn.fromSide,
          conn.toSide,
          connectorStyle,
        );

        return (
          <ConnectorPathGroup
            key={conn.id}
            d={d}
            stroke={CANVAS_ACCENT}
            strokeWidth={strokeWidth}
            fromAnchor={fromAnchor}
            toAnchor={toAnchor}
            toSide={conn.toSide}
            viewportScale={viewportSettledScale}
            dashed
            opacity={0.85}
            showTargetArrow={false}
          />
        );
      })}
    </svg>
  );
}
