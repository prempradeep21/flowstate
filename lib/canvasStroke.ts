export const PENCIL_COLORS = [
  "#F0F0F0",
  "#111111",
  "#E53935",
  "#1E88E5",
  "#43A047",
  "#FB8C00",
  "#8E24AA",
] as const;

export const PENCIL_STROKE_WIDTH = 3;

export type PencilColor = (typeof PENCIL_COLORS)[number];

export interface CanvasStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export function strokeToSvgPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y}`;
  for (const p of rest) {
    d += ` L ${p.x} ${p.y}`;
  }
  return d;
}
