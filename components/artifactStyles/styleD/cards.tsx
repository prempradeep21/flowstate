"use client";

import { PRIMARY } from "../fonts";
import type { ClaimSide } from "@/lib/artifactTypes";
import { CurrentBody } from "../current";
import { AnswerAtState, ComposerField, Prose, proseSize, qaStateOf } from "../cards";
import type { ArtifactRenderContext } from "../types";
import { ROLE } from "../textSpec";
import {
  Avatar,
  Bloom,
  Clamp,
  D,
  DModeContext,
  type DMode,
  FONT,
  FROST_BG,
  FROST_SHADOW,
  type HueId,
  NEST_INSET,
  NEST_RADIUS,
  PAD,
  RAISED,
  SOLID_SHADOW,
  Title,
  accentVars,
  cardHueOf,
  useDMode,
  useOn,
  sizeFor,
} from "./tokens";

/**
 * Text cards — the reference's "Strategic Plan" quotes. Frost, generous
 * margins, the words set large and light, and every word there: these cards
 * hug what they hold. In Aurora a coloured bloom rises from the lower edge;
 * Frost has no coloured gradients, so its colour comes as solid pieces
 * instead — an ink avatar, a lime claim card, a lime note.
 */

type Ctx = { ctx: ArtifactRenderContext };

const isPersonName = (s: string) => /^(\p{Lu}[\p{L}'.-]*)(\s+\p{Lu}[\p{L}'.-]*){0,3}$/u.test(s.trim());

/**
 * A person: the avatar (iconography), the name as `role`, and optionally a
 * quiet second line that is another part (`metaRole`) — never invented meta.
 */
function Speaker({
  name,
  role,
  meta,
  metaRole,
  size = 44,
  onFill = false,
}: {
  name: string;
  role: string;
  meta?: string;
  metaRole?: string;
  size?: number;
  onFill?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3.5">
      {isPersonName(name) ? <Avatar name={name} size={size} /> : null}
      <div className="min-w-0" style={FONT}>
        <p data-el={role} className="text-[20px] leading-tight" style={{ color: onFill ? D.limeInk : D.ink, overflowWrap: "break-word" }}>
          {name}
        </p>
        {meta && metaRole ? (
          <p data-el={metaRole} className="mt-0.5 text-[14px] leading-tight" style={{ color: onFill ? D.limeInk : D.ink, overflowWrap: "break-word" }}>
            {meta}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ─── Quote ──────────────────────────────────────────────────────────────────

export function QuoteBody({ ctx }: Ctx) {
  const mode = useDMode();
  const payload = ctx.item.payload;
  if (payload.type !== "quote") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const size = sizeFor(d.text, [[90, 36], [140, 31], [200, 28], [260, 24]], 22);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: PAD }}>
      {mode === "aurora" ? <Bloom hue={cardHueOf(mode, ctx.item.uid)} height="46%" /> : null}
      <Clamp el={ROLE.quote} as="blockquote" size={size} lineHeight={1.24} className="relative" style={{ fontFamily: PRIMARY, letterSpacing: "-0.02em", color: D.ink }}>
        “{d.text}”
      </Clamp>
      <div className="relative mt-7 shrink-0">
        {/* The title sits under the speaker, as the quote's subject. */}
        <Speaker name={d.speaker} role={ROLE.speaker} meta={ctx.item.artifact.title} metaRole={ROLE.title} />
      </div>
    </div>
  );
}

// ─── Claim ──────────────────────────────────────────────────────────────────

/**
 * One side of the argument: its own small card. In Aurora a frost card with
 * its own bloom; in Frost either flat lime (the claim) or raised frost. The
 * side's label is set a step above body size, medium, so the two sides read
 * as headed columns.
 */
function Side({ side, label, role, hue, fill }: { side: ClaimSide; label: string; role: string; hue?: HueId; fill?: string }) {
  const size = sizeFor(side.text, [[70, 25], [130, 22], [200, 19]], 18);
  return (
    <div
      className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      style={{ borderRadius: 30, background: fill ?? FROST_BG, boxShadow: fill ? SOLID_SHADOW : FROST_SHADOW, padding: "24px 26px 22px" }}
    >
      {hue ? <Bloom hue={hue} height="55%" opacity={0.95} /> : null}
      <p data-el={ROLE.sideLabels} className="relative mb-3 text-[20px] leading-tight" style={{ ...FONT, fontWeight: 500, color: fill ? D.limeInk : D.ink }}>
        {label}
      </p>
      <Clamp el={role} size={size} lineHeight={1.3} className="relative" style={{ letterSpacing: "-0.012em", color: fill ? D.limeInk : D.ink }}>
        {side.text}
      </Clamp>
      <div className="relative mt-auto shrink-0 pt-5">
        <Speaker name={side.speaker} role={ROLE.speakers} size={36} onFill={!!fill} />
      </div>
    </div>
  );
}

/** The question in light display type, then the two answers as two small cards side by side, the same height. */
export function ClaimBody({ ctx }: Ctx) {
  const frost = useDMode() === "frost";
  const payload = ctx.item.payload;
  if (payload.type !== "claim") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const title = ctx.item.artifact.title;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: PAD }}>
      <Title el={ROLE.title} size={sizeFor(title, [[30, 38], [48, 32]], 28)} lines={2} className="shrink-0">
        {title}
      </Title>
      <div className="mt-7 flex min-h-0 flex-1 items-stretch gap-5">
        {frost ? <Side side={d.proposition} label="The claim" role={ROLE.claim} fill={D.lime} /> : <Side side={d.proposition} label="The claim" role={ROLE.claim} hue="tide" />}
        <Side side={d.counter} label="The pushback" role={ROLE.pushback} hue={frost ? undefined : "rose"} />
      </div>
    </div>
  );
}

