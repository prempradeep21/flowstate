"use client";

import type { ReactNode } from "react";
import type { ChartArtifactData } from "@/lib/chartTypes";
import { CurrentBody } from "../current";
import { compact, parseFigure, sizeFor, smoothPath, useBox, withUnit } from "../styleC/tokens";
import type { ArtifactRenderContext } from "../types";
import { BAR_VALUE_LABELS_MAX, ROLE } from "../../textSpec";
import { Swatch, V, labelStyle, useLook, type Look } from "./look";

/**
 * Kit charts. Headless — the family's header carries the title — so each
 * chart opens with its Figure (the peak, the latest, the biggest share) and a
 * Figure note saying what it is, the legend when there is more than one
 * series, then the plot. Every text is tagged with its part (textSpec.ts):
 * nothing here prints a count or a label of its own. The Look decides the
 * shape of every mark; the theme its colour.
 */

type Ctx = { ctx: ArtifactRenderContext };

function chartData(ctx: ArtifactRenderContext): ChartArtifactData | null {
  return ctx.item.payload.type === "chart" ? ctx.item.payload.data : null;
}

const svgId = (uid: string, tag: string) => `k-${tag}-${uid.replace(/[^a-z0-9]/gi, "")}`;

/** Hatch patterns for the first eight series, when the Look wants them. */
function HatchDefs({ uid, count }: { uid: string; count: number }) {
  return (
    <defs>
      {Array.from({ length: count }, (_, i) => (
        <pattern key={i} id={svgId(uid, `h${i}`)} patternUnits="userSpaceOnUse" width={6} height={6} patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={6} stroke={V.s(i)} strokeWidth={1.6} />
        </pattern>
      ))}
    </defs>
  );
}

function fillFor(look: Look, uid: string, i: number, solid: string): string {
  return look.hatch ? `url(#${svgId(uid, `h${i}`)})` : solid;
}

export function Legend({ items, align = "right" }: { items: { name: string; color: string }[]; align?: "left" | "right" }) {
  const look = useLook();
  return (
    <div data-el={ROLE.legend} className={`flex min-w-0 flex-wrap gap-x-4 gap-y-1.5 ${align === "right" ? "justify-end" : ""}`}>
      {items.map((s) => (
        <span key={s.name} className="inline-flex max-w-full items-center gap-2 text-[13px] font-medium" style={{ color: V.ink, fontFamily: look.font.body }}>
          <Swatch color={s.color} />
          <span className="truncate">{s.name}</span>
        </span>
      ))}
    </div>
  );
}

/** The opening line of a chart: a figure, then what it is. */
export function Lede({ figure, text, aside }: { figure?: string; text: ReactNode; aside?: ReactNode }) {
  const look = useLook();
  return (
    <div className="flex shrink-0 items-start justify-between gap-4">
      <div className="min-w-0">
        {figure ? (
          <p
            data-el={ROLE.figure}
            className="truncate tabular-nums"
            style={{ fontFamily: look.font.display, fontWeight: look.font.numberWeight, fontSize: 34, lineHeight: 1, letterSpacing: look.font.displayTracking, color: V.ink }}
          >
            {figure}
          </p>
        ) : null}
        <p data-el={ROLE.figureNote} className={`${figure ? "mt-1.5" : ""} line-clamp-2 text-[13.5px] font-medium leading-snug`} style={{ color: V.muted, fontFamily: look.font.body }}>
          {text}
        </p>
      </div>
      {aside ? <div className="min-w-0 shrink pt-0.5">{aside}</div> : null}
    </div>
  );
}

// ─── Bar ────────────────────────────────────────────────────────────────────

