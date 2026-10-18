"use client";

import { isConnectionHidden } from "@/lib/chatThreads";
import { useHiddenCardIds } from "@/hooks/useHiddenCardIds";
import {
  ConnectorStyle,
  useCanvasStore,
} from "@/lib/store";
import { getConnectionCardBounds } from "@/lib/canvasMeasure";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import { ConnectorPathGroup } from "@/components/ConnectorPathGroup";
import {
  buildPlugConnectorPath,
  connectorMarkerSizes,
  isLateralBranchConnection,
  plugAnchorAt,
  plugAnchorAtWorldPoint,
  resolveConnectionAnchors,
} from "@/lib/plugConnector";
import { connectorColour } from "@/lib/design/tokens";
import { compensatedStrokeWidth } from "@/lib/zoomDisplay";
import { isConversationCard } from "@/lib/conversationCard";


const BASE_STROKE_SCREEN = 1.75;

const HIT_STROKE_SCREEN = 14;



const COLLAPSED_STUB_LENGTH = 48;

export function Connections() {

  const cards = useCanvasStore((s) => s.cards);

  const connections = useCanvasStore((s) => s.connections);
  const collapsedCardIds = useCanvasStore((s) => s.collapsedCardIds);
  const hiddenCardIds = useHiddenCardIds();

  const threads = useCanvasStore((s) => s.threads);

  const viewportSettledScale = useCanvasStore((s) => s.viewportSettledScale);

  const connectorStyle = useCanvasStore((s) => s.connectorStyle);

  const recentConnectionId = useCanvasStore((s) => s.recentConnectionId);
  const clearRecentConnection = useCanvasStore((s) => s.clearRecentConnection);
  const tuning = RESOLVED_CANVAS_TUNING;



  const strokeWidth = compensatedStrokeWidth(

    BASE_STROKE_SCREEN,

    viewportSettledScale,

    BASE_STROKE_SCREEN,

  );

  const hitWidth = compensatedStrokeWidth(

    HIT_STROKE_SCREEN,

    viewportSettledScale,

    HIT_STROKE_SCREEN,

  );



  return (

    <>

      <svg

        className="absolute left-0 top-0"

        style={{
          overflow: "visible",
        }}

        width={1}

        height={1}

      >

        {connections.map((conn) => {

          const from = cards[conn.from];

          const to = cards[conn.to];

          if (!from || !to) return null;

          if (isConnectionHidden(useCanvasStore.getState(), conn)) {
            if (
              hiddenCardIds.has(conn.to) &&
              !hiddenCardIds.has(conn.from)
            ) {
              const { w, h } = getConnectionCardBounds(from, tuning);
              if (isLateralBranchConnection(conn.fromSide)) {
                const fromSide = (conn.fromSide ?? "right") as "left" | "right";
                const toSide = fromSide === "left" ? "right" : "left";
                const fromAnchor = plugAnchorAt(
                  from.position.x,
                  from.position.y,
                  w,
                  h,
                  fromSide,
                );
                const stubEnd = plugAnchorAtWorldPoint(
                  fromAnchor.px +
                    (fromSide === "left"
                      ? -COLLAPSED_STUB_LENGTH
                      : COLLAPSED_STUB_LENGTH),
                  fromAnchor.py,
                  fromSide,
                );
                const { d } = buildPlugConnectorPath(
                  fromAnchor,
                  stubEnd,
                  fromSide,
                  toSide,
                  connectorStyle,
                );
                const stroke =
                  connectorColour(threads[from.threadId]?.accentColour);
                return (
                  <g key={conn.id}>
                    <ConnectorPathGroup
                      d={d}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      fromAnchor={fromAnchor}
                      toAnchor={stubEnd}
                      toSide={toSide}
                      viewportScale={viewportSettledScale}
                      dashed
                      opacity={0.55}
                      showTargetPlug={false}
                    />
                  </g>
                );
              }
              const isBottomFollowUp =
                conn.fromSide === "bottom" || conn.fromSide == null;
              // A minimized card gets no plug/stub underneath it.
              if (isBottomFollowUp && collapsedCardIds.includes(conn.from)) {
                return null;
              }
              if (isBottomFollowUp) {
                const fromSide = "bottom" as const;
                const toSide = "top" as const;
                const fromAnchor = plugAnchorAt(
                  from.position.x,
                  from.position.y,
                  w,
                  h,
                  fromSide,
                );
                const stubEnd = {
                  px: fromAnchor.px,
                  py: fromAnchor.py + COLLAPSED_STUB_LENGTH,
                  tx: 0,
                  ty: 1,
                };
                const { d } = buildPlugConnectorPath(
                  fromAnchor,
                  stubEnd,
                  fromSide,
                  toSide,
                  connectorStyle,
                );
                const stroke =
                  connectorColour(threads[from.threadId]?.accentColour);
                return (
                  <g key={conn.id}>
                    <ConnectorPathGroup
                      d={d}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      fromAnchor={fromAnchor}
                      toAnchor={stubEnd}
                      toSide={toSide}
                      viewportScale={viewportSettledScale}
                      dashed
                      opacity={0.55}
                      showTargetPlug={false}
                    />
                  </g>
                );
              }
            }
            return null;
          }

          const isConversationLink =
            isConversationCard(from) && isConversationCard(to);

          const {
            fromAnchor: a,
            toAnchor: b,
            fromSide,
            toSide,
          } = resolveConnectionAnchors(conn, from, to, tuning);

          const { plugOuterRadius } = connectorMarkerSizes(viewportSettledScale);
          const { d } = buildPlugConnectorPath(
            a,
            b,
            fromSide,
            toSide,
            connectorStyle,
            isConversationLink
              ? undefined
              : { startInset: plugOuterRadius, endInset: plugOuterRadius },
          );



          const stroke =

            connectorColour(threads[from.threadId]?.accentColour);

          return (
            <g key={conn.id}>
              <ConnectorPathGroup
                d={d}
                stroke={stroke}
                strokeWidth={strokeWidth}
                fromAnchor={a}
                toAnchor={b}
                toSide={toSide}
                viewportScale={viewportSettledScale}
                opacity={0.85}
                hitWidth={hitWidth}
                showSourcePlug={!isConversationLink}
                showTargetPlug={!isConversationLink}
                drawIn={conn.id === recentConnectionId}
                onDrawComplete={
                  conn.id === recentConnectionId
                    ? clearRecentConnection
                    : undefined
                }
              />
            </g>
          );

        })}

      </svg>



    </>

  );

}

