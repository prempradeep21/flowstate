"use client";

import { PRIMARY } from "../fonts";
import type { ClaimSide } from "@/lib/artifactTypes";
import { CurrentBody } from "../current";
import type { ArtifactRenderContext } from "../types";
import { ROLE } from "../../textSpec";
import {
  Avatar,
  Bloom,
  Clamp,
  D,
  FONT,
  FROST_BG,
  FROST_SHADOW,
  type HueId,
  PAD,
  RAISED,
  SOLID_SHADOW,
  Title,
  cardHueOf,
  onAccent,
  useDMode,
  useOn,
  sizeFor,
} from "./tokens";

/**
 * Text cards — the reference's "Strategic Plan" quotes. Frost, generous
 * margins, the words set large and light. In Aurora a coloured bloom rises
 * from the lower edge; Frost has no coloured gradients, so its colour comes
 * as solid pieces instead — an ink avatar, a lime claim card, a lime note.
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
        <p data-el={role} className="truncate text-[17px] leading-tight" style={{ color: onFill ? D.limeInk : D.ink }}>
          {name}
        </p>
        {meta && metaRole ? (
          <p data-el={metaRole} className="truncate text-[14px] leading-tight" style={{ color: onFill ? onAccent(55) : D.faint }}>
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
  const size = sizeFor(d.text, [[90, 30], [140, 26], [200, 23], [260, 20]], 18);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: PAD }}>
      {mode === "aurora" ? <Bloom hue={cardHueOf(mode, ctx.item.uid)} height="46%" /> : null}
      <Clamp el={ROLE.quote} as="blockquote" size={size} lineHeight={1.24} className="relative" style={{ fontFamily: PRIMARY, letterSpacing: "-0.02em", color: D.ink }}>
        “{d.text}”
      </Clamp>
      <div className="relative mt-5 shrink-0">
        {/* The title sits under the speaker, as the quote's subject. */}
        <Speaker name={d.speaker} role={ROLE.speaker} meta={ctx.item.artifact.title} metaRole={ROLE.title} />
      </div>
    </div>
  );
}

// ─── Claim ──────────────────────────────────────────────────────────────────

/**
 * One side of the argument: its own small card. In Aurora a frost card with
 * its own bloom; in Frost either flat lime (the claim) or raised frost.
 */
function Side({ side, label, role, hue, fill }: { side: ClaimSide; label: string; role: string; hue?: HueId; fill?: string }) {
  const size = sizeFor(side.text, [[70, 21], [130, 18], [200, 16]], 15);
  return (
    <div
      className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      style={{ borderRadius: 30, background: fill ?? FROST_BG, boxShadow: fill ? SOLID_SHADOW : FROST_SHADOW, padding: "24px 26px 22px" }}
    >
      {hue ? <Bloom hue={hue} height="55%" opacity={0.95} /> : null}
      <p data-el={ROLE.sideLabels} className="relative mb-2 text-[14px]" style={{ ...FONT, color: fill ? onAccent(55) : D.faint }}>
        {label}
      </p>
      <Clamp el={role} size={size} lineHeight={1.3} className="relative" style={{ letterSpacing: "-0.012em", color: fill ? D.limeInk : D.ink }}>
        {side.text}
      </Clamp>
      <div className="relative mt-4 shrink-0">
        <Speaker name={side.speaker} role={ROLE.speakers} size={36} onFill={!!fill} />
      </div>
    </div>
  );
}

/** The question in light display type, then the two answers as two small cards, staggered like the reference's quotes. */
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
        <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-6">
          {frost ? <Side side={d.proposition} label="The claim" role={ROLE.claim} fill={D.lime} /> : <Side side={d.proposition} label="The claim" role={ROLE.claim} hue="tide" />}
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col pt-6">
          <Side side={d.counter} label="The pushback" role={ROLE.pushback} hue={frost ? undefined : "rose"} />
        </div>
      </div>
    </div>
  );
}

// ─── Definition ─────────────────────────────────────────────────────────────

/** A dictionary entry: the headword large and light, the gloss under it, the example in a raised pill. */
export function DefinitionBody({ ctx }: Ctx) {
  const mode = useDMode();
  const payload = ctx.item.payload;
  if (payload.type !== "definition") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const title = ctx.item.artifact.title;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${PAD - 6}px ${PAD}px` }}>
      {mode === "aurora" ? <Bloom hue={cardHueOf(mode, ctx.item.uid)} height="40%" opacity={0.75} /> : null}
      <div className="relative flex shrink-0 items-baseline justify-between gap-4">
        <Title el={ROLE.title} size={sizeFor(title, [[16, 36], [26, 31]], 27)} lines={1}>
          {title}
        </Title>
        {d.speaker?.trim() ? (
          <span data-el={ROLE.speaker} className="shrink-0 text-[14px]" style={{ ...FONT, color: D.faint }}>
            per {d.speaker}
          </span>
        ) : null}
      </div>
      <Clamp el={ROLE.gloss} size={d.gloss.length > 130 ? 16 : 18} lineHeight={1.35} className="relative mt-3" style={{ color: D.ink }}>
        {d.gloss}
      </Clamp>
      {d.example?.trim() ? (
        <div data-el={ROLE.example} className="relative mt-3 flex shrink-0 gap-3 overflow-hidden rounded-[22px] px-4 py-3" style={RAISED}>
          <span className="shrink-0 rounded-full px-2 py-[3px] text-[12px] leading-none" style={{ ...FONT, background: D.accent, color: D.accentInk, alignSelf: "flex-start", marginTop: 1 }}>
            e.g.
          </span>
          <p className="line-clamp-1 text-[14px] leading-snug" style={{ ...FONT, color: D.muted }}>
            {d.example}
          </p>
        </div>
      ) : null}
    </div>
  );
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
      <p data-el={ROLE.title} className="relative shrink-0 text-[17px] leading-tight" style={{ ...FONT, fontWeight: 500, color: on.ink }}>
        {ctx.item.artifact.title}
      </p>
      <Clamp el={ROLE.note} size={sizeFor(text, [[120, 19], [220, 16]], 14)} lineHeight={1.38} className="relative mt-2.5" style={{ color: on.ink }}>
        {text}
      </Clamp>
    </div>
  );
}
