"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { TimelineEvent } from "@/lib/artifactTypes";
import { wheelDeltaXY } from "@/lib/canvasWheel";
import { CurrentBody } from "../current";
import type { ArtifactRenderContext } from "../types";
import { ROLE } from "../textSpec";
import { D, DISPLAY, FONT, PAD, RAISED, Title, inkA, sentenceCase, sizeFor, splitTitle, useClamps, usePalette } from "./tokens";

type Ctx = { ctx: ArtifactRenderContext };
type Side = "above" | "below";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MS_DAY = 86_400_000;
const UNIT_MS: Record<string, number> = { year: 365.25 * MS_DAY, month: 30.4375 * MS_DAY, day: MS_DAY };

/** The rail the moments sit on, and the room between it and the nearest lane. */
const RAIL_H = 14;
const RAIL_GAP = 20;
/** A label's width, and how far right of its pullout line it starts. */
const LABEL_W = 220;
const LABEL_INDENT = 16;
/** The container's padding — pulled back out with a negative margin, so text lines up with its date at rest. */
const BOX_PAD_X = 10;
/** The least room between two labels in a lane, and between stacked lanes. */
const LABEL_GAP = 18;
const LANE_GAP = 16;
/** At most this many lanes either side of the rail. */
const MAX_LANES = 3;
/** Where the pullout line meets its label: the middle of the date line. */
const STEM_CAP = 8;
/** Labels and dots fade out over this much of each edge as they pan off. */
const EDGE_FADE = 44;
/** Room the fitted view keeps before the first moment and after the last (its label runs right). */
const FIT_PAD_L = EDGE_FADE + 8;
const FIT_PAD_R = LABEL_INDENT + LABEL_W + 24;
/** How far out past the fitted view the strip zooms, and how far in (a day this wide at most). */
const MIN_ZOOM_OF_FIT = 0.5;
const MAX_PX_PER_MS = 48 / MS_DAY;
/** A press must travel this far (screen px) before it pans. */
const PAN_THRESHOLD = 4;
/** Stepping to a chapter off screen glides the strip there. */
const GLIDE_MS = 380;
const GLIDE = `${GLIDE_MS}ms cubic-bezier(0.22, 0.8, 0.24, 1)`;

