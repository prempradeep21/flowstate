"use client";

import type { CSSProperties } from "react";
import type { StudioArtifact } from "@/lib/artifactStudio/pool";
import type { ArtifactStyleFamily, FrameSlotProps, StyleSlots } from "../types";
import { CornerMenu } from "../menu";
import { ClaimBody, ConversationBody, DefinitionBody, QaBody, QuoteBody, StickyBody, makeComposer } from "./cards";
import { AreaBody, BarBody, GaugeBody, LineBody, PieBody, StatBody } from "./charts";
import { CalendarBody, CodeBody, EpisodeBody, LinkGroupBody, MechanismBody, TableBody, TodoBody } from "./lists";
import { TimelineBody } from "./timeline";
import { AudioBody, ImagesBody, InsetBody, VideoBody, WebsiteBody, RepoBody } from "./media";
import {
  CARD_RADIUS,
  D,
  DModeContext,
  FONT,
  FROST_BG,
  glowEdge,
  SD_DARK_VARS,
  FROST_FIELD_DARK,
  FROST_SHADOW,
  FROST_SHADOW_LIFT,
  GlowLayers,
  GlowSpill,
  SELF_BLOOM,
  SOLID_SHADOW,
  SOLID_SHADOW_LIFT,
  SURFACE_FILL,
  SurfaceContext,
  frostSurfaceOf,
  type OnSurface,
  accentVars,
  cardHueOf,
  glowHueOf,
  surfaceOf,
  type DMode,
} from "./tokens";
import {
  Atmosphere,
  E_CARD_BG,
  E_CARD_BG_DARK,
  E_FIELD,
  E_FIELD_DARK,
  E_SHADOW,
  E_SHADOW_DARK,
  E_SHADOW_LIFT,
  E_SHADOW_LIFT_DARK,
  GlassEdge,
  edgeTintOf,
} from "./atmosphere";

/**
 * Style D and Style E — two families split from one ("Aurora"). Neither has a
 * header slot: each title is set inside its artifact. They share every body
 * and differ only by the mode the frame provides (see `DMode` in ./tokens):
 *
 *   Style D · Frost  — white frost cards lit from the top-left (their pale
 *                      gradient is the only gradient), lime as the one
 *                      accent. Every card is white frost (only the sticky
 *                      note is flat lime) and colour is spread like the
 *                      calendar's: raised white pills, ink marks, and one
 *                      solid lime element per card — a unit pill, a header
 *                      band, the area under a line, the marker tick.
 *                      Rules: docs/design-system/artifacts-frost.md
 *   Style E · Aurora — everything is lit. Hero cards glow from inside with
 *                      stacked blurred blobs and spill light onto the ground;
 *                      every other card blooms in its own hue along its lower
 *                      edge, and that hue is its accent too.
 *
 * In dark mode (`ctx.mode`) the frame sets the dark neutrals on the card root
 * (SD_DARK_VARS) and swaps the Aurora surfaces for their smoked-glass
 * versions; the lime, the hues and every rule stay the same.
 */

function stateStyle(ctx: FrameSlotProps["ctx"]): CSSProperties {
  if (ctx.chromeState === "selected") return { outline: `2.5px solid ${D.ink}`, outlineOffset: 0 };
  if (ctx.chromeState === "hover") return { transform: "translateY(-3px)" };
  return {};
}

function makeFrame(mode: DMode) {
  return function CardFrame({ ctx, body }: FrameSlotProps) {
    const hero = surfaceOf(ctx.item.variant) === "glow";
    const glow = hero && mode === "aurora";
    const hue = glowHueOf(ctx.item.uid);
    const lifted = ctx.chromeState !== "rest";
    const aurora = mode === "aurora";
    // Aurora's text cards paint their own bloom; every other card gets an atmosphere —
    // except the Q&A card, which stays flat so its answer is the only thing on it.
    const atmosphere = aurora && !hero && !SELF_BLOOM.has(ctx.item.variant) && ctx.item.variant !== "qa";
    const hueId = cardHueOf(mode, ctx.item.uid);
    // Frost paints heroes and notes one flat colour; the rest keep the white frost gradient.
    const solid = mode === "frost" ? frostSurfaceOf(ctx.item.variant) : "frost";
    const surface: OnSurface = glow ? "glow" : solid;
    const dark = ctx.mode === "dark";

    return (
      <DModeContext.Provider value={mode}>
      <SurfaceContext.Provider value={surface}>
        {/* flex-1: in a hugging stage the card fills out to its least height (ScaledStage `hug`). */}
        <div className="relative isolate flex h-full flex-1 flex-col" style={{ borderRadius: CARD_RADIUS, transition: "transform 220ms ease", ...(dark ? SD_DARK_VARS : null), ...stateStyle(ctx) }}>
          {glow ? <GlowSpill hue={hue} strength={lifted ? 1.25 : 1} /> : null}
          <div
            data-sd-frame
            data-sd-surface={surface}
            className="relative flex h-full flex-1 flex-col overflow-hidden"
            style={{
              ...FONT,
              ...accentVars(mode, ctx.item.uid, surface),
              borderRadius: CARD_RADIUS,
              // Aurora's glow takes D.ink: dark on the pale light-mode wash, off-white in dark.
              color: solid === "ink" || solid === "sage" ? D.white : solid === "lime" ? D.limeInk : D.ink,
              background: glow ? glowEdge(hue, dark) : solid !== "frost" ? SURFACE_FILL[solid] : aurora ? (dark ? E_CARD_BG_DARK : E_CARD_BG) : FROST_BG,
              boxShadow: glow
                ? `0 1px 1px rgba(24,24,40,0.05), 0 18px 36px -18px rgba(24,24,40,${lifted ? 0.32 : 0.22})`
                : aurora
                  ? lifted
                    ? dark ? E_SHADOW_LIFT_DARK : E_SHADOW_LIFT
                    : dark ? E_SHADOW_DARK : E_SHADOW
                  : solid !== "frost"
                    ? lifted
                      ? SOLID_SHADOW_LIFT
                      : SOLID_SHADOW
                    : lifted
                      ? FROST_SHADOW_LIFT
                      : FROST_SHADOW,
              transition: "box-shadow 220ms ease",
            }}
          >
            {glow ? <GlowLayers hue={hue} dark={dark} /> : null}
            {atmosphere ? <Atmosphere hue={hueId} uid={ctx.item.uid} variant={ctx.item.variant} dark={dark} /> : null}
            <div className="relative flex min-h-0 flex-1 flex-col">{body}</div>
            {aurora ? <GlassEdge tint={edgeTintOf(glow ? hue : hueId, ctx.item.uid, glow)} lit={glow} dark={dark} /> : null}
            <CornerMenu ctx={ctx} cardRadius={CARD_RADIUS} />
          </div>
        </div>
      </SurfaceContext.Provider>
      </DModeContext.Provider>
    );
  };
}

