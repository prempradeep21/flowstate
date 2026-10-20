"use client";

import { PRIMARY, SECONDARY } from "./fonts";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import type { ClaimSide } from "@/lib/artifactTypes";
import { STICKY_NOTE_PALETTE } from "@/lib/stickyNoteArtifact";
import { CurrentBody } from "./current";
import { KIT_VARIANTS } from "./kit/family";
import { LookContext, themeStyle, type Look, type ThemeVars } from "./kit/look";
import { ROLE } from "../textSpec";
import type {
  ArtifactRenderContext,
  ArtifactStyleFamily,
  FrameSlotProps,
  StyleSlots,
} from "./types";

/**
 * Style B — "Band". Every artifact is a Flowstate-blue shell: the title sits
 * in the shell's top band, centred in white, with no kind icon; the content
 * sits in a surface panel inset into the shell, and data content sits once
 * more in a hairline card inside that panel.
 *
 *   shell (blue, R 32) ─ 10px ─ panel (surface, R 22) ─ 12px ─ content card (R 10)
 *
 * Radii are concentric (outer = inner + gap at every step), and the header is
 * the same everywhere: one type size, one minimum height. A long title wraps
 * to a second centred line and the band grows to hold it.
 *
 * Body handling:
 *   data (default) — content card inside the panel (tables, charts, timelines…)
 *   media          — flush in the panel, the panel's corners crop it
 *   text cards     — stat, quote, definition, claim: purpose-built bodies
 *   stickynote     — keeps its own paper (a note, not a card)
 *
 * Content is drawn by the kit bodies (styles/kit) in Band's Look and the
 * canvas colours, so Band carries the same text parts as every other family
 * (textSpec.ts); kinds the kit doesn't draw (map, 3D, embed…) show the live
 * body, which has no text of its own.
 */

const ACCENT = "rgb(var(--canvas-accent))";
const ACCENT_TINT = "rgb(var(--canvas-accent) / 0.06)";

/** Geometry — change here, everything stays concentric. */
const SHELL_INSET = 10;
const PANEL_RADIUS = 22;
const SHELL_RADIUS = PANEL_RADIUS + SHELL_INSET;
const CARD_INSET = 12;
const CARD_RADIUS = PANEL_RADIUS - CARD_INSET;

/** The one header: same size, weight and minimum height on every artifact. */
const HEADER_FONT_SIZE = 18;
const HEADER_LINE_HEIGHT = 24;
const HEADER_MIN_HEIGHT = 56;

/** Band's rules for the kit bodies: soft radii, pill bars, dot legends, plain labels. */
const BAND_LOOK: Look = {
  radius: CARD_RADIUS,
  nest: 8,
  pad: 18,
  font: {
    display: PRIMARY,
    body: SECONDARY,
    mono: SECONDARY,
    displayWeight: 700,
    displayTracking: "-0.02em",
    labelCase: "none",
    numberWeight: 700,
  },
  bar: "pill",
  legend: "dot",
  rule: "hair",
  chip: "pill",
  stroke: 1,
};

/** The canvas's own colours, so Band follows the app's light and dark themes. */
const BAND_VARS: ThemeVars = {
  field: "rgb(var(--canvas-bg))",
  card: "rgb(var(--canvas-card))",
  well: "rgb(var(--canvas-bg))",
  ink: "rgb(var(--canvas-ink))",
  muted: "rgb(var(--canvas-muted))",
  faint: "rgb(var(--canvas-muted) / 0.72)",
  hair: "rgb(var(--canvas-border))",
  accent: ACCENT,
  accentInk: "#FFFFFF",
  head: ACCENT,
  headInk: "#FFFFFF",
  series: [ACCENT, "#8DB2FF", "rgb(var(--canvas-ink))", "#F2A33A", "#4FB38A", "#B58CF0"],
  pos: "#2E9E6A",
  neg: "#D9473F",
};

/** A kit body drawn in Band's Look and colours. */
function kit(Body: ComponentType<{ ctx: ArtifactRenderContext }>): ComponentType<{ ctx: ArtifactRenderContext }> {
  const Kit = ({ ctx }: { ctx: ArtifactRenderContext }) => (
    <LookContext.Provider value={BAND_LOOK}>
      <div className="flex min-h-0 flex-1 flex-col" style={{ ...themeStyle(BAND_VARS, ctx.item.category), color: BAND_VARS.ink, fontFamily: SECONDARY }}>
        <Body ctx={ctx} />
      </div>
    </LookContext.Provider>
  );
  return Kit;
}

