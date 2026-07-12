import { isConnectionHidden } from "@/lib/chatThreads";
import { getConnectionCardBounds } from "@/lib/canvasMeasure";
import {
  buildPlugConnectorPath,
  connectorMarkerSizes,
  isLateralBranchConnection,
  plugAnchorAt,
  plugAnchorAtWorldPoint,
  resolveConnectionAnchors,
  type PlugAnchor,
} from "@/lib/plugConnector";
import { CANVAS_CONNECTOR } from "@/lib/design/tokens";
import type { ResolvedCanvasTuning } from "@/lib/canvasTuning";
import type {
  Card,
  CardSide,
  Connection,
  ConnectorStyle,
  Thread,
} from "@/lib/store";

const STROKE_FALLBACK = CANVAS_CONNECTOR;
const COLLAPSED_STUB_LENGTH = 48;

export interface ConnectionGeometryState {
  cards: Record<string, Card>;
  threads: Record<string, Thread>;
  connectorStyle: ConnectorStyle;
  collapsedCardIds: string[];
  hiddenCardIds: Set<string>;
  /** Full store state for isConnectionHidden (thread visibility rules). */
  hiddenCheckState: Parameters<typeof isConnectionHidden>[0];
}

export interface RenderableConnection {
  connId: string;
  /** SVG path data — canvas2d consumes it via Path2D. */
  d: string;
  stroke: string;
  fromAnchor: PlugAnchor;
  toAnchor: PlugAnchor;
  toSide: CardSide;
  dashed: boolean;
  opacity: number;
  showSourcePlug: boolean;
  showTargetArrow: boolean;
  /** Hoverable connections expose a midpoint for the style picker. */
  midX: number | null;
  midY: number | null;
  hoverable: boolean;
}

/**
 * Pure extraction of Connections.tsx's per-connection resolution (hidden
 * stubs, anchors, path building, styling) so the canvas renderer and the
 * legacy SVG renderer share EXACT geometry. `dragOffsets` shifts endpoint
 * cards by the live gesture delta so connections track imperative drags.
 */
export function resolveConnectionRender(
  conn: Connection,
  state: ConnectionGeometryState,
  tuning: ResolvedCanvasTuning,
  viewportScale: number,
  dragOffsets?: ReadonlyMap<string, { dx: number; dy: number }>,
): RenderableConnection | null {
  const rawFrom = state.cards[conn.from];
  const rawTo = state.cards[conn.to];
  if (!rawFrom || !rawTo) return null;

  const offsetCard = (card: Card): Card => {
    const off = dragOffsets?.get(card.id);
    if (!off || (off.dx === 0 && off.dy === 0)) return card;
    return {
      ...card,
      position: {
        x: card.position.x + off.dx,
        y: card.position.y + off.dy,
      },
    };
  };
  const from = offsetCard(rawFrom);
  const to = offsetCard(rawTo);

  if (isConnectionHidden(state.hiddenCheckState, conn)) {
    if (state.hiddenCardIds.has(conn.to) && !state.hiddenCardIds.has(conn.from)) {
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
          state.connectorStyle,
        );
        return {
          connId: conn.id,
          d,
          stroke: state.threads[from.threadId]?.accentColour ?? STROKE_FALLBACK,
          fromAnchor,
          toAnchor: stubEnd,
          toSide,
          dashed: true,
          opacity: 0.55,
          showSourcePlug: true,
          showTargetArrow: false,
          midX: null,
          midY: null,
          hoverable: false,
        };
      }
      const isBottomFollowUp =
        conn.fromSide === "bottom" || conn.fromSide == null;
      // A minimized card gets no plug/stub underneath it.
      if (isBottomFollowUp && state.collapsedCardIds.includes(conn.from)) {
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
          state.connectorStyle,
        );
        return {
          connId: conn.id,
          d,
          stroke: state.threads[from.threadId]?.accentColour ?? STROKE_FALLBACK,
          fromAnchor,
          toAnchor: stubEnd,
          toSide,
          dashed: true,
          opacity: 0.55,
          showSourcePlug: true,
          showTargetArrow: false,
          midX: null,
          midY: null,
          hoverable: false,
        };
      }
    }
    return null;
  }

  const isConversationLink =
    from.cardKind === "conversation" && to.cardKind === "conversation";

  const {
    fromAnchor: a,
    toAnchor: b,
    fromSide,
    toSide,
  } = resolveConnectionAnchors(conn, from, to, tuning);

  const { arrowSize } = connectorMarkerSizes(viewportScale);
  const { d, midX, midY } = buildPlugConnectorPath(
    a,
    b,
    fromSide,
    toSide,
    state.connectorStyle,
    isConversationLink
      ? undefined
      : { trimTargetArrowInset: arrowSize * 1.35 },
  );

  return {
    connId: conn.id,
    d,
    stroke: state.threads[from.threadId]?.accentColour ?? STROKE_FALLBACK,
    fromAnchor: a,
    toAnchor: b,
    toSide,
    dashed: false,
    opacity: 0.85,
    showSourcePlug: !isConversationLink,
    showTargetArrow: !isConversationLink && (toSide === "left" || toSide === "right"),
    midX: midX ?? (a.px + b.px) / 2,
    midY: midY ?? (a.py + b.py) / 2,
    hoverable: !isConversationLink,
  };
}
