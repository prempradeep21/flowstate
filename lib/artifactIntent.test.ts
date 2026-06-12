import { describe, expect, it } from "vitest";
import {
  detectCalendarIntent,
  detectChartIntent,
  detectCustomUiIntent,
  detectUserRequestedArtifactKind,
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
});