function eventStamp(e: TimelineEvent, scale: string): string {
  const m = e.at.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return e.at;
  if (scale === "day") return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}`;
  if (scale === "month") return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  return m[1]!;
}

/** Where the strip looks: the moment at its centre, and how many px a millisecond takes. */
type View = { center: number; px: number };

type Candidate = { i: number; x: number; side: Side };
type Placed = Candidate & { lane: number; l: number; r: number };

/**
 * Lane each label sits in, nearest the rail first (the reference's staggered
 * pullouts). A label may take a lane only when its box is clear of the others
 * in that lane, its pullout line crosses no nearer label, and no farther
 * label's line crosses it. Candidates are placed in the order given; one that
 * finds no lane is left unlabelled until zooming gives it room.
 */
function placeLabels(cands: Candidate[], lanes: Record<Side, number>): Map<number, number> {
  const placed: Record<Side, Placed[]> = { above: [], below: [] };
  const out = new Map<number, number>();
  for (const c of cands) {
    const l = c.x - 2;
    const r = c.x + LABEL_INDENT + LABEL_W;
    const side = placed[c.side];
    for (let k = 0; k < lanes[c.side]; k++) {
      const clear = side.every((p) =>
        p.lane === k
          ? p.r + LABEL_GAP <= l || r + LABEL_GAP <= p.l
          : p.lane < k
            ? c.x < p.l - 4 || c.x > p.r + 4
            : p.x < l - 4 || p.x > r + 4,
      );
      if (!clear) continue;
      side.push({ ...c, lane: k, l, r });
      out.set(c.i, k);
      break;
    }
  }
  return out;
}

/** Lit: hovered, or selected with nothing hovered. Marked: selected while another is hovered. */
type LabelState = "rest" | "marked" | "lit";

/** A moment's date over its words, the words in a container that fills when the chapter is lit. */
function Label({
  e,
  scale,
  clamps,
  state = "rest",
  measure = false,
}: {
  e: TimelineEvent;
  scale: string;
  clamps: boolean;
  state?: LabelState;
  measure?: boolean;
}) {
  const box: CSSProperties =
    state === "lit"
      ? { background: D.accent, boxShadow: `0 6px 16px -6px ${D.accentShadow}` }
      : state === "marked"
        ? RAISED
        : { background: "transparent", boxShadow: "none" };
  return (
    <>
      <p data-el={measure ? undefined : ROLE.eventDates} className="text-[15px] leading-none tabular-nums" style={{ ...FONT, color: D.ink, letterSpacing: "0.01em" }}>
        {eventStamp(e, scale)}
      </p>
      <div
        className="mt-[7px] inline-block rounded-[14px]"
        style={{
          marginLeft: -BOX_PAD_X,
          maxWidth: `calc(100% + ${BOX_PAD_X}px)`,
          padding: `6px ${BOX_PAD_X}px 7px`,
          transition: "background-color 180ms ease-out, box-shadow 180ms ease-out",
          ...box,
        }}
      >
        <p
          data-el={measure ? undefined : ROLE.eventLabels}
          className={`${clamps ? "line-clamp-3" : ""} text-[20px] leading-[1.2]`}
          style={{ ...DISPLAY, color: state === "lit" ? D.accentInk : D.ink, letterSpacing: "-0.012em", overflowWrap: "break-word" }}
        >
          {e.label}
        </p>
      </div>
    </>
  );
}

function Arrow({ dir, disabled, onClick }: { dir: -1 | 1; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir < 0 ? "Previous moment" : "Next moment"}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-full transition-[opacity,transform] duration-150 active:scale-95 disabled:opacity-30"
      style={{ ...RAISED, color: D.ink }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <path
          d={dir < 0 ? "M11 4L6 9l5 5" : "M7 4l5 5-5 5"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/**
 * Moments on a raised rail, each pulled out to its label by a fine line —
 * labels stagger into lanes above and below so a crowded stretch stacks
 * instead of colliding (the reference's pullout timeline).
 *
 * Each moment is a chapter of five parts: its stretch of rail up to the next
 * moment (the segment), its dot on the rail, the pullout line, its date and
 * words, and a container behind the words. One chapter is lit at a time:
 * its segment fills ink, its dot turns lime, its line goes solid and its
 * words sit in a lime container (the card's one lime element). The lit
 * chapter is the one hovered (its label, dot or stretch of rail), else the
 * selected one — the first, until the arrows under the title step or a
 * chapter is pressed. While another is hovered the selected chapter keeps a
 * white container and the rest recede.
 *
 * Moments sit where they fall in time. The strip opens fitted to its range;
 * once the card is live the wheel zooms about the cursor and a sideways swipe
 * or a drag pans, as the vanilla timeline does; a moment with no room keeps
 * its dot and shows its label once zooming opens a lane. How many lanes each
 * side gets is settled in the fitted view, so the card hugs one height at
 * every zoom.
 */
export function TimelineBody({ ctx }: Ctx) {
  const pal = usePalette(ctx.item.uid);
  const clamps = useClamps();
  const viewportRef = useRef<HTMLDivElement>(null);
  const sizerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [labelH, setLabelH] = useState(0);
  const [userView, setUserView] = useState<View | null>(null);
  const [panning, setPanning] = useState(false);
  const [gliding, setGliding] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const live = ctx.interactive;

  const payload = ctx.item.payload;
  const timeline = payload.type === "timeline" ? payload.data : null;
  const scale = timeline?.scale ?? "year";

  const moments = useMemo(() => {
    const events = timeline ? [...timeline.events].sort((a, b) => a.at.localeCompare(b.at)) : [];
    return events.map((e) => ({ e, t: Date.parse(e.at) })).filter((m) => Number.isFinite(m.t));
  }, [timeline]);
  const n = moments.length;
  const minT = n ? moments[0]!.t : 0;
  const maxT = n ? moments[n - 1]!.t : 0;
  // The selected chapter: the one stepped or pressed to, else the first.
  const active = picked != null && picked < n ? picked : 0;

  // The fitted view: the first moment just in from the left, the last with room for its label.
  const fit = useMemo<View>(() => {
    const span = Math.max(maxT - minT, UNIT_MS[scale] ?? UNIT_MS.year!);
    const room = width - FIT_PAD_L - FIT_PAD_R;
    const px = (room > 120 ? room : Math.max(width * 0.5, 1)) / span;
    return { center: minT + (width / 2 - FIT_PAD_L) / px, px };
  }, [maxT, minT, scale, width]);
  const view = userView ?? fit;
  const viewRef = useRef(view);
  viewRef.current = view;

  const limitsRef = useRef({ minPx: 0, maxPx: 0, lo: minT, hi: maxT });
  limitsRef.current = {
    minPx: fit.px * MIN_ZOOM_OF_FIT,
    maxPx: Math.max(fit.px * 4, MAX_PX_PER_MS),
    lo: Math.min(minT, fit.center),
    hi: Math.max(maxT, fit.center),
  };
  /** Keep the centre on the range, the zoom inside its limits. */
  const commitRef = useRef((next: View) => {
    const lim = limitsRef.current;
    const v = {
      px: Math.min(lim.maxPx, Math.max(lim.minPx, next.px)),
      center: Math.min(lim.hi, Math.max(lim.lo, next.center)),
    };
    viewRef.current = v;
    setUserView(v);
  });

  // The layout width (offsetWidth ignores the canvas's scale transform), and
  // the tallest label — every lane is that tall.
  useLayoutEffect(() => {
    const el = viewportRef.current;
    const sizer = sizerRef.current;
    if (!el || !sizer) return;
    const sync = () => {
      setWidth(el.offsetWidth);
      setLabelH(sizer.offsetHeight);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    ro.observe(sizer);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!live) setHovered(null);
  }, [live]);

  // Wheel zoom and drag pan — only while the card is live, so a scroll over a
  // resting card still moves the canvas. A press that doesn't pan lights the
  // chapter it landed on.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !live) return;
    const commit = commitRef.current;
    /** Screen px per layout px — the canvas zoom the card is drawn at. */
    const screenScale = () => el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const k = screenScale();
      const { dx, dy } = wheelDeltaXY(e);
      const cur = viewRef.current;
      if (!e.ctrlKey && Math.abs(dx) > Math.abs(dy)) {
        commit({ ...cur, center: cur.center + dx / k / cur.px });
        return;
      }
      const factor = Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.002));
      const lim = limitsRef.current;
      const px = Math.min(lim.maxPx, Math.max(lim.minPx, cur.px * factor));
      const offset = (e.clientX - el.getBoundingClientRect().left) / k - el.offsetWidth / 2;
      const pivot = cur.center + offset / cur.px;
      commit({ px, center: pivot - offset / px });
    };

    let pan: { id: number; x: number; center: number; moved: boolean; moment: number | null } | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const hit = (e.target as Element).closest<HTMLElement>("[data-moment]");
      pan = { id: e.pointerId, x: e.clientX, center: viewRef.current.center, moved: false, moment: hit ? Number(hit.dataset.moment) : null };
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!pan || pan.id !== e.pointerId) return;
      const dx = e.clientX - pan.x;
      if (!pan.moved && Math.abs(dx) < PAN_THRESHOLD) return;
      if (!pan.moved) {
        setPanning(true);
        setHovered(null);
      }
      pan.moved = true;
      commit({ ...viewRef.current, center: pan.center - dx / screenScale() / viewRef.current.px });
    };
    const onUp = (e: PointerEvent) => {
      if (!pan || pan.id !== e.pointerId) return;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // already released
      }
      if (!pan.moved && pan.moment != null && Number.isFinite(pan.moment)) setPicked(pan.moment);
      pan = null;
      setPanning(false);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      setPanning(false);
    };
  }, [live]);

  const xAt = (t: number, v: View) => width / 2 + (t - v.center) * v.px;
  const candidatesAt = (v: View, first: number | null, second: number | null = null): Candidate[] => {
    const all = moments
      .map((m, i) => ({ i, x: xAt(m.t, v), side: (i % 2 === 0 ? "above" : "below") as Side }))
      .filter((c) => c.x >= -(LABEL_INDENT + LABEL_W) && c.x <= width - 8);
    // The lit chapter claims its room first, then highlighted moments, then left to right.
    const rank = (c: Candidate) => (c.i === first ? 0 : c.i === second ? 1 : moments[c.i]!.e.highlight ? 2 : 3);
    return all.sort((a, b) => rank(a) - rank(b) || a.x - b.x);
  };

  // How many lanes each side gets: what the fitted view needs, at most MAX_LANES.
  const lanes = useMemo<Record<Side, number>>(() => {
    if (width <= 0) return { above: 1, below: 1 };
    const fitted = placeLabels(candidatesAt(fit, null), { above: MAX_LANES, below: MAX_LANES });
    const most = { above: 0, below: 0 };
    for (const [i, lane] of fitted) {
      const side: Side = i % 2 === 0 ? "above" : "below";
      most[side] = Math.max(most[side], lane + 1);
    }
    return { above: Math.max(1, most.above), below: n > 1 ? Math.max(1, most.below) : 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fit, moments, n, width]);

  // A hovered chapter with no label of its own claims room first, so hovering brings any chapter out.
  const placed = useMemo(() => {
    if (width <= 0) return new Map<number, number>();
    const base = placeLabels(candidatesAt(view, active), lanes);
    if (hovered == null || base.has(hovered)) return base;
    return placeLabels(candidatesAt(view, hovered, active), lanes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, hovered, lanes, moments, view, width]);

  /** Light a chapter; glide the strip to it when its label isn't wholly in view. */
  const step = (d: -1 | 1) => {
    const next = Math.min(n - 1, Math.max(0, active + d));
    if (next === active) return;
    setPicked(next);
    setHovered(null);
    const t = moments[next]!.t;
    const cur = viewRef.current;
    const x = xAt(t, cur);
    if (x < FIT_PAD_L || x + LABEL_INDENT + LABEL_W > width - EDGE_FADE) {
      setGliding(true);
      // Land the moment a third of the way in, its label running into the middle.
      commitRef.current({ ...cur, center: t + (width / 2 - width / 3) / cur.px });
      window.setTimeout(() => setGliding(false), GLIDE_MS);
    }
  };

  if (!timeline) return <CurrentBody ctx={ctx} />;
  const t = splitTitle(ctx.item.artifact.title);
  const big = t.lead ?? t.head;
  // The rest of the title's own words, in order — never a computed span or count.
  const second = [t.lead ? t.head : null, t.sub].filter(Boolean).join(" — ");
  const dotColors = pal.dots;
  const fade = `linear-gradient(to right, transparent, #000 ${EDGE_FADE}px, #000 calc(100% - ${EDGE_FADE}px), transparent)`;

  // Vertical geometry: lanes above, the rail, lanes below.
  const laneH = labelH + LANE_GAP;
  const aboveH = lanes.above * laneH;
  const railTop = aboveH + RAIL_GAP;
  const railY = railTop + RAIL_H / 2;
  const belowTop = railTop + RAIL_H + RAIL_GAP;
  const height = belowTop + lanes.below * laneH;
  const labelTop = (side: Side, lane: number) => (side === "above" ? aboveH - (lane + 1) * laneH : belowTop + lane * laneH);

  const move = gliding ? `left ${GLIDE}, width ${GLIDE}` : "";
  const settle = (extra: string) => [move, extra].filter(Boolean).join(", ") || undefined;
  // The lit chapter is the hovered one, else the selected one. While another
  // is hovered, the selected chapter stays marked; the rest recede.
  const lit = hovered ?? active;
  const marked = hovered != null && hovered !== active ? active : null;
  const stateOf = (i: number): LabelState => (i === lit ? "lit" : i === marked ? "marked" : "rest");
  const recede = (i: number) => (hovered != null && stateOf(i) === "rest" ? 0.38 : 1);
  const hover = (i: number) => (live && !panning ? () => setHovered(i) : undefined);

  const pts = moments.map((m, i) => ({ ...m, i, x: xAt(m.t, view) }));
  /** Where chapter i's stretch of rail ends: the next moment, or past the edge for the last. */
  const segEndOf = (i: number) => (i < n - 1 ? pts[i + 1]!.x : width + 40);
  const segment = (i: number, background: string, key: string) => (
    <span
      key={key}
      aria-hidden
      data-timeline-segment={key}
      className="absolute rounded-full"
      style={{
        top: railTop + 4,
        height: RAIL_H - 8,
        left: pts[i]!.x,
        width: Math.max(0, segEndOf(i) - pts[i]!.x),
        background,
        transition: settle(""),
      }}
    />
  );

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden" style={{ padding: `${PAD + 4}px ${PAD + 8}px` }}>
      <div className="flex w-[24%] min-w-[260px] max-w-[420px] shrink-0 flex-col justify-center pr-10">
        <div data-el={ROLE.title}>
          <Title size={sizeFor(big, [[14, 64], [22, 54], [34, 44]], 38)} lines={3}>
            {big}
          </Title>
          {second ? (
            <p className="mt-3 text-[22px] leading-tight" style={{ ...DISPLAY, color: D.ink, letterSpacing: "-0.015em", overflowWrap: "break-word" }}>
              {sentenceCase(second)}
            </p>
          ) : null}
          {t.range ? (
            <p className="mt-5 text-[16px] tabular-nums" style={{ ...FONT, color: D.ink }}>
              {t.range}
            </p>
          ) : null}
        </div>
        {n > 1 ? (
          // Quick presses are steps, not the card's double-click-to-edit.
          <div data-timeline-steps className="mt-12 flex items-center gap-2.5" onDoubleClick={(e) => e.stopPropagation()}>
            <Arrow dir={-1} disabled={active <= 0} onClick={() => step(-1)} />
            <Arrow dir={1} disabled={active >= n - 1} onClick={() => step(1)} />
          </div>
        ) : null}
      </div>
      {/* The strip's own faint frame, setting it apart from the title side. */}
      <div
        data-timeline-frame
        className="min-w-0 flex-1 self-center rounded-[28px]"
        style={{ border: `1px solid ${D.hair}`, background: inkA(1.5), padding: "26px 22px" }}
      >
      <div
        ref={viewportRef}
        data-frost-timeline
        {...(live ? { "data-canvas-scroll": "" } : {})}
        className={`relative ${live ? `select-none ${panning ? "cursor-grabbing" : "cursor-grab"}` : ""}`}
        style={{ height, touchAction: live ? "none" : undefined }}
        onPointerLeave={() => setHovered(null)}
        // Pressing chapters in quick succession picks them; Edit stays on the title side and ⋯.
        onDoubleClick={live ? (e) => e.stopPropagation() : undefined}
      >
        {/* Every label stacked in one cell, unseen: a lane is as tall as the tallest. */}
        <div ref={sizerRef} aria-hidden className="invisible absolute left-0 top-0 grid" style={{ width: LABEL_W }}>
          {moments.map(({ e }) => (
            <div key={e.id} style={{ gridArea: "1 / 1" }}>
              <Label e={e} scale={scale} clamps={clamps} measure />
            </div>
          ))}
        </div>

        <div aria-hidden className="absolute inset-x-0 rounded-full" style={{ ...RAISED, top: railTop, height: RAIL_H }} />

        <div className="absolute inset-0" style={{ overflow: "clip", maskImage: fade, WebkitMaskImage: fade }}>
          {/* The marked chapter's stretch of rail faintly, the lit one's in ink. */}
          {n > 0 && marked != null ? segment(marked, inkA(22), "marked") : null}
          {n > 0 ? segment(lit, D.ink, "lit") : null}

          {/* Each stretch of rail is a hover target for the moment that opens it. */}
          {live
            ? pts.map((p) => {
                const end = segEndOf(p.i);
                if (end < 0 || p.x > width) return null;
                return (
                  <span
                    key={`hit-${p.e.id}`}
                    aria-hidden
                    data-moment={p.i}
                    className="absolute cursor-pointer"
                    style={{ left: p.x, width: Math.max(0, end - p.x), top: railTop - RAIL_GAP / 2, height: RAIL_H + RAIL_GAP }}
                    onPointerEnter={hover(p.i)}
                  />
                );
              })
            : null}

          {/* Pullout lines, then labels. */}
          {pts.map((p) => {
            const lane = placed.get(p.i);
            if (lane == null) return null;
            const side: Side = p.i % 2 === 0 ? "above" : "below";
            const top = labelTop(side, lane);
            const solid = stateOf(p.i) !== "rest";
            const y1 = side === "above" ? top + STEM_CAP : railY;
            const y2 = side === "above" ? railY : top + STEM_CAP;
            return (
              <span
                key={`stem-${p.e.id}`}
                aria-hidden
                className="absolute"
                style={{
                  left: p.x - (solid ? 0.75 : 0.5),
                  top: y1,
                  height: Math.max(0, y2 - y1),
                  width: solid ? 1.5 : 1,
                  background: solid ? D.ink : undefined,
                  backgroundImage: solid ? undefined : `linear-gradient(to bottom, ${inkA(34)} 55%, transparent 55%)`,
                  backgroundSize: "1px 6px",
                  opacity: recede(p.i),
                  transition: settle("top 220ms ease-out, height 220ms ease-out, opacity 180ms ease-out"),
                }}
              />
            );
          })}
          {pts.map((p) => {
            const lane = placed.get(p.i);
            if (lane == null) return null;
            const side: Side = p.i % 2 === 0 ? "above" : "below";
            const state = stateOf(p.i);
            return (
              <div
                key={p.e.id}
                data-moment={p.i}
                data-moment-state={state}
                className={`absolute ${live ? "cursor-pointer" : ""}`}
                style={{
                  ...FONT,
                  left: p.x + LABEL_INDENT,
                  top: labelTop(side, lane),
                  width: LABEL_W,
                  zIndex: state === "lit" ? 2 : state === "marked" ? 1 : undefined,
                  opacity: recede(p.i),
                  transition: settle("top 220ms ease-out, opacity 180ms ease-out"),
                }}
                onPointerEnter={hover(p.i)}
              >
                <Label e={p.e} scale={scale} clamps={clamps} state={state} />
              </div>
            );
          })}

          {/* Dots on the rail. */}
          {pts.map((p) => {
            if (p.x < -24 || p.x > width + 24) return null;
            const state = stateOf(p.i);
            const color = dotColors[p.i % dotColors.length]!;
            const size = state === "lit" ? 16 : state === "marked" ? 11 : p.e.highlight ? 9 : 7;
            return (
              <span
                key={`dot-${p.e.id}`}
                data-moment={p.i}
                className={`absolute flex h-[24px] w-[24px] -translate-x-1/2 -translate-y-1/2 items-center justify-center ${live ? "cursor-pointer" : ""}`}
                style={{ left: p.x, top: railY, zIndex: state === "rest" ? 1 : 3, transition: settle("") }}
                onPointerEnter={hover(p.i)}
              >
                <span
                  className="rounded-full"
                  style={{
                    width: size,
                    height: size,
                    background: state === "lit" ? D.accent : state === "marked" ? D.ink : color,
                    boxShadow:
                      state === "lit"
                        ? `0 0 0 3px ${D.raisedTop}, 0 3px 10px -1px ${D.accentShadow}`
                        : pal.halo && state === "rest"
                          ? `0 0 8px ${color}`
                          : undefined,
                    opacity: recede(p.i),
                    transition: "width 180ms ease-out, height 180ms ease-out, opacity 180ms ease-out, background-color 180ms ease-out",
                  }}
                />
              </span>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
