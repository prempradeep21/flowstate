"use client";

import { ConnectorPathGroup } from "@/components/ConnectorPathGroup";
import { getConnectionCardBounds } from "@/lib/canvasMeasure";
import { getArtifactBounds } from "@/lib/canvasNodeBounds";
import {
  buildPlugConnectorPath,
  plugAnchorAt,
} from "@/lib/plugConnector";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import { useCanvasStore } from "@/lib/store";
import type { ArtifactEdgeScene } from "./timeline";

const BASE_STROKE_SCREEN = 1.75;

/**
 * Dashed artifact→card plug edges, rendered with the same primitives as the
 * product's ArtifactPlugConnections but with timeline-driven opacity (the
 * product's draw-in is a wall-clock CSS animation).
 */
export function DemoArtifactEdges({
  edges,
  viewportScale,
}: {
  edges: ArtifactEdgeScene[];
  viewportScale: number;
}) {
  const cards = useCanvasStore((s) => s.cards);
  const threads = useCanvasStore((s) => s.threads);
  const nodes = useCanvasStore((s) => s.canvasArtifactNodes);
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const tuning = RESOLVED_CANVAS_TUNING;

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0 z-[14]"
      style={{ overflow: "visible" }}
      width={1}
      height={1}
      aria-hidden
    >
      {edges.map((e) => {
        const node = nodes[e.artifactNodeId];
        const card = cards[e.cardId];
        if (!node || !card) return null;
        const art = sessionArtifacts[node.artifactId];
        const { w: aw, h: ah } = getArtifactBounds(node, art);
        const { w: cw, h: ch } = getConnectionCardBounds(card, tuning);
        const fromAnchor = plugAnchorAt(
          node.position.x,
          node.position.y,
          aw,
          ah,
          e.fromSide,
        );
        const toAnchor = plugAnchorAt(
          card.position.x,
          card.position.y,
          cw,
          ch,
          e.toSide,
        );
        const { d } = buildPlugConnectorPath(
          fromAnchor,
          toAnchor,
          e.fromSide,
          e.toSide,
          "orthogonal",
        );
        const stroke = threads[card.threadId]?.accentColour ?? "#B8B5AE";
        return (
          <ConnectorPathGroup
            key={e.id}
            d={d}
            stroke={stroke}
            strokeWidth={BASE_STROKE_SCREEN}
            fromAnchor={fromAnchor}
            toAnchor={toAnchor}
            toSide={e.toSide}
            viewportScale={viewportScale}
            dashed
            opacity={0.85 * e.opacity}
            showTargetArrow={false}
          />
        );
      })}
    </svg>
  );
}
