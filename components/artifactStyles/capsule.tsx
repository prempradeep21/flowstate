"use client";

import { ArtifactMoreMenu, hasArtifactMenu } from "./menu";
import { ROLE } from "./textSpec";
import { PRIMARY, SECONDARY } from "./fonts";
import { makeKitFamily } from "./kit/family";
import { V, type Look, type StyleTheme } from "./kit/look";

/**
 * Capsule — everything is a pill.
 *
 * Layout
 *   The card is a soft capsule-cornered slab (44px). Its title floats in a
 *   pill inset from the top edge: the kind glyph in a white disc at the
 *   left, then the title, the pill's right end mirroring the disc's
 *   curve. The content sits below with air around it; nothing touches an
 *   edge.
 *
 * Colour
 *   Tinted pills on white. The header pill takes the kind's tint; marks
 *   inside use the same tints with one stronger accent. The field is warm
 *   off-white, the shadow long and soft.
 *
 * Shape
 *   Pill bars, pill chips, pill checkboxes, pill progress — no straight
 *   ends anywhere, and no rules between rows: spacing separates. Type is
 *   medium throughout, in the surface's strongest ink, rounded in feel.
 */

const LOOK: Look = {
  radius: 44,
  nest: 28,
  pad: 28,
  // The pill carries the gap to the content; bodies add none of their own.
  bodyTop: 0,
  font: {
    display: PRIMARY,
    body: SECONDARY,
    mono: SECONDARY,
    displayWeight: 500,
    displayTracking: "-0.025em",
    labelCase: "none",
    numberWeight: 500,
  },
  bar: "pill",
  legend: "dot",
  rule: "none",
  chip: "pill",
  stroke: 1,
};

/**
 * Each theme twice. The pastels are the point, so in dark the pills keep their
 * tints and their dark type; only the card and the field go deep, warm or
 * cool to match.
 */
