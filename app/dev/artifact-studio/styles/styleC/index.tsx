"use client";

import type { CSSProperties } from "react";
import type { ArtifactStyleFamily, FrameSlotProps, StyleSlots } from "../types";
import { ClaimBody, DefinitionBody, QuoteBody, StickyBody } from "./cards";
import { AreaBody, BarBody, GaugeBody, LineBody, PieBody, StatBody } from "./charts";
import {
  CalendarBody,
  CodeBody,
  EpisodeBody,
  LinkGroupBody,
  MechanismBody,
  TableBody,
  TimelineBody,
  TodoBody,
} from "./lists";
import { AudioBody, ImagesBody, InsetBody, VideoBody, WebsiteBody } from "./media";
import { C, CARD_RADIUS, SC_THEMES, SURFACE_BG, paletteVars, scThemeOf, surfaceOf } from "./tokens";
import type { StyleTheme } from "../kit/look";

/**
 * Style C — "Integrated". There is no header slot: every title is set inside
 * its artifact as part of the graphic — the headline over a donut, the label
 * over a big number, the question two speech bubbles answer, the subject of a
 * timeline set poster-size. Each body decides how loud its title is.
 *
 * Cards are flat (no border, no shadow at rest) on a forest field, coloured
 * by role — see `surfaceOf` and the colour rules in ./tokens. The roles are
 * CSS variables, so the five themes (SC_THEMES) recolour every card without
 * touching a body.
 */

function CardFrame({ ctx, body }: FrameSlotProps) {
  const surface = surfaceOf(ctx.item.variant);
  const state: CSSProperties =
    ctx.chromeState === "selected"
      ? { outline: `4px solid ${C.orange}`, outlineOffset: 5 }
      : ctx.chromeState === "hover"
        ? { boxShadow: "0 18px 40px -12px rgba(0,0,0,0.45)", transform: "translateY(-2px)" }
        : {};
  return (
    <div
      data-sc-frame
      data-sc-surface={surface}
      className="flex h-full flex-col overflow-hidden font-sans transition-[box-shadow,transform] duration-200"
      style={{ ...paletteVars(scThemeOf(ctx.themeId).pal), background: SURFACE_BG[surface], borderRadius: CARD_RADIUS, color: C.ink, ...state }}
    >
      {body}
    </div>
  );
}

/** Notes carry their own paper; the frame only adds the interaction states. */
function NoteFrame({ ctx, body }: FrameSlotProps) {
  const state: CSSProperties =
    ctx.chromeState === "selected"
      ? { outline: `4px solid ${C.orange}`, outlineOffset: 5, borderRadius: 28 }
      : ctx.chromeState === "hover"
        ? { boxShadow: "0 18px 40px -12px rgba(0,0,0,0.45)", borderRadius: 28 }
        : {};
  return (
    <div className="flex h-full flex-col font-sans" style={{ ...paletteVars(scThemeOf(ctx.themeId).pal), ...state }}>
      {body}
    </div>
  );
}

/** The studio's theme contract (field drives the board backdrop); bodies read the palette, not these. */
const THEMES: StyleTheme[] = SC_THEMES.map(({ id, name, hint, pal }) => ({
  id,
  name,
  hint,
  vars: {
    field: pal.field,
    card: "#FFFFFF",
    well: pal.well,
    ink: pal.ink,
    muted: pal.fieldInk,
    faint: pal.fieldInk,
    hair: pal.fieldInk,
    accent: pal.accent,
    accentInk: pal.ink,
    head: pal.hero,
    headInk: pal.ink,
    series: [pal.ink, pal.worldDeep, pal.accent, ...pal.quiet],
    pos: pal.heroDeep,
    neg: pal.accent,
  },
}));

const NoHeader: StyleSlots["Header"] = () => null;
const NoIcon: StyleSlots["Icon"] = () => null;

export const STYLE_C: ArtifactStyleFamily = {
  id: "style-c",
  name: "Style C",
  status: "live",
  summary:
    "Integrated — no title bar; each title is set into its artifact's graphic. Hero, white and world cards on a dark field, one accent — in five palettes.",
  fonts: { primary: "space-grotesk", secondary: "figtree" },
  backdrop: { background: SC_THEMES[0]!.pal.field, ink: SC_THEMES[0]!.pal.fieldInk, muted: "rgba(243,246,228,0.62)" },
  themes: THEMES,
  slots: {
    Frame: CardFrame,
    Header: NoHeader,
    Icon: NoIcon,
    Body: InsetBody,
  },
  categories: {
    geo: { Body: InsetBody },
    media: { Body: InsetBody },
  },
  variants: {
    table: { Body: TableBody },
    "chart:bar": { Body: BarBody },
    "chart:line": { Body: LineBody },
    "chart:area": { Body: AreaBody },
    "chart:pie": { Body: PieBody },
    "chart:gauge": { Body: GaugeBody },
    stat: { Body: StatBody },
    mechanism: { Body: MechanismBody },
    timeline: { Body: TimelineBody },
    calendar: { Body: CalendarBody },
    todo: { Body: TodoBody },
    images: { Body: ImagesBody },
    video: { Body: VideoBody },
    audio: { Body: AudioBody },
    website: { Body: WebsiteBody },
    episode: { Body: EpisodeBody },
    linkgroup: { Body: LinkGroupBody },
    quote: { Body: QuoteBody },
    claim: { Body: ClaimBody },
    definition: { Body: DefinitionBody },
    code: { Body: CodeBody },
    custom: { Body: InsetBody },
    embed: { Body: InsetBody },
    stickynote: { Frame: NoteFrame, Body: StickyBody },
  },
};
