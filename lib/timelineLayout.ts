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
export const STEM_LENGTH = 48;

/** Max width before event titles wrap to a second line (px). */
export const LABEL_MAX_WIDTH = 500;

/** Event labels appear once zoom reaches this level. */
export const LABEL_MIN_ZOOM = 1.35;
/** Horizontal fade band at viewport edges (px). */
export const LABEL_EDGE_FADE_PX = 72;

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

export const TIMELINE_EVENT_COLORS = [
  "#5B9BD5",
  "#ED7D31",
  "#A5A5A5",
  "#FFC000",
  "#4472C4",
  "#70AD47",
  "#264478",
  "#9E480E",
] as const;

export function eventColor(index: number): string {
  return TIMELINE_EVENT_COLORS[index % TIMELINE_EVENT_COLORS.length]!;
}

export function eventSide(
  index: number,
  override?: "above" | "below",
): "above" | "below" {
  if (override) return override;
  return index % 2 === 0 ? "above" : "below";
}