// ─── Definition ─────────────────────────────────────────────────────────────

/**
 * A dictionary entry, stacked: the headword large and light, who said it on
 * its own line beneath, the gloss, and the example in a raised pill.
 */
export function DefinitionBody({ ctx }: Ctx) {
  const mode = useDMode();
  const payload = ctx.item.payload;
  if (payload.type !== "definition") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const title = ctx.item.artifact.title;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${PAD - 4}px ${PAD}px ${PAD - 2}px` }}>
      {mode === "aurora" ? <Bloom hue={cardHueOf(mode, ctx.item.uid)} height="40%" opacity={0.75} /> : null}
      <Title el={ROLE.title} size={sizeFor(title, [[16, 38], [26, 32]], 28)} lines={2} className="relative shrink-0">
        {title}
      </Title>
      {d.speaker?.trim() ? (
        <p data-el={ROLE.speaker} className="relative mt-2 shrink-0 text-[17px] leading-snug" style={{ ...FONT, color: D.ink, overflowWrap: "break-word" }}>
          per {d.speaker}
        </p>
      ) : null}
      <Clamp el={ROLE.gloss} size={d.gloss.length > 130 ? 19 : 22} lineHeight={1.35} className="relative mt-5" style={{ color: D.ink }}>
        {d.gloss}
      </Clamp>
      {d.example?.trim() ? (
        <div data-el={ROLE.example} className="relative mt-5 flex shrink-0 items-start gap-3 overflow-hidden rounded-[22px] px-4 py-3" style={RAISED}>
          <span className="shrink-0 rounded-full px-2 py-[3px] text-[14px] leading-none" style={{ ...FONT, background: D.accent, color: D.accentInk, marginTop: 3 }}>
            e.g.
          </span>
          <p className="min-w-0 text-[17px] leading-snug" style={{ ...FONT, color: D.ink, overflowWrap: "break-word" }}>
            {d.example}
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ─── Cards ──────────────────────────────────────────────────────────────────

/**
 * A transcript beat: its heading on a panel in the card's accent — solid
 * lime in Frost, the card's own hue in Aurora — and the summary on the frost
 * below. The panel is what tells it from a Q&A card: a beat of someone
 * else's talk carries the colour; the user's own exchange does not.
 */
export function ConversationBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  if (payload.type !== "conversation") return <CurrentBody ctx={ctx} />;
  const { heading, body } = payload.data;
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: NEST_INSET, paddingBottom: PAD - 12 }}>
      <div
        className="relative flex shrink-0 flex-col overflow-hidden"
        style={{
          borderRadius: NEST_RADIUS,
          padding: `${PAD - 18}px ${PAD - 14}px ${PAD - 16}px`,
          background: D.accent,
          color: D.accentInk,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 24px -14px ${D.accentShadow}`,
        }}
      >
        <Title el={ROLE.title} size={sizeFor(heading, [[26, 30], [44, 26], [70, 23]], 21)} lines={2} color={D.accentInk} className="relative">
          {heading}
        </Title>
      </div>
      <Prose
        el={ROLE.summary}
        text={body}
        size={proseSize(body, [[180, 20], [360, 19]], 17)}
        lineHeight={1.45}
        color={D.ink}
        // Lines up with the heading inside the panel: inset + the panel's own padding.
        style={{ ...FONT, padding: `0 ${PAD - 14}px` }}
        className="relative mt-4"
      />
    </div>
  );
}