const NoHeader: StyleSlots["Header"] = () => null;
const NoIcon: StyleSlots["Icon"] = () => null;

const BACKDROP = {
  background: "radial-gradient(130% 90% at 18% 0%, #EEEEEC 0%, #E4E4E2 48%, #D9D9D7 100%)",
  ink: "#1C1C1E",
  muted: "rgba(28, 28, 30, 0.56)",
};
const BACKDROP_DARK = { background: FROST_FIELD_DARK, ink: "#F2F2F0", muted: "rgba(242, 242, 240, 0.6)" };

const VARIANTS: ArtifactStyleFamily["variants"] = {
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
  repo: { Body: RepoBody },
  stickynote: { Body: StickyBody },
  qa: { Body: QaBody },
  conversation: { Body: ConversationBody },
};

/**
 * Every card hugs its content — no text is ever clamped or cut. Kinds whose
 * picture has no height of its own (charts, media, live embeds) keep their
 * canvas height as the least they are drawn at and grow past it when their
 * words need the room; everything else is exactly as tall as what it holds.
 */
// A Google Doc is an iframe with no height of its own either — hugging it alone
// collapses the card to its title. (A repo's explorer stage sets its own
// height, so RepoBody hugs it exactly, collapsed or open.)
// A sticky note is a square of paper: an empty one is not a strip under its title.
const KEEPS_ITS_HEIGHT = new Set<string>(["stickynote", "chart:bar", "chart:line", "chart:area", "chart:pie", "images", "video", "audio", "map", "streetview", "3d", "website", "embed", "custom", "google-doc"]);

function hugFloor(item: StudioArtifact): number | null {
  // The episode's thumbnail keeps its own 16:9, so the card is all content.
  if (item.payload.type === "episode") return 0;
  if (KEEPS_ITS_HEIGHT.has(item.variant) || item.category === "geo" || item.category === "media") return item.natural.h;
  return 0;
}

const E_BACKDROP = { background: E_FIELD, ink: "#1C1C1E", muted: "rgba(28, 28, 30, 0.56)" };
const E_BACKDROP_DARK = { background: E_FIELD_DARK, ink: "#F2F2F0", muted: "rgba(242, 242, 240, 0.6)" };

function makeFamily(mode: DMode, base: Pick<ArtifactStyleFamily, "id" | "name" | "summary" | "fonts">): ArtifactStyleFamily {
  return {
    ...base,
    status: "live",
    backdrop: mode === "aurora" ? E_BACKDROP : BACKDROP,
    darkBackdrop: mode === "aurora" ? E_BACKDROP_DARK : BACKDROP_DARK,
    Composer: makeComposer(mode),
    hug: hugFloor,
    slots: { Frame: makeFrame(mode), Header: NoHeader, Icon: NoIcon, Body: InsetBody },
    categories: { geo: { Body: InsetBody }, media: { Body: InsetBody } },
    variants: VARIANTS,
  };
}

export const STYLE_D = makeFamily("frost", {
  id: "style-d",
  name: "Style D",
  fonts: { primary: "inter-tight", secondary: "dm-sans" },
  summary:
    "Frost — white frost cards lit from the top-left, lime the one accent: one lime element per card, two fonts, every card as tall as what it holds.",
});

export const STYLE_E = makeFamily("aurora", {
  id: "style-e",
  name: "Style E",
  fonts: { primary: "inter-tight", secondary: "geist" },
  summary:
    "Aurora — every card is lit: hero numbers glow from inside with layered blurs and spill light; the rest bloom in their own hue, which is also their accent.",
});
