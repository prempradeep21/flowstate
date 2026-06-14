import { describe, expect, it } from "vitest";
import { seedCustomUiTurnState } from "@/lib/customUiTurnSeed";
import type { SessionArtifact } from "@/lib/sessionArtifacts";

describe("seedCustomUiTurnState", () => {
  it("seeds edit stages for custom artifact follow-ups", () => {
    const sessionArtifacts: Record<string, SessionArtifact> = {
      art1: {
        id: "art1",
        kind: "custom",
        title: "Pixel Art",
        latestVersionId: "v1",
        versions: [
          {
            id: "v1",
            createdAt: 1,
            payload: {
              type: "custom",
              title: "Pixel Art",
              data: { html: "<div></div>" },
            },
          },
        ],
      },
    };

    const seed = seedCustomUiTurnState(
      "make the grid bigger",
      "art1",
      undefined,
      sessionArtifacts,
    );

    expect(seed).not.toBeNull();
    expect(seed!.thinkingLabel).toBe("Updating custom component…");
    expect(seed!.sdkBuildStages.map((s) => s.id)).toEqual([
      "connect",
      "orchestrate",
      "ui-editor",
      "emit",
    ]);
    expect(seed!.sdkBuildStages[0]?.status).toBe("active");
  });

  it("seeds build stages for new custom UI follow-up prompts", () => {
    const seed = seedCustomUiTurnState(
      "Build an interactive widget for pixel art editing",
      undefined,
      undefined,
      {},
    );

    expect(seed).not.toBeNull();
    expect(seed!.thinkingLabel).toBe("Building custom component…");
    expect(seed!.sdkBuildStages.some((s) => s.id === "ui-planner")).toBe(true);
  });
});
