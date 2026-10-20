"use client";

import type { ClaimSide } from "@/lib/artifactTypes";
import { CurrentBody } from "../current";
import { ROLE } from "../../textSpec";
import { sizeFor } from "../styleC/tokens";
import type { ArtifactRenderContext } from "../types";
import { V, chipStyle, labelStyle, useLook } from "./look";

/**
 * Kit text cards: quote, claim, definition, sticky note. Headless; the
 * family's header names the artifact, so a quote is just the words and who
 * said them, a claim the two sides, a definition the gloss (never the term
 * again — the title names it). Every text is tagged with its part
 * (textSpec.ts); avatar initials are iconography.
 */

type Ctx = { ctx: ArtifactRenderContext };

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
      <p data-el={role} className="min-w-0 truncate text-[13.5px]" style={{ color: V.ink, fontFamily: look.font.body }}>
        <span className="font-semibold">{name}</span>
        {meta ? (
          <span className="tabular-nums" style={{ color: V.muted }}>
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
  const size = sizeFor(d.text, [[90, 26], [140, 23], [200, 20], [260, 17]], 15);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${look.pad - 6}px ${look.pad}px ${look.pad - 6}px` }}>
      <blockquote
        data-el={ROLE.quote}
        className="min-h-0 flex-1 overflow-hidden"
        style={{ fontFamily: look.font.display, fontWeight: look.font.displayWeight >= 700 ? 600 : 400, fontSize: size, lineHeight: 1.28, letterSpacing: look.font.displayTracking, color: V.ink, textWrap: "pretty" }}
      >
        <span aria-hidden style={{ color: V.accent, fontWeight: look.font.displayWeight }}>
          “
        </span>
        {d.text}
        <span aria-hidden style={{ color: V.accent, fontWeight: look.font.displayWeight }}>
          ”
        </span>
      </blockquote>
      <div className="mt-2.5 shrink-0">
        <Byline name={d.speaker} meta={d.timestamp} />
      </div>
    </div>
  );
}

// ─── Claim ──────────────────────────────────────────────────────────────────

function Side({ side, label, emphasis, role }: { side: ClaimSide; label: string; emphasis: boolean; role: string }) {
  const look = useLook();
  const size = sizeFor(side.text, [[70, 18], [130, 16], [200, 14.5]], 13.5);
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
      <p data-el={ROLE.sideLabels} className="mb-2 shrink-0" style={labelStyle(look, 11, emphasis ? V.accentInk : V.muted)}>
        {label}
      </p>
      <p data-el={role} className="min-h-0 flex-1 overflow-hidden" style={{ fontSize: size, lineHeight: 1.34, fontFamily: look.font.body, textWrap: "pretty" }}>
        {side.text}
      </p>
      <p data-el={ROLE.speakers} className="mt-3 shrink-0 truncate text-[12.5px] font-semibold">
        {side.speaker}
        {side.timestamp ? <span className="font-normal tabular-nums opacity-70"> · {side.timestamp}</span> : null}
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
    <div className="flex min-h-0 flex-1 gap-3 overflow-hidden" style={{ padding: look.pad }}>
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: look.pad }}>
      {/* The gloss keeps at least two lines whatever the card's height: it is the definition. */}
      <p data-el={ROLE.gloss} className="min-h-[2.76em] shrink overflow-hidden" style={{ fontSize: d.gloss.length > 140 ? 14.5 : 16.5, lineHeight: 1.38, color: V.ink, fontFamily: look.font.body }}>
        {d.gloss}
      </p>
      {d.example?.trim() ? (
        <div className="mt-3 flex shrink-0 gap-2.5 overflow-hidden" style={{ borderLeft: `${Math.max(2, look.stroke)}px solid ${V.accent}`, paddingLeft: 12 }}>
          <p data-el={ROLE.example} className="line-clamp-2 text-[13px] leading-snug" style={{ color: V.muted }}>
            {d.example}
          </p>
        </div>
      ) : null}
      {d.speaker?.trim() ? (
        <p data-el={ROLE.speaker} className="mt-auto shrink-0 truncate pt-3" style={labelStyle(look, 11)}>
          per {d.speaker}
        </p>
      ) : null}
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
        <p data-el={ROLE.title} className="mb-2 shrink-0 text-[14px] font-semibold leading-tight">
          {ctx.item.artifact.title}
        </p>
      ) : null}
      <p data-el={ROLE.note} className="min-h-0 flex-1 overflow-hidden" style={{ fontSize: sizeFor(text, [[120, 17], [220, 14.5]], 13), lineHeight: 1.36, fontFamily: look.font.body }}>
        {text}
      </p>
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
    <span className="inline-flex max-w-full items-center truncate px-2 py-[2px] text-[11.5px] font-semibold leading-[16px]" style={chipStyle(look, bg, fg)}>
      {children}
    </span>
  );
}
