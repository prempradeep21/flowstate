"use client";

import { CornerMenu } from "./menu";
import { ROLE } from "./textSpec";
import { PRIMARY, SECONDARY } from "./fonts";
import { makeKitFamily } from "./kit/family";
import { V, type Look, type StyleTheme } from "./kit/look";

/**
 * Wire — a technical drawing.
 *
 * Layout
 *   The card is an outline on the field: no fill, a 1.5px line. Its title
 *   sits in a tab that rises from the top-left corner, the tab's bottom
 *   edge opening into the card like a folder. The kind glyph is drawn in
 *   the same line weight. Selection draws a second line outside the first.
 *
 * Colour
 *   One line colour on one ground, and one accent for the single thing to
 *   notice. Nothing is filled solid except that accent: bars, areas and
 *   slices are hatched with their series line, chips are outlined.
 *
 * Shape
 *   10px radius, dashed grid and row rules, square legend swatches, outlined
 *   bars. Labels are tracked mono caps.
 */

const LOOK: Look = {
  radius: 10,
  nest: 6,
  pad: 20,
  font: {
    display: PRIMARY,
    body: SECONDARY,
    mono: SECONDARY,
    displayWeight: 500,
    displayTracking: "-0.01em",
    labelCase: "upper",
    numberWeight: 500,
  },
  bar: "outline",
  legend: "square",
  rule: "dashed",
  chip: "outline",
  stroke: 1.5,
  hatch: true,
};

/**
 * Each theme twice. Blueprint and Neon are drawings on a dark ground, so
 * those are their dark sides and the light ones are the same line on paper;
 * Graphite is the paper one, and its dark side is bone on black.
 */
const THEMES: [StyleTheme, StyleTheme, StyleTheme] = [
  {
    id: "blueprint",
    name: "Blueprint",
    hint: "White line on blueprint blue, a yellow accent — blue line on paper in light",
    vars: {
      field: "#EEF2FA",
      card: "#EEF2FA",
      well: "rgba(29,67,168,0.06)",
      ink: "#1D43A8",
      muted: "rgba(29,67,168,0.72)",
      faint: "rgba(29,67,168,0.46)",
      hair: "rgba(29,67,168,0.32)",
      accent: "#E8B400",
      accentInk: "#1D43A8",
      head: "#EEF2FA",
      headInk: "#1D43A8",
      series: ["#1D43A8", "#E8B400", "#3E8BE0", "#D64B8A", "#1EA383", "#7A5CD6"],
      pos: "#1EA383",
      neg: "#D64B8A",
    },
    dark: {
      field: "#1D43A8",
      card: "#1D43A8",
      well: "rgba(255,255,255,0.08)",
      ink: "#FFFFFF",
      muted: "rgba(255,255,255,0.7)",
      faint: "rgba(255,255,255,0.45)",
      hair: "rgba(255,255,255,0.32)",
      accent: "#FFD400",
      accentInk: "#1D43A8",
      head: "#1D43A8",
      headInk: "#FFFFFF",
      series: ["#FFFFFF", "#FFD400", "#9FD0FF", "#FF9ECF", "#7CF5D0", "#C9B8FF"],
      pos: "#7CF5D0",
      neg: "#FF9ECF",
    },
  },
  {
    id: "graphite",
    name: "Graphite",
    hint: "Multitudes of one grey: black line on bone, greys for series, a red accent",
    vars: {
      field: "#F4F3EE",
      card: "#F4F3EE",
      well: "rgba(21,21,26,0.05)",
      ink: "#15151A",
      muted: "rgba(21,21,26,0.62)",
      faint: "rgba(21,21,26,0.42)",
      hair: "rgba(21,21,26,0.28)",
      accent: "#E63B2E",
      accentInk: "#FFFFFF",
      head: "#F4F3EE",
      headInk: "#15151A",
      series: ["#15151A", "#5E5E66", "#9A9AA3", "#C7C7CE", "#3A3A42", "#7C7C85"],
      pos: "#15151A",
      neg: "#E63B2E",
    },
    dark: {
      field: "#141416",
      card: "#141416",
      well: "rgba(236,234,227,0.06)",
      ink: "#ECEAE3",
      muted: "rgba(236,234,227,0.66)",
      faint: "rgba(236,234,227,0.42)",
      hair: "rgba(236,234,227,0.3)",
      accent: "#FF4A3C",
      accentInk: "#FFFFFF",
      head: "#141416",
      headInk: "#ECEAE3",
      series: ["#ECEAE3", "#A9A8A0", "#75746E", "#4A4945", "#C8C6BF", "#8E8D87"],
      pos: "#ECEAE3",
      neg: "#FF4A3C",
    },
  },
  {
    id: "neon",
    name: "Neon",
    hint: "Cyan line on near-black, a magenta accent — teal on white in light",
    vars: {
      field: "#F2FAF9",
      card: "#F2FAF9",
      well: "rgba(11,140,128,0.07)",
      ink: "#0B8C80",
      muted: "rgba(11,140,128,0.74)",
      faint: "rgba(11,140,128,0.48)",
      hair: "rgba(11,140,128,0.34)",
      accent: "#E8238F",
      accentInk: "#FFFFFF",
      head: "#F2FAF9",
      headInk: "#0B8C80",
      series: ["#0B8C80", "#E8238F", "#B5A800", "#6F4BE0", "#0C0C12", "#2FB8AB"],
      pos: "#B5A800",
      neg: "#E8238F",
    },
    dark: {
      field: "#0C0C12",
      card: "#0C0C12",
      well: "rgba(68,240,224,0.07)",
      ink: "#44F0E0",
      muted: "rgba(68,240,224,0.72)",
      faint: "rgba(68,240,224,0.45)",
      hair: "rgba(68,240,224,0.32)",
      accent: "#FF3EA5",
      accentInk: "#0C0C12",
      head: "#0C0C12",
      headInk: "#44F0E0",
      series: ["#44F0E0", "#FF3EA5", "#F5FF5A", "#9D7BFF", "#FFFFFF", "#2FB8AB"],
      pos: "#F5FF5A",
      neg: "#FF3EA5",
    },
  },
];

