import type { CardSide, ConnectorStyle } from "@/lib/store";
import type { ResolvedCanvasTuning } from "@/lib/canvasTuning";
import {
  branchTargetAnchorY,
  getConnectionCardBounds,
} from "@/lib/canvasMeasure";

export interface PlugAnchor {
  px: number;
  py: number;
  tx: number;
  ty: number;
}

export interface PlugPathGeometry {
  d: string;
  midX?: number;
  midY?: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function isVerticalSide(side: CardSide) {
  return side === "top" || side === "bottom";
}

export function isLateralBranchConnection(
  fromSide: CardSide | null | undefined,
): boolean {
  return fromSide === "left" || fromSide === "right";
}

export function plugAnchorAt(
  x: number,
  y: number,
  w: number,
  h: number,
  side: CardSide,
  options?: { pyOverride?: number },
): PlugAnchor {
  switch (side) {
    case "top":
      return { px: x + w / 2, py: y, tx: 0, ty: -1 };
    case "bottom":
      return { px: x + w / 2, py: y + h, tx: 0, ty: 1 };
    case "left":
      return {
        px: x,
        py: options?.pyOverride ?? y + h / 2,
        tx: -1,
        ty: 0,
      };
    case "right":
      return {
        px: x + w,
        py: options?.pyOverride ?? y + h / 2,
        tx: 1,
        ty: 0,
      };
  }
}

export interface ConnectionAnchorInput {
  fromSide?: CardSide | null;
  toSide?: CardSide | null;
}

export interface LayoutCardAnchorInput {
  id: string;
  position: { x: number; y: number };
  size?: { w: number; h: number };
  status?: string;
  cardKind?: "qa" | "conversation";
}

/** Resolve plug anchors for a connection (branch child targets question-block center). */
export function resolveConnectionAnchors(
  conn: ConnectionAnchorInput,
  from: LayoutCardAnchorInput,
  to: LayoutCardAnchorInput,
  tuning: ResolvedCanvasTuning,
): {
  fromAnchor: PlugAnchor;
  toAnchor: PlugAnchor;
  fromSide: CardSide;
  toSide: CardSide;
  fromW: number;
  fromH: number;
  toW: number;
  toH: number;
} {
  const fromSide: CardSide = conn.fromSide ?? "bottom";
  const toSide: CardSide = conn.toSide ?? "top";
  const { w: fromW, h: fromH } = getConnectionCardBounds(from, tuning);
  const { w: toW, h: toH } = getConnectionCardBounds(to, tuning);

  const fromAnchor = plugAnchorAt(
    from.position.x,
    from.position.y,
    fromW,
    fromH,
    fromSide,
  );

  const lateralBranch = isLateralBranchConnection(fromSide);
  const toPyOverride =
    lateralBranch &&
    (toSide === "left" || toSide === "right") &&
    to.cardKind !== "conversation"
      ? branchTargetAnchorY(to.id, to.position.y, toH)
      : undefined;

  const toAnchor = plugAnchorAt(
    to.position.x,
    to.position.y,
    toW,
    toH,
    toSide,
    toPyOverride != null ? { pyOverride: toPyOverride } : undefined,
  );

  return {
    fromAnchor,
    toAnchor,
    fromSide,
    toSide,
    fromW,
    fromH,
    toW,
    toH,
  };
}

/** Card-centre anchors for straight centre-to-centre connectors. */
export function resolveCardCenterAnchors(
  from: LayoutCardAnchorInput,
  to: LayoutCardAnchorInput,
  tuning: ResolvedCanvasTuning,
): { fromAnchor: PlugAnchor; toAnchor: PlugAnchor } {
  const { w: fromW, h: fromH } = getConnectionCardBounds(from, tuning);
  const { w: toW, h: toH } = getConnectionCardBounds(to, tuning);
  return {
    fromAnchor: {
      px: from.position.x + fromW / 2,
      py: from.position.y + fromH / 2,
      tx: 0,
      ty: 0,
    },
    toAnchor: {
      px: to.position.x + toW / 2,
      py: to.position.y + toH / 2,
      tx: 0,
      ty: 0,
    },
  };
}

function buildStraightPath(a: PlugAnchor, b: PlugAnchor): PlugPathGeometry {
  const d = `M ${a.px} ${a.py} L ${b.px} ${b.py}`;
  return { d, midX: (a.px + b.px) / 2, midY: (a.py + b.py) / 2 };
}

function buildCurvyPath(a: PlugAnchor, b: PlugAnchor): PlugPathGeometry {
  const dx = b.px - a.px;
  const dy = b.py - a.py;
  const dist = Math.sqrt(dx * dx + dy * dy);
  // Cap pull at half the distance so the curve's hull never overshoots
  // past the target edge into the node when two cards sit close together.
  const pull = Math.min(clamp(dist * 0.45, 60, 200), dist / 2);

  const cp1x = a.px + a.tx * pull;
  const cp1y = a.py + a.ty * pull;
  const cp2x = b.px + b.tx * pull;
  const cp2y = b.py + b.ty * pull;

  const d = `M ${a.px} ${a.py} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${b.px} ${b.py}`;
  return { d, midX: (a.px + b.px) / 2, midY: (a.py + b.py) / 2 };
}

function routeOrthogonalPoints(
  a: PlugAnchor,
  b: PlugAnchor,
  fromSide: CardSide,
  toSide: CardSide,
): { x: number; y: number }[] {
  const verticalFrom = isVerticalSide(fromSide);
  const verticalTo = isVerticalSide(toSide);

  if (verticalFrom && verticalTo) {
    if (Math.abs(a.px - b.px) < 1) {
      return [
        { x: a.px, y: a.py },
        { x: b.px, y: b.py },
      ];
    }
    const midY = (a.py + b.py) / 2;
    return [
      { x: a.px, y: a.py },
      { x: a.px, y: midY },
      { x: b.px, y: midY },
      { x: b.px, y: b.py },
    ];
  }
  if (!verticalFrom && !verticalTo) {
    if (Math.abs(a.py - b.py) < 1) {
      return [
        { x: a.px, y: a.py },
        { x: b.px, y: b.py },
      ];
    }
    const midX = (a.px + b.px) / 2;
    return [
      { x: a.px, y: a.py },
      { x: midX, y: a.py },
      { x: midX, y: b.py },
      { x: b.px, y: b.py },
    ];
  }
  if (verticalFrom) {
    return [
      { x: a.px, y: a.py },
      { x: a.px, y: b.py },
      { x: b.px, y: b.py },
    ];
  }
  return [
    { x: a.px, y: a.py },
    { x: b.px, y: a.py },
    { x: b.px, y: b.py },
  ];
}

function roundedPolylinePath(
  points: { x: number; y: number }[],
  radius: number,
): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const v1x = curr.x - prev.x;
    const v1y = curr.y - prev.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);
    if (len1 < 0.001 || len2 < 0.001) continue;

    const r1 = Math.min(radius, len1 / 2);
    const r2 = Math.min(radius, len2 / 2);

    const beforeX = curr.x - (v1x / len1) * r1;
    const beforeY = curr.y - (v1y / len1) * r1;
    const afterX = curr.x + (v2x / len2) * r2;
    const afterY = curr.y + (v2y / len2) * r2;

    d += ` L ${beforeX} ${beforeY}`;
    d += ` Q ${curr.x} ${curr.y} ${afterX} ${afterY}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

function buildOrthogonalPath(
  a: PlugAnchor,
  b: PlugAnchor,
  fromSide: CardSide,
  toSide: CardSide,
): PlugPathGeometry {
  const points = routeOrthogonalPoints(a, b, fromSide, toSide);
  const isShortVertical =
    isVerticalSide(fromSide) &&
    isVerticalSide(toSide) &&
    Math.abs(a.px - b.px) < 1;
  const d = roundedPolylinePath(points, 0);
  const mid = points[Math.floor(points.length / 2)];
  return { d, midX: mid.x, midY: mid.y };
}

/** Move an anchor inward so the stroke stops at the arrow base. */
export function trimPlugAnchorForArrow(
  anchor: PlugAnchor,
  side: CardSide,
  inset: number,
): PlugAnchor {
  if (inset <= 0) return anchor;
  switch (side) {
    case "top":
      return { ...anchor, py: anchor.py + inset };
    case "bottom":
      return { ...anchor, py: anchor.py - inset };
    case "left":
      return { ...anchor, px: anchor.px + inset };
    case "right":
      return { ...anchor, px: anchor.px - inset };
  }
}

export function buildPlugConnectorPath(
  a: PlugAnchor,
  b: PlugAnchor,
  fromSide: CardSide,
  toSide: CardSide,
  style: ConnectorStyle,
  options?: { trimTargetArrowInset?: number },
): PlugPathGeometry {
  const target =
    options?.trimTargetArrowInset != null && options.trimTargetArrowInset > 0
      ? trimPlugAnchorForArrow(b, toSide, options.trimTargetArrowInset)
      : b;
  if (style === "straight") {
    return buildStraightPath(a, target);
  }
  if (style === "orthogonal") {
    return buildOrthogonalPath(a, target, fromSide, toSide);
  }
  return buildCurvyPath(a, target);
}

/** Screen-constant marker sizes in world px. */
export function connectorMarkerSizes(viewportScale: number) {
  const scale = viewportScale > 0 ? viewportScale : 1;
  return {
    plugRadius: 2.5 / scale,
    arrowSize: 5 / scale,
  };
}

/** Filled circle path for the source plug dot. */
export function connectorPlugCirclePath(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
}

/** Triangle arrowhead at the target plug, pointing into the card. */
export function connectorArrowPath(
  px: number,
  py: number,
  side: CardSide,
  size: number,
): string {
  const s = size;
  switch (side) {
    case "top":
      return `M ${px} ${py} L ${px - s} ${py + s * 1.35} L ${px + s} ${py + s * 1.35} Z`;
    case "bottom":
      return `M ${px} ${py} L ${px - s} ${py - s * 1.35} L ${px + s} ${py - s * 1.35} Z`;
    case "left":
      return `M ${px} ${py} L ${px + s * 1.35} ${py - s} L ${px + s * 1.35} ${py + s} Z`;
    case "right":
      return `M ${px} ${py} L ${px - s * 1.35} ${py - s} L ${px - s * 1.35} ${py + s} Z`;
  }
}

/** Free end of a drag preview — cursor with horizontal exit tangent. */
export function plugAnchorAtWorldPoint(
  x: number,
  y: number,
  fromSide: "left" | "right",
): PlugAnchor {
  return {
    px: x,
    py: y,
    tx: fromSide === "left" ? -1 : 1,
    ty: 0,
  };
}