export function BarBody({ ctx }: Ctx) {
  const look = useLook();
  const d = chartData(ctx);
  const [ref, box] = useBox<HTMLDivElement>();
  if (!d || !d.categories?.length || !d.series?.length) return <CurrentBody ctx={ctx} />;

  const cats = d.categories;
  const series = d.series;
  const stacked = !!d.stacked && series.length > 1;
  const single = series.length === 1;
  const totals = cats.map((_, i) => series.reduce((s, ser) => s + (ser.data[i] ?? 0), 0));
  const metric = single ? series[0]!.data : totals;
  const peak = metric.reduce((best, v, i) => (v > (metric[best] ?? -Infinity) ? i : best), 0);
  const values = stacked ? totals : series.flatMap((s) => s.data);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...(stacked ? [0] : values));
  const span = max - min || 1;

  const n = cats.length;
  const { w, h } = box;
  const slot = w / n;
  const k = stacked || single ? 1 : series.length;
  const barW = Math.max(4, Math.min(k === 1 ? slot * 0.62 : (slot * 0.84) / k, 64));
  const gap = k === 1 ? 0 : Math.min(5, barW * 0.15);
  const capH = look.bar === "cap" ? Math.min(7, Math.max(4, barW * 0.14)) : 0;
  const zeroY = h * (max / span);
  const scale = (v: number) => (Math.abs(v) / span) * h;
  // Every category and its value up to BAR_VALUE_LABELS_MAX bars; past that, the first and last only.
  const showLabels = n <= BAR_VALUE_LABELS_MAX;
  const showValues = showLabels;
  const rx = look.bar === "pill" ? Math.min(barW / 2, 10) : look.bar === "cap" ? Math.min(6, barW / 3) : 0;
  const outlined = look.bar === "square" || look.bar === "outline";
  const uid = ctx.item.uid;

  type Bar = { x: number; y: number; w: number; h: number; i: number; si: number; peak: boolean };
  const bars: Bar[] = [];
  cats.forEach((_, i) => {
    const groupW = k * barW + (k - 1) * gap;
    let x = i * slot + (slot - groupW) / 2;
    if (stacked) {
      let acc = 0;
      series.forEach((s, si) => {
        const v = Math.max(0, s.data[i] ?? 0);
        if (v <= 0) return;
        const bh = scale(v);
        bars.push({ x, y: zeroY - scale(acc) - bh, w: barW, h: bh, i, si, peak: i === peak });
        acc += v;
      });
    } else {
      series.forEach((s, si) => {
        const v = s.data[i] ?? 0;
        const bh = scale(v);
        bars.push({ x, y: v >= 0 ? zeroY - bh : zeroY, w: barW, h: bh, i, si, peak: single && i === peak });
        x += barW + gap;
      });
    }
  });

  const colorOf = (b: Bar) => (b.peak && !stacked ? V.accent : V.s(b.si));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: look.pad }}>
      <Lede
        figure={withUnit(metric[peak]!, d.unit)}
        text={single ? `Peak, ${cats[peak]}` : `${cats[peak]} leads${stacked ? " in total" : ""}`}
        aside={!single ? <Legend items={series.map((s, i) => ({ name: s.name, color: V.s(i) }))} /> : null}
      />
      <div ref={ref} className="relative mt-4 min-h-[40px] flex-1">
        {w > 0 && h > 0 ? (
          <svg width={w} height={h} className="absolute inset-0 overflow-visible" aria-hidden>
            {look.hatch ? <HatchDefs uid={uid} count={series.length} /> : null}
            {min < 0 ? <line x1={0} x2={w} y1={zeroY} y2={zeroY} stroke={V.ink} strokeOpacity={0.3} strokeWidth={1.5} /> : null}
            {bars.map((b, i) => {
              const bh = Math.max(b.h, 2);
              const c = colorOf(b);
              return (
                <g key={i}>
                  <rect
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={bh}
                    rx={stacked ? 0 : rx}
                    fill={look.bar === "outline" ? fillFor(look, uid, b.si, "transparent") : b.peak && look.hatch ? V.accent : fillFor(look, uid, b.si, c)}
                    stroke={outlined ? (look.bar === "outline" ? c : V.ink) : stacked ? V.card : "none"}
                    strokeWidth={outlined ? look.stroke : stacked ? 1.5 : 0}
                  />
                  {capH && (!stacked || b.si === series.length - 1) ? (
                    <rect x={b.x} y={b.y} width={b.w} height={capH} rx={rx} fill={b.peak ? V.ink : V.accent} />
                  ) : null}
                </g>
              );
            })}
          </svg>
        ) : null}
      </div>
      {showLabels ? (
        <div className="mt-2.5 grid shrink-0" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {cats.map((c, i) => (
            <div key={c + i} className="flex min-w-0 flex-col items-center px-0.5 text-center">
              <span data-el={ROLE.categoryLabels} className="line-clamp-2 text-[13px] font-medium leading-tight" style={{ color: i === peak ? V.ink : V.muted, fontFamily: look.font.body }}>
                {c}
              </span>
              {showValues ? (
                <span data-el={ROLE.valueLabels} className="mt-0.5 text-[12px] tabular-nums" style={{ color: V.faint }}>
                  {withUnit(metric[i]!, d.unit)}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div data-el={ROLE.categoryLabels} className="mt-2.5 flex shrink-0 justify-between gap-6" style={labelStyle(look)}>
          <span className="min-w-0 truncate">{cats[0]}</span>
          <span className="min-w-0 truncate text-right">{cats[n - 1]}</span>
        </div>
      )}
    </div>
  );
}

// ─── Line ───────────────────────────────────────────────────────────────────

export function LineBody({ ctx }: Ctx) {
  const look = useLook();
  const d = chartData(ctx);
  const [ref, box] = useBox<HTMLDivElement>();
  if (!d || !d.categories?.length || !d.series?.length) return <CurrentBody ctx={ctx} />;

  const cats = d.categories;
  const series = d.series;
  const main = series[0]!.data;
  const last = main[main.length - 1]!;
  const first = main[0]!;
  const change = first !== 0 ? Math.round(((last - first) / Math.abs(first)) * 100) : null;
  const all = series.flatMap((s) => s.data);
  const max = Math.max(...all);
  const min = Math.min(...all);
  const span = max - min || 1;
  const peak = main.reduce((best, v, i) => (v > main[best]! ? i : best), 0);

  const { w, h } = box;
  const padX = 8;
  const padY = 14;
  const xOf = (i: number) => padX + (i * (w - padX * 2)) / Math.max(1, cats.length - 1);
  const yOf = (v: number) => padY + (1 - (v - min) / span) * (h - padY * 2);
  const gridRows = 3;
  const dashed = look.rule === "dashed";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: look.pad }}>
      <Lede
        figure={withUnit(last, d.unit)}
        text={
          <>
            {series[0]!.name}, {cats[cats.length - 1]}
            {change != null ? (
              <span style={{ color: change >= 0 ? V.pos : V.neg }}>
                {" "}
                {change >= 0 ? "▲" : "▼"} {Math.abs(change)}%
              </span>
            ) : null}
          </>
        }
        aside={series.length > 1 ? <Legend items={series.map((s, i) => ({ name: s.name, color: V.s(i) }))} /> : null}
      />
      <div ref={ref} className="relative mt-4 min-h-[50px] flex-1">
        {w > 0 && h > 0 ? (
          <svg width={w} height={h} className="absolute inset-0 overflow-visible" aria-hidden>
            {Array.from({ length: gridRows + 1 }, (_, i) => {
              const y = padY + (i * (h - padY * 2)) / gridRows;
              return <line key={i} x1={0} x2={w} y1={y} y2={y} stroke={V.hair} strokeWidth={1} strokeDasharray={dashed ? "3 4" : undefined} />;
            })}
            {series.map((s, si) => {
              const pts = s.data.map((v, i) => ({ x: xOf(i), y: yOf(v) }));
              return (
                <path
                  key={s.name}
                  d={d.smooth === false || look.bar === "square" ? pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ") : smoothPath(pts)}
                  fill="none"
                  stroke={V.s(si)}
                  strokeWidth={si === 0 ? 2.5 + look.stroke * 0.4 : 2}
                  strokeLinecap={look.bar === "square" ? "square" : "round"}
                  strokeLinejoin={look.bar === "square" ? "miter" : "round"}
                  strokeDasharray={si > 0 && look.hatch ? "6 5" : undefined}
                />
              );
            })}
            {(() => {
              const p = { x: xOf(peak), y: yOf(main[peak]!) };
              const r = 5 + look.stroke;
              return look.legend === "square" ? (
                <rect x={p.x - r} y={p.y - r} width={r * 2} height={r * 2} fill={V.accent} stroke={V.ink} strokeWidth={look.stroke} />
              ) : (
                <circle cx={p.x} cy={p.y} r={r} fill={V.accent} stroke={V.card} strokeWidth={2.5} />
              );
            })()}
          </svg>
        ) : null}
      </div>
      <div data-el={ROLE.axisLabels} className="mt-2 flex shrink-0 justify-between gap-6" style={labelStyle(look)}>
        <span className="min-w-0 truncate">{cats[0]}</span>
        {cats.length > 4 ? <span className="min-w-0 truncate">{cats[Math.floor(cats.length / 2)]}</span> : null}
        <span className="min-w-0 truncate text-right">{cats[cats.length - 1]}</span>
      </div>
    </div>
  );
}

// ─── Area ───────────────────────────────────────────────────────────────────

export function AreaBody({ ctx }: Ctx) {
  const look = useLook();
  const d = chartData(ctx);
  const [ref, box] = useBox<HTMLDivElement>();
  if (!d || !d.categories?.length || !d.series?.length) return <CurrentBody ctx={ctx} />;

  const cats = d.categories;
  const series = d.series;
  const stacked = !!d.stacked;
  const main = series[0]!.data;
  const last = main[main.length - 1]!;
  const first = main[0]!;
  const change = first !== 0 ? Math.round(((last - first) / Math.abs(first)) * 100) : null;
  const layers = series.map((s, si) =>
    s.data.map((v, i) => (stacked ? series.slice(0, si + 1).reduce((acc, x) => acc + (x.data[i] ?? 0), 0) : v)),
  );
  const max = Math.max(...layers.flat(), 0) || 1;
  const { w, h } = box;
  const xOf = (i: number) => (i * w) / Math.max(1, cats.length - 1);
  const yOf = (v: number) => h - (v / max) * (h * 0.9);
  const order = layers
    .map((l, i) => ({ i, sum: l.reduce((a, b) => a + b, 0) }))
    .sort((a, b) => (stacked ? b.i - a.i : b.sum - a.sum));
  const uid = ctx.item.uid;
  const gid = svgId(uid, "area");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${look.pad}px ${look.pad}px 0` }}>
      <Lede
        figure={withUnit(last, d.unit)}
        text={
          <>
            {series[0]!.name}, {cats[cats.length - 1]}
            {change != null ? (
              <span style={{ color: change >= 0 ? V.pos : V.neg }}>
                {" "}
                {change >= 0 ? "▲" : "▼"} {Math.abs(change)}% since {cats[0]}
              </span>
            ) : null}
          </>
        }
        aside={series.length > 1 ? <Legend items={series.map((s, i) => ({ name: s.name, color: V.s(i) }))} /> : null}
      />
      <div ref={ref} className="relative mt-3 min-h-[50px] flex-1" style={{ margin: `12px -${look.pad}px 0` }}>
        {w > 0 && h > 0 ? (
          <svg width={w} height={h} className="absolute inset-0" aria-hidden>
            <defs>
              {series.map((_, i) => (
                <linearGradient key={i} id={`${gid}-${i}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor={V.s(i)} stopOpacity={look.hatch ? 0 : 0.85} />
                  <stop offset="1" stopColor={V.s(i)} stopOpacity={look.hatch ? 0 : 0.25} />
                </linearGradient>
              ))}
            </defs>
            {look.hatch ? <HatchDefs uid={uid} count={series.length} /> : null}
            {order.map(({ i }) => {
              const pts = layers[i]!.map((v, j) => ({ x: xOf(j), y: yOf(v) }));
              const line = look.bar === "square" ? pts.map((p, j) => `${j ? "L" : "M"}${p.x},${p.y}`).join(" ") : smoothPath(pts);
              return (
                <g key={i}>
                  <path d={`${line} L${w},${h} L0,${h} Z`} fill={look.hatch ? `url(#${svgId(uid, `h${i}`)})` : `url(#${gid}-${i})`} />
                  <path d={line} fill="none" stroke={V.s(i)} strokeWidth={2.5} strokeLinejoin={look.bar === "square" ? "miter" : "round"} />
                </g>
              );
            })}
          </svg>
        ) : null}
        <div data-el={ROLE.axisLabels} className="absolute inset-x-0 bottom-0 flex justify-between px-4 pb-3" style={labelStyle(look, 11, V.ink)}>
          <span>{cats[0]}</span>
          <span>{cats[cats.length - 1]}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Pie ────────────────────────────────────────────────────────────────────

