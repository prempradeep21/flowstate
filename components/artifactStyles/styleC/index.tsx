"use client";

import type { CSSProperties } from "react";
import type { StudioArtifact } from "@/lib/artifactStudio/pool";
import type { ArtifactStyleFamily, FrameSlotProps, StyleSlots } from "../types";
import { ClaimBody, Composer, ConversationBody, DefinitionBody, QaBody, QuoteBody, StickyBody } from "./cards";
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
import { C, CARD_RADIUS, SC_THEMES, SURFACE_BG, paletteVars, scPaletteOf, surfaceOf, type Palette } from "./tokens";
import type { StyleTheme } from "../kit/look";
import { CornerMenu } from "../menu";

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
      ? { outline: `4px solid ${C.orange}`, outlineOffset: 0 }
      : ctx.chromeState === "hover"
        ? { boxShadow: "0 18px 40px -12px rgba(0,0,0,0.45)", transform: "translateY(-2px)" }
        : {};
  return (
    <div
      data-sc-frame
      data-sc-surface={surface}
      className="relative flex h-full flex-1 flex-col overflow-hidden font-sans transition-[box-shadow,transform] duration-200"
      style={{ ...paletteVars(scPaletteOf(ctx.themeId, ctx.mode)), background: SURFACE_BG[surface], borderRadius: CARD_RADIUS, color: C.ink, ...state }}
    >
      {body}
      <CornerMenu ctx={ctx} cardRadius={CARD_RADIUS} />
    </div>
  );
}

/** Notes carry their own paper; the frame only adds the interaction states. */
function NoteFrame({ ctx, body }: FrameSlotProps) {
  const state: CSSProperties =
    ctx.chromeState === "selected"
      ? { outline: `4px solid ${C.orange}`, outlineOffset: 0, borderRadius: 28 }
      : ctx.chromeState === "hover"
        ? { boxShadow: "0 18px 40px -12px rgba(0,0,0,0.45)", borderRadius: 28 }
        : {};
  return (
    <div className="relative flex h-full flex-1 flex-col font-sans" style={{ ...paletteVars(scPaletteOf(ctx.themeId, ctx.mode)), ...state }}>
      {body}
      <CornerMenu ctx={ctx} cardRadius={28} />
    </div>
  );
}

/** The studio's theme contract (field drives the board backdrop); bodies read the palette, not these. */
function contractOf(pal: Palette) {
  return {
    field: pal.field,
    card: pal.paper ?? "#FFFFFF",
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
  };
}

const THEMES: StyleTheme[] = SC_THEMES.map(({ id, name, hint, pal, dark }) => ({
  id,
  name,
  hint,
  vars: contractOf(pal),
  dark: contractOf(dark),
}));

/**
 * Every Style C card hugs its content — no text is ever clamped or cut. Kinds
 * whose picture has no height of its own (charts, media, live embeds, the
 * timeline poster) keep their canvas height as the least they are drawn at
 * and grow past it when their words need the room; everything else is
 * exactly as tall as what it says.
 */
const KEEPS_ITS_HEIGHT = new Set<string>(["chart:bar", "chart:line", "chart:area", "chart:pie", "chart:gauge", "timeline", "images", "video", "audio", "map", "streetview", "3d", "website", "embed", "custom"]);

function hugFloor(item: StudioArtifact): number | null {
  if (KEEPS_ITS_HEIGHT.has(item.variant) || item.category === "geo" || item.category === "media") return item.natural.h;
  if (item.payload.type === "episode" && item.payload.data.thumb) return item.natural.h;
  return 0;
}

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
  darkBackdrop: { background: SC_THEMES[0]!.dark.field, ink: SC_THEMES[0]!.dark.fieldInk, muted: "rgba(230,238,221,0.62)" },
  themes: THEMES,
  Composer,
  hug: hugFloor,
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
    qa: { Body: QaBody },
    conversation: { Body: ConversationBody },
  },
};
