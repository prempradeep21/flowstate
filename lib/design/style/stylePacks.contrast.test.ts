import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/design/contrast";
import { getArtifactStylePack } from "@/lib/design/style/stylePacks";
import type { ArtifactStyleSurfaceTokens } from "@/lib/design/style/types";
import { ARTIFACT_CATEGORY_IDS } from "@/lib/design/theme/types";

/**
 * Contrast guard for the color-led packs. Every text pair the stylesheet can
 * produce is asserted against WCAG AA (4.5:1); surfaces are asserted to be
 * visibly distinct from the canvas. Decorative `vivid` inks carry no text
 * guarantee and are not tested as text.
 */

const AA = 4.5;

function modes(id: string): Array<["light" | "dark", ArtifactStyleSurfaceTokens]> {
  const pack = getArtifactStylePack(id);
  return [
    ["light", pack.light],
    ["dark", pack.dark],
  ];
}

function expectRatio(label: string, a: string, b: string, min: number) {
  const ratio = contrastRatio(a, b);
  expect(ratio, `${label}: ${a} on ${b} = ${ratio.toFixed(2)} (min ${min})`).toBeGreaterThanOrEqual(min);
}

describe("bento contrast", () => {
  for (const [mode, tokens] of modes("bento")) {
    const cats = tokens.categories!;
    const canvas = tokens.canvasBg!;
    for (const category of ARTIFACT_CATEGORY_IDS) {
      const t = cats[category];
      it(`${mode} ${category}: text pairs clear AA`, () => {
        expectRatio("onSolid/solid", t.onSolid, t.solid, AA);
        expectRatio("onSolidMuted/solid", t.onSolidMuted, t.solid, AA);
        expectRatio("ink/pale", t.ink, t.pale, AA);
        expectRatio("muted/pale", t.muted, t.pale, AA);
      });
      it(`${mode} ${category}: surfaces separate from the canvas`, () => {
        expectRatio("pale/canvas", t.pale, canvas, 1.1);
        expectRatio("solid/canvas", t.solid, canvas, 1.2);
      });
    }
    it(`${mode}: chart ink clears AA on the chart background`, () => {
      expectRatio("chart ink/bg", tokens.chart!.ink, tokens.chart!.bg, AA);
      expectRatio("chart muted/bg", tokens.chart!.muted, tokens.chart!.bg, AA);
    });
  }
});

describe("frost contrast", () => {
  for (const [mode, tokens] of modes("frost")) {
    it(`${mode}: ink and muted clear AA on the frost card`, () => {
      expectRatio("ink/card", tokens.surfaceInk!, tokens.cardFill, AA);
      expectRatio("muted/card", tokens.surfaceMuted!, tokens.cardFill, AA);
    });
    it(`${mode}: chart ink clears AA on the chart background`, () => {
      expectRatio("chart ink/bg", tokens.chart!.ink, tokens.chart!.bg, AA);
      expectRatio("chart muted/bg", tokens.chart!.muted, tokens.chart!.bg, AA);
    });
    it(`${mode}: the frost card separates from the canvas`, () => {
      expectRatio("card/canvas", tokens.cardFill, tokens.canvasBg!, 1.1);
    });
  }
  it("lime ink clears AA on the lime mark", () => {
    expectRatio("lime ink/lime", "#1C1C1E", "#DDF23F", AA);
  });
});
