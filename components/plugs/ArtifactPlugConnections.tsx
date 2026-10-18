"use client";

import {
  useNodeDragFrame,
  withNodeDragOffset,
} from "@/hooks/useNodeDragFrame";
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

import { connectorColour } from "@/lib/design/tokens";

const BASE_STROKE_SCREEN = 1.75;

export function ArtifactPlugConnections() {
  const artifactPlugConnections = useCanvasStore((s) => s.artifactPlugConnections);
  const cards = useCanvasStore((s) => s.cards);
  const threads = useCanvasStore((s) => s.threads);
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const canvasArtifactNodes = useCanvasStore((s) => s.canvasArtifactNodes);
  const connectorStyle = useCanvasStore((s) => s.connectorStyle);
  const viewportSettledScale = useCanvasStore((s) => s.viewportSettledScale);
  const recentArtifactPlugId = useCanvasStore((s) => s.recentArtifactPlugId);
  const clearRecentArtifactPlug = useCanvasStore((s) => s.clearRecentArtifactPlug);
  const chatsGloballyHidden = useCanvasStore((s) => s.chatsGloballyHidden);
  // Follow live node drags — the store only moves on release.
  const dragFrame = useNodeDragFrame();
  const tuning = RESOLVED_CANVAS_TUNING;

  if (artifactPlugConnections.length === 0 || chatsGloballyHidden) return null;

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
      }}
      width={1}
      height={1}
      aria-hidden
    >
      {artifactPlugConnections.map((conn) => {
        const node = canvasArtifactNodes[conn.artifactNodeId];
        const card = cards[conn.cardId];
        if (!node || !card) return null;
        const nodePos = withNodeDragOffset(
          dragFrame,
          "artifact",
          node.id,
          node.position,
        );
        const cardPos = withNodeDragOffset(
          dragFrame,
          "card",
          card.id,
          card.position,
        );

        const art = node.artifactId
          ? sessionArtifacts[node.artifactId]
          : undefined;
        const { w: artW, h: artH } = getArtifactBounds(node, art);
        const { w: cardW, h: cardH } = getConnectionCardBounds(card, tuning);

        const fromAnchor = plugAnchorAt(
          nodePos.x,
          nodePos.y,
          artW,
          artH,
          conn.fromSide,
        );

        const toPyOverride =
          conn.toSide === "left" || conn.toSide === "right"
            ? branchTargetAnchorY(card.id, cardPos.y, cardH)
            : undefined;

        const toAnchor = plugAnchorAt(
          cardPos.x,
          cardPos.y,
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
        const stroke = connectorColour(
          artCard ? threads[artCard.threadId]?.accentColour : undefined,
        );

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
            opacity={conn.id === recentArtifactPlugId ? 1 : 0.85}
            showTargetPlug={false}
            drawIn={conn.id === recentArtifactPlugId}
            onDrawComplete={
              conn.id === recentArtifactPlugId
                ? clearRecentArtifactPlug
                : undefined
            }
          />
        );
      })}
    </svg>
  );
}
