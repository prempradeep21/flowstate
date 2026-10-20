"use client";

import { PRIMARY } from "../fonts";
import type { ClaimSide } from "@/lib/artifactTypes";
import { CurrentBody } from "../current";
import type { ArtifactRenderContext } from "../types";
import { ROLE } from "../../textSpec";
import { Avatar, C, Display, PAD, sizeFor, tint } from "./tokens";

/**
 * Text cards. The title is never a bar on top of these: on a quote it becomes
 * the context line under the speaker, on a claim it is the question the two
 * bubbles answer, on a definition it is the dictionary headword.
 */

type Ctx = { ctx: ArtifactRenderContext };

/** "Andrew Huberman" yes, "Commonly claimed" no — every word capitalised. */
const isPersonName = (s: string) => /^(\p{Lu}[\p{L}'.-]*)(\s+\p{Lu}[\p{L}'.-]*){0,3}$/u.test(s.trim());

// ─── Quote ──────────────────────────────────────────────────────────────────

export function QuoteBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  if (payload.type !== "quote") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const size = sizeFor(d.text, [[90, 27], [140, 24], [200, 21], [260, 18]], 16);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `22px ${PAD}px 22px` }}>
      <span
        aria-hidden
        className="pointer-events-none absolute font-semibold leading-none"
        style={{ fontFamily: PRIMARY, right: 26, bottom: -58, fontSize: 170, color: C.limeDeep }}
      >
        ”
      </span>
      <blockquote
        data-el={ROLE.quote}
        className="relative min-h-0 flex-1 overflow-hidden font-normal"
        style={{ fontFamily: PRIMARY, fontSize: size, lineHeight: 1.28, letterSpacing: "-0.012em", color: C.ink, textWrap: "pretty" }}
      >
        “{d.text}”
      </blockquote>
      <div className="mt-3 flex shrink-0 items-center gap-3">
        {isPersonName(d.speaker) ? <Avatar name={d.speaker} size={38} icon /> : null}
        <div className="min-w-0">
          <p data-el={ROLE.speaker} className="truncate text-[15px] font-semibold leading-tight" style={{ color: C.ink }}>
            {d.speaker}
          </p>
          {/* The title is the quote's context line, set as written. */}
          <p data-el={ROLE.title} className="truncate text-[14px] leading-tight" style={{ color: C.muted }}>
            {ctx.item.artifact.title}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Claim ──────────────────────────────────────────────────────────────────


function Bubble({ side, label, tone, role }: { side: ClaimSide; label: string; tone: "white" | "lime"; role: string }) {
  const size = sizeFor(side.text, [[70, 20], [130, 17], [200, 15]], 14);
  const bg = tone === "lime" ? C.lime : C.white;
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="relative flex min-h-0 flex-1 flex-col rounded-[22px] px-5 py-4" style={{ background: bg }}>
        <p data-el={ROLE.sideLabels} className="mb-1.5 text-[13px] font-semibold" style={{ color: tone === "lime" ? C.ink : C.muted }}>
          {label}
        </p>
        <p data-el={role} className="min-h-0 overflow-hidden font-sans" style={{ fontSize: size, lineHeight: 1.32, color: C.ink, textWrap: "pretty" }}>
          {side.text}
        </p>
        <span aria-hidden className="absolute -bottom-1.5 left-7 h-4 w-4 rotate-45" style={{ background: bg }} />
      </div>
      <div className="mt-3.5 flex h-8 shrink-0 items-center gap-2.5 pl-3">
        {isPersonName(side.speaker) ? (
          <Avatar name={side.speaker} size={32} bg={tone === "lime" ? C.orange : C.white} icon />
        ) : (
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: tone === "lime" ? C.orange : C.white }} />
        )}
        <p data-el={ROLE.speakers} className="min-w-0 truncate text-[14px] font-semibold" style={{ color: C.ink }}>
          {side.speaker}
        </p>
      </div>
    </div>
  );
}

