"use client";

import type { ClaimSide } from "@/lib/artifactTypes";
import { CurrentBody } from "../current";
import { AnswerAtState, Prose, proseSize, qaStateOf } from "../cards";
import { ROLE } from "../textSpec";
import { sizeFor, useBox } from "../styleC/tokens";
import type { ArtifactRenderContext } from "../types";
import { TEXT_WEIGHT, V, chipStyle, labelStyle, padTop, useLook } from "./look";

/**
 * Kit text cards: quote, claim, definition, sticky note. Headless; the
 * family's header names the artifact, so a quote is just the words and who
 * said them, a claim the two sides, a definition the gloss (never the term
 * again — the title names it). Every text is tagged with its part
 * (textSpec.ts); avatar initials are iconography.
 */

type Ctx = { ctx: ArtifactRenderContext };

/**
 * Text that fills the space it is given and ends on a whole line: the line
 * count is clamped to the box, so bigger type never shows half a line.
 */
function Clamp({ el, size, lineHeight, fill = true, minLines = 0, maxLines = Infinity, className = "", style, children }: { el: string; size: number; lineHeight: number; fill?: boolean; minLines?: number; maxLines?: number; className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  const [ref, box] = useBox<HTMLDivElement>();
  const lines = Math.min(maxLines, Math.max(1, Math.floor((box.h + 1) / (size * lineHeight))));
  return (
    <div ref={ref} data-el={el} className={`overflow-hidden ${fill ? "min-h-0 flex-1" : ""} ${className}`} style={minLines ? { minHeight: Math.ceil(size * lineHeight * minLines) } : undefined}>
      <div style={{ fontSize: size, lineHeight, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: box.h > 0 ? lines : undefined, overflow: "hidden", ...style }}>{children}</div>
    </div>
  );
}

const isPersonName = (s: string) => /^(\p{Lu}[\p{L}'.-]*)(\s+\p{Lu}[\p{L}'.-]*){0,3}$/u.test(s.trim());

export function Initials({ name, size = 30, bg = V.accent, fg = V.accentInk }: { name: string; size?: number; bg?: string; fg?: string }) {
  const look = useLook();
  const initials = name
    .replace(/[^\p{L}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <span
      data-el-kind="icon"
      className="inline-flex shrink-0 items-center justify-center font-semibold"
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: size * 0.38,
        borderRadius: look.chip === "block" ? 4 : 999,
        boxShadow: look.chip === "block" ? `inset 0 0 0 ${look.stroke}px ${V.ink}` : undefined,
      }}
    >
      {initials || "·"}
    </span>
  );
}

export function Byline({ name, meta, role = ROLE.speaker }: { name: string; meta?: string; role?: string }) {
  const look = useLook();
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {isPersonName(name) ? <Initials name={name} /> : null}
      <p data-el={role} className="min-w-0 truncate text-[16px] font-medium" style={{ color: V.ink, fontFamily: look.font.body }}>
        <span>{name}</span>
        {meta ? (
          <span className="tabular-nums">
            {" "}
            · {meta}
          </span>
        ) : null}
      </p>
    </div>
  );
}

// ─── Quote ──────────────────────────────────────────────────────────────────

