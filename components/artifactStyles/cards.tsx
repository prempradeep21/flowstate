"use client";

import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { ArrowUp, MessageCircleQuestionMark, MessageSquareQuote } from "lucide-react";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatCollapseIcon, DotsIcon } from "@/components/CardQaMenu";
import { CardAnswerBody } from "@/components/cards/CardAnswerBody";
import { CardQuestionText } from "@/components/cards/CardQuestionText";
import { ConversationCardSurface } from "@/components/cards/ConversationCardSurface";
import {
  QaQuestionHeaderRow,
  QaQuestionSection,
  QaTranslucentSurface,
} from "@/components/QaQuestionSection";
import { Icon } from "@/components/ui/Icon";
import type { StudioArtifact, StudioCardItem, StudioCardKind } from "@/lib/artifactStudio/pool";
import { formatPendingStatusLabel } from "@/lib/qaStreamDisplay";
import type { Card } from "@/lib/store";
import { CANVAS_CONTENT_INERT_CLASS } from "@/lib/canvasNodeInteraction";
import { qaInsetStyle } from "@/lib/design/canvasInsets";
import { CANVAS_ACCENT } from "@/lib/design/tokens";
import { ROLE } from "./textSpec";
import { useHugs } from "./hug";
import { useBox } from "./styleC/tokens";
import type { ArtifactRenderContext, QaState } from "./types";

/**
 * The canvas's two card nodes in the studio — Q&A cards (a question and its
 * answer) and conversation cards (an imported transcript beat: a heading over
 * a few sentences of summary).
 *
 * Families draw them like any artifact: the question / heading is the title,
 * the answer / summary the body. Answers are light markdown (paragraphs and
 * bold), so bodies set them through {@link Prose}, never raw.
 *
 * The two are siblings, not twins. A conversation card is a beat of someone
 * else's talk, and families give it their colour; a Q&A card is the user's
 * own exchange and stays flat — paper, ink, a rule — so the answer is the
 * only thing on it.
 *
 * A Q&A card also has a turn (see {@link QaState}): the composer before the
 * question, the question alone while the answer is thought about, the answer
 * arriving, and the finished card. {@link qaStateOf} reads it; the pieces
 * below ({@link ThinkingDots}, {@link Caret}, {@link ComposerField}) are
 * what families draw those states with, in their own colours.
 */

// ─── Turn state ─────────────────────────────────────────────────────────────

export const QA_STATES: { id: QaState; label: string; hint: string }[] = [
  { id: "typing", label: "Typing", hint: "The empty card — a composer waiting for a question" },
  { id: "thinking", label: "Thinking", hint: "The question is in; the answer is being worked out" },
  { id: "answering", label: "Answering", hint: "The answer arriving, a caret at its end" },
  { id: "done", label: "Done", hint: "The finished card" },
];

/** Where a Q&A card is in its turn — only a Q&A card has one; everything else is done. */
export function qaStateOf(ctx: ArtifactRenderContext): QaState {
  return ctx.item.variant === "qa" ? (ctx.qaState ?? "done") : "done";
}

/** The label under the thinking dots — the live card's default. */
export const THINKING_LABEL = formatPendingStatusLabel();

/** The placeholder in an empty card's composer — the live card's. */
export const COMPOSER_PLACEHOLDER = "Ask anything";

/** How far through streaming the focus view freezes an answering card. */
const DEFAULT_STREAMED = 0.42;

/**
 * How much of an answering card's text has arrived, 0–1. The focus view
 * leaves it at its frozen default; the sample canvas streams it live.
 */
export const StreamedContext = createContext(DEFAULT_STREAMED);

/**
 * The answer as it stands part-way through streaming: the first stretch,
 * cut on a word, with any bold run it opened closed again.
 */
export function partialAnswer(text: string, streamed = DEFAULT_STREAMED): string {
  if (streamed >= 1) return text;
  const n = streamed === DEFAULT_STREAMED ? Math.max(80, Math.round(text.length * streamed)) : Math.round(text.length * streamed);
  let cut = text.slice(0, n);
  const space = cut.lastIndexOf(" ");
  if (space > 40) cut = cut.slice(0, space);
  cut = cut.replace(/[\s,;:—-]+$/, "");
  if ((cut.match(/\*\*/g)?.length ?? 0) % 2) cut += "**";
  return cut;
}

