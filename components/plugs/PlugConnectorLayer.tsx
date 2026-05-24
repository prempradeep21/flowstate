"use client";

import { useCanvasStore, type CardSide } from "@/lib/store";
import { getArtifactBounds, getCardBounds } from "@/lib/canvasNodeBounds";
import {
  buildPlugConnectorPath,
  plugAnchorAt,
  plugAnchorAtWorldPoint,
} from "@/lib/plugConnector";
import { compensatedStrokeWidth } from "@/lib/zoomDisplay";

const STROKE_FALLBACK = "#B8B5AE";
const BASE_STROKE_SCREEN = 1.75;

export function PlugConnectorLayer() {
  const plugDrag = useCanvasStore((s) => s.plugDrag);
  const cards = useCanvasStore((s) => s.cards);
  const threads = useCanvasStore((s) => s.threads);
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const canvasArtifactNodes = useCanvasStore((s) => s.canvasArtifactNodes);
  const connectorStyle = useCanvasStore((s) => s.connectorStyle);
  const viewport = useCanvasStore((s) => s.viewport);

  if (!plugDrag) return null;

  const strokeWidth = compensatedStrokeWidth(
    BASE_STROKE_SCREEN,
    viewport.scale,
    BASE_STROKE_SCREEN,
  );

  let fromAnchor;
  let stroke = STROKE_FALLBACK;
  let dashed = false;
  let fromSide: CardSide;
  let toSide: CardSide;

  const end = plugAnchorAtWorldPoint(
    plugDrag.pointerWorld.x,
    plugDrag.pointerWorld.y,
    plugDrag.fromSide,
  );

  if (plugDrag.kind === "branch") {
    const card = cards[plugDrag.sourceCardId];
    if (!card) return null;
    const { w, h } = getCardBounds(card);
    fromSide = plugDrag.fromSide;
    toSide = plugDrag.fromSide === "left" ? "right" : "left";
    fromAnchor = plugAnchorAt(
      card.position.x,
      card.position.y,
      w,
      h,
      fromSide,
    );
    stroke = threads[card.threadId]?.accentColour ?? STROKE_FALLBACK;
  } else {
    const node = canvasArtifactNodes[plugDrag.artifactNodeId];
    if (!node) return null;
    const art = sessionArtifacts[node.artifactId];
    const { w, h } = getArtifactBounds(node, art);
    fromSide = plugDrag.fromSide;
    toSide = plugDrag.fromSide === "left" ? "right" : "left";
    fromAnchor = plugAnchorAt(
      node.position.x,
      node.position.y,
      w,
      h,
      fromSide,
    );
    const artCard = cards[node.sourceCardId];
    stroke =
      (artCard && threads[artCard.threadId]?.accentColour) ??
      STROKE_FALLBACK;
    dashed = true;
  }

  const { d } = buildPlugConnectorPath(
    fromAnchor,
    end,
    fromSide,
    toSide,
    connectorStyle,
  );

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0 z-[15]"
      style={{ overflow: "visible" }}
      width={1}
      height={1}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={0.85}
        strokeDasharray={dashed ? "6 5" : undefined}
      />
    </svg>
  );
}
