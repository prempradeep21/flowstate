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

describe("riso contrast", () => {
  for (const [mode, tokens] of modes("riso")) {
    const cats = tokens.categories!;
    const canvas = tokens.canvasBg!;
    const paper = tokens.surfaceCard!;
    it(`${mode}: neutral text on paper`, () => {
      expectRatio("ink/paper", tokens.surfaceInk!, paper, 7);
      expectRatio("muted/paper", tokens.surfaceMuted!, paper, AA);
      expectRatio("stroke/canvas", tokens.stroke, canvas, 3);
      expectRatio("paper/canvas", paper, canvas, 1.08);
    });
    for (const category of ARTIFACT_CATEGORY_IDS) {
      const t = cats[category];
      it(`${mode} ${category}: text pairs clear AA`, () => {
        // Category text (numerals, table heads, roles) on paper and on tint.
        expectRatio("ink/paper", t.ink, paper, AA);
        expectRatio("ink/tint", t.ink, t.pale, AA);
        // Neutral text on tint fills (pill nodes, examples, sticky notes).
        expectRatio("neutralInk/tint", tokens.surfaceInk!, t.pale, 7);
        // Text on vivid chips (today chip, checked boxes, icon chips).
        expectRatio("onSolid/vivid", t.onSolid, t.vivid, AA);
      });
      it(`${mode} ${category}: tint block is visible on paper`, () => {
        expectRatio("tint/paper", t.pale, paper, 1.12);
      });
    }
    it(`${mode}: chart ink clears AA on the chart background`, () => {
      expectRatio("chart ink/bg", tokens.chart!.ink, tokens.chart!.bg, AA);
      expectRatio("chart muted/bg", tokens.chart!.muted, tokens.chart!.bg, AA);
    });
  }
});
