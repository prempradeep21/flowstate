import { CARD_WIDTH } from "@/lib/canvasNodeBounds";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import {
  buildPlugConnectorPath,
  connectorMarkerSizes,
  resolveConnectionAnchors,
  type PlugAnchor,
} from "@/lib/plugConnector";
import { THREAD_ACCENT_PALETTE } from "@/lib/design/tokens";
import type { CardSide, ConnectorStyle } from "@/lib/store";

export interface DesignSystemConnectorNode {
  id: string;
  label: string;
  position: { x: number; y: number };
  size: { w: number; h: number };
  accentColour: string;
}

export interface DesignSystemConnectorSpec {
  id: string;
  title: string;
  description: string;
  tags: string[];
  fromId: string;
  toId: string;
  fromSide: CardSide;
  toSide: CardSide;
  style: ConnectorStyle;
  stroke: string;
}

export interface DesignSystemConnectorPath {
  spec: DesignSystemConnectorSpec;
  d: string;
  fromAnchor: PlugAnchor;
  toAnchor: PlugAnchor;
  toSide: CardSide;
  strokeWidth: number;
  plugRadius: number;
  arrowSize: number;
}

const CARD_H = 120;

export const DESIGN_SYSTEM_CONNECTOR_NODES: DesignSystemConnectorNode[] = [
  {
    id: "parent",
    label: "Parent card",
    position: { x: 80, y: 60 },
    size: { w: CARD_WIDTH, h: CARD_H },
    accentColour: THREAD_ACCENT_PALETTE[0]!,
  },
  {
    id: "branch-a",
    label: "Branch A",
    position: { x: 620, y: 40 },
    size: { w: CARD_WIDTH, h: CARD_H },
    accentColour: THREAD_ACCENT_PALETTE[1]!,
  },
  {
    id: "branch-b",
    label: "Branch B",
    position: { x: 620, y: 220 },
    size: { w: CARD_WIDTH, h: CARD_H },
    accentColour: THREAD_ACCENT_PALETTE[2]!,
  },
  {
    id: "follow-up",
    label: "Follow-up",
    position: { x: 80, y: 280 },
    size: { w: CARD_WIDTH, h: CARD_H },
    accentColour: THREAD_ACCENT_PALETTE[3]!,
  },
];

export const DESIGN_SYSTEM_CONNECTOR_SPECS: DesignSystemConnectorSpec[] = [
  {
    id: "curvy-branch",
    title: "Curvy branch connector",
    description: "Default thread curve from parent to a lateral branch child.",
    tags: ["curvy", "branch", "thread"],
    fromId: "parent",
    toId: "branch-a",
    fromSide: "right",
    toSide: "left",
    style: "curvy",
    stroke: THREAD_ACCENT_PALETTE[1]!,
  },
  {
    id: "orthogonal-branch",
    title: "Orthogonal branch connector",
    description: "Pipeline-style orthogonal routing between cards.",
    tags: ["orthogonal", "pipeline", "thread"],
    fromId: "parent",
    toId: "branch-b",
    fromSide: "right",
    toSide: "left",
    style: "orthogonal",
    stroke: THREAD_ACCENT_PALETTE[2]!,
  },
  {
    id: "curvy-follow-up",
    title: "Vertical follow-up",
    description: "Bottom-to-top curve for a follow-up question in the same thread.",
    tags: ["curvy", "follow-up", "vertical"],
    fromId: "parent",
    toId: "follow-up",
    fromSide: "bottom",
    toSide: "top",
    style: "curvy",
    stroke: THREAD_ACCENT_PALETTE[0]!,
  },
];

function nodeById(id: string): DesignSystemConnectorNode {
  const node = DESIGN_SYSTEM_CONNECTOR_NODES.find((n) => n.id === id);
  if (!node) throw new Error(`Unknown connector node: ${id}`);
  return node;
}

export function buildDesignSystemConnectorPaths(
  viewportScale = 1,
): DesignSystemConnectorPath[] {
  const { arrowSize } = connectorMarkerSizes(viewportScale);
  const strokeWidth = 1.75 / viewportScale;
  const trimInset = arrowSize * 1.35;

  return DESIGN_SYSTEM_CONNECTOR_SPECS.map((spec) => {
    const from = nodeById(spec.fromId);
    const to = nodeById(spec.toId);
    const resolved = resolveConnectionAnchors(
      { fromSide: spec.fromSide, toSide: spec.toSide },
      {
        id: from.id,
        position: from.position,
        size: from.size,
      },
      {
        id: to.id,
        position: to.position,
        size: to.size,
      },
      RESOLVED_CANVAS_TUNING,
    );
    const geometry = buildPlugConnectorPath(
      resolved.fromAnchor,
      resolved.toAnchor,
      resolved.fromSide,
      resolved.toSide,
      spec.style,
      { trimTargetArrowInset: trimInset },
    );
    const { plugRadius, arrowSize: arrow } = connectorMarkerSizes(viewportScale);

    return {
      spec,
      d: geometry.d,
      fromAnchor: resolved.fromAnchor,
      toAnchor: resolved.toAnchor,
      toSide: resolved.toSide,
      strokeWidth,
      plugRadius,
      arrowSize: arrow,
    };
  });
}

export const DESIGN_SYSTEM_CONNECTOR_VIEWBOX = {
  width: 1120,
  height: 440,
} as const;
