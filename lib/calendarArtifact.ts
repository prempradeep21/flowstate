import type {
  ArtifactPayload,
  CalendarArtifactData,
  CalendarEvent,
} from "@/lib/artifactTypes";
import { TIMELINE_EVENT_COLORS } from "@/lib/timelineLayout";

/** Source card id for user-initiated calendar saves (no chat turn). */
export const MANUAL_CALENDAR_SOURCE_CARD_ID = "__manual__";

/** Fits month nav + weekday row + six 52px week rows inside canvas chrome (72px header overhead). */
export const CALENDAR_ARTIFACT_HEIGHT = 500;

function newCalendarEventId(): string {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeIsoDate(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return undefined;
  const d = new Date(parsed);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function clampMonth(value: unknown): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n < 1 || n > 12) {
    return new Date().getMonth() + 1;
  }
  return n;
}

function clampYear(value: unknown): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n < 1970 || n > 2100) {
    return new Date().getFullYear();
  }
  return n;
}

export function normalizeCalendarEvent(
  raw: unknown,
  fallbackId?: string,
): CalendarEvent | null {
  const obj =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  if (!title) return null;

  let startDate = normalizeIsoDate(obj.startDate);
  let endDate = normalizeIsoDate(obj.endDate);
  if (!startDate && !endDate) return null;
  if (!startDate) startDate = endDate!;
  if (!endDate) endDate = startDate;
  if (endDate < startDate) {
    [startDate, endDate] = [endDate, startDate];
  }

  return {
    id:
      typeof obj.id === "string" && obj.id.trim()
        ? obj.id.trim()
        : (fallbackId ?? newCalendarEventId()),
    title,
    startDate,
    endDate,
  };
}

export function ensureUniqueCalendarEventIds(
  events: CalendarEvent[],
): CalendarEvent[] {
  const seen = new Set<string>();
  return events.map((event) => {
    if (event.id && !seen.has(event.id)) {
      seen.add(event.id);
      return event;
    }
    const id = newCalendarEventId();
    seen.add(id);
    return { ...event, id };
  });
}

export function normalizeCalendarArtifactData(
  data: unknown,
): CalendarArtifactData {
  const obj =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const now = new Date();
  const viewYear = clampYear(obj.viewYear);
  const viewMonth = clampMonth(obj.viewMonth);

  const highlightedRaw = Array.isArray(obj.highlightedDates)
    ? obj.highlightedDates
    : [];
  const highlightedDates = [
    ...new Set(
      highlightedRaw
        .map((d) => normalizeIsoDate(d))
        .filter((d): d is string => Boolean(d)),
    ),
  ];

  const eventsRaw = Array.isArray(obj.events) ? obj.events : [];
  const events = ensureUniqueCalendarEventIds(
    eventsRaw
      .map((e) => normalizeCalendarEvent(e))
      .filter((e): e is CalendarEvent => e !== null),
  );

  return { viewYear, viewMonth, highlightedDates, events };
}

export function normalizeCalendarPayload(
  payload: Extract<ArtifactPayload, { type: "calendar" }>,
): Extract<ArtifactPayload, { type: "calendar" }> {
  return {
    ...payload,
    data: normalizeCalendarArtifactData(payload.data),
  };
}

export function createCalendarEvent(
  title: string,
  startDate: string,
  endDate: string,
): CalendarEvent {
  const normalized = normalizeCalendarEvent({
    title,
    startDate,
    endDate,
  });
  return normalized ?? {
    id: newCalendarEventId(),
    title: title.trim() || "Untitled",
    startDate,
    endDate,
  };
}

export function mergeCalendarEventsFromAi(
  previous: CalendarEvent[],
  incoming: CalendarEvent[],
): CalendarEvent[] {
  const prevById = new Map(previous.map((e) => [e.id, e]));
  const prevByKey = new Map<string, CalendarEvent[]>();

  for (const event of previous) {
    const key = `${event.title.toLowerCase()}|${event.startDate}|${event.endDate}`;
    const list = prevByKey.get(key) ?? [];
    list.push(event);
    prevByKey.set(key, list);
  }

  const usedPrevIds = new Set<string>();
  const usedIncomingIds = new Set<string>();

  const merged = incoming.map((raw, index) => {
    if (raw.id && prevById.has(raw.id) && !usedPrevIds.has(raw.id)) {
      usedPrevIds.add(raw.id);
      usedIncomingIds.add(raw.id);
      return { ...raw, id: raw.id };
    }

    const key = `${raw.title.toLowerCase()}|${raw.startDate}|${raw.endDate}`;
    const matches = prevByKey.get(key) ?? [];
    const match = matches.find((e) => !usedPrevIds.has(e.id));
    if (match) {
      usedPrevIds.add(match.id);
      usedIncomingIds.add(match.id);
      return { ...raw, id: match.id };
    }

    if (raw.id && !usedIncomingIds.has(raw.id)) {
      usedIncomingIds.add(raw.id);
      return { ...raw, id: raw.id };
    }

    const positional = previous[index];
    if (positional && !usedPrevIds.has(positional.id)) {
      usedPrevIds.add(positional.id);
      usedIncomingIds.add(positional.id);
      return { ...raw, id: positional.id };
    }

    const id = newCalendarEventId();
    usedIncomingIds.add(id);
    return { ...raw, id };
  });

  return ensureUniqueCalendarEventIds(merged);
}