const THEMES: [StyleTheme, StyleTheme, StyleTheme] = [
  {
    id: "peach",
    name: "Peach",
    hint: "Warm pastels — peach, butter, mint, sky — with a coral accent",
    vars: {
      field: "#F8F1EA",
      card: "#FFFFFF",
      well: "#F7F1EA",
      ink: "#2B2320",
      muted: "rgba(43,35,32,0.6)",
      faint: "rgba(43,35,32,0.4)",
      hair: "rgba(43,35,32,0.08)",
      accent: "#FF8A5B",
      accentInk: "#FFFFFF",
      head: "#FFD9C7",
      headInk: "#2B2320",
      series: ["#FF8A5B", "#FFD36B", "#7FD8B0", "#8FB8FF", "#C8A2FF", "#FF9EB5"],
      pos: "#3BB98A",
      neg: "#FF6B6B",
      cat: { data: "#CFE4FF", viz: "#FFD9C7", geo: "#CDEFD9", media: "#F3D5FF", docs: "#FFF0B8", dev: "#E3E6EC", planning: "#D7F2E8", discourse: "#FFD7E3" },
    },
    dark: {
      field: "#1F1713",
      card: "#2A201B",
      well: "#352A24",
      ink: "#F8EFE7",
      muted: "rgba(248,239,231,0.62)",
      faint: "rgba(248,239,231,0.42)",
      hair: "rgba(248,239,231,0.1)",
      accent: "#FF8A5B",
      accentInk: "#2B2320",
      head: "#FFD9C7",
      headInk: "#2B2320",
      series: ["#FF8A5B", "#FFD36B", "#7FD8B0", "#8FB8FF", "#C8A2FF", "#FF9EB5"],
      pos: "#5FD3A3",
      neg: "#FF7B7B",
      cat: { data: "#CFE4FF", viz: "#FFD9C7", geo: "#CDEFD9", media: "#F3D5FF", docs: "#FFF0B8", dev: "#E3E6EC", planning: "#D7F2E8", discourse: "#FFD7E3" },
      catInk: { data: "#2B2320", viz: "#2B2320", geo: "#2B2320", media: "#2B2320", docs: "#2B2320", dev: "#2B2320", planning: "#2B2320", discourse: "#2B2320" },
    },
  },
  {
    id: "lavender",
    name: "Lavender",
    hint: "Multitudes of one violet, deep for data, pale for words",
    vars: {
      field: "#F3F0FB",
      card: "#FFFFFF",
      well: "#F3EFFA",
      ink: "#2A2350",
      muted: "rgba(42,35,80,0.6)",
      faint: "rgba(42,35,80,0.4)",
      hair: "rgba(42,35,80,0.08)",
      accent: "#6C4FD6",
      accentInk: "#FFFFFF",
      head: "#6C4FD6",
      headInk: "#FFFFFF",
      series: ["#6C4FD6", "#9A84E8", "#B9A2EE", "#D9CCF6", "#2A2350", "#8470DF"],
      pos: "#6C4FD6",
      neg: "#D64F8A",
      cat: { data: "#6C4FD6", viz: "#8A70E0", geo: "#A890EA", media: "#B9A2EE", docs: "#D9CCF6", dev: "#EFEAFB", planning: "#CBBDF3", discourse: "#E6DFFA" },
      catInk: { data: "#FFFFFF", viz: "#FFFFFF", geo: "#FFFFFF" },
    },
    dark: {
      field: "#15112A",
      card: "#211B3B",
      well: "#2B2448",
      ink: "#EFEAFF",
      muted: "rgba(239,234,255,0.62)",
      faint: "rgba(239,234,255,0.42)",
      hair: "rgba(239,234,255,0.1)",
      accent: "#7C61E6",
      accentInk: "#FFFFFF",
      head: "#7C61E6",
      headInk: "#FFFFFF",
      series: ["#9A84E8", "#B9A2EE", "#D9CCF6", "#6C4FD6", "#EFEAFF", "#8470DF"],
      pos: "#9A84E8",
      neg: "#E86AA6",
      cat: { data: "#6C4FD6", viz: "#8A70E0", geo: "#A890EA", media: "#B9A2EE", docs: "#D9CCF6", dev: "#3A3160", planning: "#CBBDF3", discourse: "#E6DFFA" },
      catInk: { data: "#FFFFFF", viz: "#FFFFFF", geo: "#FFFFFF", media: "#2A2350", docs: "#2A2350", dev: "#EFEAFF", planning: "#2A2350", discourse: "#2A2350" },
    },
  },
  {
    id: "jelly",
    name: "Jelly",
    hint: "Saturated — coral, amber, teal, blue, violet — white type on colour",
    vars: {
      field: "#EEF0F5",
      card: "#FFFFFF",
      well: "#F3F4F8",
      ink: "#14161F",
      muted: "rgba(20,22,31,0.6)",
      faint: "rgba(20,22,31,0.4)",
      hair: "rgba(20,22,31,0.08)",
      accent: "#FF4F8B",
      accentInk: "#FFFFFF",
      head: "#4D7CFF",
      headInk: "#FFFFFF",
      series: ["#4D7CFF", "#FF7A59", "#22C7A9", "#FFB020", "#9B51E0", "#FF4F8B"],
      pos: "#22C7A9",
      neg: "#FF4F8B",
      cat: { data: "#4D7CFF", viz: "#FF7A59", geo: "#22C7A9", media: "#9B51E0", docs: "#FFB020", dev: "#14161F", planning: "#2ED573", discourse: "#FF4F8B" },
      catInk: { data: "#FFFFFF", viz: "#FFFFFF", geo: "#FFFFFF", media: "#FFFFFF", dev: "#FFFFFF", discourse: "#FFFFFF" },
    },
    dark: {
      field: "#0F1117",
      card: "#1A1D27",
      well: "#232735",
      ink: "#F2F3F7",
      muted: "rgba(242,243,247,0.62)",
      faint: "rgba(242,243,247,0.42)",
      hair: "rgba(242,243,247,0.1)",
      accent: "#FF4F8B",
      accentInk: "#FFFFFF",
      head: "#4D7CFF",
      headInk: "#FFFFFF",
      series: ["#4D7CFF", "#FF7A59", "#22C7A9", "#FFB020", "#9B51E0", "#FF4F8B"],
      pos: "#22C7A9",
      neg: "#FF4F8B",
      cat: { data: "#4D7CFF", viz: "#FF7A59", geo: "#22C7A9", media: "#9B51E0", docs: "#FFB020", dev: "#F2F3F7", planning: "#2ED573", discourse: "#FF4F8B" },
      catInk: { data: "#FFFFFF", viz: "#FFFFFF", geo: "#FFFFFF", media: "#FFFFFF", docs: "#14161F", dev: "#14161F", planning: "#14161F", discourse: "#FFFFFF" },
    },
  },
];

