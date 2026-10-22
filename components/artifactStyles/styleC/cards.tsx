"use client";

import { PRIMARY } from "../fonts";
import type { ClaimSide } from "@/lib/artifactTypes";
import { CurrentBody } from "../current";
import { AnswerAtState, ComposerField, Prose, proseSize, qaStateOf } from "../cards";
import type { ArtifactRenderContext } from "../types";
import { ROLE } from "../textSpec";
import { Avatar, C, Display, INSET, SECTION, SURFACE_BG, paletteVars, scPaletteOf, sizeFor, tint } from "./tokens";

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
  const size = sizeFor(d.text, [[90, 32], [140, 29], [200, 25], [260, 22]], 19);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: INSET }}>
      <span
        aria-hidden
        className="pointer-events-none absolute font-semibold leading-none"
        style={{ fontFamily: PRIMARY, right: 26, bottom: -58, fontSize: 170, color: C.limeDeep }}
      >
        ”
      </span>
      {/* The whole quote, always — the card grows to hold it. */}
      <div className="relative flex-1">
        <blockquote
          data-el={ROLE.quote}
          className="font-medium"
          style={{ fontFamily: PRIMARY, fontSize: size, lineHeight: 1.28, letterSpacing: "-0.012em", color: C.ink, textWrap: "pretty" }}
        >
          “{d.text}”
        </blockquote>
      </div>
      <div className="flex shrink-0 items-center gap-3" style={{ marginTop: SECTION }}>
        {isPersonName(d.speaker) ? <Avatar name={d.speaker} size={42} icon /> : null}
        <div className="min-w-0">
          <p data-el={ROLE.speaker} className="text-[18px] font-medium leading-tight" style={{ color: C.ink }}>
            {d.speaker}
          </p>
          {/* The title is the quote's context line, set as written. */}
          <p data-el={ROLE.title} className="mt-1 text-[14px] font-medium leading-tight" style={{ color: C.ink }}>
            {ctx.item.artifact.title}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Claim ──────────────────────────────────────────────────────────────────


function Bubble({ side, label, tone, role }: { side: ClaimSide; label: string; tone: "white" | "lime"; role: string }) {
  const size = sizeFor(side.text, [[70, 24], [130, 20], [200, 18]], 17);
  const bg = tone === "lime" ? SURFACE_BG.lime : SURFACE_BG.white;
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="relative flex min-h-0 flex-1 flex-col rounded-[22px] px-6 py-5" style={{ background: bg }}>
        <p data-el={ROLE.sideLabels} className="mb-2.5 text-[16px] font-medium" style={{ color: C.ink }}>
          {label}
        </p>
        <p data-el={role} className="font-sans font-medium" style={{ fontSize: size, lineHeight: 1.32, color: C.ink, textWrap: "pretty" }}>
          {side.text}
        </p>
        <span aria-hidden className="absolute -bottom-1.5 left-7 h-4 w-4 rotate-45" style={{ background: bg }} />
      </div>
      <div className="mt-4 flex min-h-8 shrink-0 items-center gap-2.5 pl-3">
        {isPersonName(side.speaker) ? (
          <Avatar name={side.speaker} size={32} bg={tone === "lime" ? C.orange : C.white} icon />
        ) : (
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: tone === "lime" ? C.orange : C.white }} />
        )}
        <p data-el={ROLE.speakers} className="min-w-0 text-[17px] font-medium leading-tight" style={{ color: C.ink }}>
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: INSET }}>
      <div data-el={ROLE.title} className="mx-auto max-w-[92%] shrink-0">
        <Display size={sizeFor(title, [[30, 40], [48, 35]], 30)} align="center">
          {title}
        </Display>
      </div>
      <div className="flex min-h-0 flex-1 gap-5" style={{ marginTop: SECTION }}>
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: INSET }}>
      <div className="flex shrink-0 items-baseline justify-between gap-4">
        <div data-el={ROLE.title} className="min-w-0">
          <Display size={sizeFor(title, [[16, 34], [26, 30]], 26)}>
            {title}
          </Display>
        </div>
        {d.speaker?.trim() ? (
          <span data-el={ROLE.speaker} className="shrink-0 text-[16px] font-medium" style={{ color: C.ink }}>
            per {d.speaker}
          </span>
        ) : null}
      </div>
      <p
        data-el={ROLE.gloss}
        className="mt-4 shrink-0 font-sans font-medium"
        style={{ fontSize: d.gloss.length > 130 ? 18 : 20, lineHeight: 1.35, color: C.ink }}
      >
        {d.gloss}
      </p>
      {d.example?.trim() ? (
        <div data-el={ROLE.example} className="flex shrink-0 gap-2.5 rounded-[18px] px-5 py-4" style={{ background: C.well, marginTop: SECTION }}>
          <span className="shrink-0 text-[16px] font-medium leading-snug" style={{ color: C.ink }}>
            e.g.
          </span>
          <p className="text-[16px] font-medium leading-snug" style={{ color: C.ink }}>
            {d.example}
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ─── Cards ──────────────────────────────────────────────────────────────────

/**
 * A transcript beat on the world (blue) card: its heading set as display
 * type, one orange rule, then the summary. The blue is the difference from
 * the Q&A card — a beat of someone else's talk sits with the arguments.
 */
export function ConversationBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  if (payload.type !== "conversation") return <CurrentBody ctx={ctx} />;
  const { heading, body } = payload.data;
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: INSET }}>
      <div data-el={ROLE.title} className="shrink-0">
        <Display size={sizeFor(heading, [[26, 30], [44, 26], [70, 23]], 21)}>
          {heading}
        </Display>
      </div>
      <span aria-hidden className="mt-5 h-[5px] w-10 shrink-0 rounded-full" style={{ background: C.orange }} />
      <Prose el={ROLE.summary} text={body} size={proseSize(body, [[180, 20], [360, 19]], 17)} lineHeight={1.45} color={C.ink} className="mt-5 font-sans" />
    </div>
  );
}

