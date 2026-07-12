import { describe, expect, it } from "vitest";
import { resolveArtifactStyle } from "@/lib/design/style/resolveArtifactStyle";
import {
  ARTIFACT_STYLE_PACKS,
  DEFAULT_ARTIFACT_STYLE_ID,
  getArtifactStylePack,
} from "@/lib/design/style/stylePacks";

describe("resolveArtifactStyle", () => {
  it("resolves vanilla to an empty payload (structural no-op)", () => {
    const resolved = resolveArtifactStyle(DEFAULT_ARTIFACT_STYLE_ID);
    expect(resolved.isDefault).toBe(true);
    expect(resolved.css).toBe("");
    expect(resolved.lightVars).toEqual({});
    expect(resolved.darkVars).toEqual({});
  });

  it("falls back to vanilla for unknown pack ids", () => {
    expect(getArtifactStylePack("does-not-exist").id).toBe(
      DEFAULT_ARTIFACT_STYLE_ID,
    );
    expect(resolveArtifactStyle("does-not-exist").isDefault).toBe(true);
  });

  it("emits both scoped mode blocks for neo", () => {
    const resolved = resolveArtifactStyle("neo");
    expect(resolved.isDefault).toBe(false);
    expect(resolved.css).toContain('[data-artifact-style="neo"] {');
    expect(resolved.css).toContain(
      'html[data-theme="dark"] [data-artifact-style="neo"] {',
    );
  });

  it("scopes the #1754C6 accent (23 84 198) inside neo only", () => {
    const resolved = resolveArtifactStyle("neo");
    expect(resolved.lightVars["--canvas-accent"]).toBe("23 84 198");
    expect(resolved.lightVars["--canvas-accent-deep"]).toBeTruthy();
    // Dark accent is derived, not the light hex verbatim.
    expect(resolved.darkVars["--canvas-accent"]).toBeTruthy();
    expect(resolved.darkVars["--canvas-accent"]).not.toBe("23 84 198");
  });

  it("emits the full structural + surface variable set for neo", () => {
    const resolved = resolveArtifactStyle("neo");
    for (const name of [
      "--canvas-artifact-stroke-w",
      "--canvas-artifact-radius",
      "--canvas-artifact-card-fill",
      "--canvas-artifact-stroke",
      "--canvas-artifact-ambient-shadow",
      "--canvas-artifact-chin-shadow",
      "--canvas-artifact-selected-ring",
      "--canvas-artifact-selected-chin",
      "--canvas-artifact-header-bg",
      "--canvas-artifact-header-rule",
      "--canvas-artifact-control-stroke-w",
      "--canvas-artifact-checkbox-stroke-w",
    ]) {
      expect(resolved.lightVars[name], name).toBeTruthy();
    }
    // Dark block restates every surface token.
    for (const name of [
      "--canvas-artifact-card-fill",
      "--canvas-artifact-stroke",
      "--canvas-artifact-ambient-shadow",
      "--canvas-artifact-chin-shadow",
    ]) {
      expect(resolved.darkVars[name], name).toBeTruthy();
    }
  });

  it("keeps pack ids unique", () => {
    const ids = ARTIFACT_STYLE_PACKS.map((pack) => pack.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
