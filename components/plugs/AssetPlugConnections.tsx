"use client";

import { ConnectorPathGroup } from "@/components/ConnectorPathGroup";
import { getCanvasAssetBounds } from "@/lib/canvasAssetBounds";
import {
  branchTargetAnchorY,
  getConnectionCardBounds,
} from "@/lib/canvasMeasure";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import { connectorColour } from "@/lib/design/tokens";
import {
  buildPlugConnectorPath,
  CONNECTOR_STROKE_PX,
  plugAnchorAt,
} from "@/lib/plugConnector";
import {
  useNodeDragFrame,
  withNodeDragOffset,
} from "@/hooks/useNodeDragFrame";
import { useCanvasStore } from "@/lib/store";


/** Image (asset) plug links — same dashed connector as skill / artifact links. */
export function AssetPlugConnections() {
  const assetPlugConnections = useCanvasStore((s) => s.assetPlugConnections);
  const cards = useCanvasStore((s) => s.cards);
  const canvasAssetNodes = useCanvasStore((s) => s.canvasAssetNodes);
  const canvasAssets = useCanvasStore((s) => s.canvasAssets);
  const connectorStyle = useCanvasStore((s) => s.connectorStyle);
  const chatsGloballyHidden = useCanvasStore((s) => s.chatsGloballyHidden);
  // Follow live node drags — the store only moves on release.
  const dragFrame = useNodeDragFrame();
  const tuning = RESOLVED_CANVAS_TUNING;

  if (assetPlugConnections.length === 0 || chatsGloballyHidden) return null;


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
      {assetPlugConnections.map((conn) => {
        const node = canvasAssetNodes[conn.assetNodeId];
        const card = cards[conn.cardId];
        if (!node || !card) return null;
        const nodePos = withNodeDragOffset(
          dragFrame,
          "asset",
          node.id,
          node.position,
        );
        const cardPos = withNodeDragOffset(
          dragFrame,
          "card",
          card.id,
          card.position,
        );

        const asset = canvasAssets[node.assetId];
        const { w: assetW, h: assetH } = getCanvasAssetBounds(node, asset);
        const { w: cardW, h: cardH } = getConnectionCardBounds(card, tuning);

        const fromAnchor = plugAnchorAt(
          nodePos.x,
          nodePos.y,
          assetW,
          assetH,
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

        return (
          <ConnectorPathGroup
            key={conn.id}
            d={d}
            stroke={connectorColour(undefined)}
            strokeWidth={CONNECTOR_STROKE_PX}
            fromAnchor={fromAnchor}
            toAnchor={toAnchor}
            toSide={conn.toSide}
            dashed
            opacity={0.85}
            showTargetPlug={false}
          />
        );
      })}
    </svg>
  );
}