export function QuoteBody({ ctx }: Ctx) {
  const look = useLook();
  const payload = ctx.item.payload;
  if (payload.type !== "quote") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const size = sizeFor(d.text, [[90, 31], [140, 28], [200, 24], [260, 20]], 18);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${padTop(look, look.pad - 6)}px ${look.pad}px ${look.pad - 6}px` }}>
      <Clamp el={ROLE.quote} size={size} lineHeight={1.28} style={{ fontFamily: look.font.display, fontWeight: TEXT_WEIGHT, letterSpacing: look.font.displayTracking, color: V.ink, textWrap: "pretty" }}>
        <span aria-hidden style={{ color: V.accent, fontWeight: look.font.displayWeight }}>
          “
        </span>
        {d.text}
        <span aria-hidden style={{ color: V.accent, fontWeight: look.font.displayWeight }}>
          ”
        </span>
      </Clamp>
      <div className="mt-3.5 shrink-0">
        <Byline name={d.speaker} meta={d.timestamp} />
      </div>
    </div>
  );
}

// ─── Claim ──────────────────────────────────────────────────────────────────

function Side({ side, label, emphasis, role }: { side: ClaimSide; label: string; emphasis: boolean; role: string }) {
  const look = useLook();
  const size = sizeFor(side.text, [[70, 22], [130, 19], [200, 17]], 16);
  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      style={{
        padding: 16,
        borderRadius: look.nest,
        background: emphasis ? V.accent : V.well,
        color: emphasis ? V.accentInk : V.ink,
        border: look.chip === "block" ? `${look.stroke}px solid ${V.ink}` : look.chip === "outline" ? `${look.stroke}px solid ${emphasis ? V.accent : V.hair}` : undefined,
        ...(look.chip === "outline" ? { background: emphasis ? V.accent : "transparent" } : {}),
      }}
    >
      <p data-el={ROLE.sideLabels} className="mb-2 shrink-0" style={labelStyle(look, 13, emphasis ? V.accentInk : V.ink)}>
        {label}
      </p>
      <Clamp el={role} size={size} lineHeight={1.34} style={{ fontWeight: TEXT_WEIGHT, fontFamily: look.font.body, textWrap: "pretty" }}>
        {side.text}
      </Clamp>
      <p data-el={ROLE.speakers} className="mt-3 shrink-0 truncate text-[15px] font-medium">
        {side.speaker}
        {side.timestamp ? <span className="tabular-nums"> · {side.timestamp}</span> : null}
      </p>
    </div>
  );
}

export function ClaimBody({ ctx }: Ctx) {
  const look = useLook();
  const payload = ctx.item.payload;
  if (payload.type !== "claim") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  return (
    <div className="flex min-h-0 flex-1 gap-3 overflow-hidden" style={{ padding: `${padTop(look, look.pad)}px ${look.pad}px ${look.pad}px` }}>
      <Side side={d.proposition} label="Claim" emphasis={false} role={ROLE.claim} />
      <Side side={d.counter} label="Pushback" emphasis role={ROLE.pushback} />
    </div>
  );
}

// ─── Definition ─────────────────────────────────────────────────────────────

export function DefinitionBody({ ctx }: Ctx) {
  const look = useLook();
  const payload = ctx.item.payload;
  if (payload.type !== "definition") return <CurrentBody ctx={ctx} />;
  const d = payload.data;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${padTop(look, look.pad)}px ${look.pad}px ${look.pad}px` }}>
      {/* The gloss keeps at least two lines whatever the card's height: it is the definition. */}
      <Clamp el={ROLE.gloss} size={d.gloss.length > 140 ? 17 : 20} lineHeight={1.38} fill={false} minLines={2} className="shrink" style={{ fontWeight: TEXT_WEIGHT, color: V.ink, fontFamily: look.font.body }}>
        {d.gloss}
      </Clamp>
      {d.example?.trim() ? (
        <div className="mt-4 flex shrink gap-2.5 overflow-hidden" style={{ minHeight: 22, borderLeft: `${Math.max(2, look.stroke)}px solid ${V.accent}`, paddingLeft: 12 }}>
          {/* Gives up its second line before the speaker below is pushed out. */}
          <Clamp el={ROLE.example} size={16} lineHeight={1.375} fill={false} minLines={1} maxLines={2} className="shrink" style={{ color: V.ink, fontWeight: TEXT_WEIGHT }}>
            {d.example}
          </Clamp>
        </div>
      ) : null}
      {d.speaker?.trim() ? (
        <p data-el={ROLE.speaker} className="mt-auto shrink-0 truncate pt-4" style={labelStyle(look, 13)}>
          per {d.speaker}
        </p>
      ) : null}
    </div>
  );
}

// ─── Cards ──────────────────────────────────────────────────────────────────

/**
 * A conversation card: a beat of someone else's talk. The family's header
 * carries the heading; the summary sits in the kind's colour — on a tinted
 * panel where the family's chips are pills, beside a solid accent rule where
 * they are outlines (Wire fills nothing but its accent).
 */
