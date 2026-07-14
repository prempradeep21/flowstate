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

  it("scopes the #2066EB accent (32 102 235) inside neo only", () => {
    const resolved = resolveArtifactStyle("neo");
    expect(resolved.lightVars["--canvas-accent"]).toBe("32 102 235");
    expect(resolved.lightVars["--canvas-accent-deep"]).toBeTruthy();
    // Dark accent is derived, not the light hex verbatim.
    expect(resolved.darkVars["--canvas-accent"]).toBeTruthy();
    expect(resolved.darkVars["--canvas-accent"]).not.toBe("32 102 235");
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

  it("emits the quirk variable set for every non-default pack", () => {
    for (const pack of ARTIFACT_STYLE_PACKS) {
      if (pack.id === DEFAULT_ARTIFACT_STYLE_ID) continue;
      const resolved = resolveArtifactStyle(pack.id);
      for (const name of [
        "--canvas-artifact-tilt",
        "--canvas-artifact-hover-lift",
        "--canvas-artifact-press-push",
        "--canvas-artifact-hard-shadow",
      ]) {
        expect(resolved.lightVars[name], `${pack.id} ${name}`).toBeTruthy();
      }
    }
  });

  it("keeps the quirk tokens inert on neo (present but disabled)", () => {
    const resolved = resolveArtifactStyle("neo");
    expect(resolved.lightVars["--canvas-artifact-tilt"]).toBe("0deg");
    expect(resolved.lightVars["--canvas-artifact-hard-shadow"]).toBe("none");
    // No canvas recolor unless a pack opts in.
    expect(resolved.lightVars["--canvas-bg"]).toBeUndefined();
    expect(resolved.darkVars["--canvas-bg"]).toBeUndefined();
    expect(resolved.lightVars["--canvas-dot"]).toBeUndefined();
    expect(resolved.darkVars["--canvas-dot"]).toBeUndefined();
  });

  it("leaves the canvas backdrop to the theme for neobrutalism", () => {
    const resolved = resolveArtifactStyle("neobrutalism");
    expect(resolved.isDefault).toBe(false);
    // The pack no longer recolors the canvas — it inherits the theme backdrop.
    expect(resolved.lightVars["--canvas-bg"]).toBeUndefined();
    expect(resolved.darkVars["--canvas-bg"]).toBeUndefined();
    expect(resolved.lightVars["--canvas-artifact-stage"]).toBeUndefined();
    expect(resolved.lightVars["--canvas-dot"]).toBeUndefined();
    expect(resolved.darkVars["--canvas-dot"]).toBeUndefined();
    // The scope block is still emitted for the other (structure/surface) vars.
    expect(resolved.css).toContain('[data-artifact-style="neobrutalism"] {');
    expect(resolved.css).toContain(
      'html[data-theme="dark"] [data-artifact-style="neobrutalism"] {',
    );
  });

  it("registers packs in picker order with liquid glass last", () => {
    expect(ARTIFACT_STYLE_PACKS.map((pack) => pack.id)).toEqual([
      "vanilla",
      "neo",
      "neobrutalism",
      "liquid-glass",
    ]);
  });

  it("emits the glass material tokens for liquid glass", () => {
    const resolved = resolveArtifactStyle("liquid-glass");
    expect(resolved.isDefault).toBe(false);
    expect(resolved.css).toContain('[data-artifact-style="liquid-glass"] {');
    expect(resolved.css).toContain(
      'html[data-theme="dark"] [data-artifact-style="liquid-glass"] {',
    );
    expect(resolved.lightVars["--canvas-artifact-backdrop-filter"]).toBe(
      "blur(20px) saturate(1.7)",
    );
    expect(resolved.lightVars["--canvas-artifact-card-alpha"]).toBe("0.55");
    expect(resolved.darkVars["--canvas-artifact-card-alpha"]).toBe("0.5");
    expect(resolved.lightVars["--canvas-artifact-inner-highlight"]).toBeTruthy();
    expect(resolved.darkVars["--canvas-artifact-inner-highlight"]).toBeTruthy();
    // Tinted canvas backdrop so the blur has content to refract.
    expect(resolved.lightVars["--canvas-bg"]).toBe("221 229 239");
    expect(resolved.darkVars["--canvas-bg"]).toBe("16 19 25");
    // No pack accent — glass adapts to the active theme accent.
    expect(resolved.lightVars["--canvas-accent"]).toBeUndefined();
  });

  it("keeps the glass tokens off non-glass packs", () => {
    const resolved = resolveArtifactStyle("neo");
    expect(
      resolved.lightVars["--canvas-artifact-backdrop-filter"],
    ).toBeUndefined();
    expect(resolved.lightVars["--canvas-artifact-card-alpha"]).toBeUndefined();
    expect(
      resolved.lightVars["--canvas-artifact-inner-highlight"],
    ).toBeUndefined();
    expect(resolved.darkVars["--canvas-artifact-card-alpha"]).toBeUndefined();
  });

  it("gives neobrutalism hard zero-blur shadows and thick strokes", () => {
    const resolved = resolveArtifactStyle("neobrutalism");
    expect(resolved.lightVars["--canvas-artifact-hard-shadow"]).toBe(
      "6px 6px 0 #000000",
    );
    expect(resolved.lightVars["--canvas-artifact-stroke-w"]).toBe("3px");
    expect(resolved.lightVars["--canvas-artifact-tilt"]).toBe("-0.5deg");
    // Dark shadow is the hot-pink pop, not black.
    expect(resolved.darkVars["--canvas-artifact-hard-shadow"]).toBe(
      "6px 6px 0 #FF7AA8",
    );
  });
});
