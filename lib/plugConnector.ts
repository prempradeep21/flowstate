import type { CardSide, ConnectorStyle } from "@/lib/store";

export interface PlugAnchor {
  px: number;
  py: number;
  tx: number;
  ty: number;
}

export interface PlugPathGeometry {
  d: string;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function isVerticalSide(side: CardSide) {
  return side === "top" || side === "bottom";
}

export function plugAnchorAt(
  x: number,
  y: number,
  w: number,
  h: number,
  side: CardSide,
): PlugAnchor {
  switch (side) {
    case "top":
      return { px: x + w / 2, py: y, tx: 0, ty: -1 };
    case "bottom":
      return { px: x + w / 2, py: y + h, tx: 0, ty: 1 };
    case "left":
      return { px: x, py: y + h / 2, tx: -1, ty: 0 };
    case "right":
      return { px: x + w, py: y + h / 2, tx: 1, ty: 0 };
  }
}

function buildCurvyPath(a: PlugAnchor, b: PlugAnchor): PlugPathGeometry {
  const dx = b.px - a.px;
  const dy = b.py - a.py;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const pull = clamp(dist * 0.45, 60, 200);

  const cp1x = a.px + a.tx * pull;
  const cp1y = a.py + a.ty * pull;
  const cp2x = b.px + b.tx * pull;
  const cp2y = b.py + b.ty * pull;

  const d = `M ${a.px} ${a.py} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${b.px} ${b.py}`;
  return { d };
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
    const midY = (a.py + b.py) / 2;
    return [
      { x: a.px, y: a.py },
      { x: a.px, y: midY },
      { x: b.px, y: midY },
      { x: b.px, y: b.py },
    ];
  }
  if (!verticalFrom && !verticalTo) {
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
  const d = roundedPolylinePath(points, 10);
  return { d };
}

export function buildPlugConnectorPath(
  a: PlugAnchor,
  b: PlugAnchor,
  fromSide: CardSide,
  toSide: CardSide,
  style: ConnectorStyle,
): PlugPathGeometry {
  if (style === "orthogonal") {
    return buildOrthogonalPath(a, b, fromSide, toSide);
  }
  return buildCurvyPath(a, b);
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