/**
 * Concentric corners: every nested shape keeps R(outer) = R(inner) + gap.
 *   card 44 ─16─▶ header pill 28 (56 tall) ─8─▶ glyph disc 20 (40 tall)
 * Media and wells nest at the same 16 (LOOK.nest = 44 − 16).
 */
const INSET = 16;
const HEAD_R = LOOK.radius - INSET;
const HEAD_H = HEAD_R * 2;
const INNER_GAP = 8;
const INNER_R = HEAD_R - INNER_GAP;
const INNER_H = INNER_R * 2;

export const CAPSULE = makeKitFamily({
  id: "capsule",
  fonts: { primary: "parkinsans", secondary: "figtree" },
  name: "Capsule",
  summary: "Pill — a floating title pill with the glyph in a white disc; pill bars, chips and checks; no rules, long soft shadows. Tints by kind.",
  look: LOOK,
  themes: THEMES,
  Header: ({ ctx, icon }) => (
    <div
      className="flex shrink-0 items-center gap-3.5"
      // Without actions the right end sits as far from the title as the disc's centre from
      // the pill's edge; with them, the ⋯ disc mirrors the glyph disc at the other end.
      style={{ margin: INSET, padding: INNER_GAP, paddingRight: hasArtifactMenu(ctx) ? INNER_GAP : HEAD_R, borderRadius: HEAD_R, minHeight: HEAD_H, background: V.cat, color: V.catInk }}
    >
      <span className="inline-flex shrink-0 items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]" style={{ width: INNER_H, height: INNER_H, borderRadius: INNER_R, background: V.card, color: V.ink }}>
        {icon}
      </span>
      <h3 data-el={ROLE.title} className={`min-w-0 flex-1 text-[16px] font-medium tracking-[-0.01em] ${ctx.item.card ? "line-clamp-2 leading-snug" : "truncate"}`} style={{ fontFamily: PRIMARY }}>
        {ctx.item.artifact.title}
      </h3>
      <ArtifactMoreMenu
        ctx={ctx}
        iconSize={18}
        style={{ width: INNER_H, height: INNER_H, borderRadius: INNER_R, background: `color-mix(in srgb, ${V.card} 55%, transparent)`, color: V.catInk }}
      />
    </div>
  ),
  Frame: ({ ctx, header, body }) => (
    <div
      className="flex h-full flex-col overflow-hidden transition-[box-shadow,transform] duration-200"
      style={{
        background: V.card,
        color: V.ink,
        borderRadius: LOOK.radius,
        boxShadow:
          ctx.chromeState === "rest"
            ? "0 20px 44px -24px rgba(30,20,10,0.25), 0 1px 3px -1px rgba(30,20,10,0.06)"
            : "0 30px 60px -26px rgba(30,20,10,0.35), 0 2px 6px -2px rgba(30,20,10,0.08)",
        outline: ctx.chromeState === "selected" ? `3px solid ${V.accent}` : undefined,
        outlineOffset: 0,
        transform: ctx.chromeState === "hover" ? "translateY(-2px)" : undefined,
      }}
    >
      {header}
      <div className="flex min-h-0 flex-1 flex-col">{body}</div>
    </div>
  ),
});