export function cloneCalendarPayload(
  payload: Extract<ArtifactPayload, { type: "calendar" }>,
): Extract<ArtifactPayload, { type: "calendar" }> {
  return {
    type: "calendar",
    title: payload.title,
    description: payload.description,
    data: {
      viewYear: payload.data.viewYear,
      viewMonth: payload.data.viewMonth,
      highlightedDates: [...payload.data.highlightedDates],
      events: payload.data.events.map((e) => ({ ...e })),
    },
  };
}

/** Compare ISO date strings. */
export function compareIsoDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isoDateRangeInclusive(start: string, end: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const cursor = new Date(sy, sm - 1, sd);
  const last = new Date(ey, em - 1, ed);
  while (cursor <= last) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface CalendarDayCell {
  iso: string | null;
  day: number | null;
  inMonth: boolean;
}

export interface CalendarWeekRow {
  days: CalendarDayCell[];
}

export function buildMonthWeeks(year: number, month: number): CalendarWeekRow[] {
  const first = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const startPad = first.getDay();

  const cells: CalendarDayCell[] = [];
  for (let i = 0; i < startPad; i++) {
    cells.push({ iso: null, day: null, inMonth: false });
  }
  for (let d = 1; d <= lastDay; d++) {
    const m = String(month).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    cells.push({
      iso: `${year}-${m}-${day}`,
      day: d,
      inMonth: true,
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ iso: null, day: null, inMonth: false });
  }

  const weeks: CalendarWeekRow[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push({ days: cells.slice(i, i + 7) });
  }
  return weeks;
}

export interface WeekEventSegment {
  event: CalendarEvent;
  startCol: number;
  span: number;
  lane: number;
}

export function layoutWeekEventSegments(
  weekDays: CalendarDayCell[],
  events: CalendarEvent[],
): WeekEventSegment[] {
  const weekIsos = weekDays
    .map((d) => d.iso)
    .filter((d): d is string => d !== null);
  if (weekIsos.length === 0) return [];

  const weekStart = weekIsos[0];
  const weekEnd = weekIsos[weekIsos.length - 1];

  const overlapping = events.filter(
    (e) => e.startDate <= weekEnd && e.endDate >= weekStart,
  );

  const segments = overlapping.map((event) => {
    const segStart =
      compareIsoDates(event.startDate, weekStart) < 0
        ? weekStart
        : event.startDate;
    const segEnd =
      compareIsoDates(event.endDate, weekEnd) > 0 ? weekEnd : event.endDate;
    const startCol = weekIsos.indexOf(segStart);
    const endCol = weekIsos.indexOf(segEnd);
    const span = endCol - startCol + 1;
    return { event, startCol, span, lane: 0 };
  });

  segments.sort((a, b) => {
    const startCmp = compareIsoDates(a.event.startDate, b.event.startDate);
    if (startCmp !== 0) return startCmp;
    const aLen = isoDateRangeInclusive(a.event.startDate, a.event.endDate).length;
    const bLen = isoDateRangeInclusive(b.event.startDate, b.event.endDate).length;
    return bLen - aLen;
  });

  const laneEnds: number[] = [];

  for (const seg of segments) {
    let lane = 0;
    while (lane < laneEnds.length && seg.startCol <= laneEnds[lane]) {
      lane++;
    }
    seg.lane = lane;
    laneEnds[lane] = seg.startCol + seg.span - 1;
  }

  return segments;
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function calendarEventColor(index: number): string {
  return TIMELINE_EVENT_COLORS[index % TIMELINE_EVENT_COLORS.length]!;
}

export function calendarEventChipStyle(index: number): {
  backgroundColor: string;
  color: string;
} {
  const base = calendarEventColor(index);
  return {
    backgroundColor: `${base}22`,
    color: base,
  };
}
