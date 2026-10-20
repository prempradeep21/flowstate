"use client";

import { ROLE } from "../textSpec";
import { sizeFor } from "./styleC/tokens";
import { PRIMARY, SECONDARY } from "./fonts";
import { makeKitFamily } from "./kit/family";
import { V, type Look, type StyleTheme } from "./kit/look";

/**
 * Ledger — the accountant's page.
 *
 * Layout
 *   A rule of accent colour across the top, then the title set in a serif
 *   across the full measure, a double rule, the content, and nothing else.
 *   Edges are square (2px).
 *
 * Colour
 *   Paper and ink and one rubric colour. The rubric is the top rule, the
 *   peak, the next item, the live mark — never a surface. Series are
 *   ink, rubric, then greys.
 *
 * Shape
 *   No shadow, no fill: a hairline border, hairline row rules, dashes for
 *   legend swatches, square bars, outlined chips. Numbers are tabular and
 *   light.
 */

const LOOK: Look = {
  radius: 2,
  nest: 2,
  pad: 20,
  font: {
    display: PRIMARY,
    body: SECONDARY,
    mono: SECONDARY,
    displayWeight: 400,
    displayTracking: "-0.01em",
    labelCase: "upper",
    numberWeight: 400,
  },
  bar: "square",
  legend: "dash",
  rule: "hair",
  chip: "outline",
  stroke: 1,
};

const THEMES: [StyleTheme, StyleTheme, StyleTheme] = [
  {
    id: "broadsheet",
    name: "Broadsheet",
    hint: "Cream paper, black ink, a red rubric",
    vars: {
      field: "#EBE6DA",
      card: "#F8F5EE",
      well: "#EFEBE0",
      ink: "#1A1814",
      muted: "rgba(26,24,20,0.62)",
      faint: "rgba(26,24,20,0.42)",
      hair: "rgba(26,24,20,0.16)",
      accent: "#C8322B",
      accentInk: "#FFFFFF",
      head: "#F8F5EE",
      headInk: "#1A1814",
      series: ["#1A1814", "#C8322B", "#8A7F6A", "#4A5E8A", "#B59A3C", "#6E8C6A"],
      pos: "#3C7A4E",
      neg: "#C8322B",
    },
  },
  {
    id: "blueprint",
    name: "Blueprint",
    hint: "Multitudes of one blue: white ink on blue paper, a yellow rubric",
    vars: {
      field: "#12296B",
      card: "#1B3A8C",
      well: "#24479A",
      ink: "#F2F6FF",
      muted: "rgba(242,246,255,0.66)",
      faint: "rgba(242,246,255,0.44)",
      hair: "rgba(242,246,255,0.2)",
      accent: "#FFD166",
      accentInk: "#12296B",
      head: "#1B3A8C",
      headInk: "#F2F6FF",
      series: ["#F2F6FF", "#FFD166", "#9DB8F7", "#6F8FE0", "#C9D8FF", "#3F63C4"],
      pos: "#8FE3B5",
      neg: "#FF8A7A",
    },
  },
  {
    id: "graphite",
    name: "Graphite",
    hint: "Greys only, and a highlighter yellow for what matters",
    vars: {
      field: "#E6E6E4",
      card: "#F7F7F5",
      well: "#ECECEA",
      ink: "#1F1F22",
      muted: "rgba(31,31,34,0.6)",
      faint: "rgba(31,31,34,0.4)",
      hair: "rgba(31,31,34,0.14)",
      accent: "#FFE600",
      accentInk: "#1F1F22",
      head: "#F7F7F5",
      headInk: "#1F1F22",
      series: ["#1F1F22", "#6E6E73", "#A5A5AA", "#CFCFD3", "#FFE600", "#48484E"],
      pos: "#1F1F22",
      neg: "#8C1D18",
    },
  },
];

export const LEDGER = makeKitFamily({
  id: "ledger",
  fonts: { primary: "denton", secondary: "figtree" },
  name: "Ledger",
  summary: "Editorial — serif title over a double rule, hairlines. Paper, ink and one rubric colour; no fills, no shadows.",
  look: LOOK,
  themes: THEMES,
  Header: ({ ctx }) => {
    const title = ctx.item.artifact.title;
    // Short cards set the title on one line so the body keeps its height.
    const short = ctx.item.natural.h < 300;
    return (
      <div className="shrink-0 px-5 pt-4">
        <h3
          data-el={ROLE.title}
          className={short ? "truncate" : "line-clamp-2"}
          style={{ fontFamily: LOOK.font.display, fontWeight: 400, fontSize: short ? 21 : sizeFor(title, [[30, 26], [52, 23]], 20), lineHeight: 1.12, letterSpacing: "-0.01em", color: V.ink, textWrap: "balance" }}
        >
          {title}
        </h3>
        <div className="mt-3" style={{ borderTop: `1px solid ${V.ink}` }} />
        <div className="mt-[2px]" style={{ borderTop: `1px solid ${V.ink}` }} />
      </div>
    );
  },
  Frame: ({ ctx, header, body }) => (
    <div
      className="flex h-full flex-col overflow-hidden transition-[outline-color] duration-150"
      style={{
        background: V.card,
        borderRadius: LOOK.radius,
        border: `1px solid ${ctx.chromeState === "rest" ? V.hair : V.ink}`,
        borderTop: `3px solid ${V.accent}`,
        outline: ctx.chromeState === "selected" ? `2px solid ${V.accent}` : undefined,
        outlineOffset: 3,
      }}
    >
      {header}
      <div className="flex min-h-0 flex-1 flex-col">{body}</div>
    </div>
  ),
});