/**
 * The user's own exchange, flat: the question as the headline, a hairline,
 * the answer in plain ink on paper. No well, no mark — the orange appears
 * only while the answer is being thought about, as the dots.
 */
export function QaBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  if (payload.type !== "qa") return <CurrentBody ctx={ctx} />;
  const { heading, body } = payload.data;
  const state = qaStateOf(ctx);
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: INSET }}>
      <div data-el={ROLE.title} className="shrink-0">
        <Display size={sizeFor(heading, [[40, 26], [70, 23], [110, 20]], 18)}>
          {heading}
        </Display>
      </div>
      <span aria-hidden className="mt-5 h-px w-full shrink-0" style={{ background: C.hair }} />
      <div className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden font-sans">
        <AnswerAtState
          state={state}
          text={body}
          accent={C.orange}
          muted={C.ink}
          ink={C.ink}
          size={proseSize(body, [[260, 19], [520, 17]], 17)}
          lineHeight={1.48}
          labelSize={17}
        />
      </div>
    </div>
  );
}

/** The empty card: a white field on the forest, the send disc in orange. */
export function Composer({ ctx }: Ctx) {
  return (
    <div className="w-full font-sans" style={paletteVars(scPaletteOf(ctx.themeId, ctx.mode))}>
      <ComposerField
        height={64}
        radius={32}
        padding={10}
        background={C.white}
        placeholderColor={C.faint}
        fontSize={16}
        value={ctx.composerDraft}
        valueColor={C.ink}
        button={{ background: C.orange, color: C.onBright }}
      />
    </div>
  );
}

// ─── Sticky note ────────────────────────────────────────────────────────────

/** Each note's paper and the one ink everything on it is set in — white on the ink note. */
const NOTE_SURFACE: Record<string, { bg: string; ink: string }> = {
  turbo: { bg: SURFACE_BG.lime, ink: C.ink },
  violet: { bg: SURFACE_BG.blue, ink: C.ink },
  chalk: { bg: SURFACE_BG.white, ink: C.ink },
  haiti: { bg: SURFACE_BG.ink, ink: C.pure },
};

/** A note keeps its colour, mapped into the palette; its title is a bold first line. */
export function StickyBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  if (payload.type !== "stickynote") return <CurrentBody ctx={ctx} />;
  const tone = NOTE_SURFACE[payload.data.colorId] ?? NOTE_SURFACE.turbo!;
  const text = payload.data.text;
  return (
    <div
      className="flex flex-1 flex-col overflow-hidden rounded-[28px] px-7 py-7"
      style={{ background: tone.bg, boxShadow: tone.bg === SURFACE_BG.ink ? `inset 0 0 0 1.5px ${tint(C.lime, 18)}` : undefined }}
    >
      <p data-el={ROLE.title} className="shrink-0 text-[15px] font-medium leading-tight" style={{ color: tone.ink }}>
        {ctx.item.artifact.title}
      </p>
      <p
        data-el={ROLE.note}
        className="mt-3 font-sans font-medium"
        style={{ fontSize: sizeFor(text, [[120, 22], [220, 18]], 16), lineHeight: 1.36, color: tone.ink }}
      >
        {text}
      </p>
    </div>
  );
}
