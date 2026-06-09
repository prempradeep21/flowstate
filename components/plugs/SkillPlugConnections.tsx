"use client";

import { ConnectorPathGroup } from "@/components/ConnectorPathGroup";
import { getCanvasSkillBounds } from "@/lib/canvasSkillBounds";
import {
  branchTargetAnchorY,
  getConnectionCardBounds,
} from "@/lib/canvasMeasure";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import { CANVAS_CONNECTOR } from "@/lib/design/tokens";
import { buildPlugConnectorPath, plugAnchorAt } from "@/lib/plugConnector";
import { useCanvasStore } from "@/lib/store";
import { compensatedStrokeWidth } from "@/lib/zoomDisplay";

const STROKE_FALLBACK = CANVAS_CONNECTOR;
const BASE_STROKE_SCREEN = 1.75;

export function SkillPlugConnections() {
  const skillPlugConnections = useCanvasStore((s) => s.skillPlugConnections);
  const cards = useCanvasStore((s) => s.cards);
  const canvasSkillNodes = useCanvasStore((s) => s.canvasSkillNodes);
  const canvasSkills = useCanvasStore((s) => s.canvasSkills);
  const connectorStyle = useCanvasStore((s) => s.connectorStyle);
  const viewportSettledScale = useCanvasStore((s) => s.viewportSettledScale);
  const canvasLoadReveal = useCanvasStore((s) => s.canvasLoadReveal);
  const hideForLoadReveal =
    canvasLoadReveal?.phase === "pending" ||
    canvasLoadReveal?.phase === "running";
  const tuning = RESOLVED_CANVAS_TUNING;

  if (skillPlugConnections.length === 0) return null;

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
      {skillPlugConnections.map((conn) => {
        const node = canvasSkillNodes[conn.skillNodeId];
        const card = cards[conn.cardId];
        if (!node || !card) return null;

        const skill = canvasSkills[node.skillId];
        const { w: skillW, h: skillH } = getCanvasSkillBounds(node, skill);
        const { w: cardW, h: cardH } = getConnectionCardBounds(card, tuning);

        const fromAnchor = plugAnchorAt(
          node.position.x,
          node.position.y,
          skillW,
          skillH,
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
            stroke={STROKE_FALLBACK}
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
