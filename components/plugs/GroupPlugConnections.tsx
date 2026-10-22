"use client";

import {
  nodeDragOffset,
  useNodeDragFrame,
  withNodeDragOffset,
} from "@/hooks/useNodeDragFrame";
import { useCanvasStore } from "@/lib/store";
import {
  PACK_CONNECTOR_STROKE_PX,
  usePackConnector,
} from "@/hooks/usePackConnector";
import {
  branchTargetAnchorY,
  getConnectionCardBounds,
} from "@/lib/canvasMeasure";
import { computeGroupBounds } from "@/lib/groupBounds";
import { useCanvasNodesState } from "@/hooks/useCanvasNodesState";
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

import { CANVAS_ACCENT, connectorColour } from "@/lib/design/tokens";


/** Persistent dashed lines from group containers to the cards they feed. */
export function GroupPlugConnections() {
  const groupPlugConnections = useCanvasStore((s) => s.groupPlugConnections);
  const groups = useCanvasStore((s) => s.groups);
  const connectorStyle = useCanvasStore((s) => s.connectorStyle);
  const chatsGloballyHidden = useCanvasStore((s) => s.chatsGloballyHidden);
  // Follow live node drags — the store only moves on release.
  const dragFrame = useNodeDragFrame();
  const nodesState = useCanvasNodesState();
  const tuning = RESOLVED_CANVAS_TUNING;
  // Pack plug-link colour (Frost): one dashed ink tint for every plug kind.
  const packConnector = usePackConnector();

  // Links of the selection rise above every node with it.
  const isLifted = useLiftedConnector();
  if (groupPlugConnections.length === 0 || chatsGloballyHidden) return null;


  const renderLink = (conn: (typeof groupPlugConnections)[number]) => {
        const group = groups[conn.groupId];
        const card = nodesState.cards[conn.cardId];
        if (!group || !card) return null;

        const bounds = computeGroupBounds(nodesState, group);
        if (!bounds) return null;
        const groupOffset = nodeDragOffset(dragFrame, "group", group.id);
        const cardPos = withNodeDragOffset(
          dragFrame,
          "card",
          card.id,
          card.position,
        );
        const { w: cardW, h: cardH } = getConnectionCardBounds(card, tuning);

        const fromAnchor = plugAnchorAt(
          bounds.x + groupOffset.dx,
          bounds.y + groupOffset.dy,
          bounds.w,
          bounds.h,
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
            stroke={packConnector?.plugLink ?? connectorColour(undefined, CANVAS_ACCENT)}
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
  const lifted = groupPlugConnections.filter((c) =>
    isLifted(c.cardId, { kind: "group", id: c.groupId }),
  );
  const resting = groupPlugConnections.filter(
    (c) => !isLifted(c.cardId, { kind: "group", id: c.groupId }),
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