function Band({ title }: { title: string }) {
  return (
    <div
      data-sb-band
      className="flex shrink-0 items-center justify-center px-6 py-3 text-center"
      style={{ minHeight: HEADER_MIN_HEIGHT }}
    >
      <h3
        data-el={ROLE.title}
        className="line-clamp-2 font-semibold tracking-[-0.005em] text-white"
        style={{ fontFamily: PRIMARY, fontSize: HEADER_FONT_SIZE, lineHeight: `${HEADER_LINE_HEIGHT}px` }}
      >
        {title}
      </h3>
    </div>
  );
}

function shellState(ctx: ArtifactRenderContext): string {
  if (ctx.chromeState === "selected") {
    return "shadow-artifact ring-2 ring-offset-2 ring-offset-canvas-bg";
  }
  if (ctx.chromeState === "hover") return "shadow-artifact";
  return "shadow-[0_1px_2px_rgb(0_0_0/0.08)]";
}

/** Blue shell with the header in its top band and the surface panel inset below. */
function ShellFrame({ ctx, header, body }: FrameSlotProps) {
  return (
    <div
      data-sb-frame
      className={`flex h-full flex-col overflow-hidden transition-shadow ${shellState(ctx)}`}
      style={{
        background: ACCENT,
        borderRadius: SHELL_RADIUS,
        paddingInline: SHELL_INSET,
        paddingBottom: SHELL_INSET,
        ...(ctx.chromeState === "selected" ? ({ "--tw-ring-color": ACCENT } as CSSProperties) : {}),
      }}
    >
      {header}
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas-card"
        style={{ borderRadius: PANEL_RADIUS }}
      >
        {body}
      </div>
    </div>
  );
}

const BandHeader: StyleSlots["Header"] = ({ ctx }) => <Band title={ctx.item.artifact.title} />;

const NoIcon: StyleSlots["Icon"] = () => null;
const NoHeader: StyleSlots["Header"] = () => null;

/** Data content: a hairline card inset in the panel, as in the reference picker. */
function inCard(Body: ComponentType<{ ctx: ArtifactRenderContext }>): StyleSlots["Body"] {
  const Card: StyleSlots["Body"] = ({ ctx }) => (
    <div className="flex min-h-0 flex-1 flex-col" style={{ padding: CARD_INSET }}>
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden border border-canvas-border shadow-[0_1px_3px_rgb(0_0_0/0.06)]"
        style={{ borderRadius: CARD_RADIUS }}
      >
        <Body ctx={ctx} />
      </div>
    </div>
  );
  return Card;
}

const CardBody = inCard(CurrentBody);

/** Media fills the panel edge to edge; the panel's corners crop it. */
const FlushBody: StyleSlots["Body"] = CurrentBody;

/** The kit's body for a variant, in a card (data) or flush in the panel (media). */
const kitCard = (v: keyof typeof KIT_VARIANTS): Partial<StyleSlots> => ({ Body: inCard(kit(KIT_VARIANTS[v]!.Body!)) });
const kitFlush = (v: keyof typeof KIT_VARIANTS): Partial<StyleSlots> => ({ Body: kit(KIT_VARIANTS[v]!.Body!) });

function Attribution({ children, role }: { children: ReactNode; role: string }) {
  return (
    <p data-el={role} className="text-[12px] leading-snug text-canvas-muted">
      {children}
    </p>
  );
}

// ─── Text-card bodies ───────────────────────────────────────────────────────

