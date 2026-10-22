"use client";

import { PRIMARY } from "../fonts";
import type { ChartArtifactData } from "@/lib/chartTypes";
import { CurrentBody } from "../current";
import type { ArtifactRenderContext } from "../types";
import { useHugs } from "../hug";
import { BAR_VALUE_LABELS_MAX, ROLE } from "../textSpec";
import {
  C,
  Diamond,
  Display,
  KICKER_PART,
  Kicker,
  INSET,
  PAD,
  PAD_Y,
  ROW,
  SECTION,
  SURFACE_BG,
  compact,
  parseFigure,
  seriesRamp,
  sizeFor,
  smoothPath,
  splitTitle,
  tint,
  useBox,
  withUnit,
} from "./tokens";

/**
 * Charts in Style C have no title bar: the title is set as the chart's own
 * headline, and a computed line under it says what the chart shows (the peak,
 * the low, the share), which is also the one mark painted orange.
 */

type Ctx = { ctx: ArtifactRenderContext };

/** The least height a chart's graph is drawn at — long titles grow the card, never squeeze the graph. */
const GRAPH_MIN = 200;

function chartData(ctx: ArtifactRenderContext): ChartArtifactData | null {
  return ctx.item.payload.type === "chart" ? ctx.item.payload.data : null;
}

