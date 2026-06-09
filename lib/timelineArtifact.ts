import type {
  ArtifactPayload,
  TimelineArtifactData,
  TimelineEvent,
  TimelineScale,
} from "@/lib/artifactTypes";
import { parseRange } from "@/lib/timelineLayout";

/** Source card id for user-initiated timeline edits (no chat turn). */
export const MANUAL_TIMELINE_SOURCE_CARD_ID = "__manual_timeline__";

export const TIMELINE_ARTIFACT_WIDTH = 1920;
export const TIMELINE_ARTIFACT_HEIGHT = 480;
/** Timeline artifacts can be resized wider than generic canvas artifacts. */
export const MAX_TIMELINE_ARTIFACT_WIDTH = 2800;

export const TIMELINE_EVENT_MAX_WORDS = 10;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function truncateTimelineLabel(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= TIMELINE_EVENT_MAX_WORDS) return words.join(" ");
  return words.slice(0, TIMELINE_EVENT_MAX_WORDS).join(" ");
}

export function isValidTimelineLabel(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return countWords(trimmed) <= TIMELINE_EVENT_MAX_WORDS;
}

function newEventId(): string {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function parseIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value.trim());
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function normalizeScale(value: unknown): TimelineScale {
  if (value === "month" || value === "day") return value;
  return "year";
}

export function normalizeTimelineEvent(raw: unknown): TimelineEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const at = parseIsoDate(o.at);
  if (!at) return null;
  const rawLabel =
    typeof o.label === "string"
      ? o.label
      : typeof o.title === "string"
        ? o.title
        : "";
  const label = truncateTimelineLabel(rawLabel);
  if (!label) return null;
  const side = o.side === "above" || o.side === "below" ? o.side : undefined;
  return {
    id:
      typeof o.id === "string" && o.id.trim() ? o.id.trim() : newEventId(),
    at,
    label,
    side,
    highlight: o.highlight === true ? true : undefined,
  };
}

function padRange(
  startMs: number,
  endMs: number,
  scale: TimelineScale,
): { rangeStart: string; rangeEnd: string } {
  const start = new Date(startMs);
  const end = new Date(endMs);
  if (scale === "year") {
    start.setUTCMonth(0, 1);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCFullYear(start.getUTCFullYear() - 1);
    end.setUTCMonth(11, 31);
    end.setUTCHours(23, 59, 59, 999);
    end.setUTCFullYear(end.getUTCFullYear() + 1);
  } else if (scale === "month") {
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCMonth(start.getUTCMonth() - 1);
    end.setUTCMonth(end.getUTCMonth() + 2, 0);
    end.setUTCHours(23, 59, 59, 999);
  } else {
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - 7);
    end.setUTCHours(23, 59, 59, 999);
    end.setUTCDate(end.getUTCDate() + 7);
  }
  return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
}

export function defaultTimelineRange(scale: TimelineScale): {
  rangeStart: string;
  rangeEnd: string;
} {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  if (scale === "year") {
    start.setUTCFullYear(start.getUTCFullYear() - 5);
    end.setUTCFullYear(end.getUTCFullYear() + 1);
  } else if (scale === "month") {
    start.setUTCMonth(start.getUTCMonth() - 6);
    end.setUTCMonth(end.getUTCMonth() + 3);
  } else {
    start.setUTCDate(start.getUTCDate() - 14);
    end.setUTCDate(end.getUTCDate() + 7);
  }
  return padRange(start.getTime(), end.getTime(), scale);
}

/** Default viewport center — midpoint of events, else padded data range. */
export function timelineDefaultCenterMs(data: {
  events: TimelineEvent[];
  rangeStart?: string;
  rangeEnd?: string;
  scale?: TimelineScale;
}): number {
  if (data.events.length > 0) {
    const times = data.events.map((e) => new Date(e.at).getTime());
    return (Math.min(...times) + Math.max(...times)) / 2;
  }
  const scale = data.scale ?? "year";
  const range = parseRange(data.rangeStart, data.rangeEnd, scale);
  return (range.startMs + range.endMs) / 2;
}

export function normalizeTimelineArtifactData(data: unknown): TimelineArtifactData {
  const obj =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const scale = normalizeScale(obj.scale);
  const eventsRaw = Array.isArray(obj.events) ? obj.events : [];
  const seen = new Set<string>();
  const events = eventsRaw
    .map(normalizeTimelineEvent)
    .filter((e): e is TimelineEvent => e !== null)
    .filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    })
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  let rangeStart = parseIsoDate(obj.rangeStart) ?? undefined;
  let rangeEnd = parseIsoDate(obj.rangeEnd) ?? undefined;

  if (events.length > 0) {
    const min = Math.min(...events.map((e) => new Date(e.at).getTime()));
    const max = Math.max(...events.map((e) => new Date(e.at).getTime()));
    const padded = padRange(min, max, scale);
    rangeStart = rangeStart ?? padded.rangeStart;
    rangeEnd = rangeEnd ?? padded.rangeEnd;
  } else if (!rangeStart || !rangeEnd) {
    const def = defaultTimelineRange(scale);
    rangeStart = rangeStart ?? def.rangeStart;
    rangeEnd = rangeEnd ?? def.rangeEnd;
  }

  return {
    events,
    scale,
    rangeStart,
    rangeEnd,
  };
}

export function createTimelineEvent(input: {
  at: string;
  label: string;
  side?: "above" | "below";
}): TimelineEvent {
  const at = parseIsoDate(input.at);
  if (!at) throw new Error("Invalid date");
  const label = truncateTimelineLabel(input.label);
  if (!label) throw new Error("Label required");
  return {
    id: newEventId(),
    at,
    label,
    side: input.side,
  };
}

export function normalizeTimelinePayload(
  payload: Extract<ArtifactPayload, { type: "timeline" }>,
): Extract<ArtifactPayload, { type: "timeline" }> {
  return {
    ...payload,
    data: normalizeTimelineArtifactData(payload.data),
  };
}

export function mergeTimelineEventsFromAi(
  previous: TimelineEvent[],
  incoming: TimelineEvent[],
): TimelineEvent[] {
  const prevById = new Map(previous.map((e) => [e.id, e]));
  const prevByKey = new Map<string, TimelineEvent[]>();

  for (const event of previous) {
    const key = `${event.label.toLowerCase()}|${event.at}`;
    const list = prevByKey.get(key) ?? [];
    list.push(event);
    prevByKey.set(key, list);
  }

  const usedPrevIds = new Set<string>();

  return incoming.map((raw) => {
    if (raw.id && prevById.has(raw.id) && !usedPrevIds.has(raw.id)) {
      usedPrevIds.add(raw.id);
      return { ...raw, id: raw.id };
    }

    const key = `${raw.label.toLowerCase()}|${raw.at}`;
    const matches = prevByKey.get(key) ?? [];
    const match = matches.find((m) => !usedPrevIds.has(m.id));
    if (match) {
      usedPrevIds.add(match.id);
      return { ...raw, id: match.id };
    }

    return raw;
  });
}