/** The live card as the state would have it — what Current's real components read. */
export function cardAtState(card: Card, state: QaState, streamed = DEFAULT_STREAMED): Card {
  switch (state) {
    case "typing":
      return { ...card, status: "empty", answer: "" };
    case "thinking":
      return { ...card, status: "thinking", answer: "" };
    case "answering":
      // The live body only sets text on a done card; the caret marks it as still arriving.
      return { ...card, status: "done", answer: partialAnswer(card.answer, streamed) };
    default:
      return card;
  }
}

/** Three dots breathing in turn — the live card's answer dots, in any colour. */
export function ThinkingDots({ color, size = 8, gap = 6 }: { color: string; size?: number; gap?: number }) {
  return (
    <span className="inline-flex items-center" style={{ gap }} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="animate-pulse rounded-full"
          style={{ width: size, height: size, background: color, animationDelay: `${i * 0.18}s`, animationDuration: "1.1s" }}
        />
      ))}
    </span>
  );
}

/** The dots and their label, centred in the answer's place. */
export function Thinking({
  color,
  labelColor,
  font,
  size = 14,
  className = "",
  style,
}: {
  color: string;
  labelColor: string;
  font?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`flex min-h-[72px] flex-1 flex-col items-center justify-center gap-2.5 ${className}`}
      style={style}
      aria-live="polite"
      aria-busy="true"
      aria-label={THINKING_LABEL}
    >
      <ThinkingDots color={color} />
      <p className="text-center" style={{ fontFamily: font, fontSize: size, lineHeight: 1.3, fontWeight: 500, color: labelColor }}>
        {THINKING_LABEL}
      </p>
    </div>
  );
}

/** The caret at the end of an arriving answer. */
export function Caret({ color }: { color: string }) {
  return <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse align-middle" style={{ background: color }} />;
}

/**
 * The body of an answer in each state. Done and answering set the prose
 * (answering stops part-way, with a caret); thinking shows the dots.
 * Families wrap it in their own surface.
 */
export function AnswerAtState({
  state,
  text,
  accent,
  muted,
  ink,
  font,
  size,
  lineHeight = 1.5,
  labelSize,
  style,
  strong,
}: {
  state: QaState;
  text: string;
  /** The dots. */
  accent: string;
  /** The thinking label. */
  muted: string;
  /** The caret. */
  ink: string;
  font?: string;
  size: number;
  lineHeight?: number;
  labelSize?: number;
  style?: CSSProperties;
  strong?: CSSProperties;
}) {
  const streamed = useContext(StreamedContext);
  if (state === "thinking") return <Thinking color={accent} labelColor={muted} font={font} size={labelSize ?? size} />;
  const answering = state === "answering";
  return (
    <Prose
      el={ROLE.answer}
      text={answering ? partialAnswer(text, streamed) : text}
      size={size}
      lineHeight={lineHeight}
      color={ink}
      font={font}
      style={style}
      strong={strong}
      trailing={answering ? <Caret color={ink} /> : null}
    />
  );
}

/**
 * A family's composer: one field with the placeholder and a send disc, drawn
 * standing alone the way the live empty card is. Families pass their own
 * surface, type and button; the geometry is shared.
 */
