import { describe, expect, it } from "vitest";
import {
  buildMonthWeeks,
  layoutWeekEventSegments,
  mergeCalendarEventsFromAi,
  normalizeCalendarArtifactData,
  normalizeCalendarEvent,
  normalizeIsoDate,
} from "@/lib/calendarArtifact";

describe("normalizeIsoDate", () => {
  it("accepts YYYY-MM-DD", () => {
    expect(normalizeIsoDate("2026-06-10")).toBe("2026-06-10");
  });

  it("parses human-readable dates", () => {
    expect(normalizeIsoDate("June 10, 2026")).toBe("2026-06-10");
  });
});

describe("normalizeCalendarEvent", () => {
  it("coerces end date to start when missing", () => {
    const event = normalizeCalendarEvent({
      title: "Meeting",
      startDate: "2026-06-10",
    });
    expect(event).toEqual({
      id: expect.any(String),
      title: "Meeting",
      startDate: "2026-06-10",
      endDate: "2026-06-10",
    });
  });

  it("swaps inverted ranges", () => {
    const event = normalizeCalendarEvent({
      title: "Offsite",
      startDate: "2026-06-12",
      endDate: "2026-06-10",
    });
    expect(event?.startDate).toBe("2026-06-10");
    expect(event?.endDate).toBe("2026-06-12");
  });
});

describe("normalizeCalendarArtifactData", () => {
  it("dedupes highlighted dates", () => {
    const data = normalizeCalendarArtifactData({
      viewYear: 2026,
      viewMonth: 6,
      highlightedDates: ["2026-06-10", "2026-06-10"],
      events: [],
    });
    expect(data.highlightedDates).toEqual(["2026-06-10"]);
  });
});

describe("mergeCalendarEventsFromAi", () => {
  it("preserves ids from previous events", () => {
    const previous = [
      {
        id: "evt_keep",
        title: "Visa",
        startDate: "2026-06-15",
        endDate: "2026-06-15",
      },
    ];
    const incoming = [
      {
        title: "Visa",
        startDate: "2026-06-15",
        endDate: "2026-06-15",
      },
    ];
    const merged = mergeCalendarEventsFromAi(previous, incoming as never);
    expect(merged[0].id).toBe("evt_keep");
  });
});

describe("buildMonthWeeks", () => {
  it("pads June 2026 to full weeks", () => {
    const weeks = buildMonthWeeks(2026, 6);
    expect(weeks.length).toBeGreaterThanOrEqual(4);
    const inMonth = weeks.flatMap((w) =>
      w.days.filter((d) => d.inMonth && d.iso),
    );
    expect(inMonth).toHaveLength(30);
  });
});

describe("layoutWeekEventSegments", () => {
  it("spans multi-day events across columns", () => {
    const week = buildMonthWeeks(2026, 6)[1];
    const segments = layoutWeekEventSegments(week.days, [
      {
        id: "e1",
        title: "Offsite",
        startDate: "2026-06-08",
        endDate: "2026-06-10",
      },
    ]);
    expect(segments.length).toBe(1);
    expect(segments[0].span).toBeGreaterThan(1);
  });
});
