"use client";

import type { CSSProperties } from "react";
import type { ArtifactVariant } from "@/lib/artifactStudio/pool";
import { ROLE } from "../textSpec";
import { PRIMARY, SECONDARY } from "./fonts";
import { makeKitFamily } from "./kit/family";
import { V, type Look, type StyleTheme } from "./kit/look";

/**
 * Badge — the fintech bento.
 *
 * Layout
 *   A small badge carries the kind's glyph, the title sits beside it as a
 *   plain line, and the content is the hero: a big number, a thick ring,
 *   capped bars. No border, no shadow — the cards are blocks of colour on a
 *   deep field, and the field does the separating.
 *
 * Colour
 *   Surfaces by role. Charcoal for anything read row by row; the accent
 *   (lime) for the hero numbers — stat, gauge, pie — where the ink flips
 *   dark; the second colour (violet) for media and places. The badge is
 *   always the accent on charcoal and charcoal on the accent.
 *
 * Shape
 *   24px radius, capped bars (a contrasting cap on each column), thick
 *   split rings, pill chips, dot legends. Numbers are heavy and tight.
 */

const LOOK: Look = {
  radius: 24,
  nest: 16,
  pad: 22,
  font: {
    display: PRIMARY,
    body: SECONDARY,
    mono: SECONDARY,
    displayWeight: 700,
    displayTracking: "-0.03em",
    labelCase: "upper",
    numberWeight: 700,
  },
  bar: "cap",
  legend: "dot",
  rule: "hair",
  chip: "pill",
  stroke: 1,
};

const THEMES: [StyleTheme, StyleTheme, StyleTheme] = [
  {
    id: "forest",
    name: "Forest",
    hint: "The reference: charcoal, lime and violet on green",
    vars: {
      field: "#1F4A3C",
      card: "#161616",
      well: "#262626",
      ink: "#F4F4F2",
      muted: "rgba(244,244,242,0.62)",
      faint: "rgba(244,244,242,0.4)",
      hair: "rgba(244,244,242,0.12)",
      accent: "#D5FF4A",
      accentInk: "#161616",
      head: "#161616",
      headInk: "#D5FF4A",
      series: ["#8B6CF0", "#D5FF4A", "#FFB762", "#5AC8A8", "#F4F4F2", "#B59CFF"],
      pos: "#5AC8A8",
      neg: "#FF7A6B",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    hint: "Multitudes of one blue: navy cards, cobalt hero, ice ink",
    vars: {
      field: "#0A1020",
      card: "#141D33",
      well: "#1C2742",
      ink: "#EEF2FF",
      muted: "rgba(238,242,255,0.62)",
      faint: "rgba(238,242,255,0.4)",
      hair: "rgba(238,242,255,0.12)",
      accent: "#4D7CFF",
      accentInk: "#FFFFFF",
      head: "#141D33",
      headInk: "#9DB8FF",
      series: ["#9DB8FF", "#4D7CFF", "#DCE8FF", "#2B4ED0", "#6E8FFF", "#B7CAFF"],
      pos: "#8FD3FF",
      neg: "#FF9DB0",
    },
  },
  {
    id: "ember",
    name: "Ember",
    hint: "Black, coral and sand",
    vars: {
      field: "#1B1412",
      card: "#262019",
      well: "#332A24",
      ink: "#F7EFE6",
      muted: "rgba(247,239,230,0.62)",
      faint: "rgba(247,239,230,0.4)",
      hair: "rgba(247,239,230,0.12)",
      accent: "#FF6B4A",
      accentInk: "#1B1412",
      head: "#262019",
      headInk: "#FF6B4A",
      series: ["#F2C94C", "#FF6B4A", "#F7EFE6", "#C97B5A", "#8C5A4A", "#E8A98F"],
      pos: "#F2C94C",
      neg: "#FF6B4A",
    },
  },
];

type Role = "data" | "hero" | "world";

function roleOf(variant: ArtifactVariant): Role {
  switch (variant) {
    case "stat":
    case "chart:gauge":
    case "chart:pie":
    case "quote":
      return "hero";
    case "map":
    case "streetview":
    case "images":
    case "video":
    case "3d":
    case "website":
    case "embed":
      return "world";
    default:
      return "data";
  }
}

/** Flip the theme's variables for a card drawn on the accent or the second colour. */
function surfaceVars(role: Role, theme: StyleTheme): CSSProperties {
  const v = theme.vars;
  if (role === "hero") {
    return {
      "--k-card": v.accent,
      "--k-ink": v.accentInk,
      "--k-muted": `color-mix(in srgb, ${v.accentInk} 68%, ${v.accent})`,
      "--k-faint": `color-mix(in srgb, ${v.accentInk} 45%, ${v.accent})`,
      "--k-hair": `color-mix(in srgb, ${v.accentInk} 16%, ${v.accent})`,
      "--k-well": `color-mix(in srgb, ${v.accentInk} 12%, ${v.accent})`,
      "--k-accent": v.accentInk,
      "--k-accent-ink": v.accent,
      "--k-head": v.accentInk,
      "--k-head-ink": v.accent,
      "--k-s0": v.accentInk,
      "--k-s1": v.series[0],
    } as CSSProperties;
  }
  if (role === "world") {
    const base = v.series[0]!;
    return {
      "--k-card": base,
      "--k-well": `color-mix(in srgb, ${v.ink} 14%, ${base})`,
      "--k-hair": `color-mix(in srgb, ${v.ink} 18%, ${base})`,
      "--k-head": v.card,
      "--k-head-ink": v.ink,
    } as CSSProperties;
  }
  return {};
}

export const BADGE = makeKitFamily({
  id: "badge",
  fonts: { primary: "satoshi", secondary: "inter-tight" },
  name: "Badge",
  summary: "Fintech bento — a tiny glyph badge marks the kind, the content is the hero. Charcoal, lime and violet blocks on a deep field; no borders.",
  look: LOOK,
  themes: THEMES,
  Header: ({ ctx, icon }) => (
    <div className="flex shrink-0 items-start gap-2.5 px-[22px] pt-[20px]">
      <span className="inline-flex h-[24px] shrink-0 items-center rounded-full px-2.5 [&>svg]:h-[13px] [&>svg]:w-[13px]" style={{ background: V.head, color: V.headInk }}>
        {icon}
      </span>
      <p data-el={ROLE.title} className="line-clamp-2 min-w-0 pt-[2px] text-[15px] font-medium leading-snug" style={{ color: V.ink, fontFamily: PRIMARY }}>
        {ctx.item.artifact.title}
      </p>
    </div>
  ),
  Frame: ({ ctx, header, body, theme }) => {
    const role = roleOf(ctx.item.variant);
    return (
      <div
        className="flex h-full flex-col overflow-hidden transition-[box-shadow,transform] duration-200"
        style={{
          ...surfaceVars(role, theme),
          background: V.card,
          color: V.ink,
          borderRadius: LOOK.radius,
          boxShadow: ctx.chromeState === "hover" ? "0 24px 48px -20px rgba(0,0,0,0.6)" : undefined,
          outline: ctx.chromeState === "selected" ? `3px solid ${theme.vars.accent}` : undefined,
          outlineOffset: 5,
          transform: ctx.chromeState === "hover" ? "translateY(-2px)" : undefined,
        }}
      >
        {header}
        <div className="flex min-h-0 flex-1 flex-col">{body}</div>
      </div>
    );
  },
});
