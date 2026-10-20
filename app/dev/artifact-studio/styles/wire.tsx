"use client";

import { ROLE } from "../textSpec";
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

const THEMES: [StyleTheme, StyleTheme, StyleTheme] = [
  {
    id: "blueprint",
    name: "Blueprint",
    hint: "White line on blueprint blue, a yellow accent",
    vars: {
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
  },
  {
    id: "neon",
    name: "Neon",
    hint: "Cyan line on near-black, a magenta accent",
    vars: {
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
        height: TAB_H,
        marginBottom: -LINE,
        background: V.card,
        color: V.ink,
        border: `${LINE}px solid ${V.ink}`,
        borderBottom: "none",
        borderRadius: `${LOOK.radius - 2}px ${LOOK.radius - 2}px 0 0`,
      }}
    >
      <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <h3 data-el={ROLE.title} className="truncate text-[13px] font-medium" style={{ fontFamily: LOOK.font.display, letterSpacing: "0.01em" }}>
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
        className="flex min-h-0 flex-1 flex-col overflow-hidden transition-[outline-color] duration-150"
        style={{
          background: V.card,
          border: `${LINE}px solid ${V.ink}`,
          borderRadius: `0 ${LOOK.radius}px ${LOOK.radius}px ${LOOK.radius}px`,
          outline: ctx.chromeState === "selected" ? `${LINE}px solid ${V.accent}` : ctx.chromeState === "hover" ? `${LINE}px solid ${V.hair}` : undefined,
          outlineOffset: 4,
        }}
      >
        {body}
      </div>
    </div>
  ),
});