function LegendDots({ items, align = "center" }: { items: { name: string; color: string }[]; align?: "center" | "left" }) {
  return (
    <div data-el={ROLE.legend} className={`flex flex-wrap gap-x-6 gap-y-1 ${align === "center" ? "justify-center" : ""}`}>
      {items.map((s) => (
        <span key={s.name} className="inline-flex items-center gap-2 text-[17px] font-medium leading-tight" style={{ color: C.ink }}>
          <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: s.color, boxShadow: s.color === C.pure || s.color === C.white ? `inset 0 0 0 1px ${C.hair}` : undefined }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

/**
 * A centred chart headline: the title's lead and head set large, any range or
 * second idea from the same title quieter underneath — all one Title part.
 */
function ChartTitle({ title, sizes, fallback }: { title: string; sizes: [number, number][]; fallback: number }) {
  const t = splitTitle(title);
  const head = t.lead ? `${t.lead}: ${t.head}` : t.head;
  const rest = [t.sub, t.range].filter(Boolean).join(" · ");
  return (
    <div data-el={ROLE.title} className="flex flex-col items-center gap-2 text-center">
      <Display size={sizeFor(t.head, sizes, fallback)} align="center">
        {head}
      </Display>
      {rest ? (
        <p className="text-[15px] font-medium leading-snug" style={{ color: C.ink }}>
          {rest}
        </p>
      ) : null}
    </div>
  );
}

// ─── Bar ────────────────────────────────────────────────────────────────────

/** "Go give your team a high five" — headline, an insight line, legend, then bars. */
export function BarBody({ ctx }: Ctx) {
  const d = chartData(ctx);
  const [ref, box] = useBox<HTMLDivElement>();
  if (!d || !d.categories?.length || !d.series?.length) return <CurrentBody ctx={ctx} />;

  const cats = d.categories;
  const series = d.series;
  const t = splitTitle(ctx.item.artifact.title);
  const stacked = !!d.stacked && series.length > 1;
  const ramp = seriesRamp("lime");
  const single = series.length === 1;

  const totals = cats.map((_, i) => series.reduce((s, ser) => s + (ser.data[i] ?? 0), 0));
  const metric = single ? series[0]!.data : totals;
  const peak = metric.reduce((best, v, i) => (v > (metric[best] ?? -Infinity) ? i : best), 0);

  // The headline figure is the bar the orange mark sits on: the peak, or the leading column's total.
  const figure = withUnit(metric[peak]!, d.unit);
  const insight = single ? `Peak, in ${cats[peak]}` : stacked ? `${cats[peak]} leads` : `${cats[peak]} leads in total`;

  const values = stacked ? totals : series.flatMap((s) => s.data);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...(stacked ? [0] : values));
  const span = max - min || 1;

  const n = cats.length;
  const { w, h } = box;
  const slot = w / n;
  const k = stacked || single ? 1 : series.length;
  const barW = Math.max(4, Math.min(k === 1 ? slot * 0.64 : (slot * 0.84) / k, 72));
  const gap = k === 1 ? 0 : Math.min(6, barW * 0.15);
  /** Headroom over the tallest column for its value. */
  const head = n <= BAR_VALUE_LABELS_MAX && series.length > 1 ? 22 : 0;
  const plotH = Math.max(0, h - head);
  const zeroY = head + plotH * (max / span);
  const scale = (v: number) => (Math.abs(v) / span) * plotH;
  const showLabels = n <= 8;
  const showValues = n <= BAR_VALUE_LABELS_MAX;
  /** Grouped bars carry their values on the bars, stacked columns their totals on top; a single series under the name. */
  const valuesOnBars = showValues && !single;

  const bars: { x: number; y: number; w: number; h: number; fill: string; v: number }[] = [];
  /** Stacked columns: the whole column is one rounded shape; segments are cut from it. */
  const columns: { x: number; y: number; w: number; h: number }[] = [];
  cats.forEach((_, i) => {
    const groupW = k * barW + (k - 1) * gap;
    let x = i * slot + (slot - groupW) / 2;
    if (stacked) {
      let acc = 0;
      series.forEach((s, si) => {
        const v = Math.max(0, s.data[i] ?? 0);
        if (v <= 0) return;
        const bh = scale(v);
        bars.push({ x, y: zeroY - scale(acc) - bh, w: barW, h: bh, fill: ramp[si % ramp.length]!, v });
        acc += v;
      });
      columns.push({ x, y: zeroY - scale(acc), w: barW, h: scale(acc) });
    } else {
      series.forEach((s, si) => {
        const v = s.data[i] ?? 0;
        const bh = scale(v);
        const fill = single ? (i === peak ? C.orange : C.ink) : ramp[si % ramp.length]!;
        bars.push({ x, y: v >= 0 ? zeroY - bh : zeroY, w: barW, h: bh, fill, v });
        x += barW + gap;
      });
    }
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: INSET }}>
      <div className="flex shrink-0 flex-col items-center gap-4 text-center">
        <ChartTitle title={ctx.item.artifact.title} sizes={[[20, 40], [30, 35], [44, 31]]} fallback={27} />
        <div className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-4" style={{ background: tint(C.ink, 7) }}>
          <span
            data-el={ROLE.figure}
            className="rounded-full px-3.5 py-0.5 text-[23px] font-medium leading-tight tracking-[-0.02em] tabular-nums"
            style={{ fontFamily: PRIMARY, background: C.orange, color: C.onBright }}
          >
            {figure}
          </span>
          <span data-el={ROLE.figureNote} className="text-[17px] font-medium" style={{ color: C.ink }}>
            {insight}
          </span>
        </div>
        {!single ? (
          <div className="mt-1">
            <LegendDots items={series.map((s, i) => ({ name: s.name, color: ramp[i % ramp.length]! }))} />
          </div>
        ) : null}
      </div>
      <div ref={ref} className={`relative flex-1 ${single ? "mt-9" : "mt-7"}`} style={{ minHeight: GRAPH_MIN }}>
        {w > 0 && h > 0 ? (
          <svg width={w} height={h} className="absolute inset-0 overflow-visible" aria-hidden>
            {min < 0 ? <line x1={0} x2={w} y1={zeroY} y2={zeroY} stroke={C.ink} strokeOpacity={0.25} strokeWidth={1.5} /> : null}
            {stacked ? (
              <>
                <defs>
                  {columns.map((c, i) => (
                    <clipPath key={i} id={`sc-col-${ctx.item.uid.replace(/[^a-z0-9]/gi, "")}-${i}`}>
                      <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={Math.min(12, c.w / 2.5)} />
                    </clipPath>
                  ))}
                </defs>
                {columns.map((c, i) => (
                  <g key={i} clipPath={`url(#sc-col-${ctx.item.uid.replace(/[^a-z0-9]/gi, "")}-${i})`}>
                    {bars
                      .filter((b) => b.x === c.x)
                      .map((b, j) => (
                        <rect key={j} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.fill} stroke={C.lime} strokeWidth={2.5} />
                      ))}
                  </g>
                ))}
              </>
            ) : (
              bars.map((b, i) => (
                <rect key={i} x={b.x} y={b.y} width={b.w} height={Math.max(b.h, 2)} rx={Math.min(9, b.w / 2, Math.max(b.h, 2) / 2)} fill={b.fill} />
              ))
            )}
            {valuesOnBars && stacked ? (
              <g data-el={ROLE.valueLabels}>
                {columns.map((c, i) => (
                  <text
                    key={i}
                    x={c.x + c.w / 2}
                    y={c.y - 7}
                    textAnchor="middle"
                    fontSize={14}
                    fontWeight={500}
                    fill={C.ink}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {compact(totals[i]!)}
                  </text>
                ))}
              </g>
            ) : valuesOnBars ? (
              <g data-el={ROLE.valueLabels}>
                {bars.map((b, i) => (
                  <text
                    key={i}
                    x={b.x + b.w / 2}
                    y={b.v >= 0 ? b.y - 7 : b.y + b.h + 16}
                    textAnchor="middle"
                    fontSize={14}
                    fontWeight={500}
                    fill={C.ink}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {compact(b.v)}
                  </text>
                ))}
              </g>
            ) : null}
          </svg>
        ) : null}
      </div>
      {showLabels ? (
        <div className="mt-5 grid shrink-0" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {cats.map((c, i) => (
            <div key={c + i} className="flex min-w-0 flex-col items-center px-0.5 text-center">
              <span data-el={ROLE.categoryLabels} className="text-[18px] font-medium leading-tight" style={{ color: C.ink }}>
                {c}
              </span>
              {showValues && !valuesOnBars ? (
                <span data-el={ROLE.valueLabels} className="mt-1.5 text-[16px] font-medium tabular-nums" style={{ color: C.ink }}>
                  {withUnit(metric[i]!, d.unit)}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        // Too many bars to name each: name the ends, the insight line names the peak.
        <div data-el={ROLE.categoryLabels} className="mt-5 flex shrink-0 justify-between gap-6 text-[17px] font-medium" style={{ color: C.ink }}>
          <span className="min-w-0">{cats[0]}</span>
          <span className="min-w-0 text-right">{cats[n - 1]}</span>
        </div>
      )}
    </div>
  );
}

// ─── Line ───────────────────────────────────────────────────────────────────

function Sparkle({ color = C.orange }: { color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden className="shrink-0">
      <path d="M9 2.5c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6Z" fill={color} />
      <path d="M17 12.5v5M14.5 15h5M17 3v3M15.5 4.5h3" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * "Thomas Smith" — a centred headline over a line that runs off both edges of
 * the card, with one callout bubble pinned to the point the title is about.
 */
export function LineBody({ ctx }: Ctx) {
  const d = chartData(ctx);
  const [ref, box] = useBox<HTMLDivElement>();
  if (!d || !d.categories?.length || !d.series?.length) return <CurrentBody ctx={ctx} />;

  const cats = d.categories;
  const series = d.series;
  const main = series[0]!.data;
  const rising = (main[main.length - 1] ?? 0) >= (main[0] ?? 0);
  const focus = main.reduce(
    (best, v, i) => (rising ? v > main[best]! : v < main[best]!) ? i : best,
    0,
  );
  const all = series.flatMap((s) => s.data);
  const max = Math.max(...all);
  const min = Math.min(...all);
  const span = max - min || 1;

  const { w, h } = box;
  const inset = 30;
  // A peak's callout sits above it, a low point's below — the line takes the other half.
  const top = rising ? h * 0.4 : h * 0.1;
  const bottom = rising ? h * 0.2 : h * 0.44;
  const xOf = (i: number) => inset + (i * (w - inset * 2)) / Math.max(1, cats.length - 1);
  const yOf = (v: number) => top + (1 - (v - min) / span) * (h - top - bottom);
  const lineColors = [C.ink, C.lime, C.pure];

  const fp = { x: xOf(focus), y: yOf(main[focus]!) };
  const bubbleW = Math.min(350, w - 32);
  const bubbleLeft = Math.max(16, Math.min(w - bubbleW - 16, fp.x - bubbleW / 2));
  const bubbleAbove = rising;
  const first = main[0]!;
  const delta = first !== 0 ? Math.round(((main[focus]! - first) / Math.abs(first)) * 100) : null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col items-center gap-4 text-center" style={{ padding: `${PAD_Y}px ${PAD}px 14px` }}>
        <ChartTitle title={ctx.item.artifact.title} sizes={[[20, 40], [32, 35], [46, 30]]} fallback={27} />
        {series.length > 1 ? (
          <LegendDots items={series.map((s, i) => ({ name: s.name, color: lineColors[i % lineColors.length]! }))} />
        ) : null}
      </div>
      <div ref={ref} className="relative flex-1" style={{ minHeight: GRAPH_MIN + 60 }}>
        {w > 0 && h > 0 ? (
          <>
            <svg width={w} height={h} className="absolute inset-0" aria-hidden>
              {series.map((s, si) => {
                const pts = s.data.map((v, i) => ({ x: xOf(i), y: yOf(v) }));
                // Run the line off both edges, as in the reference.
                const ext = [{ x: -4, y: pts[0]!.y }, ...pts, { x: w + 4, y: pts[pts.length - 1]!.y }];
                return (
                  <path
                    key={s.name}
                    d={smoothPath(ext)}
                    fill="none"
                    stroke={lineColors[si % lineColors.length]}
                    strokeWidth={si === 0 ? 4 : 3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}
              <circle cx={fp.x} cy={fp.y} r={9} fill={C.pure} stroke={C.ink} strokeWidth={3.5} />
            </svg>
            <div
              className="absolute flex items-start gap-3 rounded-[20px] px-4 py-3"
              style={{
                left: bubbleLeft,
                width: bubbleW,
                background: SURFACE_BG.lime,
                ...(bubbleAbove ? { bottom: h - fp.y + 22 } : { top: fp.y + 22 }),
              }}
            >
              <Sparkle />
              <div className="min-w-0">
                <p data-el={ROLE.figure} className="text-[20px] font-medium leading-tight" style={{ color: C.ink }}>
                  {rising ? "Peak" : "Low point"}: {withUnit(main[focus]!, d.unit)}
                </p>
                <p data-el={ROLE.figureNote} className="mt-1 text-[17px] font-medium leading-snug" style={{ color: C.ink }}>
                  In {cats[focus]}
                  {delta != null && focus !== 0 ? `, ${delta >= 0 ? "up" : "down"} ${Math.abs(delta)}% from ${cats[0]}` : ""}.
                </p>
              </div>
              <span
                aria-hidden
                className="absolute h-3.5 w-3.5 rotate-45"
                style={{
                  background: SURFACE_BG.lime,
                  left: Math.max(18, Math.min(bubbleW - 32, fp.x - bubbleLeft - 7)),
                  ...(bubbleAbove ? { bottom: -6 } : { top: -6 }),
                }}
              />
            </div>
            {[0, cats.length - 1].map((i) => {
              const y = yOf(main[i]!);
              return (
                <span
                  key={i}
                  data-el={ROLE.axisLabels}
                  className="absolute text-[17px] font-medium tabular-nums"
                  style={{
                    color: C.ink,
                    top: Math.max(2, Math.min(h - 26, rising ? y + 16 : y - 40)),
                    ...(i === 0 ? { left: inset - 6 } : { right: inset - 6 }),
                  }}
                >
                  {cats[i]}
                </span>
              );
            })}
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Area ───────────────────────────────────────────────────────────────────

/** "Total Spend" turned into a trend: label, big latest value, change, then the area bleeding off the bottom. */
export function AreaBody({ ctx }: Ctx) {
  const d = chartData(ctx);
  const [ref, box] = useBox<HTMLDivElement>();
  if (!d || !d.categories?.length || !d.series?.length) return <CurrentBody ctx={ctx} />;

  const cats = d.categories;
  const series = d.series;
  const t = splitTitle(ctx.item.artifact.title);
  const main = series[0]!.data;
  const last = main[main.length - 1]!;
  const first = main[0]!;
  const change = first !== 0 ? Math.round(((last - first) / Math.abs(first)) * 100) : null;
  const stacked = !!d.stacked;

  const layers = series.map((s, si) =>
    s.data.map((v, i) => (stacked ? series.slice(0, si + 1).reduce((acc, x) => acc + (x.data[i] ?? 0), 0) : v)),
  );
  const max = Math.max(...layers.flat(), 0) || 1;
  const { w, h } = box;
  const xOf = (i: number) => (i * w) / Math.max(1, cats.length - 1);
  const yOf = (v: number) => h - (v / max) * (h * 0.86);
  const fills = [
    { fill: C.lime, stroke: C.ink },
    { fill: C.blue, stroke: C.blueDeep },
    { fill: tint(C.orange, 45, C.white), stroke: C.orange },
  ];
  // Draw the biggest layer first so the smaller one stays visible on top.
  const order = layers
    .map((l, i) => ({ i, sum: l.reduce((a, b) => a + b, 0) }))
    .sort((a, b) => (stacked ? b.i - a.i : b.sum - a.sum));

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-start justify-between gap-5" style={{ padding: `${PAD_Y}px ${PAD}px 0` }}>
        <div className="min-w-0">
          <div data-el={ROLE.title}>
            <Kicker color={C.ink} size={17}>
              {[t.lead ? `${t.lead}: ${t.head}` : t.head, t.sub, t.range].filter(Boolean).join(" · ")}
            </Kicker>
          </div>
          <p data-el={ROLE.figure} className="mt-2.5 font-medium leading-none tracking-[-0.035em] tabular-nums" style={{ fontFamily: PRIMARY, fontSize: 60, color: C.ink }}>
            {withUnit(last, d.unit)}
          </p>
          <div data-el={ROLE.figureNote} className="mt-5">
            <Kicker size={KICKER_PART} icon={change != null ? <Diamond color={change >= 0 ? C.ink : C.orange} /> : undefined}>
              {series[0]!.name} in {cats[cats.length - 1]}
              {change != null ? ` · ${change >= 0 ? "up" : "down"} ${Math.abs(change)}% since ${cats[0]}` : ""}
            </Kicker>
          </div>
        </div>
        {series.length > 1 ? (
          <div data-el={ROLE.legend} className="flex max-w-[40%] shrink-0 flex-col items-end gap-2.5 pt-1">
            {series.map((s, i) => (
              <span key={s.name} className="inline-flex items-center gap-2 text-[17px] font-medium leading-tight" style={{ color: C.ink }}>
                {s.name}
                <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: fills[i % 3]!.fill, boxShadow: `inset 0 0 0 2px ${fills[i % 3]!.stroke}` }} />
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div ref={ref} className="relative flex-1" style={{ marginTop: SECTION + 4, minHeight: GRAPH_MIN }}>
        {w > 0 && h > 0 ? (
          <svg width={w} height={h} className="absolute inset-0" aria-hidden>
            {order.map(({ i }) => {
              const pts = layers[i]!.map((v, j) => ({ x: xOf(j), y: yOf(v) }));
              const line = smoothPath(pts);
              const f = fills[i % fills.length]!;
              return (
                <g key={i}>
                  <path d={`${line} L${w},${h} L0,${h} Z`} fill={f.fill} />
                  <path d={line} fill="none" stroke={f.stroke} strokeWidth={3.5} strokeLinejoin="round" />
                </g>
              );
            })}
          </svg>
        ) : null}
        {/* The ends sit on the bright fills, so they take the dark ink in both modes. */}
        <div data-el={ROLE.axisLabels} className="absolute inset-x-0 bottom-0 flex justify-between px-6 pb-5 text-[16px] font-medium" style={{ color: C.onBright }}>
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

/** "Health Score" as a split: headline, a donut that names its biggest part, and the parts beside it. */
export function PieBody({ ctx }: Ctx) {
  const d = chartData(ctx);
  const [ref, box] = useBox<HTMLDivElement>();
  const raw = d?.slices?.length
    ? d.slices
    : d?.categories?.map((name, i) => ({ name, value: d.series?.[0]?.data[i] ?? 0 })) ?? [];
  if (!d || raw.length === 0) return <CurrentBody ctx={ctx} />;

  const sorted = [...raw].sort((a, b) => b.value - a.value);
  const slices = sorted.length > 7 ? [...sorted.slice(0, 6), { name: "Other", value: sorted.slice(6).reduce((s, x) => s + x.value, 0) }] : sorted;
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const colors = [C.ink, C.blueDeep, C.white, C.q1, C.q2, C.orange, C.q3];
  const pct = (v: number) => `${Math.round((v / total) * 100)}%`;

  const { w, h } = box;
  const size = Math.max(0, Math.min(h, w * 0.5));
  const r1 = size / 2;
  const r0 = r1 * 0.6;
  let a = -Math.PI / 2;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: INSET }}>
      <div className="shrink-0">
        <ChartTitle title={ctx.item.artifact.title} sizes={[[20, 40], [32, 35], [46, 30]]} fallback={27} />
      </div>
      <div ref={ref} className="flex flex-1 items-center gap-10" style={{ marginTop: SECTION + 4, minHeight: GRAPH_MIN }}>
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          {size > 0 ? (
            <svg width={size} height={size} aria-hidden>
              {slices.map((s, i) => {
                const sweep = (s.value / total) * Math.PI * 2;
                const path = arcPath(r1, r1, r0, r1, a, a + sweep - 0.0001);
                a += sweep;
                return <path key={s.name} d={path} fill={colors[i % colors.length]} stroke={C.lime} strokeWidth={3} />;
              })}
            </svg>
          ) : null}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span data-el={ROLE.figure} className="font-sans font-medium leading-none tracking-[-0.03em] tabular-nums" style={{ fontSize: Math.max(22, r0 * 0.62), color: C.ink }}>
              {pct(slices[0]!.value)}
            </span>
            <span data-el={ROLE.figureNote} className="mt-1.5 text-[16px] font-medium leading-tight" style={{ color: C.ink, maxWidth: r0 * 1.5 }}>
              {slices[0]!.name}
            </span>
          </div>
        </div>
        <ul className="flex min-w-0 flex-1 flex-col justify-center" style={{ gap: ROW }}>
          {slices.map((s, i) => (
            <li key={s.name} className="flex items-center gap-3 text-[18px] font-medium leading-tight" style={{ color: C.ink }}>
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ background: colors[i % colors.length], boxShadow: colors[i % colors.length] === C.white ? `inset 0 0 0 1px ${C.hair}` : undefined }}
              />
              <span data-el={ROLE.sliceLabels} className="min-w-0 flex-1 font-medium">
                {s.name}
              </span>
              <span data-el={ROLE.sliceValues} className="tabular-nums" style={{ color: C.ink }}>
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

/** "Health Score", nearly verbatim: headline, diamond line, the ring with the value at its heart. */
export function GaugeBody({ ctx }: Ctx) {
  const d = chartData(ctx);
  const [ref, box] = useBox<HTMLDivElement>();
  if (!d || d.gaugeValue == null) return <CurrentBody ctx={ctx} />;

  const maxV = d.gaugeMax ?? 100;
  const frac = Math.max(0, Math.min(1, d.gaugeValue / (maxV || 1)));
  const isPct = d.unit === "%" || maxV === 100;
  const valueText = isPct ? `${compact(d.gaugeValue)}%` : withUnit(d.gaugeValue, d.unit);
  const kicker = d.gaugeLabel
    ? isPct
      ? d.gaugeLabel
      : `${d.gaugeLabel} · of ${withUnit(maxV, d.unit)}`
    : `of ${withUnit(maxV, d.unit)}`;

  const size = Math.max(0, Math.min(box.w, box.h));
  const r = size / 2;
  const stroke = r * 0.34;
  const rr = r - stroke / 2;
  const circ = 2 * Math.PI * rr;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: INSET }}>
      <div className="flex shrink-0 flex-col items-center gap-3.5 text-center">
        <ChartTitle title={ctx.item.artifact.title} sizes={[[18, 42], [30, 36], [44, 31]]} fallback={27} />
        <div data-el={ROLE.figureNote}>
          <Kicker align="center" icon={<Diamond size={16} />} size={KICKER_PART}>
            {kicker}
          </Kicker>
        </div>
      </div>
      <div ref={ref} className="relative flex flex-1 items-center justify-center" style={{ marginTop: SECTION + 4, minHeight: GRAPH_MIN }}>
        {size > 0 ? (
          <svg width={size} height={size} aria-hidden className="-rotate-90">
            <circle cx={r} cy={r} r={rr} fill="none" stroke={C.limeDeep} strokeWidth={stroke} />
            <circle
              cx={r}
              cy={r}
              r={rr}
              fill="none"
              stroke={C.ink}
              strokeWidth={stroke}
              strokeDasharray={`${circ * frac} ${circ}`}
            />
          </svg>
        ) : null}
        <span
          data-el={ROLE.figure}
          className="absolute font-medium leading-none tracking-[-0.03em] tabular-nums"
          style={{ fontFamily: PRIMARY, fontSize: Math.max(22, (r - stroke) * 0.62), color: C.ink }}
        >
          {valueText}
        </span>
      </div>
    </div>
  );
}

// ─── Stat ───────────────────────────────────────────────────────────────────

/** "Total Spend": headline, the figure in a grey well, and the change drawn as a bar. */
export function StatBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  const [wellRef, well] = useBox<HTMLDivElement>();
  const hugs = useHugs();
  if (payload.type !== "stat") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const phrase = d.unit && `${d.value} ${d.unit}`.length <= 12 ? `${d.value} ${d.unit}` : d.value;
  const splitUnit = phrase === d.value && d.unit;
  // Sized to the phrase, then to the well when the card is short (the unit line takes its share).
  const fitted = sizeFor(phrase, [[5, 76], [8, 64], [11, 50], [16, 38]], 30);
  // A hugging card has no box to fit to (the well is as tall as the figure), so the figure keeps its size.
  const valueSize = !hugs && well.h > 0 ? Math.max(28, Math.min(fitted, well.h * 0.96 - (splitUnit ? 30 : 0))) : fitted;

  const from = d.delta ? parseFigure(d.delta.from) : null;
  const to = d.delta ? parseFigure(d.delta.to) : null;
  const barMax = from != null && to != null ? Math.max(Math.abs(from), Math.abs(to)) : null;
  const toShare = barMax ? Math.max(0.03, Math.abs(to!) / barMax) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-stretch overflow-hidden" style={{ padding: INSET }}>
      <div className="flex shrink-0 flex-col items-center gap-2 text-center">
        <ChartTitle title={ctx.item.artifact.title} sizes={[[18, 30], [30, 26], [44, 23]]} fallback={21} />
        {d.delta ? (
          <p data-el={ROLE.figureNote} className="text-[16px] font-medium leading-snug" style={{ color: C.ink }}>
            {d.label}
          </p>
        ) : null}
      </div>
      <div
        ref={wellRef}
        data-el={ROLE.figure}
        className={`mt-5 flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-[22px] px-5 py-6 text-center ${d.delta ? "flex-1" : "shrink-0"}`}
        style={{ background: C.well }}
      >
        <p className="font-medium leading-none tracking-[-0.035em] tabular-nums" style={{ fontFamily: PRIMARY, fontSize: valueSize, color: C.ink }}>
          {phrase}
        </p>
        {splitUnit ? (
          <p className="mt-2 text-[18px] font-medium" style={{ color: C.ink }}>
            {d.unit}
          </p>
        ) : null}
      </div>
      {d.delta ? (
        <div className="mt-5 shrink-0">
          <div className="mb-2.5 flex justify-between gap-3 text-[16px] font-medium tabular-nums" style={{ color: C.ink }}>
            <span data-el={ROLE.was}>Was {d.delta.from}</span>
            <span data-el={ROLE.now}>Now {d.delta.to}</span>
          </div>
          {toShare != null ? (
            <div className="h-3.5 w-full overflow-hidden rounded-full" style={{ background: C.ink }}>
              <div className="h-full rounded-full" style={{ width: `${toShare * 100}%`, background: C.orange, boxShadow: `0 0 0 2px ${C.ink}` }} />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 flex min-h-0 flex-1 flex-col items-center justify-center text-center">
          <p data-el={ROLE.figureNote} className="text-[18px] font-medium leading-snug" style={{ color: C.ink }}>
            {d.label}
          </p>
        </div>
      )}
    </div>
  );
}

