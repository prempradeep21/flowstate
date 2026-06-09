import { describe, expect, it } from "vitest";
import {
  detectCalendarIntent,
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

describe("detectUserRequestedArtifactKind", () => {
  it("prefers calendar over custom for date messages", () => {
    expect(detectUserRequestedArtifactKind("Show me a calendar for June")).toBe(
      "calendar",
    );
  });
});