/** "70% of revenue" — the figure reads as one phrase when it is short enough. */
function StatBody({ ctx }: { ctx: ArtifactRenderContext }) {
  const payload = ctx.item.payload;
  if (payload.type !== "stat") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const phrase = d.unit ? `${d.value} ${d.unit}` : d.value;
  const together = phrase.length <= 16;
  const heroLen = together ? phrase.length : d.value.length;
  const heroSize = heroLen <= 5 ? 50 : heroLen <= 10 ? 42 : heroLen <= 16 ? 32 : 24;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2.5 overflow-hidden px-6 py-4 text-center [&>*]:shrink-0">
      <div data-el={ROLE.figure}>
        <p
          className="font-bold leading-[1.02] tracking-[-0.025em] text-canvas-ink"
          style={{ fontFamily: PRIMARY, fontSize: heroSize }}
        >
          {together ? phrase : d.value}
        </p>
        {!together && d.unit ? (
          <p className="mt-1 text-[19px] font-bold tracking-tight text-canvas-ink">{d.unit}</p>
        ) : null}
      </div>
      {d.delta ? (
        <p className="flex items-baseline gap-1.5 text-[13px] tabular-nums text-canvas-muted">
          <span data-el={ROLE.was}>{d.delta.from}</span>
          <span aria-hidden>→</span>
          <span data-el={ROLE.now} className="font-semibold" style={{ color: ACCENT }}>
            {d.delta.to}
          </span>
        </p>
      ) : null}
      <p data-el={ROLE.figureNote} className="line-clamp-3 max-w-[34ch] text-[15px] leading-snug text-canvas-ink/80">{d.label}</p>
    </div>
  );
}

function QuoteBody({ ctx }: { ctx: ArtifactRenderContext }) {
  const payload = ctx.item.payload;
  if (payload.type !== "quote") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const len = d.text.length;
  const fontSize = len <= 110 ? 21 : len <= 170 ? 18 : len <= 240 ? 16 : 14;

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 overflow-hidden px-7 py-4 [&>*]:shrink-0">
      <blockquote
        data-el={ROLE.quote}
        className="line-clamp-6 font-medium leading-[1.32] tracking-[-0.01em] text-canvas-ink"
        style={{ fontFamily: PRIMARY, fontSize }}
      >
        <span aria-hidden className="font-semibold" style={{ color: ACCENT }}>
          “
        </span>
        {d.text}
        <span aria-hidden className="font-semibold" style={{ color: ACCENT }}>
          ”
        </span>
      </blockquote>
      <p data-el={ROLE.speaker} className="text-[13px] font-semibold text-canvas-ink">
        {d.speaker}
      </p>
    </div>
  );
}

function DefinitionBody({ ctx }: { ctx: ArtifactRenderContext }) {
  const payload = ctx.item.payload;
  if (payload.type !== "definition") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  // The band names the term — the card is what it means.
  const glossSize = d.gloss.length > 140 ? 15 : 17;

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 overflow-hidden px-7 py-4 [&>*]:shrink-0">
      <p
        data-el={ROLE.gloss}
        className="line-clamp-3 font-medium leading-snug tracking-[-0.005em] text-canvas-ink"
        style={{ fontSize: glossSize }}
      >
        {d.gloss}
      </p>
      {d.example ? (
        <p
          data-el={ROLE.example}
          className="line-clamp-2 border-l-2 pl-3 text-[13px] leading-snug text-canvas-muted"
          style={{ borderColor: ACCENT }}
        >
          {d.example}
        </p>
      ) : null}
      {d.speaker ? <Attribution role={ROLE.speaker}>— {d.speaker}</Attribution> : null}
    </div>
  );
}

function ClaimColumn({
  label,
  side,
  emphasis,
  role,
}: {
  label: string;
  side: ClaimSide;
  emphasis: boolean;
  role: string;
}) {
  const n = side.text.length;
  const fontSize = n > 220 ? 16 : n > 140 ? 18 : n > 80 ? 21 : 24;
  return (
    <div
      className="flex min-h-0 flex-col gap-3 overflow-hidden px-6 py-5"
      style={emphasis ? { background: ACCENT_TINT } : undefined}
    >
      <p
        data-el={ROLE.sideLabels}
        className="text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: emphasis ? ACCENT : "rgb(var(--canvas-muted))" }}
      >
        {label}
      </p>
      <p
        data-el={role}
        className="line-clamp-[8] font-medium leading-[1.35] tracking-[-0.005em] text-canvas-ink"
        style={{ fontSize }}
      >
        {side.text}
      </p>
      <div className="mt-auto">
        <Attribution role={ROLE.speakers}>
          <span className="font-semibold text-canvas-ink">{side.speaker}</span>
        </Attribution>
      </div>
    </div>
  );
}

