"use client";

import { useCanvasStore } from "@/lib/store";
import { getArtifactBounds } from "@/lib/canvasNodeBounds";
import {
  branchTargetAnchorY,
  getConnectionCardBounds,
} from "@/lib/canvasMeasure";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import { ConnectorPathGroup } from "@/components/ConnectorPathGroup";
import { buildPlugConnectorPath, plugAnchorAt } from "@/lib/plugConnector";
import { compensatedStrokeWidth } from "@/lib/zoomDisplay";

import { CANVAS_CONNECTOR } from "@/lib/design/tokens";

const STROKE_FALLBACK = CANVAS_CONNECTOR;
const BASE_STROKE_SCREEN = 1.75;

export function ArtifactPlugConnections() {
  const artifactPlugConnections = useCanvasStore((s) => s.artifactPlugConnections);
  const cards = useCanvasStore((s) => s.cards);
  const threads = useCanvasStore((s) => s.threads);
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const canvasArtifactNodes = useCanvasStore((s) => s.canvasArtifactNodes);
  const connectorStyle = useCanvasStore((s) => s.connectorStyle);
  const viewportSettledScale = useCanvasStore((s) => s.viewportSettledScale);
  const canvasLoadReveal = useCanvasStore((s) => s.canvasLoadReveal);
  const hideForLoadReveal =
    canvasLoadReveal?.phase === "pending" ||
    canvasLoadReveal?.phase === "running";
  const tuning = RESOLVED_CANVAS_TUNING;

  if (artifactPlugConnections.length === 0) return null;

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
      {artifactPlugConnections.map((conn) => {
        const node = canvasArtifactNodes[conn.artifactNodeId];
        const card = cards[conn.cardId];
        if (!node || !card) return null;

        const art = sessionArtifacts[node.artifactId];
        const { w: artW, h: artH } = getArtifactBounds(node, art);
        const { w: cardW, h: cardH } = getConnectionCardBounds(card, tuning);

        const fromAnchor = plugAnchorAt(
          node.position.x,
          node.position.y,
          artW,
          artH,
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

        const artCard = cards[node.sourceCardId];
        const stroke =
          (artCard && threads[artCard.threadId]?.accentColour) ??
          STROKE_FALLBACK;

        return (
          <ConnectorPathGroup
            key={conn.id}
            d={d}
            stroke={stroke}
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