function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const p = (r: number, a: number) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p(r1, a0)} A${r1},${r1} 0 ${large} 1 ${p(r1, a1)} L${p(r0, a1)} A${r0},${r0} 0 ${large} 0 ${p(r0, a0)} Z`;
}

export function PieBody({ ctx }: Ctx) {
  const look = useLook();
  const d = chartData(ctx);
  const [ref, box] = useBox<HTMLDivElement>();
  const raw = d?.slices?.length
    ? d.slices
    : d?.categories?.map((name, i) => ({ name, value: d.series?.[0]?.data[i] ?? 0 })) ?? [];
  if (!d || raw.length === 0) return <CurrentBody ctx={ctx} />;

  const sorted = [...raw].sort((a, b) => b.value - a.value);
  const slices = sorted.length > 7 ? [...sorted.slice(0, 6), { name: "Other", value: sorted.slice(6).reduce((s, x) => s + x.value, 0) }] : sorted;
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const pct = (v: number) => `${Math.round((v / total) * 100)}%`;
  const uid = ctx.item.uid;

  const { w, h } = box;
  const size = Math.max(0, Math.min(h, w * 0.46));
  const r1 = size / 2;
  const r0 = r1 * (look.bar === "cap" ? 0.68 : 0.58);
  // A gap between slices, as a stroke in the card colour (the bento's split ring).
  const gapStroke = look.bar === "cap" ? 5 : look.bar === "square" || look.bar === "outline" ? look.stroke : 2;
  let a = -Math.PI / 2;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: look.pad }}>
      {/* The figure sits in the ring's centre; the lede is only what it is. */}
      <Lede text={`${slices[0]!.name} — the largest of ${raw.length}`} />
      <div ref={ref} className="mt-4 flex min-h-0 flex-1 items-center gap-6">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          {size > 0 ? (
            <svg width={size} height={size} aria-hidden className="overflow-visible">
              {look.hatch ? <HatchDefs uid={uid} count={slices.length} /> : null}
              {slices.map((s, i) => {
                const sweep = (s.value / total) * Math.PI * 2;
                const path = arcPath(r1, r1, r0, r1, a, a + sweep - 0.0001);
                a += sweep;
                return (
                  <path
                    key={s.name}
                    d={path}
                    fill={i === 0 && look.hatch ? V.accent : fillFor(look, uid, i, i === 0 ? V.accent : V.s(i))}
                    stroke={look.bar === "square" || look.bar === "outline" ? V.ink : V.card}
                    strokeWidth={gapStroke}
                    strokeLinejoin={look.bar === "square" ? "miter" : "round"}
                  />
                );
              })}
            </svg>
          ) : null}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              data-el={ROLE.figure}
              className="tabular-nums"
              style={{ fontFamily: look.font.display, fontWeight: look.font.numberWeight, fontSize: Math.max(18, r0 * 0.58), lineHeight: 1, letterSpacing: look.font.displayTracking, color: V.ink }}
            >
              {pct(slices[0]!.value)}
            </span>
          </div>
        </div>
        <ul className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          {slices.map((s, i) => (
            <li key={s.name} className="flex items-center gap-2.5 text-[14px] leading-tight" style={{ color: V.ink, fontFamily: look.font.body }}>
              <Swatch color={i === 0 ? V.accent : V.s(i)} />
              <span data-el={ROLE.sliceLabels} className="min-w-0 flex-1 truncate font-medium">
                {s.name}
              </span>
              <span data-el={ROLE.sliceValues} className="tabular-nums" style={{ color: V.muted }}>
                {pct(s.value)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Gauge ──────────────────────────────────────────────────────────────────

export function GaugeBody({ ctx }: Ctx) {
  const look = useLook();
  const d = chartData(ctx);
  const [ref, box] = useBox<HTMLDivElement>();
  if (!d || d.gaugeValue == null) return <CurrentBody ctx={ctx} />;

  const maxV = d.gaugeMax ?? 100;
  const frac = Math.max(0, Math.min(1, d.gaugeValue / (maxV || 1)));
  const isPct = d.unit === "%" || maxV === 100;
  const valueText = isPct ? `${compact(d.gaugeValue)}%` : withUnit(d.gaugeValue, d.unit);
  // The note is the gauge's label; without one, the scale is what the figure is "of".
  const ofMax = `of ${withUnit(maxV, d.unit)}`;
  const note = d.gaugeLabel?.trim() || ofMax;
  const ofUnderFigure = !isPct && note !== ofMax;

  // A three-quarter arc, open at the bottom.
  const size = Math.max(0, Math.min(box.w, box.h * 1.15));
  const r = size / 2;
  const stroke = Math.max(10, r * 0.22);
  const rr = r - stroke / 2;
  const start = Math.PI * 0.75;
  const sweep = Math.PI * 1.5;
  const arc = (from: number, to: number) => {
    const p = (a: number) => `${r + rr * Math.cos(a)},${r + rr * Math.sin(a)}`;
    const large = to - from > Math.PI ? 1 : 0;
    return `M${p(from)} A${rr},${rr} 0 ${large} 1 ${p(to)}`;
  };
  const cap = look.bar === "pill" || look.bar === "cap" ? "round" : "butt";
  const segments = look.rule === "dashed" ? 24 : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: look.pad }}>
      <p data-el={ROLE.figureNote} className="shrink-0" style={labelStyle(look, 12)}>
        {note}
      </p>
      <div ref={ref} className="relative mt-2 flex min-h-0 flex-1 items-center justify-center">
        {size > 0 ? (
          <svg width={size} height={size * 0.88} viewBox={`0 0 ${size} ${size * 0.88}`} aria-hidden className="overflow-visible">
            {segments ? (
              Array.from({ length: segments }, (_, i) => {
                const a0 = start + (i / segments) * sweep;
                const a1 = start + ((i + 0.6) / segments) * sweep;
                const lit = (i + 0.3) / segments <= frac;
                return <path key={i} d={arc(a0, a1)} fill="none" stroke={lit ? V.accent : V.well} strokeWidth={stroke} />;
              })
            ) : (
              <>
                <path d={arc(start, start + sweep)} fill="none" stroke={look.hatch ? V.hair : V.well} strokeWidth={stroke} strokeLinecap={cap} />
                {frac > 0 ? <path d={arc(start, start + sweep * frac)} fill="none" stroke={V.accent} strokeWidth={stroke} strokeLinecap={cap} /> : null}
                {look.bar === "square" || look.bar === "outline" ? (
                  <path d={arc(start, start + sweep)} fill="none" stroke={V.ink} strokeWidth={look.stroke} strokeLinecap={cap} transform={`translate(0,0)`} opacity={0.0} />
                ) : null}
              </>
            )}
          </svg>
        ) : null}
        <div data-el={ROLE.figure} className="absolute inset-0 flex flex-col items-center justify-center pt-3 text-center">
          <span
            className="tabular-nums"
            style={{ fontFamily: look.font.display, fontWeight: look.font.numberWeight, fontSize: Math.max(26, (r - stroke) * 0.6), lineHeight: 1, letterSpacing: look.font.displayTracking, color: V.ink }}
          >
            {valueText}
          </span>
          {ofUnderFigure ? (
            <span className="mt-1.5 text-[12px] font-medium" style={{ color: V.muted }}>
              {ofMax}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Stat ───────────────────────────────────────────────────────────────────

export function StatBody({ ctx }: Ctx) {
  const look = useLook();
  const payload = ctx.item.payload;
  if (payload.type !== "stat") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const phrase = d.unit && `${d.value} ${d.unit}`.length <= 12 ? `${d.value} ${d.unit}` : d.value;
  const splitUnit = phrase === d.value && d.unit;
  // With the was/now bars below, a short card gives the figure less height so the note keeps its line.
  const valueSize = Math.min(sizeFor(phrase, [[4, 72], [7, 60], [11, 46], [16, 34]], 26), d.delta ? Math.max(34, Math.round((ctx.item.natural.h - 150) * 0.5)) : 72);
  const from = d.delta ? parseFigure(d.delta.from) : null;
  const to = d.delta ? parseFigure(d.delta.to) : null;
  const barMax = from != null && to != null ? Math.max(Math.abs(from), Math.abs(to)) : null;
  const fromShare = barMax ? Math.max(0.03, Math.abs(from!) / barMax) : null;
  const toShare = barMax ? Math.max(0.03, Math.abs(to!) / barMax) : null;
  const barRadius = look.bar === "pill" || look.bar === "cap" ? 999 : 2;

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden" style={{ padding: `${look.pad - 4}px ${look.pad}px ${look.pad - 6}px` }}>
      <div className="min-h-0 shrink overflow-hidden">
        <div data-el={ROLE.figure}>
          <p
            className="tabular-nums"
            style={{ fontFamily: look.font.display, fontWeight: look.font.numberWeight, fontSize: valueSize, lineHeight: 1, letterSpacing: look.font.displayTracking, color: V.ink, textWrap: "balance" }}
          >
            {phrase}
          </p>
          {splitUnit ? (
            <p className="mt-1.5 text-[15px] font-semibold" style={{ color: V.ink }}>
              {d.unit}
            </p>
          ) : null}
        </div>
        <p data-el={ROLE.figureNote} className="mt-2 line-clamp-2 text-[14px] font-medium leading-snug" style={{ color: V.ink, fontFamily: look.font.body }}>
          {d.label}
        </p>
      </div>
      {d.delta && fromShare != null && toShare != null ? (
        <div className="mt-3 shrink-0 space-y-1.5">
          {[
            { role: ROLE.was, label: d.delta.from, share: fromShare, bg: V.well, fg: V.muted },
            { role: ROLE.now, label: d.delta.to, share: toShare, bg: V.accent, fg: V.ink },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-3">
              <span data-el={row.role} className="w-16 shrink-0 truncate text-[12px] font-semibold tabular-nums" style={{ color: row.fg }}>
                {row.label}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block h-3"
                  style={{
                    width: `${row.share * 100}%`,
                    background: look.hatch && i === 0 ? "transparent" : row.bg,
                    borderRadius: barRadius,
                    boxShadow: look.bar === "square" || look.bar === "outline" ? `inset 0 0 0 ${look.stroke}px ${V.ink}` : undefined,
                    backgroundImage: look.hatch && i === 0 ? `repeating-linear-gradient(135deg, ${V.muted} 0 1.5px, transparent 1.5px 4px)` : undefined,
                  }}
                />
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