export function ComposerField({
  height = 60,
  radius = 30,
  padding = 10,
  background,
  border,
  shadow,
  font,
  fontSize = 16,
  placeholderColor,
  value,
  valueColor,
  button,
  style,
}: {
  height?: number;
  radius?: number;
  /** Inset of the button from the field's edge; the button's radius is `radius - padding`. */
  padding?: number;
  background: string;
  border?: string;
  shadow?: string;
  font?: string;
  fontSize?: number;
  placeholderColor: string;
  /** Text typed so far; empty shows the placeholder. */
  value?: string;
  /** Ink for the typed text and its caret. */
  valueColor?: string;
  button: { background: string; color: string; border?: string; shadow?: string };
  style?: CSSProperties;
}) {
  const buttonSize = height - padding * 2;
  const typing = !!value;
  return (
    <div
      data-studio-composer
      role="textbox"
      aria-placeholder={COMPOSER_PLACEHOLDER}
      className="flex w-full items-center"
      style={{ height, borderRadius: radius, padding, paddingLeft: Math.max(padding, radius * 0.65), background, border, boxShadow: shadow, ...style }}
    >
      <span className="min-w-0 flex-1 truncate" style={{ fontFamily: font, fontSize, color: typing ? valueColor ?? "currentColor" : placeholderColor }}>
        {typing ? value : COMPOSER_PLACEHOLDER}
        {typing ? <Caret color={valueColor ?? "currentColor"} /> : null}
      </span>
      <span
        aria-label="Send"
        className="inline-flex shrink-0 items-center justify-center"
        style={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: Math.max(4, radius - padding),
          background: button.background,
          color: button.color,
          border: button.border,
          boxShadow: button.shadow,
        }}
      >
        <Icon icon={ArrowUp} className="h-[18px] w-[18px]" />
      </span>
    </div>
  );
}

// ─── Icon ───────────────────────────────────────────────────────────────────

const CARD_ICONS = { qa: MessageCircleQuestionMark, conversation: MessageSquareQuote } as const;

/** The kind glyph for anything in the pool — artifacts and cards alike. */
export function StudioKindIcon({ item, className = "h-4 w-4" }: { item: StudioArtifact; className?: string }) {
  if (item.card) return <Icon icon={CARD_ICONS[item.kind]} className={className} />;
  return <ArtifactTypeIcon kind={item.variant === "video" ? "video" : item.kind} className={className} />;
}

export function isCardKind(kind: string): kind is StudioCardKind {
  return kind === "qa" || kind === "conversation";
}

// ─── Text ───────────────────────────────────────────────────────────────────

