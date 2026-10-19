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

/** Outward unit tangent of a card side. */
function sideTangent(side: CardSide): { tx: number; ty: number } {
  switch (side) {
    case "top":
      return { tx: 0, ty: -1 };
    case "bottom":
      return { tx: 0, ty: 1 };
    case "left":
      return { tx: -1, ty: 0 };
    case "right":
      return { tx: 1, ty: 0 };
  }
}

/** Below this the control handles are too short to read as a curve. */
const CURVY_MIN_PULL = 24;
/** How hard a backward connection loops out before turning around. */
const CURVY_BACKWARD_CURVATURE = 0.25;

/**
 * How far a control point sits out along its plug's tangent — the node-editor
 * bezier (React Flow / Weavy). `ahead` is how far the other end lies along
 * the tangent: half of that when the target is in front, so the curve leaves
 * flat and sweeps across in a long S; a sqrt-growing loop when it's behind.
 */
function curvyPull(ahead: number): number {
  if (ahead >= 0) return Math.max(ahead * 0.5, CURVY_MIN_PULL);
  return Math.max(
    CURVY_BACKWARD_CURVATURE * 25 * Math.sqrt(-ahead),
    CURVY_MIN_PULL,
  );
}

function buildCurvyPath(
  a: PlugAnchor,
  b: PlugAnchor,
  fromSide: CardSide,
  toSide: CardSide,
): PlugPathGeometry {
  // Tangents come from the sides, not the anchors: a drag-preview cursor end
  // carries the source's exit tangent, which would hook the curve backwards.
  const ta = sideTangent(fromSide);
  const tb = sideTangent(toSide);
  const dx = b.px - a.px;
  const dy = b.py - a.py;
  const dist = Math.hypot(dx, dy);
  // Cap at the anchor distance so close, collinear plugs (collapsed stubs)
  // can't overshoot past their end.
  const pullA = Math.min(curvyPull(dx * ta.tx + dy * ta.ty), dist);
  const pullB = Math.min(curvyPull(-dx * tb.tx - dy * tb.ty), dist);

  const cp1x = a.px + ta.tx * pullA;
  const cp1y = a.py + ta.ty * pullA;
  const cp2x = b.px + tb.tx * pullB;
  const cp2y = b.py + tb.ty * pullB;

  const d = `M ${a.px} ${a.py} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${b.px} ${b.py}`;
  // B(0.5) — the picker sits on the stroke, not the chord between plugs.
  return {
    d,
    midX: (a.px + 3 * cp1x + 3 * cp2x + b.px) / 8,
    midY: (a.py + 3 * cp1y + 3 * cp2y + b.py) / 8,
  };
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

/** Move an anchor out of its card, along the side's outward normal. */
export function offsetPlugAnchorOutward(
  anchor: PlugAnchor,
  side: CardSide,
  distance: number,
): PlugAnchor {
  if (distance <= 0) return anchor;
  const { tx, ty } = sideTangent(side);
  return { ...anchor, px: anchor.px + tx * distance, py: anchor.py + ty * distance };
}

export function buildPlugConnectorPath(
  a: PlugAnchor,
  b: PlugAnchor,
  fromSide: CardSide,
  toSide: CardSide,
  style: ConnectorStyle,
  options?: {
    /** Start the stroke this far out from the source edge (its plug ring). */
    startInset?: number;
    /** End the stroke this far out from the target edge (its plug ring). */
    endInset?: number;
  },
): PlugPathGeometry {
  const source = offsetPlugAnchorOutward(a, fromSide, options?.startInset ?? 0);
  const target = offsetPlugAnchorOutward(b, toSide, options?.endInset ?? 0);
  if (style === "straight") {
    return buildStraightPath(source, target);
  }
  if (style === "orthogonal") {
    return buildOrthogonalPath(source, target, fromSide, toSide);
  }
  return buildCurvyPath(source, target, fromSide, toSide);
}

/**
 * The plug ring every connector end draws — the same 10px ring with a 2px
 * border as the DOM <Plug> (components/plugs/Plug.tsx), so a drawn end and a
 * live plug at the same anchor coincide exactly.
 */
export const PLUG_DIAMETER_PX = 10;
export const PLUG_RING_PX = 2;

/**
 * Plug ring sizes in world px. A fixed world size at every zoom, like the DOM
 * <Plug> — the ring scales with the cards rather than staying screen-constant,
 * which ballooned plugs over the cards when zoomed out. `_viewportScale` is
 * kept so callers' per-scale marker caching stays untouched.
 */
export function connectorMarkerSizes(_viewportScale: number) {
  return {
    /** Radius to the middle of the ring's stroke. */
    plugRadius: (PLUG_DIAMETER_PX - PLUG_RING_PX) / 2,
    plugRingWidth: PLUG_RING_PX,
    /** Radius to the ring's outside edge — where the connector line stops. */
    plugOuterRadius: PLUG_DIAMETER_PX / 2,
  };
}

/** Closed circle path for a plug ring centred on a card edge. */
export function connectorPlugCirclePath(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
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
