"use client";

import type { ChartArtifactData } from "@/lib/chartTypes";
import { CurrentBody } from "../current";
import type { ArtifactRenderContext } from "../types";
import { BAR_VALUE_LABELS_MAX, ROLE } from "../../textSpec";
import {
  D,
  DotNumber,
  FONT,
  Figure,
  HUES,
  PAD,
  RAISED,
  Ruler,
  Sub,
  Tag,
  TitleBlock,
  Track,
  compact,
  dottable,
  parseFigure,
  sizeFor,
  smoothPath,
  splitTitle,
  useBox,
  useOn,
  usePalette,
  withUnit,
} from "./tokens";

/**
 * Charts are ink marks with the one point the title is about in colour. In
 * Frost that colour is solid lime and the series run ink → lime → sage →
 * stone, flat; in Aurora the point is lit in the card's hue and haloed by a
 * blurred copy of itself, and charts on glow are drawn in white.
 */

type Ctx = { ctx: ArtifactRenderContext };

function chartData(ctx: ArtifactRenderContext): ChartArtifactData | null {
  return ctx.item.payload.type === "chart" ? ctx.item.payload.data : null;
}

const headOf = (title: string) => {
  const t = splitTitle(title);
  return { t, head: t.lead ? `${t.lead}: ${t.head}` : t.head };
};

/** Title sizes for the charts' top-left titles. */
const CHART_TITLE: [number, number][] = [[22, 34], [34, 30], [50, 27]];

/**
 * The chart's headline figure: the number in lit dots, with any unit word
 * ("mentions", "€") set beside it in light type — one part, the Figure.
 */
function Headline({ value, unit, height = 30, color = D.ink, glow = false }: { value: number; unit?: string; height?: number; color?: string; glow?: boolean }) {
  const full = withUnit(value, unit);
  if (dottable(full)) return <DotNumber el={ROLE.figure} text={full} height={height} color={color} glow={glow} />;
  const num = compact(value);
  const at = full.indexOf(num);
  if (!dottable(num) || at < 0) return <Figure el={ROLE.figure} text={full} height={height} color={color} glow={glow} />;
  const pre = full.slice(0, at).trim();
  const post = full.slice(at + num.length).trim();
  const word = { ...FONT, fontSize: Math.round(height * 0.5), color: D.muted, lineHeight: 1 } as const;
  return (
    <span data-el={ROLE.figure} className="flex items-baseline gap-2">
      {pre ? <span style={word}>{pre}</span> : null}
      <DotNumber el={ROLE.figure} text={num} height={height} color={color} glow={glow} />
      {post ? <span className="whitespace-nowrap" style={word}>{post}</span> : null}
    </span>
  );
}