/** Paragraphs of a card body, markdown emphasis left in for {@link Inline}. */
export function paragraphsOf(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

/** One paragraph with its `**bold**` set bold — the only markdown sample answers use. */
export function Inline({ text, strong }: { text: string; strong?: CSSProperties }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <strong key={i} style={{ fontWeight: 600, ...strong }}>
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

/**
 * Body prose that fills whatever height it is given and ends on a whole line
 * with an ellipsis. Paragraphs keep a half-line gap; the line count allows for
 * it, so the last visible line is never cut by the card's edge. When the card
 * hugs its content (Q&A) nothing is clamped.
 */
export function Prose({
  text,
  size,
  lineHeight = 1.5,
  color,
  font,
  el,
  className = "",
  style,
  strong,
  trailing,
}: {
  text: string;
  size: number;
  lineHeight?: number;
  color?: string;
  font?: string;
  el?: string;
  className?: string;
  style?: CSSProperties;
  strong?: CSSProperties;
  /** Set after the last paragraph's text — the streaming caret. */
  trailing?: ReactNode;
}) {
  const [ref, box] = useBox<HTMLDivElement>();
  // A hugging card's height follows this prose, so there is no box to clamp to.
  const hugs = useHugs();
  const paragraphs = paragraphsOf(text);
  const line = size * lineHeight;
  const gap = Math.round(line / 2);
  const lines = Math.max(1, Math.floor((box.h + 1 - gap * (paragraphs.length - 1)) / line));
  return (
    <div ref={ref} data-el={el} className={`min-h-0 flex-1 overflow-hidden ${className}`}>
      <div
        style={{
          fontFamily: font,
          fontSize: size,
          lineHeight,
          // Body text is medium; `**bold**` runs stay heavier (see Inline).
          fontWeight: 500,
          color,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: !hugs && box.h > 0 ? lines : undefined,
          overflow: "hidden",
          textWrap: "pretty",
          ...style,
        }}
      >
        {paragraphs.map((p, i) => (
          <p key={i} style={{ marginTop: i ? gap : 0 }}>
            <Inline text={p} strong={strong} />
            {i === paragraphs.length - 1 ? trailing : null}
          </p>
        ))}
      </div>
    </div>
  );
}

/** Body size that keeps a short summary generous and a long answer readable. */
export function proseSize(text: string, steps: [maxChars: number, px: number][], fallback: number): number {
  const n = text.replace(/\*\*/g, "").length;
  for (const [max, px] of steps) if (n <= max) return px;
  return fallback;
}

// ─── Current ────────────────────────────────────────────────────────────────

/** The Q&A header's collapse + actions buttons, drawn without the store the live menu reads. */
function QaControls() {
  const button =
    "flex h-8 w-8 items-center justify-center rounded-canvas-nest-17 text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink";
  return (
    <div className="relative z-30 flex flex-row items-center gap-0.5">
      <button type="button" aria-label="Collapse chat" className={button}>
        <ChatCollapseIcon collapsed={false} />
      </button>
      <button type="button" aria-label="Card actions" className={button}>
        <DotsIcon />
      </button>
    </div>
  );
}

/**
 * Today's card — the markup Card.tsx draws on the canvas (casing, translucent
 * surface, question header, answer body, follow-up footer) with the absolute
 * positioning, side plugs and store wiring dropped. Every turn state is the
 * live one: the empty card is the bare composer, thinking pulses the accent
 * hairline over the answer dots, answering streams with the caret.
 */
export function CurrentCard({ ctx }: { ctx: ArtifactRenderContext & { item: StudioCardItem } }) {
  const { item, interactive, chromeState } = ctx;
  const state = qaStateOf(ctx);
  const card = cardAtState(item.card, state, useContext(StreamedContext));
  const selected = chromeState === "selected";
  const conversation = item.kind === "conversation";

  if (state === "typing") {
    return (
      <div data-canvas-card={card.id} data-artifact-category="discourse" className="relative w-full select-text">
        <ChatComposer
          variant="canvas"
          accentColour={CANVAS_ACCENT}
          placeholder={COMPOSER_PLACEHOLDER}
          autoFocus={!!ctx.onComposerSubmit}
          draftValue={ctx.onComposerDraft ? ctx.composerDraft ?? "" : undefined}
          onDraftChange={ctx.onComposerDraft}
          onSubmit={ctx.onComposerSubmit ?? noop}
          trailingControls={<QaControls />}
        />
      </div>
    );
  }

  return (
    <div data-canvas-card={card.id} data-artifact-category="discourse" className="group/card relative h-full w-full select-text overflow-visible">
      <div
        className={`chat-casing group/inner relative flex h-full flex-col overflow-hidden rounded-canvas border bg-transparent transition-shadow ${
          chromeState === "rest" ? "shadow-artifact" : "shadow-artifactHover"
        } ${
          selected
            ? "border-canvas-accent outline-canvas-accent ring-2 ring-canvas-accent/25"
            : "border-canvas-border outline-canvas-border"
        } ${!interactive ? CANVAS_CONTENT_INERT_CLASS : ""}`}
        style={{ outlineStyle: "solid", outlineWidth: 1, outlineOffset: -1 }}
      >
        {state === "thinking" ? (
          <div className="thinking-accent-bar pointer-events-none absolute inset-x-0 top-0 z-40 h-px bg-canvas-accent" aria-hidden />
        ) : null}
        <div className="flex min-w-0 flex-col">
          {conversation ? (
            <ConversationCardSurface card={card} />
          ) : (
            <QaTranslucentSurface className="group/body flex min-w-0 flex-col">
              <QaQuestionSection style={qaInsetStyle("question")}>
                <QaQuestionHeaderRow controls={<QaControls />} />
                <CardQuestionText question={card.question} collapsed={false} />
              </QaQuestionSection>
              <div className="mx-5 h-px shrink-0 bg-canvas-border" />
              <div data-card-answer className="min-w-0" style={qaInsetStyle("answer")}>
                {/* Without its question: a "show me where…" ask expects an artifact the studio never commits, and the live body would call the answer missing. */}
                <CardAnswerBody card={{ ...card, question: "" }} isStreaming={state === "answering"} showPendingPlaceholder={state === "thinking"} />
              </div>
            </QaTranslucentSurface>
          )}
          {/* A finished Q&A card with nothing below it offers a follow-up. */}
          {!conversation && state === "done" ? (
            <div data-follow-up-footer className="relative z-20 shrink-0 border-t border-canvas-border bg-canvas-card px-3 py-2.5">
              <ChatComposer variant="canvas" nested accentColour={CANVAS_ACCENT} placeholder="Follow up" onSubmit={noop} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function noop() {}
