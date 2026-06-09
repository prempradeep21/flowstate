import { describe, expect, it } from "vitest";
import {
  countWords,
  createTimelineEvent,
  isValidTimelineLabel,
  mergeTimelineEventsFromAi,
  normalizeTimelineArtifactData,
  normalizeTimelineEvent,
  TIMELINE_EVENT_MAX_WORDS,
  truncateTimelineLabel,
} from "@/lib/timelineArtifact";
import {
  generateTicks,
  generateVisibleTicks,
  parseRange,
  timeToX,
  trackWidth,
  xToTime,
} from "@/lib/timelineLayout";

describe("truncateTimelineLabel", () => {
  it("caps at 10 words", () => {
    const long = "one two three four five six seven eight nine ten eleven";
    expect(countWords(long)).toBe(11);
    expect(truncateTimelineLabel(long)).toBe(
      "one two three four five six seven eight nine ten",
    );
  });

  it("isValidTimelineLabel rejects empty and over-limit", () => {
    expect(isValidTimelineLabel("")).toBe(false);
    expect(isValidTimelineLabel("hello world")).toBe(true);
    expect(
      isValidTimelineLabel("a b c d e f g h i j k"),
    ).toBe(false);
  });
});

describe("normalizeTimelineEvent", () => {
  it("accepts label or legacy title field", () => {
    const e = normalizeTimelineEvent({
      at: "2024-03-15T00:00:00.000Z",
      title: "Product launch event",
    });
    expect(e?.label).toBe("Product launch event");
  });

  it("truncates long labels", () => {
    const words = Array.from({ length: 12 }, (_, i) => `w${i}`).join(" ");
    const e = normalizeTimelineEvent({
      at: "2024-01-01T00:00:00.000Z",
      label: words,
    });
    expect(countWords(e!.label)).toBe(TIMELINE_EVENT_MAX_WORDS);
  });
});

describe("normalizeTimelineArtifactData", () => {
  it("sorts events by date", () => {
    const data = normalizeTimelineArtifactData({
      events: [
        { at: "2025-01-01T00:00:00.000Z", label: "Later" },
        { at: "2020-01-01T00:00:00.000Z", label: "Earlier" },
      ],
    });
    expect(data.events[0]!.label).toBe("Earlier");
    expect(data.scale).toBe("year");
  });

  it("defaults empty range", () => {
    const data = normalizeTimelineArtifactData({ events: [] });
    expect(data.rangeStart).toBeDefined();
    expect(data.rangeEnd).toBeDefined();
  });
});

describe("createTimelineEvent", () => {
  it("creates a valid event", () => {
    const e = createTimelineEvent({
      at: "2024-06-01",
      label: "Ship v1",
    });
    expect(e.id).toMatch(/^evt_/);
    expect(e.label).toBe("Ship v1");
  });
});

describe("mergeTimelineEventsFromAi", () => {
  it("preserves ids from previous events", () => {
    const previous = [
      {
        id: "evt_keep",
        label: "Launch",
        at: "2024-03-01T00:00:00.000Z",
      },
    ];
    const incoming = [
      {
        label: "Launch",
        at: "2024-03-01T00:00:00.000Z",
      },
    ];
    const merged = mergeTimelineEventsFromAi(
      previous,
      incoming as never,
    );
    expect(merged[0]!.id).toBe("evt_keep");
  });
});

describe("timelineLayout", () => {
  it("maps time to x within track", () => {
    const range = parseRange(
      "2020-01-01T00:00:00.000Z",
      "2025-01-01T00:00:00.000Z",
      "year",
    );
    const w = trackWidth(range, "year", 1);
    const x0 = timeToX("2020-01-01T00:00:00.000Z", range, w);
    const x1 = timeToX("2025-01-01T00:00:00.000Z", range, w);
    expect(x1).toBeGreaterThan(x0);
  });

  it("round-trips x to time", () => {
    const range = parseRange(
      "2024-01-01T00:00:00.000Z",
      "2024-12-31T00:00:00.000Z",
      "month",
    );
    const w = trackWidth(range, "month", 1);
    const mid = (w - 48 * 2) / 2 + 48;
    const iso = xToTime(mid, range, w);
    expect(new Date(iso).getTime()).toBeGreaterThan(range.startMs);
  });

  it("generates year ticks", () => {
    const range = parseRange(
      "2020-01-01T00:00:00.000Z",
      "2023-01-01T00:00:00.000Z",
      "year",
    );
    const w = trackWidth(range, "year", 1);
    const ticks = generateTicks(range, "year", w);
    expect(ticks.length).toBeGreaterThanOrEqual(4);
  });

  it("generates adaptive visible ticks for infinite viewport", () => {
    const center = new Date("1942-06-01T00:00:00.000Z").getTime();
    const ticks = generateVisibleTicks(center, 800, "year", 1);
    expect(ticks.length).toBeGreaterThan(3);
    expect(ticks.some((t) => t.label.includes("194"))).toBe(true);
  });

  it("uses century labels when zoomed far out", () => {
    const center = new Date("1950-01-01T00:00:00.000Z").getTime();
    const ticks = generateVisibleTicks(center, 800, "year", 0.05);
    expect(ticks.some((t) => t.label.endsWith("s"))).toBe(true);
  });
});
