"use client";

import {
  LIFTED_CONNECTOR_Z,
  useLiftedConnector,
} from "@/hooks/useLiftedConnector";
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
import {
  PACK_CONNECTOR_STROKE_PX,
  usePackConnector,
} from "@/hooks/usePackConnector";


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
  // Pack plug-link colour (Frost): one dashed ink tint for every plug kind.
  const packConnector = usePackConnector();

  // Links of the selection rise above every node with it.
  const isLifted = useLiftedConnector();
  if (assetPlugConnections.length === 0 || chatsGloballyHidden) return null;


  const renderLink = (conn: (typeof assetPlugConnections)[number]) => {
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
            stroke={packConnector?.plugLink ?? connectorColour(undefined)}
            strokeWidth={
              packConnector ? PACK_CONNECTOR_STROKE_PX : CONNECTOR_STROKE_PX
            }
            packPlugs={packConnector != null}
            packPlugMark={packConnector?.emphasis}
            fromAnchor={fromAnchor}
            toAnchor={toAnchor}
            toSide={conn.toSide}
            dashed
            opacity={packConnector ? 1 : 0.85}
            showTargetPlug={false}
          />
        );
};
  const lifted = assetPlugConnections.filter((c) =>
    isLifted(c.cardId, { kind: "asset", id: c.assetNodeId }),
  );
  const resting = assetPlugConnections.filter(
    (c) => !isLifted(c.cardId, { kind: "asset", id: c.assetNodeId }),
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
