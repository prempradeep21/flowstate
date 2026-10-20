"use client";

import type { CSSProperties } from "react";
import type { ArtifactStyleFamily, FrameSlotProps, StyleSlots } from "../types";
import { ClaimBody, DefinitionBody, QuoteBody, StickyBody } from "./cards";
import { AreaBody, BarBody, GaugeBody, LineBody, PieBody, StatBody } from "./charts";
import { CalendarBody, CodeBody, EpisodeBody, LinkGroupBody, MechanismBody, TableBody, TimelineBody, TodoBody } from "./lists";
import { AudioBody, ImagesBody, InsetBody, VideoBody, WebsiteBody } from "./media";
import {
  CARD_RADIUS,
  D,
  DModeContext,
  FONT,
  FROST_BG,
  FROST_SHADOW,
  FROST_SHADOW_LIFT,
  GlowLayers,
  GlowSpill,
  HUES,
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
import { Atmosphere, E_CARD_BG, E_FIELD, E_SHADOW, E_SHADOW_LIFT, GlassEdge, edgeTintOf } from "./atmosphere";

/**
 * Style D and Style E — two families split from one ("Aurora"). Neither has a
 * header slot: each title is set inside its artifact. They share every body
 * and differ only by the mode the frame provides (see `DMode` in ./tokens):
 *
 *   Style D · Frost  — white frost cards lit from the top-left (their pale
 *                      gradient is the only gradient), lime as the one
 *                      accent. Hero cards are flat colour — lime for gauge,
 *                      stat and notes, ink for the area chart, sage for audio
 *                      — and colour elsewhere is spread like the calendar's:
 *                      raised white pills, ink marks, one solid lime mark.
 *   Style E · Aurora — everything is lit. Hero cards glow from inside with
 *                      stacked blurred blobs and spill light onto the ground;
 *                      every other card blooms in its own hue along its lower
 *                      edge, and that hue is its accent too.
 */

function stateStyle(ctx: FrameSlotProps["ctx"]): CSSProperties {
  if (ctx.chromeState === "selected") return { outline: `2.5px solid ${D.ink}`, outlineOffset: 7 };
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
    // Aurora's text cards paint their own bloom; every other card gets an atmosphere.
    const atmosphere = aurora && !hero && !SELF_BLOOM.has(ctx.item.variant);
    const hueId = cardHueOf(mode, ctx.item.uid);
    // Frost paints heroes and notes one flat colour; the rest keep the white frost gradient.
    const solid = mode === "frost" ? frostSurfaceOf(ctx.item.variant) : "frost";
    const surface: OnSurface = glow ? "glow" : solid;

    return (
      <DModeContext.Provider value={mode}>
      <SurfaceContext.Provider value={surface}>
        <div className="relative isolate h-full" style={{ borderRadius: CARD_RADIUS, transition: "transform 220ms ease", ...stateStyle(ctx) }}>
          {glow ? <GlowSpill hue={hue} strength={lifted ? 1.25 : 1} /> : null}
          <div
            data-sd-frame
            data-sd-surface={surface}
            className="relative flex h-full flex-col overflow-hidden"
            style={{
              ...FONT,
              ...accentVars(mode, ctx.item.uid, surface),
              borderRadius: CARD_RADIUS,
              color: glow || solid === "ink" || solid === "sage" ? D.white : solid === "lime" ? D.limeInk : D.ink,
              background: glow ? HUES[hue].edge : solid !== "frost" ? SURFACE_FILL[solid] : aurora ? E_CARD_BG : FROST_BG,
              boxShadow: glow
                ? `0 1px 1px rgba(24,24,40,0.05), 0 18px 36px -18px rgba(24,24,40,${lifted ? 0.32 : 0.22})`
                : aurora
                  ? lifted
                    ? E_SHADOW_LIFT
                    : E_SHADOW
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
            {glow ? <GlowLayers hue={hue} /> : null}
            {atmosphere ? <Atmosphere hue={hueId} uid={ctx.item.uid} variant={ctx.item.variant} /> : null}
            <div className="relative flex min-h-0 flex-1 flex-col">{body}</div>
            {aurora ? <GlassEdge tint={edgeTintOf(glow ? hue : hueId, ctx.item.uid, glow)} lit={glow} /> : null}
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
  ink: D.ink,
  muted: D.muted,
};

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
  stickynote: { Body: StickyBody },
};

const E_BACKDROP = { background: E_FIELD, ink: D.ink, muted: D.muted };

function makeFamily(mode: DMode, base: Pick<ArtifactStyleFamily, "id" | "name" | "summary" | "fonts">): ArtifactStyleFamily {
  return {
    ...base,
    status: "live",
    backdrop: mode === "aurora" ? E_BACKDROP : BACKDROP,
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
    "Frost — white frost cards lit from the top-left, lime the one accent; heroes are flat lime, ink or sage cards — no coloured gradients.",
});

export const STYLE_E = makeFamily("aurora", {
  id: "style-e",
  name: "Style E",
  fonts: { primary: "inter-tight", secondary: "geist" },
  summary:
    "Aurora — every card is lit: hero numbers glow from inside with layered blurs and spill light; the rest bloom in their own hue, which is also their accent.",
});