function ClaimBody({ ctx }: { ctx: ArtifactRenderContext }) {
  const payload = ctx.item.payload;
  if (payload.type !== "claim") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  return (
    <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-canvas-border/70">
      <ClaimColumn label="Proposed" side={d.proposition} emphasis={false} role={ROLE.claim} />
      <ClaimColumn label="Countered" side={d.counter} emphasis role={ROLE.pushback} />
    </div>
  );
}

// ─── Variants with their own structure ──────────────────────────────────────

/** Sticky notes stay paper — a note pinned beside the cards, not one of them. */
const StickyFrame: StyleSlots["Frame"] = ({ body }) => (
  <div className="flex h-full flex-col">{body}</div>
);

/** The note on its paper: the title set in Band's header type, then the note. */
function StickyBody({ ctx }: { ctx: ArtifactRenderContext }) {
  const payload = ctx.item.payload;
  if (payload.type !== "stickynote") return <CurrentBody ctx={ctx} />;
  const paper = STICKY_NOTE_PALETTE[payload.data.colorId] ?? STICKY_NOTE_PALETTE.turbo;
  const state = ctx.chromeState === "selected" ? "ring-2 ring-offset-2 ring-offset-canvas-bg" : "";
  return (
    <div
      className={`flex h-full flex-col gap-2.5 overflow-hidden px-6 py-5 shadow-[0_6px_18px_-8px_rgb(0_0_0/0.35)] ${state}`}
      style={{ background: paper.bg, color: paper.ink, borderRadius: 6, ...(ctx.chromeState === "selected" ? ({ "--tw-ring-color": ACCENT } as CSSProperties) : {}) }}
    >
      <p data-el={ROLE.title} className="line-clamp-2 shrink-0 font-semibold" style={{ fontFamily: PRIMARY, fontSize: HEADER_FONT_SIZE, lineHeight: `${HEADER_LINE_HEIGHT}px` }}>
        {ctx.item.artifact.title}
      </p>
      <p
        data-el={ROLE.note}
        className="min-h-0 overflow-hidden whitespace-pre-line text-[15px] leading-snug"
        style={{ opacity: 0.86, maskImage: "linear-gradient(to bottom, black 78%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, black 78%, transparent)" }}
      >
        {payload.data.text}
      </p>
    </div>
  );
}

const flush: Partial<StyleSlots> = { Body: FlushBody };

/** The live map, whose only text is its place label. */
const MapBody: StyleSlots["Body"] = ({ ctx }) => (
  <div data-el={ROLE.place} className="flex min-h-0 flex-1 flex-col">
    <CurrentBody ctx={ctx} />
  </div>
);

export const STYLE_B: ArtifactStyleFamily = {
  id: "style-b",
  name: "Style B",
  status: "live",
  summary: "Band — a Flowstate-blue shell with a centred title, no icons; content inset in a surface panel.",
  fonts: { primary: "manrope", secondary: "figtree" },
  slots: {
    Frame: ShellFrame,
    Header: BandHeader,
    Icon: NoIcon,
    Body: CardBody,
  },
  categories: {
    media: flush,
    geo: flush,
  },
  variants: {
    table: kitCard("table"),
    "chart:bar": kitCard("chart:bar"),
    "chart:line": kitCard("chart:line"),
    "chart:area": kitCard("chart:area"),
    "chart:pie": kitCard("chart:pie"),
    "chart:gauge": kitCard("chart:gauge"),
    mechanism: kitCard("mechanism"),
    timeline: kitCard("timeline"),
    calendar: kitCard("calendar"),
    todo: kitCard("todo"),
    linkgroup: kitCard("linkgroup"),
    code: kitCard("code"),
    images: kitFlush("images"),
    video: kitFlush("video"),
    website: kitFlush("website"),
    embed: flush,
    map: { Body: MapBody },
    // Episode and audio are media by family but laid out like data cards.
    episode: kitCard("episode"),
    audio: kitCard("audio"),
    stat: { Body: StatBody },
    quote: { Body: QuoteBody },
    definition: { Body: DefinitionBody },
    claim: { Body: ClaimBody },
    stickynote: { Frame: StickyFrame, Header: NoHeader, Body: StickyBody },
  },
};
