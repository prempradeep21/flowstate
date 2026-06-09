import type { SelectionUnit } from "@/lib/canvasSelection";

export type AlignMode =
  | "left"
  | "centerX"
  | "right"
  | "top"
  | "centerY"
  | "bottom";

export type ArrangeMode = "horizontal" | "vertical" | "grid";

/** Gap between units for auto-arrange layouts. */
export const ARRANGE_GAP = 24;

export interface SelectionUnitDelta {
  kind: SelectionUnit["kind"];
  id: string;
  dx: number;
  dy: number;
}

function aggregateBounds(units: SelectionUnit[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const u of units) {
    minX = Math.min(minX, u.bounds.x);
    minY = Math.min(minY, u.bounds.y);
    maxX = Math.max(maxX, u.bounds.x + u.bounds.w);
    maxY = Math.max(maxY, u.bounds.y + u.bounds.h);
  }
  return { minX, minY, maxX, maxY };
}

/** Per-unit move deltas that align all units along the requested edge/axis. */
export function computeAlignDeltas(
  units: SelectionUnit[],
  mode: AlignMode,
): SelectionUnitDelta[] {
  if (units.length < 2) return [];
  const agg = aggregateBounds(units);
  const centerX = (agg.minX + agg.maxX) / 2;
  const centerY = (agg.minY + agg.maxY) / 2;

  return units.map((u) => {
    let dx = 0;
    let dy = 0;
    switch (mode) {
      case "left":
        dx = agg.minX - u.bounds.x;
        break;
      case "centerX":
        dx = centerX - (u.bounds.x + u.bounds.w / 2);
        break;
      case "right":
        dx = agg.maxX - (u.bounds.x + u.bounds.w);
        break;
      case "top":
        dy = agg.minY - u.bounds.y;
        break;
      case "centerY":
        dy = centerY - (u.bounds.y + u.bounds.h / 2);
        break;
      case "bottom":
        dy = agg.maxY - (u.bounds.y + u.bounds.h);
        break;
    }
    return { kind: u.kind, id: u.id, dx, dy };
  });
}

/**
 * Per-unit move deltas for auto-arrange layouts. Units keep their visual
 * reading order (sorted by current centers) and flow from the selection's
 * top-left corner.
 */
export function computeArrangeDeltas(
  units: SelectionUnit[],
  mode: ArrangeMode,
  gap: number = ARRANGE_GAP,
): SelectionUnitDelta[] {
  if (units.length < 2) return [];
  const agg = aggregateBounds(units);

  if (mode === "horizontal") {
    const sorted = [...units].sort(
      (a, b) => a.bounds.x + a.bounds.w / 2 - (b.bounds.x + b.bounds.w / 2),
    );
    const centerY = (agg.minY + agg.maxY) / 2;
    let cursorX = agg.minX;
    return sorted.map((u) => {
      const dx = cursorX - u.bounds.x;
      const dy = centerY - (u.bounds.y + u.bounds.h / 2);
      cursorX += u.bounds.w + gap;
      return { kind: u.kind, id: u.id, dx, dy };
    });
  }

  if (mode === "vertical") {
    const sorted = [...units].sort(
      (a, b) => a.bounds.y + a.bounds.h / 2 - (b.bounds.y + b.bounds.h / 2),
    );
    const centerX = (agg.minX + agg.maxX) / 2;
    let cursorY = agg.minY;
    return sorted.map((u) => {
      const dx = centerX - (u.bounds.x + u.bounds.w / 2);
      const dy = cursorY - u.bounds.y;
      cursorY += u.bounds.h + gap;
      return { kind: u.kind, id: u.id, dx, dy };
    });
  }

  // Grid: reading order (top-left → bottom-right), uniform cells sized to the
  // largest unit so rows/columns stay regular even with mixed node sizes.
  const sorted = [...units].sort((a, b) => {
    const ay = a.bounds.y + a.bounds.h / 2;
    const by = b.bounds.y + b.bounds.h / 2;
    if (Math.abs(ay - by) > 1) return ay - by;
    return a.bounds.x + a.bounds.w / 2 - (b.bounds.x + b.bounds.w / 2);
  });
  const cols = Math.ceil(Math.sqrt(sorted.length));
  const cellW = Math.max(...sorted.map((u) => u.bounds.w));
  const cellH = Math.max(...sorted.map((u) => u.bounds.h));

  return sorted.map((u, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellX = agg.minX + col * (cellW + gap);
    const cellY = agg.minY + row * (cellH + gap);
    // Center each unit inside its cell.
    const targetX = cellX + (cellW - u.bounds.w) / 2;
    const targetY = cellY + (cellH - u.bounds.h) / 2;
    return {
      kind: u.kind,
      id: u.id,
      dx: targetX - u.bounds.x,
      dy: targetY - u.bounds.y,
    };
  });
}