function Legend({ items, halo }: { items: { name: string; color: string }[]; halo: boolean }) {
  return (
    <div data-el={ROLE.legend} className="flex flex-wrap gap-x-5 gap-y-2">
      {items.map((s) => (
        <span key={s.name} className="inline-flex items-center gap-2" style={{ ...FONT, fontSize: 15, color: D.muted }}>
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color, boxShadow: halo ? `0 0 8px ${s.color}` : undefined }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

// ─── Bar ────────────────────────────────────────────────────────────────────

/**
 * Bars are columns of lit dots — the reference's dotted sparklines grown into
 * a chart. The peak column is lit in the card's hue and glows; the rest are
 * ink. Several series stack their dots in the series colours.
 */
export function BarBody({ ctx }: Ctx) {
  const d = chartData(ctx);
  const [ref, box] = useBox<HTMLDivElement>();
  const pal = usePalette(ctx.item.uid);
  if (!d || !d.categories?.length || !d.series?.length) return <CurrentBody ctx={ctx} />;

  const cats = d.categories;
  const series = d.series;
  const single = series.length === 1;
  const stacked = !!d.stacked && !single;
  const SERIES = pal.series;

  const totals = cats.map((_, i) => series.reduce((s, ser) => s + Math.max(0, ser.data[i] ?? 0), 0));
  const metric = single ? series[0]!.data : totals;
  const peak = metric.reduce((best, v, i) => (v > (metric[best] ?? -Infinity) ? i : best), 0);
  // Grouped bars: the tallest single bar is the headline.
  const top = series.reduce(
    (best, s, si) => s.data.reduce((b, v, ci) => (v > b.v ? { v, si, ci } : b), best),
    { v: -Infinity, si: 0, ci: 0 },
  );
  const figure = single || stacked ? metric[peak]! : top.v;
  const note = single ? `Peak in ${cats[peak]}` : stacked ? `${cats[peak]} leads, all series` : `${series[top.si]!.name} in ${cats[top.ci]}`;
  const valueOf = (i: number) => (single || stacked ? withUnit(metric[i]!, d.unit) : series.map((s) => compact(s.data[i] ?? 0)).join(" · "));

  const n = cats.length;
  const k = single || stacked ? 1 : series.length;
  const { w, h } = box;
  const slot = w / n;
  // Each bar is a block of dots `cols` wide. Pitch keeps ≥ ~12 rows and dots readable.
  const barW = Math.min(k === 1 ? slot * 0.62 : (slot * 0.82) / k, 84);
  const pitch = Math.max(6, Math.min(14, barW / 2, h / 12));
  const cols = Math.max(1, Math.floor(barW / pitch));
  const rows = Math.max(1, Math.floor(h / pitch));
  const max = Math.max(1e-9, ...(stacked ? totals : series.flatMap((s) => s.data.map((v) => Math.max(0, v)))));
  const r = pitch * 0.32;

  const dots: { x: number; y: number; fill: string; lit: boolean }[] = [];
  const halos: { x: number; w: number; top: number }[] = [];
  const column = (x0: number, fromRow: number, count: number, fill: string, lit: boolean) => {
    for (let j = 0; j < count && fromRow + j < rows; j++) {
      for (let c = 0; c < cols; c++) dots.push({ x: x0 + c * pitch + pitch / 2, y: h - (fromRow + j) * pitch - pitch / 2, fill, lit });
    }
  };
  cats.forEach((_, i) => {
    const groupW = k * cols * pitch + (k - 1) * pitch;
    const x0 = i * slot + (slot - groupW) / 2;
    if (stacked || single) {
      let row = 0;
      series.forEach((s, si) => {
        const count = Math.round((Math.max(0, s.data[i] ?? 0) / max) * rows);
        const fill = single ? (i === peak ? pal.peak : D.ink) : SERIES[si % SERIES.length]!;
        column(x0, row, count, fill, single && i === peak);
        row += count;
      });
      if (i === peak) halos.push({ x: x0, w: cols * pitch, top: h - row * pitch });
    } else {
      series.forEach((s, si) => {
        const count = Math.round((Math.max(0, s.data[i] ?? 0) / max) * rows);
        column(x0 + si * (cols + 1) * pitch, 0, count, SERIES[si % SERIES.length]!, false);
      });
    }
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: PAD }}>
      <div className="flex shrink-0 flex-col gap-2">
        <div className="flex items-start justify-between gap-6">
          <TitleBlock title={ctx.item.artifact.title} sizes={CHART_TITLE} fallback={24} />
          <div className="flex shrink-0 flex-col items-end gap-2 pt-1">
            <Headline value={figure} unit={d.unit} />
            <span className="max-w-[220px] truncate text-right" data-el={ROLE.figureNote} style={{ ...FONT, fontSize: 14, color: D.faint }}>
              {note}
            </span>
          </div>
        </div>
        {!single ? (
          <div className="mt-2">
            <Legend halo={pal.halo} items={series.map((s, i) => ({ name: s.name, color: SERIES[i % SERIES.length]! }))} />
          </div>
        ) : null}
      </div>
      <div ref={ref} className="relative mt-7 min-h-[40px] flex-1">
        {single && pal.halo
          ? halos.map((hl, i) => (
              <span
                key={i}
                aria-hidden
                className="absolute"
                style={{
                  left: hl.x - pitch,
                  width: hl.w + pitch * 2,
                  top: hl.top - pitch,
                  bottom: -pitch,
                  borderRadius: 999,
                  background: pal.peak,
                  filter: `blur(${pitch * 1.8}px)`,
                  opacity: 0.38,
                }}
              />
            ))
          : null}
        {w > 0 && h > 0 ? (
          <svg width={w} height={h} className="absolute inset-0 overflow-visible" aria-hidden>
            {dots.map((dt, i) => (
              <circle key={i} cx={dt.x} cy={dt.y} r={r} fill={dt.fill} opacity={dt.lit || !single || pal.frost ? 1 : 0.78} />
            ))}
          </svg>
        ) : null}
      </div>
      {n <= BAR_VALUE_LABELS_MAX ? (
        <div className="mt-4 grid shrink-0" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {cats.map((c, i) => (
            <div key={c + i} className="flex min-w-0 flex-col items-center px-1 text-center" style={FONT}>
              <span data-el={ROLE.categoryLabels} className="line-clamp-2 text-[15px] leading-tight" style={{ color: i === peak ? D.ink : D.muted }}>
                {c}
              </span>
              <span data-el={ROLE.valueLabels} className="mt-0.5 text-[13px] tabular-nums" style={{ color: D.faint }}>
                {valueOf(i)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div data-el={ROLE.categoryLabels} className="mt-4 flex shrink-0 justify-between gap-6 text-[14px]" style={{ ...FONT, color: D.muted }}>
          <span className="min-w-0 truncate">{cats[0]}</span>
          <span className="min-w-0 truncate text-right">{cats[n - 1]}</span>
        </div>
      )}
    </div>
  );
}

// ─── Line ───────────────────────────────────────────────────────────────────

/**
 * A thin ink line — in Aurora with its own coloured light under it (the same
 * path, drawn wide and blurred); in Frost just the line. The point the title
 * is about gets a lime dot and a raised pill that says what happened there.
 */
export function LineBody({ ctx }: Ctx) {
  const d = chartData(ctx);
  const [ref, box] = useBox<HTMLDivElement>();
  const pal = usePalette(ctx.item.uid);
  const SERIES = pal.series;
  if (!d || !d.categories?.length || !d.series?.length) return <CurrentBody ctx={ctx} />;

  const cats = d.categories;
  const series = d.series;
  const main = series[0]!.data;
  const rising = (main[main.length - 1] ?? 0) >= (main[0] ?? 0);
  const focus = main.reduce((best, v, i) => ((rising ? v > main[best]! : v < main[best]!) ? i : best), 0);
  const all = series.flatMap((s) => s.data);
  const max = Math.max(...all);
  const min = Math.min(...all);
  const span = max - min || 1;
  const first = main[0]!;
  const delta = first !== 0 ? Math.round(((main[focus]! - first) / Math.abs(first)) * 100) : null;

  const { w, h } = box;
  const top = rising ? h * 0.3 : h * 0.08;
  const bottom = rising ? h * 0.12 : h * 0.34;
  const xOf = (i: number) => (i * w) / Math.max(1, cats.length - 1);
  const yOf = (v: number) => top + (1 - (v - min) / span) * (h - top - bottom);
  const fp = { x: xOf(focus), y: yOf(main[focus]!) };
  const pillW = Math.min(280, w - 16);
  const pillLeft = Math.max(0, Math.min(w - pillW, fp.x - pillW / 2));
  const uid = ctx.item.uid.replace(/[^a-z0-9]/gi, "");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: PAD }}>
      <div className="flex shrink-0 items-start justify-between gap-6">
        <TitleBlock title={ctx.item.artifact.title} sizes={CHART_TITLE} fallback={24} />
        <div className="shrink-0 pt-1">
          <Headline value={main[focus]!} unit={d.unit} />
        </div>
      </div>
      {series.length > 1 ? (
        <div className="mt-4 shrink-0">
          <Legend halo={pal.halo} items={series.map((s, si) => ({ name: s.name, color: si === 0 ? D.ink : SERIES[(si + 1) % SERIES.length]! }))} />
        </div>
      ) : null}
      <div ref={ref} className="relative mt-6 min-h-[60px] flex-1">
        {w > 0 && h > 0 ? (
          <>
            <svg width={w} height={h} className="absolute inset-0 overflow-visible" aria-hidden>
              <defs>
                <filter id={`sd-glow-${uid}`} x="-20%" y="-60%" width="140%" height="220%">
                  <feGaussianBlur stdDeviation="9" />
                </filter>
              </defs>
              {series.map((s, si) => {
                const pts = s.data.map((v, i) => ({ x: xOf(i), y: yOf(v) }));
                const path = smoothPath(pts);
                const color = si === 0 ? pal.peak : SERIES[(si + 1) % SERIES.length]!;
                return (
                  <g key={s.name}>
                    {pal.halo ? (
                      <path d={path} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" opacity={0.55} filter={`url(#sd-glow-${uid})`} />
                    ) : null}
                    <path d={path} fill="none" stroke={si === 0 ? D.ink : color} strokeWidth={si === 0 ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                );
              })}
              <line x1={fp.x} x2={fp.x} y1={fp.y} y2={h} stroke={D.ink} strokeOpacity={0.14} strokeDasharray="2 5" strokeLinecap="round" />
            </svg>
            <span
              className="absolute h-[20px] w-[20px] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: fp.x, top: fp.y, background: D.accent, boxShadow: "0 0 0 5px rgba(255,255,255,0.9), 0 6px 14px -2px rgba(0,0,0,0.25)" }}
            />
            <div
              className="absolute flex items-center gap-3 rounded-full py-2.5 pl-3 pr-5"
              style={{
                ...RAISED,
                left: pillLeft,
                maxWidth: pillW,
                ...(rising ? { bottom: h - fp.y + 26 } : { top: fp.y + 26 }),
              }}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke={D.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {rising ? <path d="M2 11l4-4 3 3 5-5M10 5h4v4" /> : <path d="M2 5l4 4 3-3 5 5M10 11h4V7" />}
              </svg>
              <div data-el={ROLE.figureNote} className="min-w-0" style={FONT}>
                <p className="truncate text-[16px] leading-tight" style={{ color: D.ink }}>
                  {rising ? "Peak" : "Low"} in {cats[focus]}
                </p>
                {delta != null && focus !== 0 ? (
                  <p className="truncate text-[13px] leading-tight" style={{ color: D.faint }}>
                    {delta >= 0 ? "+" : "−"}
                    {Math.abs(delta)}% from {cats[0]}
                  </p>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>
      <div data-el={ROLE.axisLabels} className="mt-3 flex shrink-0 justify-between text-[14px]" style={{ ...FONT, color: D.faint }}>
        <span>{cats[0]}</span>
        <span>{cats[cats.length - 1]}</span>
      </div>
    </div>
  );
}

// ─── Area ───────────────────────────────────────────────────────────────────

/** On glow: the label, the latest figure in dots, then the area as frosted white layers over the colour. */
export function AreaBody({ ctx }: Ctx) {
  const d = chartData(ctx);
  const [ref, box] = useBox<HTMLDivElement>();
  if (!d || !d.categories?.length || !d.series?.length) return <CurrentBody ctx={ctx} />;

  const cats = d.categories;
  const series = d.series;
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
  const yOf = (v: number) => h - (v / max) * (h * 0.9);
  const order = layers.map((l, i) => ({ i, sum: l.reduce((a, b) => a + b, 0) })).sort((a, b) => (stacked ? b.i - a.i : b.sum - a.sum));
  const value = withUnit(last, d.unit);
  const on = useOn();

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col items-center gap-3 text-center" style={{ padding: `${PAD}px ${PAD}px 0` }}>
        <TitleBlock title={ctx.item.artifact.title} sizes={[[22, 26], [40, 23]]} fallback={21} align="center" color={on.title} subColor={on.sub} subSize={15} gap={4} />
        <div className="mt-2">
          <Figure el={ROLE.figure} text={value} height={56} color={on.ink} maxDots={7} glow={on.glow} />
        </div>
        <Sub el={ROLE.figureNote} align="center" color={on.sub} size={16}>
          {series[0]!.name} in {cats[cats.length - 1]}
          {change != null ? ` · ${change >= 0 ? "up" : "down"} ${Math.abs(change)}% since ${cats[0]}` : ""}
        </Sub>
      </div>
      <div ref={ref} className="relative mt-4 min-h-[60px] flex-1">
        {w > 0 && h > 0 ? (
          <svg width={w} height={h} className="absolute inset-0" aria-hidden>
            {order.map(({ i }, oi) => {
              const pts = layers[i]!.map((v, j) => ({ x: xOf(j), y: yOf(v) }));
              const line = smoothPath(pts);
              return (
                <g key={i}>
                  <path d={`${line} L${w},${h} L0,${h} Z`} fill={on.fill} opacity={on.glow ? 0.16 + oi * 0.1 : 0.14 + oi * 0.12} />
                  <path d={line} fill="none" stroke={on.line} strokeOpacity={on.glow ? 0.9 : 1} strokeWidth={2.5} strokeLinejoin="round" />
                </g>
              );
            })}
          </svg>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 flex justify-between pb-6 text-[14px]" style={{ ...FONT, color: on.sub, paddingInline: PAD }}>
          <span data-el={ROLE.axisLabels}>{cats[0]}</span>
          {series.length > 1 ? (
            <span data-el={ROLE.legend} className="truncate px-3">
              {series.map((s) => s.name).join(" · ")}
            </span>
          ) : null}
          <span data-el={ROLE.axisLabels}>{cats[cats.length - 1]}</span>
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

/**
 * A ring with the biggest share set in dots at its heart. In Frost the parts
 * are flat ink, lime, sage and stone; in Aurora each is a hue and the ring
 * sits on a blurred copy of itself so the colours spill onto the card.
 */
export function PieBody({ ctx }: Ctx) {
  const d = chartData(ctx);
  const [ref, box] = useBox<HTMLDivElement>();
  const pal = usePalette(ctx.item.uid);
  const raw = d?.slices?.length ? d.slices : d?.categories?.map((name, i) => ({ name, value: d.series?.[0]?.data[i] ?? 0 })) ?? [];
  if (!d || raw.length === 0) return <CurrentBody ctx={ctx} />;

  const sorted = [...raw].sort((a, b) => b.value - a.value);
  const slices = sorted.length > 7 ? [...sorted.slice(0, 6), { name: "Other", value: sorted.slice(6).reduce((s, x) => s + x.value, 0) }] : sorted;
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const colors = pal.frost ? pal.series : [HUES.ember.mark, HUES.rose.mark, HUES.tide.mark, HUES.grove.mark, HUES.sun.mark, HUES.lilac.mark, "#B9B9BE"];
  const pct = (v: number) => `${Math.round((v / total) * 100)}%`;

  const { w, h } = box;
  const size = Math.max(0, Math.min(h, w * 0.46));
  const r1 = size / 2;
  const r0 = r1 * 0.7;
  const gap = 0.035;
  let a = -Math.PI / 2;
  const arcs = slices.map((s, i) => {
    const sweep = (s.value / total) * Math.PI * 2;
    const path = arcPath(r1, r1, r0, r1, a + gap / 2, a + Math.max(sweep - gap / 2, gap / 2 + 0.001));
    a += sweep;
    return { path, color: colors[i % colors.length]! };
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: PAD }}>
      <div className="flex shrink-0 flex-col gap-2">
        <TitleBlock title={ctx.item.artifact.title} sizes={CHART_TITLE} fallback={24} />
      </div>
      <div ref={ref} className="mt-6 flex min-h-0 flex-1 items-center gap-10">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          {size > 0 ? (
            <>
              {pal.halo ? (
                <svg width={size} height={size} className="absolute inset-0" style={{ filter: `blur(${size * 0.07}px)`, opacity: 0.55, transform: "translateY(6%) scale(0.96)" }} aria-hidden>
                  {arcs.map((arc, i) => (
                    <path key={i} d={arc.path} fill={arc.color} />
                  ))}
                </svg>
              ) : null}
              <svg width={size} height={size} className="absolute inset-0" aria-hidden>
                {arcs.map((arc, i) => (
                  <path key={i} d={arc.path} fill={arc.color} />
                ))}
              </svg>
            </>
          ) : null}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <DotNumber el={ROLE.figure} text={pct(slices[0]!.value)} height={Math.max(18, r0 * 0.42)} color={D.ink} glow={false} />
            <span data-el={ROLE.figureNote} className="mt-2 line-clamp-2 leading-tight" style={{ ...FONT, fontSize: 14, color: D.muted, maxWidth: r0 * 1.4 }}>
              {slices[0]!.name}
            </span>
          </div>
        </div>
        <ul className="flex min-w-0 flex-1 flex-col justify-center gap-3">
          {slices.map((s, i) => (
            <li key={s.name} className="flex items-center gap-3 leading-tight" style={{ ...FONT, fontSize: 16, color: D.ink }}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colors[i % colors.length], boxShadow: pal.halo ? `0 0 8px ${colors[i % colors.length]}` : undefined }} />
              <span data-el={ROLE.sliceLabels} className="min-w-0 flex-1 truncate">
                {s.name}
              </span>
              <span data-el={ROLE.sliceValues} className="tabular-nums" style={{ color: D.muted }}>
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

/** The reference's "Biological age" card: label, the value in lit dots, a line under it, then the ruler. */
export function GaugeBody({ ctx }: Ctx) {
  const d = chartData(ctx);
  if (!d || d.gaugeValue == null) return <CurrentBody ctx={ctx} />;

  const maxV = d.gaugeMax ?? 100;
  const frac = Math.max(0, Math.min(1, d.gaugeValue / (maxV || 1)));
  const isPct = d.unit === "%" || maxV === 100;
  const valueText = isPct ? `${compact(d.gaugeValue)}%` : withUnit(d.gaugeValue, d.unit);
  const on = useOn();
  const kicker = d.gaugeLabel ? (isPct ? d.gaugeLabel : `${d.gaugeLabel} · of ${withUnit(maxV, d.unit)}`) : `of ${withUnit(maxV, d.unit)}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center overflow-hidden text-center" style={{ padding: `${PAD}px ${PAD}px ${PAD - 6}px` }}>
      <TitleBlock title={ctx.item.artifact.title} sizes={[[22, 26], [40, 23]]} fallback={21} align="center" color={on.title} subColor={on.sub} subSize={15} gap={4} />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
        <Figure el={ROLE.figure} text={valueText} height={72} color={on.ink} glow={on.glow} />
        <Sub el={ROLE.figureNote} align="center" color={on.sub} size={16}>
          {kicker}
        </Sub>
      </div>
      <div className="w-full shrink-0">
        <Ruler at={frac} color={on.ruler} marker={on.marker} lit={on.glow} />
      </div>
    </div>
  );
}

// ─── Stat ───────────────────────────────────────────────────────────────────

/**
 * On glow: the title as the label, the figure in dots (or light type if it
 * won't set in dots), a raised tag for its unit, and — when it changed — the
 * reference's track from where it was to where it is.
 */
export function StatBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  if (payload.type !== "stat") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const from = d.delta ? parseFigure(d.delta.from) : null;
  const to = d.delta ? parseFigure(d.delta.to) : null;
  const share = from != null && to != null ? Math.min(1, Math.abs(to) / Math.max(Math.abs(from), Math.abs(to), 1e-9)) : null;
  const inDots = (d.value.length <= 7 && /\d/.test(d.value));
  const on = useOn();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${PAD - 6}px ${PAD - 4}px ${PAD - 8}px` }}>
      <TitleBlock title={ctx.item.artifact.title} sizes={[[22, 23], [40, 20]]} fallback={18} align="center" color={on.title} subColor={on.sub} subSize={14} gap={4} />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 py-2">
        <div data-el={ROLE.figure} className="flex max-w-full items-start gap-2">
          <Figure el={ROLE.figure} text={d.value} height={inDots ? 56 : 40} color={on.ink} glow={on.glow} />
          {d.unit && d.unit.length <= 14 ? <Tag tone={on.glow ? "glass" : "lime"} size={13}>{d.unit}</Tag> : null}
        </div>
        <Sub el={ROLE.figureNote} align="center" color={on.sub} size={15} lines={d.delta ? 2 : 4}>
          {d.unit && d.unit.length > 14 ? `${d.unit} · ` : ""}
          {d.label}
        </Sub>
      </div>
      {d.delta ? (
        <div className="shrink-0">
          <div className="mb-2 flex justify-between text-[13px] tabular-nums" style={{ ...FONT, color: on.sub }}>
            <span data-el={ROLE.was}>Was {d.delta.from}</span>
            <span data-el={ROLE.now}>Now {d.delta.to}</span>
          </div>
          {share != null ? <Track share={share} light={on.light} /> : null}
        </div>
      ) : null}
    </div>
  );
}