/**
 * The user's own exchange, flat: the question as the title, a hairline,
 * the answer in plain ink on the frost — no raised pane, no bloom. The
 * accent shows only while the answer is being thought about, as the dots.
 */
export function QaBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  if (payload.type !== "qa") return <CurrentBody ctx={ctx} />;
  const { heading, body } = payload.data;
  const state = qaStateOf(ctx);
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${PAD - 10}px ${PAD - 12}px ${PAD - 14}px` }}>
      <Title el={ROLE.title} size={sizeFor(heading, [[40, 27], [70, 23], [110, 20]], 18)} lines={3} className="relative shrink-0">
        {heading}
      </Title>
      <span aria-hidden className="relative mt-4 h-px w-full shrink-0" style={{ background: D.hair }} />
      <div className="relative mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
        <AnswerAtState
          state={state}
          text={body}
          accent={D.accent}
          muted={D.ink}
          ink={D.ink}
          size={proseSize(body, [[260, 19], [520, 17]], 17)}
          lineHeight={1.5}
          labelSize={17}
          style={FONT}
        />
      </div>
    </div>
  );
}

/** The empty card: a raised white pill, the send disc in the accent. */
export function makeComposer(mode: DMode) {
  return function Composer({ ctx }: Ctx) {
    return (
      <DModeContext.Provider value={mode}>
        <div className="w-full" style={{ ...FONT, ...accentVars(mode, ctx.item.uid, "frost") }}>
          <ComposerField
            height={64}
            radius={32}
            padding={10}
            background={RAISED.background as string}
            shadow={RAISED.boxShadow as string}
            placeholderColor={D.faint}
            value={ctx.composerDraft}
            valueColor={D.ink}
            fontSize={16}
            button={{
              background: D.accent,
              color: D.accentInk,
              shadow: `0 6px 14px -6px ${D.accentShadow}, inset 0 1px 0 rgba(255,255,255,0.5)`,
            }}
          />
        </div>
      </DModeContext.Provider>
    );
  };
}

// ─── Sticky note ────────────────────────────────────────────────────────────

const NOTE_HUE: Record<string, HueId | null> = { turbo: "sun", violet: "lilac", chalk: null, haiti: "tide" };

/** A note: in Aurora a frost card whose colour comes up as a bloom from below; in Frost the frame paints it flat lime. */
export function StickyBody({ ctx }: Ctx) {
  const frost = useDMode() === "frost";
  const on = useOn();
  const payload = ctx.item.payload;
  if (payload.type !== "stickynote") return <CurrentBody ctx={ctx} />;
  const hue = frost ? null : NOTE_HUE[payload.data.colorId] ?? "sun";
  const text = payload.data.text;
  return (
    <div className="relative flex h-full flex-col overflow-hidden" style={{ padding: "30px 30px 28px" }}>
      {hue ? <Bloom hue={hue} height="62%" /> : null}
      <p data-el={ROLE.title} className="relative shrink-0 text-[17px] leading-tight" style={{ ...FONT, fontWeight: 500, color: on.ink, overflowWrap: "break-word" }}>
        {ctx.item.artifact.title}
      </p>
      <Clamp el={ROLE.note} size={sizeFor(text, [[120, 23], [220, 19]], 17)} lineHeight={1.38} className="relative mt-2.5" style={{ color: on.ink }}>
        {text}
      </Clamp>
    </div>
  );
}
