import { describe, expect, it } from "vitest";
import {
  detectCalendarIntent,
  detectChartIntent,
  detectCustomUiIntent,
  detectLiveDataIntent,
  detectTableIntent,
  detectUserRequestedArtifactKind,
  resolveInitialThinkingLabel,
  resolvePrimaryArtifactKind,
  stripAppendedQuestionContext,
} from "@/lib/artifactIntent";

describe("detectCustomUiIntent", () => {
  it("detects interactive widget build requests", () => {
    expect(
      detectCustomUiIntent(
        "Build an interactive widget that shows the time difference between India and Thailand.",
      ),
    ).toBe(true);
  });

  it("detects theme follow-ups on custom UI", () => {
    expect(detectCustomUiIntent("make it black and white theme")).toBe(true);
    expect(detectCustomUiIntent("switch to dark mode")).toBe(true);
  });

  it("ignores plain text questions", () => {
    expect(detectCustomUiIntent("What is the capital of France?")).toBe(false);
  });

  it("does not treat calendar requests as custom UI", () => {
    expect(detectCustomUiIntent("Build a calendar for June")).toBe(false);
  });
});

describe("detectCalendarIntent", () => {
  it("detects ISO dates", () => {
    expect(detectCalendarIntent("Meeting on 2026-06-10")).toBe(true);
  });

  it("detects month-name dates", () => {
    expect(detectCalendarIntent("Visa appointment June 15")).toBe(true);
  });

  it("detects scheduling language", () => {
    expect(detectCalendarIntent("What is on my schedule this week?")).toBe(
      true,
    );
  });

  it("ignores plain geography questions", () => {
    expect(detectCalendarIntent("What is the capital of France?")).toBe(false);
  });
});

describe("detectChartIntent", () => {
  it("detects visualization requests", () => {
    expect(detectChartIntent("Plot my sleep trend over the past two weeks")).toBe(
      true,
    );
  });

  it("detects comparison breakdowns", () => {
    expect(detectChartIntent("Breakdown of my monthly spending by category")).toBe(
      true,
    );
  });

  it("ignores plain table editing", () => {
    expect(detectChartIntent("Add a row to the table")).toBe(false);
  });

  it("does not trigger on month name alone", () => {
    expect(detectChartIntent("Planning a trip in November")).toBe(false);
  });

  it("detects bar graph revenue requests", () => {
    expect(
      detectChartIntent(
        "Show me the revenue of Airbnb in a bar graph in the last ten years.",
      ),
    ).toBe(true);
  });
});

describe("detectUserRequestedArtifactKind", () => {
  it("prefers calendar over custom for date messages", () => {
    expect(detectUserRequestedArtifactKind("Show me a calendar for June")).toBe(
      "calendar",
    );
  });

  it("detects chart kind for viz requests", () => {
    expect(detectUserRequestedArtifactKind("Visualize EV sales since 2018")).toBe(
      "chart",
    );
  });

  it("prefers explicit custom UI over incidental calendar mentions", () => {
    const q =
      "Build a custom UI artifact — interactive OSM road map with location search.";
    expect(detectUserRequestedArtifactKind(q)).toBe("custom");
    expect(resolveInitialThinkingLabel(q)).toBe("Building custom component…");
  });

  it("ignores calendar in appended skill context", () => {
    const q =
      "Build a custom UI artifact — interactive OSM road map with location search.\n\nAttached skill context:\n\nDo not use custom for date calendars — use type calendar.";
    expect(stripAppendedQuestionContext(q)).toBe(
      "Build a custom UI artifact — interactive OSM road map with location search.",
    );
    expect(resolvePrimaryArtifactKind(q)).toBe("custom");
    expect(resolveInitialThinkingLabel(q)).toBe("Building custom component…");
  });

  it("does not treat instructional calendar mentions as calendar intent", () => {
    expect(
      detectCalendarIntent(
        "Do not use custom for date calendars — use type calendar.",
      ),
    ).toBe(false);
  });
});

describe("detectLiveDataIntent", () => {
  it("detects current weather style questions", () => {
    expect(detectLiveDataIntent("What is the weather in Bangkok today?")).toBe(
      true,
    );
  });

  it("ignores historical revenue series", () => {
    expect(
      detectLiveDataIntent(
        "Show me the revenue of Airbnb in a bar graph in the last ten years.",
      ),
    ).toBe(false);
  });

  it("ignores evergreen travel table requests", () => {
    expect(
      detectLiveDataIntent(
        "Give me the top 10 places to visit in Thailand in a table",
      ),
    ).toBe(false);
  });
});

describe("detectTableIntent", () => {
  it("detects explicit in a table requests", () => {
    expect(
      detectTableIntent(
        "Give me the top 10 places to visit in Thailand in a table",
      ),
    ).toBe(true);
  });
});

describe("resolvePrimaryArtifactKind table vs travel", () => {
  it("prefers table over map when user asked for a table", () => {
    const q =
      "I am planning a trip to Thailand this November. Give me the top 10 places in a table.";
    expect(detectTableIntent(q)).toBe(true);
    expect(resolvePrimaryArtifactKind(q)).toBe("table");
  });
});
