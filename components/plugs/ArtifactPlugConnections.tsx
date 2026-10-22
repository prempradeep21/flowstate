"use client";

import {
  useNodeDragFrame,
  withNodeDragOffset,
} from "@/hooks/useNodeDragFrame";
import { useCanvasStore } from "@/lib/store";
import {
  PACK_CONNECTOR_STROKE_PX,
  usePackConnector,
} from "@/hooks/usePackConnector";
import { getArtifactBounds } from "@/lib/canvasNodeBounds";
import {
  branchTargetAnchorY,
  getConnectionCardBounds,
} from "@/lib/canvasMeasure";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import {
  LIFTED_CONNECTOR_Z,
  useLiftedConnector,
} from "@/hooks/useLiftedConnector";
import { ConnectorPathGroup } from "@/components/ConnectorPathGroup";
import {
  buildPlugConnectorPath,
  CONNECTOR_STROKE_PX,
  plugAnchorAt,
} from "@/lib/plugConnector";

import { connectorColour } from "@/lib/design/tokens";


export function ArtifactPlugConnections() {
  const artifactPlugConnections = useCanvasStore((s) => s.artifactPlugConnections);
  const cards = useCanvasStore((s) => s.cards);
  const threads = useCanvasStore((s) => s.threads);
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const canvasArtifactNodes = useCanvasStore((s) => s.canvasArtifactNodes);
  const connectorStyle = useCanvasStore((s) => s.connectorStyle);
  const recentArtifactPlugId = useCanvasStore((s) => s.recentArtifactPlugId);
  const clearRecentArtifactPlug = useCanvasStore((s) => s.clearRecentArtifactPlug);
  const chatsGloballyHidden = useCanvasStore((s) => s.chatsGloballyHidden);
  // Follow live node drags — the store only moves on release.
  const dragFrame = useNodeDragFrame();
  const tuning = RESOLVED_CANVAS_TUNING;
  // Pack plug-link colour (Frost): one ink tint for every plug kind.
  const packConnector = usePackConnector();

  // Links of the selection rise above every node with it.
  const isLifted = useLiftedConnector();
  if (artifactPlugConnections.length === 0 || chatsGloballyHidden) return null;


  const renderLink = (conn: (typeof artifactPlugConnections)[number]) => {
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
            stroke={packConnector?.plugLink ?? stroke}
            strokeWidth={
              packConnector ? PACK_CONNECTOR_STROKE_PX : CONNECTOR_STROKE_PX
            }
            packPlugs={packConnector != null}
            packPlugMark={packConnector?.emphasis}
            fromAnchor={fromAnchor}
            toAnchor={toAnchor}
            toSide={conn.toSide}
            opacity={
              conn.id === recentArtifactPlugId || packConnector ? 1 : 0.85
            }
            showTargetPlug={false}
            drawIn={conn.id === recentArtifactPlugId}
            onDrawComplete={
              conn.id === recentArtifactPlugId
                ? clearRecentArtifactPlug
                : undefined
            }
          />
        );
};
  const lifted = artifactPlugConnections.filter((c) =>
    isLifted(c.cardId, { kind: "artifact", id: c.artifactNodeId }),
  );
  const resting = artifactPlugConnections.filter(
    (c) => !isLifted(c.cardId, { kind: "artifact", id: c.artifactNodeId }),
  );

  return (
    <>
    <svg
      className="pointer-events-none absolute left-0 top-0 z-[14]"
      style={{
        overflow: "visible",
      }}
      width={1}
      height={1}
      aria-hidden
    >
      {resting.map(renderLink)}
    </svg>
    {lifted.length > 0 ? (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      style={{
        zIndex: LIFTED_CONNECTOR_Z,
        overflow: "visible",
      }}
      width={1}
      height={1}
      aria-hidden
    >
      {lifted.map(renderLink)}
    </svg>
    ) : null}
    </>
  );
}