/** The question in large type, then the two answers as speech bubbles from their speakers. */
export function ClaimBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  if (payload.type !== "claim") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const title = ctx.item.artifact.title;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${PAD - 2}px ${PAD}px ${PAD - 6}px` }}>
      <div data-el={ROLE.title} className="mx-auto max-w-[92%] shrink-0">
        <Display size={sizeFor(title, [[30, 40], [48, 35]], 30)} align="center">
          {title}
        </Display>
      </div>
      <div className="mt-6 flex min-h-0 flex-1 gap-4">
        <Bubble side={d.proposition} label="The claim" tone="white" role={ROLE.claim} />
        <Bubble side={d.counter} label="The pushback" tone="lime" role={ROLE.pushback} />
      </div>
    </div>
  );
}

// ─── Definition ─────────────────────────────────────────────────────────────

/** A dictionary entry: the title is the headword, the speaker its source. */
export function DefinitionBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  if (payload.type !== "definition") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const title = ctx.item.artifact.title;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `20px 26px 20px` }}>
      <div className="flex shrink-0 items-baseline justify-between gap-4">
        <div data-el={ROLE.title} className="min-w-0">
          <Display size={sizeFor(title, [[16, 34], [26, 30]], 26)} lines={1}>
            {title}
          </Display>
        </div>
        {d.speaker?.trim() ? (
          <span data-el={ROLE.speaker} className="shrink-0 text-[13px] font-medium" style={{ color: C.muted }}>
            per {d.speaker}
          </span>
        ) : null}
      </div>
      <p
        data-el={ROLE.gloss}
        className="mt-2 line-clamp-3 shrink-0 font-sans"
        style={{ fontSize: d.gloss.length > 130 ? 15 : 17, lineHeight: 1.35, color: C.ink }}
      >
        {d.gloss}
      </p>
      {d.example?.trim() ? (
        <div data-el={ROLE.example} className="mt-auto flex min-h-0 gap-2.5 overflow-hidden rounded-[16px] px-3.5 py-2.5" style={{ background: C.well }}>
          <span className="shrink-0 text-[13px] font-semibold leading-snug" style={{ color: C.orange }}>
            e.g.
          </span>
          <p className="line-clamp-2 text-[13px] leading-snug" style={{ color: C.ink }}>
            {d.example}
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ─── Sticky note ────────────────────────────────────────────────────────────

const NOTE_SURFACE: Record<string, { bg: string; ink: string; muted: string }> = {
  turbo: { bg: C.lime, ink: C.ink, muted: C.muted },
  violet: { bg: C.blue, ink: C.ink, muted: C.muted },
  chalk: { bg: C.white, ink: C.ink, muted: C.muted },
  haiti: { bg: C.ink, ink: C.lime, muted: tint(C.lime, 66) },
};

/** A note keeps its colour, mapped into the palette; its title is a bold first line. */
export function StickyBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  if (payload.type !== "stickynote") return <CurrentBody ctx={ctx} />;
  const tone = NOTE_SURFACE[payload.data.colorId] ?? NOTE_SURFACE.turbo!;
  const text = payload.data.text;
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-[28px] px-5 py-5"
      style={{ background: tone.bg, boxShadow: tone.bg === C.ink ? `inset 0 0 0 1.5px ${tint(C.lime, 18)}` : undefined }}
    >
      <p data-el={ROLE.title} className="shrink-0 text-[15px] font-semibold leading-tight" style={{ color: tone.ink }}>
        {ctx.item.artifact.title}
      </p>
      <p
        data-el={ROLE.note}
        className="mt-2 min-h-0 flex-1 overflow-hidden font-sans"
        style={{ fontSize: sizeFor(text, [[120, 18], [220, 15]], 13), lineHeight: 1.36, color: tone.muted === C.muted ? C.ink : tone.ink }}
      >
        {text}
      </p>
    </div>
  );
}
