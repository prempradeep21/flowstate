"use client";

import { CardSide, useCanvasStore } from "@/lib/store";

const FALLBACK_W = 420;
const FALLBACK_H = 240;
const STROKE_FALLBACK = "#B8B5AE";

interface Anchor {
  px: number;
  py: number;
  tx: number;
  ty: number;
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

export function Connections() {
  const cards = useCanvasStore((s) => s.cards);
  const connections = useCanvasStore((s) => s.connections);
  const threads = useCanvasStore((s) => s.threads);

  return (
    <svg
      className="absolute left-0 top-0 pointer-events-none"
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

        // Fall back to bottom -> top for any connection that pre-dates the
        // side metadata (shouldn't happen in V1 but defensive is cheap).
        const fromSide: CardSide = conn.fromSide ?? "bottom";
        const toSide: CardSide = conn.toSide ?? "top";

        const a = anchorAt(from.position.x, from.position.y, fromW, fromH, fromSide);
        const b = anchorAt(to.position.x, to.position.y, toW, toH, toSide);

        const dx = b.px - a.px;
        const dy = b.py - a.py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pull = clamp(dist * 0.45, 60, 200);

        const cp1x = a.px + a.tx * pull;
        const cp1y = a.py + a.ty * pull;
        const cp2x = b.px + b.tx * pull;
        const cp2y = b.py + b.ty * pull;

        const d = `M ${a.px} ${a.py} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${b.px} ${b.py}`;

        // Stroke colour comes from the SOURCE card's thread, so the curve
        // visually "emerges" from the source's colour into the (possibly
        // different) branch colour at the other end.
        const stroke =
          threads[from.threadId]?.accentColour ?? STROKE_FALLBACK;

        return (
          <path
            key={conn.id}
            d={d}
            fill="none"
            stroke={stroke}
            strokeOpacity={0.7}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
