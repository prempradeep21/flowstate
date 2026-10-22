import { describe, expect, it } from "vitest";
import { resolveArtifactStyle } from "@/lib/design/style/resolveArtifactStyle";
import { getArtifactStylePack } from "@/lib/design/style/stylePacks";
import { isEmptyPayload } from "@/components/frost/FrostStates";
import type { ArtifactPayload } from "@/lib/artifactTypes";

describe("frost pack", () => {
  it("routes artifacts through the Style D body family", () => {
    expect(getArtifactStylePack("frost").bodyFamily).toBe("frost");
    expect(getArtifactStylePack("bento").bodyFamily).toBeUndefined();
  });

  it("hands connector colours to the JS renderers in both modes", () => {
    const pack = getArtifactStylePack("frost");
    expect(pack.light.connector?.active).toBeTruthy();
    expect(pack.dark.connector?.line).toBeTruthy();
    expect(getArtifactStylePack("vanilla").light.connector).toBeUndefined();
  });

  it("emits its variables for portaled canvas menus too", () => {
    const { css } = resolveArtifactStyle("frost");
    expect(css).toContain('html[data-canvas-style="frost"] [data-canvas-portal] {');
    expect(css).toContain('html[data-theme="dark"][data-canvas-style="frost"] [data-canvas-portal] {');
  });
});

describe("frost empty state", () => {
  const todo = (n: number): ArtifactPayload => ({
    type: "todo",
    title: "Trip",
    data: { items: Array.from({ length: n }, (_, i) => ({ id: String(i), label: "x", checked: false })) },
  } as ArtifactPayload);

  it("treats a list with no items as empty", () => {
    expect(isEmptyPayload(todo(0))).toBe(true);
    expect(isEmptyPayload(todo(2))).toBe(false);
  });

  it("treats a chart without categories as empty, and a gauge by its value", () => {
    const bar = { type: "chart", title: "c", data: { chartType: "bar", categories: [], series: [] } } as unknown as ArtifactPayload;
    const gauge = { type: "chart", title: "g", data: { chartType: "gauge", gaugeValue: 40 } } as unknown as ArtifactPayload;
    expect(isEmptyPayload(bar)).toBe(true);
    expect(isEmptyPayload(gauge)).toBe(false);
  });

  it("never treats free-form kinds as empty", () => {
    const quote = { type: "quote", title: "q", data: { text: "" } } as unknown as ArtifactPayload;
    expect(isEmptyPayload(quote)).toBe(false);
  });
});
