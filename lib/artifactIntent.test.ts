import { describe, expect, it } from "vitest";
import { detectCustomUiIntent } from "@/lib/artifactIntent";

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
});
