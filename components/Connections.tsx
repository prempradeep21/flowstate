"use client";

import { ReactNode, useCallback, useRef, useState } from "react";
import {
  CardSide,
  ConnectorStyle,
  useCanvasStore,
} from "@/lib/store";
import { compensatedStrokeWidth } from "@/lib/zoomDisplay";

const FALLBACK_W = 420;
const FALLBACK_H = 240;
const STROKE_FALLBACK = "#B8B5AE";
const BASE_STROKE_SCREEN = 1.75;
const HIT_STROKE_SCREEN = 14;
/** Below this zoom, stroke width is compensated so lines stay visible on screen. */
const ORTHOGONAL_CORNER_RADIUS = 10;

interface Anchor {
  px: number;
  py: number;
  tx: number;
  ty: number;
}

interface PathGeometry {
  d: string;
  midX: number;
  midY: number;
}

function anchorAt(
  cardX: number,
  cardY: number,
  cardW: number,
  cardH: number,
  side: CardSide,
): Anchor {
  switch (side) {
    case "top":
      return { px: cardX + cardW / 2, py: cardY, tx: 0, ty: -1 };
    case "bottom":
      return { px: cardX + cardW / 2, py: cardY + cardH, tx: 0, ty: 1 };
    case "left":
      return { px: cardX, py: cardY + cardH / 2, tx: -1, ty: 0 };
    case "right":
      return { px: cardX + cardW, py: cardY + cardH / 2, tx: 1, ty: 0 };
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function isVerticalSide(side: CardSide) {
  return side === "top" || side === "bottom";
}

function buildCurvyPath(a: Anchor, b: Anchor): PathGeometry {
  const dx = b.px - a.px;
  const dy = b.py - a.py;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const pull = clamp(dist * 0.45, 60, 200);

  const cp1x = a.px + a.tx * pull;
  const cp1y = a.py + a.ty * pull;
  const cp2x = b.px + b.tx * pull;
  const cp2y = b.py + b.ty * pull;

  const d = `M ${a.px} ${a.py} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${b.px} ${b.py}`;
  return { d, midX: (a.px + b.px) / 2, midY: (a.py + b.py) / 2 };
}

function routeOrthogonalPoints(
  a: Anchor,
  b: Anchor,
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
  a: Anchor,
  b: Anchor,
  fromSide: CardSide,
  toSide: CardSide,
): PathGeometry {
  const points = routeOrthogonalPoints(a, b, fromSide, toSide);
  const d = roundedPolylinePath(points, ORTHOGONAL_CORNER_RADIUS);
  const mid = points[Math.floor(points.length / 2)];
  return { d, midX: mid.x, midY: mid.y };
}

function buildPath(
  a: Anchor,
  b: Anchor,
  fromSide: CardSide,
  toSide: CardSide,
  style: ConnectorStyle,
): PathGeometry {
  if (style === "orthogonal") {
    return buildOrthogonalPath(a, b, fromSide, toSide);
  }
  return buildCurvyPath(a, b);
}

function CurvyIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none">
      <path
        d="M2.5 11.5C2.5 6.5 5 3.5 8 3.5s5.5 3 5.5 8"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PipelineIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none">
      <path
        d="M3 4.5h4.5V8H12.5V11.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ConnectorStylePicker({
  x,
  y,
  scale,
  activeStyle,
  onSelect,
  onHoverChange,
}: {
  x: number;
  y: number;
  scale: number;
  activeStyle: ConnectorStyle;
  onSelect: (style: ConnectorStyle) => void;
  onHoverChange: (hovered: boolean) => void;
}) {
  const options: { style: ConnectorStyle; label: string; icon: ReactNode }[] =
    [
      { style: "curvy", label: "Curved connectors", icon: <CurvyIcon /> },
      {
        style: "orthogonal",
        label: "Pipeline connectors",
        icon: <PipelineIcon />,
      },
    ];

  return (
    <div
      role="toolbar"
      aria-label="Connector style"
      className="pointer-events-auto absolute z-20 flex items-center gap-0.5 rounded-lg border border-canvas-border bg-canvas-card p-0.5 shadow-card"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, calc(-100% - 10px)) scale(${1 / scale})`,
        transformOrigin: "bottom center",
      }}
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
    >
      {options.map(({ style, label, icon }) => {
        const active = activeStyle === style;
        return (
          <button
            key={style}
            type="button"
            aria-label={label}
            aria-pressed={active}
            title={label}
            onClick={() => onSelect(style)}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
              active
                ? "bg-canvas-ink/10 text-canvas-ink"
                : "text-canvas-muted hover:bg-canvas-ink/5 hover:text-canvas-ink"
            }`}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}

