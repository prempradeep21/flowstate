import type { TimelineScale } from "@/lib/artifactTypes";
import { defaultTimelineRange } from "@/lib/timelineArtifact";

export const PX_PER_UNIT: Record<TimelineScale, number> = {
  year: 100,
  month: 72,
  day: 48,
};

export const TRACK_PADDING_X = 48;
export const TRACK_HEIGHT = 400;
export const AXIS_Y = TRACK_HEIGHT / 2;
export const STEM_LENGTH = 52;

/** Max width an event label pill may span before it truncates (px). */
export const LABEL_MAX_WIDTH = 680;

/** Minimum horizontal gap between two label pills on the same side (px). */
export const LABEL_MIN_GAP_PX = 20;
/** Horizontal fade band at viewport edges (px). */
export const LABEL_EDGE_FADE_PX = 56;

export const MIN_TIMELINE_ZOOM = 0.04;
export const MAX_TIMELINE_ZOOM = 6;

const MS_HOUR = 3_600_000;
const MS_DAY = 86_400_000;
const MS_WEEK = 7 * MS_DAY;
const MS_MONTH = 30.4375 * MS_DAY;
const MS_YEAR = 365.25 * MS_DAY;

const NICE_TICK_STEPS_MS = [
  MS_HOUR,
  6 * MS_HOUR,
  12 * MS_HOUR,
  MS_DAY,
  2 * MS_DAY,
  MS_WEEK,
  2 * MS_WEEK,
  MS_MONTH,
  3 * MS_MONTH,
  6 * MS_MONTH,
  MS_YEAR,
  2 * MS_YEAR,
  5 * MS_YEAR,
  10 * MS_YEAR,
  25 * MS_YEAR,
  50 * MS_YEAR,
  100 * MS_YEAR,
  250 * MS_YEAR,
  500 * MS_YEAR,
  1_000 * MS_YEAR,
];

export function axisY(trackHeight = TRACK_HEIGHT): number {
  return trackHeight / 2;
}

export interface TimelineRange {
  startMs: number;
  endMs: number;
}

export interface TimelineTick {
  at: string;
  label: string;
  x: number;
}

function unitMs(scale: TimelineScale): number {
  if (scale === "year") return MS_YEAR;
  if (scale === "month") return MS_MONTH;
  return MS_DAY;
}

export function pxPerMsFor(scale: TimelineScale, zoom: number): number {
  return (PX_PER_UNIT[scale] / unitMs(scale)) * zoom;
}

/** Map a timestamp to horizontal screen position inside the viewport. */
export function timeToScreenX(
  timeMs: number,
  centerMs: number,
  viewportWidth: number,
  scale: TimelineScale,
  zoom: number,
): number {
  const pxPerMs = pxPerMsFor(scale, zoom);
  return viewportWidth / 2 + (timeMs - centerMs) * pxPerMs;
}

/** Map a horizontal screen position to a timestamp. */
export function screenXToTimeMs(
  screenX: number,
  centerMs: number,
  viewportWidth: number,
  scale: TimelineScale,
  zoom: number,
): number {
  const pxPerMs = pxPerMsFor(scale, zoom);
  return centerMs + (screenX - viewportWidth / 2) / pxPerMs;
}

export function screenXToTime(
  screenX: number,
  centerMs: number,
  viewportWidth: number,
  scale: TimelineScale,
  zoom: number,
): string {
  return new Date(
    screenXToTimeMs(screenX, centerMs, viewportWidth, scale, zoom),
  ).toISOString();
}

export function chooseTickStepMs(pxPerMs: number): number {
  if (pxPerMs <= 0) return MS_YEAR;
  const targetMs = 96 / pxPerMs;
  for (const step of NICE_TICK_STEPS_MS) {
    if (step >= targetMs * 0.7) return step;
  }
  return NICE_TICK_STEPS_MS[NICE_TICK_STEPS_MS.length - 1]!;
}