const LINE = LOOK.stroke;
const TAB_H = 34;

export const WIRE = makeKitFamily({
  id: "wire",
  fonts: { primary: "satoshi", secondary: "figtree" },
  name: "Wire",
  summary: "Monoline — an outlined card with a folder tab for its title; hatched fills, dashed rules, one solid accent. One line colour on one ground.",
  look: LOOK,
  themes: THEMES,
  Header: ({ ctx, icon }) => (
    <div
      className="relative z-[1] ml-4 inline-flex max-w-[78%] shrink-0 items-center gap-2 self-start px-3.5"
      style={{
        // A card's title is its question — the tab grows to a second line rather than cut it.
        ...(ctx.item.card ? { minHeight: TAB_H } : { height: TAB_H }),
        marginBottom: -LINE,
        background: V.card,
        color: V.ink,
        border: `${LINE}px solid ${V.ink}`,
        borderBottom: "none",
        borderRadius: `${LOOK.radius - 2}px ${LOOK.radius - 2}px 0 0`,
      }}
    >
      <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <h3 data-el={ROLE.title} className={ctx.item.card ? "line-clamp-2 py-[7px] text-[13px] font-medium leading-snug" : "truncate text-[13px] font-medium"} style={{ fontFamily: LOOK.font.display, letterSpacing: "0.01em" }}>
        {ctx.item.artifact.title}
      </h3>
      {/* Cover the card's top border where the tab opens into it. */}
      <span aria-hidden className="absolute inset-x-0 -bottom-[1px] h-[2px]" style={{ background: V.card, marginLeft: -LINE, marginRight: -LINE, width: `calc(100% + ${LINE * 2}px)` }} />
    </div>
  ),
  Frame: ({ ctx, header, body }) => (
    <div className="flex h-full flex-col" style={{ color: V.ink }}>
      {header}
      <div
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden transition-[outline-color] duration-150"
        style={{
          background: V.card,
          border: `${LINE}px solid ${V.ink}`,
          borderRadius: `0 ${LOOK.radius}px ${LOOK.radius}px ${LOOK.radius}px`,
          outline: ctx.chromeState === "selected" ? `${LINE}px solid ${V.accent}` : ctx.chromeState === "hover" ? `${LINE}px solid ${V.hair}` : undefined,
          outlineOffset: 0,
        }}
      >
        {body}
        {/* The card's corner is tighter than the circle, so it sits one radius in, drawn in the same line. */}
        <CornerMenu ctx={ctx} cardRadius={LOOK.radius} size={32} style={{ background: V.card, color: V.ink, border: `${LINE}px solid ${V.ink}`, backdropFilter: undefined }} />
      </div>
    </div>
  ),
});
