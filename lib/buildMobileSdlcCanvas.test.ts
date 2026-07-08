import { describe, expect, it } from "vitest";
import {
  buildMobileSdlcSnapshot,
  mobileSdlcContentCenter,
} from "@/lib/buildMobileSdlcCanvas";
import { SDLC_INPUTS } from "@/lib/mobileSdlc/sdlcInputs";
import { SDLC_PHASES } from "@/lib/mobileSdlc/sdlcPhases";

describe("buildMobileSdlcSnapshot", () => {
  it("builds a snapshot with all phase labels and input nodes", () => {
    const snapshot = buildMobileSdlcSnapshot();

    expect(snapshot.cardOrder).toContain("sdlc-sandbox-root");
    expect(snapshot.threadOrder.length).toBe(SDLC_PHASES.length);
    expect(snapshot.canvasTextLabelOrder?.length).toBe(SDLC_PHASES.length);

    const artifactNodes = snapshot.canvasArtifactOrder?.length ?? 0;
    const assetNodes = snapshot.canvasAssetOrder?.length ?? 0;
    const skillNodes = snapshot.canvasSkillOrder?.length ?? 0;

    // Inputs + one guidance stickynote per phase
    const expectedArtifacts =
      SDLC_INPUTS.filter(
        (i) =>
          i.kind !== "asset" && i.kind !== "skill",
      ).length + SDLC_PHASES.length;

    expect(artifactNodes).toBe(expectedArtifacts);
    expect(assetNodes).toBe(
      SDLC_INPUTS.filter((i) => i.kind === "asset").length,
    );
    expect(skillNodes).toBe(1);

    for (const id of snapshot.canvasArtifactOrder ?? []) {
      const node = snapshot.canvasArtifactNodes?.[id];
      expect(node).toBeDefined();
      expect(snapshot.sessionArtifacts[node!.artifactId]).toBeDefined();
    }

    for (const id of snapshot.canvasAssetOrder ?? []) {
      const node = snapshot.canvasAssetNodes?.[id];
      expect(node).toBeDefined();
      expect(snapshot.canvasAssets?.[node!.assetId]).toBeDefined();
    }
  });

  it("computes a finite content center", () => {
    const snapshot = buildMobileSdlcSnapshot();
    const center = mobileSdlcContentCenter(snapshot);
    expect(Number.isFinite(center.x)).toBe(true);
    expect(Number.isFinite(center.y)).toBe(true);
    expect(center.x).toBeGreaterThan(0);
  });
});