interface HoverState {
  connId: string;
  midX: number;
  midY: number;
}

export function Connections() {
  const cards = useCanvasStore((s) => s.cards);
  const connections = useCanvasStore((s) => s.connections);
  const threads = useCanvasStore((s) => s.threads);
  const viewport = useCanvasStore((s) => s.viewport);
  const connectorStyle = useCanvasStore((s) => s.connectorStyle);
  const setConnectorStyle = useCanvasStore((s) => s.setConnectorStyle);

  const [hover, setHover] = useState<HoverState | null>(null);
  const pickerHoveredRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      if (!pickerHoveredRef.current) setHover(null);
    }, 120);
  }, [clearHideTimer]);

  const showPicker = useCallback(
    (connId: string, midX: number, midY: number) => {
      clearHideTimer();
      setHover({ connId, midX, midY });
    },
    [clearHideTimer],
  );

  const strokeWidth = compensatedStrokeWidth(
    BASE_STROKE_SCREEN,
    viewport.scale,
    BASE_STROKE_SCREEN,
  );
  const hitWidth = compensatedStrokeWidth(
    HIT_STROKE_SCREEN,
    viewport.scale,
    HIT_STROKE_SCREEN,
  );

  return (
    <>
      <svg
        className="absolute left-0 top-0"
        style={{ overflow: "visible" }}
        width={1}
        height={1}
      >
        {connections.map((conn) => {
          const from = cards[conn.from];
          const to = cards[conn.to];
          if (!from || !to) return null;

          const fromW = from.size?.w ?? FALLBACK_W;
          const fromH = from.size?.h ?? FALLBACK_H;
          const toW = to.size?.w ?? FALLBACK_W;
          const toH = to.size?.h ?? FALLBACK_H;

          const fromSide: CardSide = conn.fromSide ?? "bottom";
          const toSide: CardSide = conn.toSide ?? "top";

          const a = anchorAt(
            from.position.x,
            from.position.y,
            fromW,
            fromH,
            fromSide,
          );
          const b = anchorAt(to.position.x, to.position.y, toW, toH, toSide);

          const { d, midX, midY } = buildPath(
            a,
            b,
            fromSide,
            toSide,
            connectorStyle,
          );

          const stroke =
            threads[from.threadId]?.accentColour ?? STROKE_FALLBACK;
          const isHovered = hover?.connId === conn.id;

          return (
            <g key={conn.id}>
              <path
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth={hitWidth}
                strokeLinecap="round"
                className="cursor-pointer"
                onPointerEnter={() => showPicker(conn.id, midX, midY)}
                onPointerLeave={scheduleHide}
              />
              <path
                d={d}
                fill="none"
                stroke={stroke}
                strokeOpacity={isHovered ? 0.95 : 0.7}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                pointerEvents="none"
              />
            </g>
          );
        })}
      </svg>

      {hover && (
        <ConnectorStylePicker
          x={hover.midX}
          y={hover.midY}
          scale={viewport.scale}
          activeStyle={connectorStyle}
          onSelect={setConnectorStyle}
          onHoverChange={(hovered) => {
            pickerHoveredRef.current = hovered;
            if (hovered) clearHideTimer();
            else scheduleHide();
          }}
        />
      )}
    </>
  );
}