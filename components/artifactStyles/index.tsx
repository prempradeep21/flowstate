"use client";

import type { ReactNode } from "react";
import type { StudioArtifact } from "@/lib/artifactStudio/pool";
import { CURRENT_STYLE } from "./current";
import { STYLE_C } from "./styleC";
import { STYLE_D, STYLE_E } from "./styleD";
import { CAPSULE } from "./capsule";
import { WIRE } from "./wire";
import { qaStateOf } from "./cards";
import { fontPairStyle, fontsFor, useFontState, type FontPair } from "./fonts";
import { fieldBackdrop, themeVarsOf } from "./kit/look";
import type {
  ArtifactRenderContext,
  ArtifactStyleFamily,
  Backdrop,
  StudioMode,
  StyleFamilyId,
  StyleSlots,
} from "./types";

export const STYLE_FAMILIES: ArtifactStyleFamily[] = [
  CURRENT_STYLE,
  STYLE_C,
  STYLE_D,
  STYLE_E,
  WIRE,
  CAPSULE,
];

/** The theme an artifact is drawn in: `themeId` if the family has it, else its first. */
export function getStyleTheme(family: ArtifactStyleFamily, themeId: string | null | undefined) {
  return family.themes?.find((t) => t.id === themeId) ?? family.themes?.[0] ?? null;
}

/** The ground a family (in a theme and mode) is designed to sit on. */
export function backdropOf(family: ArtifactStyleFamily, themeId: string | null | undefined, mode: StudioMode = "light"): Backdrop | undefined {
  const theme = getStyleTheme(family, themeId);
  if (theme) return fieldBackdrop(themeVarsOf(theme, mode));
  return mode === "dark" ? family.darkBackdrop ?? family.backdrop : family.backdrop;
}

export function getStyleFamily(id: string | null | undefined): ArtifactStyleFamily {
  return STYLE_FAMILIES.find((f) => f.id === id) ?? CURRENT_STYLE;
}

export function isStyleFamilyId(id: string | null): id is StyleFamilyId {
  return STYLE_FAMILIES.some((f) => f.id === id);
}

/**
 * The least height an artifact hugging its content is drawn at in a family,
 * or null when it keeps its fixed canvas box. See `ArtifactStyleFamily.hug`.
 */
export function hugFloorOf(family: ArtifactStyleFamily, item: StudioArtifact): number | null {
  if (family.hug) return family.hug(item);
  return item.variant === "mechanism" || item.variant === "qa" ? 0 : null;
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
  } else if (qaStateOf(ctx) === "typing" && family.Composer) {
    // The empty card is the composer alone — nothing to frame yet.
    const Composer = family.Composer;
    content = <Composer ctx={ctx} />;
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

export type { ArtifactRenderContext, ArtifactStyleFamily, StyleFamilyId, ChromeState, QaState, StudioMode } from "./types";
export type { StyleTheme } from "./kit/look";
export { FONT_OPTIONS, fontOf, previewFamilyFonts, setFamilyFonts, type FontId, type FontPair, type FontSlot } from "./fonts";
