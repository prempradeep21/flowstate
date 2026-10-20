"use client";

import type { ReactNode } from "react";
import { CURRENT_STYLE } from "./current";
import { STYLE_C } from "./styleC";
import { STYLE_B } from "./styleB";
import { STYLE_D, STYLE_E } from "./styleD";
import { BADGE } from "./badge";
import { CAPSULE } from "./capsule";
import { LEDGER } from "./ledger";
import { WIRE } from "./wire";
import { fontPairStyle, fontsFor, useFontState, type FontPair } from "./fonts";
import type {
  ArtifactRenderContext,
  ArtifactStyleFamily,
  StyleFamilyId,
  StyleSlots,
} from "./types";

export const STYLE_FAMILIES: ArtifactStyleFamily[] = [
  CURRENT_STYLE,
  STYLE_B,
  STYLE_C,
  STYLE_D,
  STYLE_E,
  LEDGER,
  BADGE,
  WIRE,
  CAPSULE,
];

/** The theme an artifact is drawn in: `themeId` if the family has it, else its first. */
export function getStyleTheme(family: ArtifactStyleFamily, themeId: string | null | undefined) {
  return family.themes?.find((t) => t.id === themeId) ?? family.themes?.[0] ?? null;
}

/** The ground a family (in a theme) is designed to sit on. */
export function backdropOf(family: ArtifactStyleFamily, themeId: string | null | undefined) {
  const theme = getStyleTheme(family, themeId);
  if (theme) {
    const dark = isDark(theme.vars.field);
    return { background: theme.vars.field, ink: dark ? "#F5F5F2" : theme.vars.ink, muted: dark ? "rgba(245,245,242,0.62)" : theme.vars.muted };
  }
  return family.backdrop;
}

function isDark(hex: string): boolean {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return false;
  const n = parseInt(m[1]!, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}

export function getStyleFamily(id: string | null | undefined): ArtifactStyleFamily {
  return STYLE_FAMILIES.find((f) => f.id === id) ?? CURRENT_STYLE;
}

export function isStyleFamilyId(id: string | null): id is StyleFamilyId {
  return STYLE_FAMILIES.some((f) => f.id === id);
}

/** variant override → category override → family default. */
export function resolveSlots(
  family: ArtifactStyleFamily,
  ctx: ArtifactRenderContext,
): StyleSlots {
  return {
    ...family.slots,
    ...family.categories?.[ctx.item.category],
    ...family.variants?.[ctx.item.variant],
  };
}

/** The two fonts a family draws with: live preview, else saved override, else its default. */
export function useFamilyFonts(family: ArtifactStyleFamily): FontPair {
  return fontsFor(useFontState(), family.id, family.fonts);
}

/** The pair a family has committed — what the pickers show while one is being auditioned. */
export function useSavedFamilyFonts(family: ArtifactStyleFamily): FontPair {
  return useFontState().saved[family.id] ?? family.fonts;
}

/** One artifact drawn in one style family. Fills its parent box. */
export function StyledArtifact({
  family,
  ctx,
}: {
  family: ArtifactStyleFamily;
  ctx: ArtifactRenderContext;
}) {
  const fonts = useFamilyFonts(family);
  let content: ReactNode;
  if (family.render) {
    const Render = family.render;
    content = <Render ctx={ctx} />;
  } else {
    const { Frame, Header, Icon, Body } = resolveSlots(family, ctx);
    content = (
      <Frame
        ctx={ctx}
        header={<Header ctx={ctx} icon={<Icon ctx={ctx} />} />}
        body={<Body ctx={ctx} />}
      />
    );
  }
  return (
    <div data-studio-fonts className="contents" style={fontPairStyle(fonts)}>
      {content}
    </div>
  );
}

export type { ArtifactRenderContext, ArtifactStyleFamily, StyleFamilyId, ChromeState } from "./types";
export type { StyleTheme } from "./kit/look";
export { FONT_OPTIONS, fontOf, previewFamilyFonts, setFamilyFonts, type FontId, type FontPair, type FontSlot } from "./fonts";
