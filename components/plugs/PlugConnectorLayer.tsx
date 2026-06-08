"use client";

import { useCanvasStore, type CardSide } from "@/lib/store";
import { getArtifactBounds } from "@/lib/canvasNodeBounds";
import { getCanvasAssetBounds } from "@/lib/canvasAssetBounds";
import { getConnectionCardBounds } from "@/lib/canvasMeasure";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import { ConnectorPathGroup } from "@/components/ConnectorPathGroup";
import {
  buildPlugConnectorPath,
  plugAnchorAt,
  plugAnchorAtWorldPoint,
} from "@/lib/plugConnector";
import { compensatedStrokeWidth } from "@/lib/zoomDisplay";

import { CANVAS_CONNECTOR } from "@/lib/design/tokens";

const STROKE_FALLBACK = CANVAS_CONNECTOR;
const BASE_STROKE_SCREEN = 1.75;

export function PlugConnectorLayer() {
  const plugDrag = useCanvasStore((s) => s.plugDrag);
  const cards = useCanvasStore((s) => s.cards);
  const threads = useCanvasStore((s) => s.threads);
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const canvasArtifactNodes = useCanvasStore((s) => s.canvasArtifactNodes);
  const canvasAssets = useCanvasStore((s) => s.canvasAssets);
  const canvasAssetNodes = useCanvasStore((s) => s.canvasAssetNodes);
  const connectorStyle = useCanvasStore((s) => s.connectorStyle);
  const viewportSettledScale = useCanvasStore((s) => s.viewportSettledScale);
  const tuning = RESOLVED_CANVAS_TUNING;

  if (!plugDrag) return null;

  const strokeWidth = compensatedStrokeWidth(
    BASE_STROKE_SCREEN,
    viewportSettledScale,
    BASE_STROKE_SCREEN,
  );

  let fromAnchor;
  let stroke: string = STROKE_FALLBACK;
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
    const { w, h } = getConnectionCardBounds(card, tuning);
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
  } else if (plugDrag.kind === "artifact") {
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
  } else {
    const node = canvasAssetNodes[plugDrag.assetNodeId];
    if (!node) return null;
    const asset = canvasAssets[node.assetId];
    const { w, h } = getCanvasAssetBounds(node, asset);
    fromSide = plugDrag.fromSide;
    toSide = plugDrag.fromSide === "left" ? "right" : "left";
    fromAnchor = plugAnchorAt(
      node.position.x,
      node.position.y,
      w,
      h,
      fromSide,
    );
    stroke = "#7C9EFF";
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
      <ConnectorPathGroup
        d={d}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fromAnchor={fromAnchor}
        toAnchor={end}
        toSide={toSide}
        viewportScale={viewportSettledScale}
        dashed={dashed}
        opacity={0.85}
        showTargetArrow={false}
      />
    </svg>
  );
}