export function alignTickStart(timeMs: number, stepMs: number): number {
  const d = new Date(timeMs);
  if (stepMs >= 100 * MS_YEAR) {
    const century = Math.floor(d.getUTCFullYear() / 100) * 100;
    return Date.UTC(century, 0, 1);
  }
  if (stepMs >= 10 * MS_YEAR) {
    const decade = Math.floor(d.getUTCFullYear() / 10) * 10;
    return Date.UTC(decade, 0, 1);
  }
  if (stepMs >= MS_YEAR) {
    return Date.UTC(d.getUTCFullYear(), 0, 1);
  }
  if (stepMs >= MS_MONTH) {
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  }
  if (stepMs >= MS_WEEK) {
    const day = d.getUTCDay();
    const diff = (day + 6) % 7;
    const aligned = new Date(d);
    aligned.setUTCDate(d.getUTCDate() - diff);
    aligned.setUTCHours(0, 0, 0, 0);
    return aligned.getTime();
  }
  if (stepMs >= MS_DAY) {
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  return Math.floor(timeMs / stepMs) * stepMs;
}

export function formatAdaptiveTickLabel(timeMs: number, stepMs: number): string {
  const d = new Date(timeMs);
  if (stepMs >= 100 * MS_YEAR) {
    const century = Math.floor(d.getUTCFullYear() / 100) * 100;
    return `${century}s`;
  }
  if (stepMs >= 10 * MS_YEAR) {
    const decade = Math.floor(d.getUTCFullYear() / 10) * 10;
    return `${decade}s`;
  }
  if (stepMs >= MS_YEAR) return String(d.getUTCFullYear());
  if (stepMs >= MS_MONTH) {
    return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  }
  if (stepMs >= MS_WEEK) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  if (stepMs >= MS_DAY) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function generateVisibleTicks(
  centerMs: number,
  viewportWidth: number,
  scale: TimelineScale,
  zoom: number,
): TimelineTick[] {
  if (viewportWidth <= 0) return [];

  const pxPerMs = pxPerMsFor(scale, zoom);
  const halfSpanMs = viewportWidth / 2 / pxPerMs;
  const bufferMs = halfSpanMs * 0.2;
  const startMs = centerMs - halfSpanMs - bufferMs;
  const endMs = centerMs + halfSpanMs + bufferMs;
  const stepMs = chooseTickStepMs(pxPerMs);

  const ticks: TimelineTick[] = [];
  let t = alignTickStart(startMs, stepMs);
  let guard = 0;
  while (t <= endMs && guard < 500) {
    guard += 1;
    ticks.push({
      at: new Date(t).toISOString(),
      label: formatAdaptiveTickLabel(t, stepMs),
      x: timeToScreenX(t, centerMs, viewportWidth, scale, zoom),
    });
    t += stepMs;
  }
  return ticks;
}

export function parseRange(
  rangeStart?: string,
  rangeEnd?: string,
  scale: TimelineScale = "year",
): TimelineRange {
  const startMs = rangeStart
    ? new Date(rangeStart).getTime()
    : new Date(defaultTimelineRange(scale).rangeStart!).getTime();
  const endMs = rangeEnd
    ? new Date(rangeEnd).getTime()
    : new Date(defaultTimelineRange(scale).rangeEnd!).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    const def = defaultTimelineRange(scale);
    return {
      startMs: new Date(def.rangeStart!).getTime(),
      endMs: new Date(def.rangeEnd!).getTime(),
    };
  }
  return { startMs, endMs };
}

export function trackWidth(
  range: TimelineRange,
  scale: TimelineScale,
  zoom = 1,
): number {
  const spanMs = range.endMs - range.startMs;
  const pxPerMs = pxPerMsFor(scale, zoom);
  return Math.max(400, TRACK_PADDING_X * 2 + spanMs * pxPerMs);
}

export function timeToX(
  at: string,
  range: TimelineRange,
  trackW: number,
): number {
  const t = new Date(at).getTime();
  const span = range.endMs - range.startMs;
  if (span <= 0) return TRACK_PADDING_X;
  const ratio = (t - range.startMs) / span;
  const inner = trackW - TRACK_PADDING_X * 2;
  return TRACK_PADDING_X + ratio * inner;
}

export function xToTime(
  x: number,
  range: TimelineRange,
  trackW: number,
): string {
  const inner = trackW - TRACK_PADDING_X * 2;
  const ratio = inner <= 0 ? 0 : (x - TRACK_PADDING_X) / inner;
  const clamped = Math.min(1, Math.max(0, ratio));
  const ms = range.startMs + clamped * (range.endMs - range.startMs);
  return new Date(ms).toISOString();
}

function formatTickLabel(d: Date, scale: TimelineScale): string {
  if (scale === "year") {
    return String(d.getUTCFullYear());
  }
  if (scale === "month") {
    return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatEventDate(at: string, scale: TimelineScale): string {
  const d = new Date(at);
  if (scale === "year") return String(d.getUTCFullYear());
  if (scale === "month") {
    return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function generateTicks(
  range: TimelineRange,
  scale: TimelineScale,
  trackW: number,
): TimelineTick[] {
  const ticks: TimelineTick[] = [];
  const start = new Date(range.startMs);
  const end = new Date(range.endMs);

  if (scale === "year") {
    let y = start.getUTCFullYear();
    const endY = end.getUTCFullYear();
    while (y <= endY) {
      const d = new Date(Date.UTC(y, 0, 1));
      ticks.push({
        at: d.toISOString(),
        label: formatTickLabel(d, scale),
        x: timeToX(d.toISOString(), range, trackW),
      });
      y += 1;
    }
  } else if (scale === "month") {
    const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    while (cur.getTime() <= end.getTime()) {
      ticks.push({
        at: cur.toISOString(),
        label: formatTickLabel(cur, scale),
        x: timeToX(cur.toISOString(), range, trackW),
      });
      cur.setUTCMonth(cur.getUTCMonth() + 1);
    }
  } else {
    const cur = new Date(start);
    cur.setUTCHours(0, 0, 0, 0);
    while (cur.getTime() <= end.getTime()) {
      ticks.push({
        at: cur.toISOString(),
        label: formatTickLabel(cur, scale),
        x: timeToX(cur.toISOString(), range, trackW),
      });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  return ticks;
}

export function snapToNearestTick(
  at: string,
  ticks: TimelineTick[],
): string {
  if (ticks.length === 0) return at;
  const t = new Date(at).getTime();
  let best = ticks[0]!;
  let bestDist = Math.abs(new Date(best.at).getTime() - t);
  for (const tick of ticks) {
    const dist = Math.abs(new Date(tick.at).getTime() - t);
    if (dist < bestDist) {
      best = tick;
      bestDist = dist;
    }
  }
  return best.at;
}

/**
 * Small, deliberately simple event palette. Hues alternate warm / cool so no
 * two adjacent phases ever look alike (no red-next-to-orange), and it cycles —
 * fine to repeat once you have more than four events. Drives the coloured axis
 * sections, their 10%-tint background bands, the dots, and the label pills.
 */
export const TIMELINE_EVENT_COLORS = [
  "#E07A5F", // coral (warm)
  "#3FA7A0", // teal (cool)
  "#D9A441", // gold (warm)
  "#5B8DEF", // blue (cool)
] as const;

/**
 * Colour for the axis before the first / after the last event. Uses the theme
 * accent (never a bare white / empty gap) and flips with the light / dark
 * theme and any runtime theme override.
 */
export const AXIS_NEUTRAL_COLOR = "rgb(var(--canvas-accent))";

export function eventColor(index: number): string {
  return TIMELINE_EVENT_COLORS[index % TIMELINE_EVENT_COLORS.length]!;
}

/** Readable text colour (dark or white) for a filled label pill of eventColor(index). */
export function eventTextColor(index: number): string {
  const hex = eventColor(index).replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 165 ? "#2A2826" : "#FFFFFF";
}

export function eventSide(
  index: number,
  override?: "above" | "below",
): "above" | "below" {
  if (override) return override;
  return index % 2 === 0 ? "above" : "below";
}

/** Approximate rendered width of a label pill (px) for collision layout. */
export function estimateLabelWidth(label: string): number {
  const text = (label ?? "").trim() || "Event";
  const approx = text.length * 7.4 + 28; // ~14px semibold glyphs + pill padding
  return Math.min(LABEL_MAX_WIDTH, Math.max(64, approx));
}

export interface LabelCandidate {
  index: number;
  x: number;
  side: "above" | "below";
  width: number;
  highlight?: boolean;
  /** |x - viewport centre|; smaller wins space first so a centre label survives. */
  centerBias: number;
}

/**
 * Level-of-detail for event labels. Highlighted and centre-most events claim
 * space first; any label that would collide with an already-placed one on the
 * same side (above / below are independent lanes) is hidden. The highest-
 * priority candidate always places, so an on-screen timeline is never a bare
 * line — zoom out collapses toward a single label, zoom in spreads events
 * apart and reveals the rest as their stretch of timeline opens up.
 */
export function computeVisibleLabels(candidates: LabelCandidate[]): Set<number> {
  const shown = new Set<number>();
  const placed: Record<"above" | "below", { x: number; half: number }[]> = {
    above: [],
    below: [],
  };
  const order = [...candidates].sort((a, b) => {
    const ah = a.highlight ? 0 : 1;
    const bh = b.highlight ? 0 : 1;
    if (ah !== bh) return ah - bh;
    return a.centerBias - b.centerBias;
  });
  for (const c of order) {
    const half = c.width / 2;
    const lane = placed[c.side];
    const collides = lane.some(
      (p) => Math.abs(p.x - c.x) < p.half + half + LABEL_MIN_GAP_PX,
    );
    if (collides) continue;
    lane.push({ x: c.x, half });
    shown.add(c.index);
  }
  return shown;
}

export interface TimelineSegment {
  x1: number;
  x2: number;
  /** Solid colour for this stretch of axis (no gradients). */
  color: string;
  /** Whether to paint the 10%-tint background band for this phase. */
  band: boolean;
}

/**
 * Build the colour-sectioned axis: one solid colour per stretch between events
 * (the colour of the event that opens it). The lead-in before the first event
 * uses the accent colour so it never reads as an empty white gap. Every stretch
 * carries a background band. Spans at least the full viewport so the axis always
 * fills the frame.
 */
export function buildTimelineSegments(
  points: { x: number; color: string }[],
  viewportWidth: number,
  neutral: string = AXIS_NEUTRAL_COLOR,
): TimelineSegment[] {
  if (points.length === 0) {
    return [{ x1: 0, x2: viewportWidth, color: neutral, band: true }];
  }
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const start = Math.min(0, first.x);
  const end = Math.max(viewportWidth, last.x);
  const segments: TimelineSegment[] = [
    { x1: start, x2: first.x, color: neutral, band: true },
  ];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    segments.push({
      x1: sorted[i]!.x,
      x2: sorted[i + 1]!.x,
      color: sorted[i]!.color,
      band: true,
    });
  }
  segments.push({ x1: last.x, x2: end, color: last.color, band: true });
  return segments;
}

/** Colour of the axis section containing screen position `x`. */
export function segmentColorAt(
  x: number,
  segments: TimelineSegment[],
  fallback: string = AXIS_NEUTRAL_COLOR,
): string {
  for (const seg of segments) {
    if (x >= seg.x1 && x <= seg.x2) return seg.color;
  }
  return fallback;
}