export function ConversationBody({ ctx }: Ctx) {
  const look = useLook();
  const payload = ctx.item.payload;
  if (payload.type !== "conversation") return <CurrentBody ctx={ctx} />;
  const text = payload.data.body;
  const size = proseSize(text, [[180, 21], [360, 19]], 18);
  const pad = look.pad;
  const prose = <Prose el={ROLE.summary} text={text} size={size} lineHeight={1.5} color={V.ink} font={look.font.body} style={{ fontWeight: TEXT_WEIGHT }} />;
  if (look.chip === "pill") {
    const inset = look.radius - look.nest;
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `0 ${inset}px ${inset}px` }}>
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          style={{ borderRadius: look.nest, padding: `${pad - 8}px ${pad - 4}px ${pad - 6}px`, background: `color-mix(in srgb, ${V.cat} 55%, ${V.card})` }}
        >
          <span aria-hidden className="mb-3.5 h-[6px] w-11 shrink-0 rounded-full" style={{ background: V.accent }} />
          {prose}
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden" style={{ padding: `${pad - 6}px ${pad}px ${pad}px`, gap: pad - 6 }}>
      <span aria-hidden className="shrink-0 self-stretch" style={{ width: look.stroke + 1.5, background: V.accent, borderRadius: look.chip === "outline" ? 0 : 2 }} />
      {prose}
    </div>
  );
}

/**
 * A Q&A card: the user's own exchange, flat. The header carries the
 * question; the answer is plain ink on the card, nothing else — the accent
 * appears only as the dots while the answer is being thought about.
 */
export function QaBody({ ctx }: Ctx) {
  const look = useLook();
  const payload = ctx.item.payload;
  if (payload.type !== "qa") return <CurrentBody ctx={ctx} />;
  const text = payload.data.body;
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${look.pad - 6}px ${look.pad}px ${look.pad}px` }}>
      <AnswerAtState
        state={qaStateOf(ctx)}
        text={text}
        accent={V.accent}
        muted={V.ink}
        ink={V.ink}
        font={look.font.body}
        size={proseSize(text, [[260, 19], [520, 18]], 17)}
        lineHeight={1.5}
        labelSize={17}
        style={{ fontWeight: TEXT_WEIGHT }}
      />
    </div>
  );
}

// ─── Sticky note ────────────────────────────────────────────────────────────

/**
 * A note keeps its own colour (mapped into the theme). The title is the
 * family header's; a note that stands alone (no header) sets it as its bold
 * first line — either way the title appears once.
 */
export function StickyBody({ ctx, standalone = false }: Ctx & { standalone?: boolean }) {
  const look = useLook();
  const payload = ctx.item.payload;
  if (payload.type !== "stickynote") return <CurrentBody ctx={ctx} />;
  const colorId = payload.data.colorId;
  const bg = colorId === "haiti" ? V.ink : colorId === "chalk" ? V.card : colorId === "violet" ? V.s(1) : V.accent;
  const fg = colorId === "haiti" ? V.card : colorId === "chalk" ? V.ink : colorId === "violet" ? V.ink : V.accentInk;
  const text = payload.data.text;
  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: bg, color: fg, padding: look.pad - 4, borderRadius: look.radius, ...(look.chip === "block" ? { border: `${look.stroke}px solid ${V.ink}`, boxShadow: `6px 6px 0 ${V.ink}` } : look.chip === "outline" ? { border: `${look.stroke}px solid ${V.ink}` } : {}) }}>
      {standalone ? (
        <p data-el={ROLE.title} className="mb-2 shrink-0 text-[14px] font-medium leading-tight">
          {ctx.item.artifact.title}
        </p>
      ) : null}
      <Clamp el={ROLE.note} size={sizeFor(text, [[120, 20], [220, 17]], 16)} lineHeight={1.36} style={{ fontWeight: TEXT_WEIGHT, fontFamily: look.font.body }}>
        {text}
      </Clamp>
    </div>
  );
}

/** The note as the whole card — no family header — so it carries the title. */
export function StandaloneStickyBody({ ctx }: Ctx) {
  return <StickyBody ctx={ctx} standalone />;
}

export function Tag({ children, bg = V.well, fg = V.ink }: { children: React.ReactNode; bg?: string; fg?: string }) {
  const look = useLook();
  return (
    <span className="inline-flex max-w-full items-center truncate px-2 py-[2px] text-[14px] font-medium leading-[18px]" style={chipStyle(look, bg, fg)}>
      {children}
    </span>
  );
}
