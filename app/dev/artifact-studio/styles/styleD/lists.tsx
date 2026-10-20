"use client";

import { useState, type CSSProperties } from "react";
import type { TableCell, TimelineEvent } from "@/lib/artifactTypes";
import { buildMonthWeeks } from "@/lib/calendarArtifact";
import { normalizeTableArtifactData } from "@/lib/tableArtifact";
import { CurrentBody } from "../current";
import type { ArtifactRenderContext } from "../types";
import { ROLE } from "../../textSpec";
import {
  D,
  DotNumber,
  FADE_BOTTOM,
  DISPLAY,
  FONT,
  F,
  NEST_INSET,
  NEST_RADIUS,
  PAD,
  RAISED,
  Sub,
  Tag,
  Title,
  TitleBlock,
  Track,
  scrollClass,
  sentenceCase,
  sizeFor,
  splitTitle,
  useDMode,
  usePalette,
} from "./tokens";

/**
 * Working data on frost. The title leads top-left in light display type with
 * its second idea as a grey line under it; rows are separated by the faintest
 * hairline, and anything you'd press or tag sits raised above the card.
 */

type Ctx = { ctx: ArtifactRenderContext };

/** The title (all of it, one part) top-left, and whatever the body sets beside it. */
function PageHead({ title, sizes, fallback, aside }: { title: string; sizes: [number, number][]; fallback: number; aside?: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-6">
      <TitleBlock title={title} sizes={sizes} fallback={fallback} />
      {aside}
    </div>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function shortDate(iso?: string): string | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}`;
}

// ─── Table ──────────────────────────────────────────────────────────────────

const cellValue = (c: string | TableCell | undefined) => (typeof c === "string" ? c : c?.value ?? "");
const NUMERIC = /^[\s~≈+\-−$€£₹]*[\d.,]+\s*(?:%|[kKmMbB]n?|x|×|hrs?|h|s|yrs?)?\s*$|^[—–-]$/;

export function TableBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  if (payload.type !== "table") return <CurrentBody ctx={ctx} />;
  const { columns, rows } = normalizeTableArtifactData(payload.data);
  const numericCol = columns.map((col) => {
    const vals = rows.map((r) => cellValue(r[col.key])).filter((v) => v.trim());
    return vals.length > 0 && vals.filter((v) => NUMERIC.test(v)).length / vals.length >= 0.7;
  });
  const isTotal = (r: (typeof rows)[number]) => /^(total|all|sum)\b/i.test(cellValue(r[columns[0]!.key]));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${PAD}px ${PAD}px ${PAD - 12}px` }}>
      <PageHead title={ctx.item.artifact.title} sizes={[[24, 32], [40, 28]]} fallback={25} />
      <div className={`mt-6 min-h-0 flex-1 ${scrollClass(ctx.interactive)}`} style={FADE_BOTTOM}>
        <table className="w-full border-collapse text-left" style={{ ...FONT, color: D.ink }}>
          <thead data-el={ROLE.columnHeaders}>
            <tr>
              {columns.map((col, i) => (
                <th key={col.key} className={`pb-3 pr-4 text-[13px] font-normal last:pr-0 ${numericCol[i] ? "text-right" : ""}`} style={{ color: D.faint }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody data-el={ROLE.cells}>
            {rows.map((row, ri) => {
              const total = isTotal(row);
              return (
                <tr key={ri} style={{ borderTop: `1px solid ${total ? "rgba(28,28,30,0.2)" : D.hair}` }}>
                  {columns.map((col, ci) => {
                    const cell = row[col.key];
                    const value = cellValue(cell);
                    return (
                      <td
                        key={col.key}
                        className={`py-[11px] pr-4 align-top text-[15.5px] leading-snug last:pr-0 ${numericCol[ci] ? "text-right tabular-nums" : ""}`}
                        style={{ fontWeight: total ? 500 : 400, color: ci === 0 || total ? D.ink : "rgba(28,28,30,0.78)" }}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Todo ───────────────────────────────────────────────────────────────────

function Check({ state }: { state: "done" | "next" | "open" }) {
  if (state === "done") {
    return (
      <span className="inline-flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full" style={{ background: D.accent, color: D.accentInk, boxShadow: `0 3px 8px -2px ${D.accentShadow}` }}>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="h-[24px] w-[24px] shrink-0 rounded-full"
      style={state === "next" ? { ...RAISED, boxShadow: `${RAISED.boxShadow}, inset 0 0 0 1.5px rgba(28,28,30,0.55)` } : { boxShadow: "inset 0 0 0 1.5px rgba(28,28,30,0.22)" }}
    />
  );
}

/** Headline, the reference's track showing how far along, then the list — the next item raised. */
export function TodoBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  const initial = payload.type === "todo" ? payload.data.items : [];
  const [items, setItems] = useState(initial);
  if (payload.type !== "todo") return <CurrentBody ctx={ctx} />;

  const done = items.filter((i) => i.checked).length;
  const next = items.findIndex((i) => !i.checked);
  const share = items.length ? done / items.length : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${PAD}px ${PAD}px ${PAD - 14}px` }}>
      <PageHead
        title={ctx.item.artifact.title}
        sizes={[[16, 36], [30, 31], [46, 27]]}
        fallback={24}
        aside={
          <div data-el={ROLE.progress} className="flex shrink-0 items-baseline gap-1.5 pt-1">
            <DotNumber el={ROLE.progress} text={String(done)} height={30} color={D.ink} glow={false} />
            <span style={{ ...FONT, fontSize: 15, color: D.faint }}>/ {items.length}</span>
          </div>
        }
      />
      <div className="mt-5 shrink-0">
        <Track share={share} />
      </div>
      <ul className={`mt-4 min-h-0 flex-1 ${scrollClass(ctx.interactive)}`} style={{ marginInline: -12, paddingInline: 4, ...FADE_BOTTOM }}>
        {items.map((item, i) => {
          const state = item.checked ? "done" : i === next ? "next" : "open";
          return (
            <li key={item.id} className="py-[3px]">
              <button
                type="button"
                disabled={!ctx.interactive}
                onClick={() => setItems((all) => all.map((x) => (x.id === item.id ? { ...x, checked: !x.checked } : x)))}
                className="flex w-full items-center gap-3.5 rounded-[18px] px-3 py-[9px] text-left"
                style={state === "next" ? RAISED : undefined}
              >
                <Check state={state} />
                <span
                  data-el={ROLE.itemLabels}
                  className="min-w-0 flex-1 truncate text-[16px] leading-snug"
                  style={{ ...FONT, color: item.checked ? D.faint : D.ink, textDecoration: item.checked ? "line-through" : undefined, textDecorationColor: "rgba(28,28,30,0.25)" }}
                >
                  {item.label}
                </span>
                {item.dueDate ? (
                  <span data-el={ROLE.dueDates} className="shrink-0 text-[13px] tabular-nums" style={{ ...FONT, color: D.faint }}>
                    {shortDate(item.dueDate)}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Calendar ───────────────────────────────────────────────────────────────

/** The month as a quiet grid; days with something on them raised, the first highlight lit lime. */
export function CalendarBody({ ctx }: Ctx) {
  const pal = usePalette(ctx.item.uid);
  const payload = ctx.item.payload;
  if (payload.type !== "calendar") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const t = splitTitle(ctx.item.artifact.title);
  const weeks = buildMonthWeeks(d.viewYear, d.viewMonth);
  const highlighted = new Set(d.highlightedDates);
  const eventDays = new Map<string, number>();
  for (const e of d.events) {
    let cur = new Date(`${e.startDate}T00:00:00`);
    const end = new Date(`${e.endDate || e.startDate}T00:00:00`);
    for (let guard = 0; cur <= end && guard < 62; guard++) {
      const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
      eventDays.set(iso, (eventDays.get(iso) ?? 0) + 1);
      cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
    }
  }
  // The calendar's own month — the year too, unless the title already says it.
  const monthLabel = new RegExp(`\\b${d.viewYear}\\b`).test(ctx.item.artifact.title) ? MONTHS_LONG[d.viewMonth - 1]! : `${MONTHS_LONG[d.viewMonth - 1]} ${d.viewYear}`;
  const events = [...d.events].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const firstHighlight = [...highlighted].sort()[0];
  const dot = pal.frost ? D.ink : pal.peak;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${PAD - 4}px ${PAD - 4}px ${PAD - 16}px` }}>
      <div className="flex shrink-0 items-start justify-between gap-4">
        <TitleBlock title={ctx.item.artifact.title} sizes={[[14, 34], [26, 30]]} fallback={26} lines={1} gap={6} />
        <div className="shrink-0 pt-1">
          <Tag el={ROLE.month} tone="lime" size={14}>
            {monthLabel}
          </Tag>
        </div>
      </div>
      <div data-el={ROLE.weekdays} className="mt-5 grid shrink-0 grid-cols-7 text-center text-[12px]" style={{ ...FONT, color: D.faint }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div data-el={ROLE.dayNumbers} className="mt-1.5 flex shrink-0 flex-col">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.days.map((cell, ci) => {
              if (!cell.iso) return <span key={ci} />;
              const hi = highlighted.has(cell.iso);
              const n = eventDays.get(cell.iso) ?? 0;
              const accent = cell.iso === firstHighlight;
              return (
                <span key={ci} className="flex h-[40px] flex-col items-center justify-center">
                  <span
                    className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full text-[15px] tabular-nums"
                    style={{
                      ...FONT,
                      ...(accent ? { background: D.accent, color: D.accentInk, boxShadow: `0 4px 12px -3px ${D.accentShadow}` } : hi ? RAISED : {}),
                      color: accent ? D.accentInk : hi || n ? D.ink : D.faint,
                    }}
                  >
                    {cell.day}
                  </span>
                  <span className="mt-[1px] h-[4px] w-[4px] rounded-full" style={{ background: n && !hi ? dot : "transparent", boxShadow: n && !hi && pal.halo ? `0 0 6px ${dot}` : undefined }} />
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <ul className={`mt-3 min-h-0 flex-1 ${scrollClass(ctx.interactive)}`} style={{ borderTop: `1px solid ${D.hair}`, ...FADE_BOTTOM }}>
        {events.map((e) => (
          <li key={e.id} className="flex items-baseline gap-3 pt-2.5 text-[14.5px] leading-snug" style={{ ...FONT, color: D.ink }}>
            <span data-el={ROLE.eventDates} className="w-[54px] shrink-0 tabular-nums" style={{ color: D.faint }}>
              {shortDate(e.startDate)}
            </span>
            <span data-el={ROLE.eventLabels} className="min-w-0 truncate">
              {e.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Timeline ───────────────────────────────────────────────────────────────

function eventStamp(e: TimelineEvent, scale: string): string {
  const m = e.at.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return e.at;
  if (scale === "day") return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}`;
  if (scale === "month") return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  return m[1]!;
}

/**
 * The reference's dotted range strip: the subject large on the left, then a
 * raised track with each moment as a small coloured dot, labels hanging above
 * and below. The latest moment is lime and gets a raised label pill.
 */
export function TimelineBody({ ctx }: Ctx) {
  const pal = usePalette(ctx.item.uid);
  const payload = ctx.item.payload;
  if (payload.type !== "timeline") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const events = [...d.events].sort((a, b) => a.at.localeCompare(b.at));
  const t = splitTitle(ctx.item.artifact.title);
  const big = t.lead ?? t.head;
  // The rest of the title's own words, in order — never a computed span or count.
  const second = [t.lead ? t.head : null, t.sub].filter(Boolean).join(" — ");
  const n = events.length;
  const dotColors = pal.dots;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden" style={{ padding: `${PAD + 8}px ${PAD + 12}px` }}>
      <div data-el={ROLE.title} className="flex w-[24%] min-w-[280px] max-w-[420px] shrink-0 flex-col justify-center pr-10">
        <Title size={sizeFor(big, [[14, 64], [22, 54], [34, 44]], 38)} lines={3} weight={300}>
          {big}
        </Title>
        {second ? (
          <p className="mt-3 line-clamp-2 text-[22px] leading-tight" style={{ ...DISPLAY, color: D.muted, letterSpacing: "-0.015em" }}>
            {sentenceCase(second)}
          </p>
        ) : null}
        {t.range ? (
          <p className="mt-5 text-[16px] tabular-nums" style={{ ...FONT, color: D.faint }}>
            {t.range}
          </p>
        ) : null}
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="absolute inset-x-[-14px] top-1/2 h-[64px] -translate-y-1/2 rounded-full" style={RAISED} />
        {events.map((e, i) => {
          const x = n === 1 ? 50 : 3 + (i * 94) / (n - 1);
          const above = i % 2 === 0;
          const latest = i === n - 1;
          const color = dotColors[i % dotColors.length]!;
          const labelW = Math.min(250, Math.max(130, ((2 * 94) / Math.max(1, n - 1)) * 10));
          return (
            <div key={e.id} className="absolute inset-y-0" style={{ left: `${x}%` }}>
              {/* A short column of dots — the reference's dotted range marks. */}
              <span className="absolute left-0 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[5px]">
                {latest ? (
                  <span className="h-[22px] w-[22px] rounded-full" style={{ background: D.accent, boxShadow: `0 0 0 5px ${D.accentHalo}, 0 4px 12px -2px ${D.accentShadow}` }} />
                ) : (
                  <>
                    <span className="h-[5px] w-[5px] rounded-full" style={{ background: "rgba(28,28,30,0.25)" }} />
                    <span className="rounded-full" style={{ width: e.highlight ? 13 : 10, height: e.highlight ? 13 : 10, background: color, boxShadow: pal.halo ? `0 0 10px ${color}` : undefined }} />
                    <span className="h-[5px] w-[5px] rounded-full" style={{ background: "rgba(28,28,30,0.25)" }} />
                  </>
                )}
              </span>
              <div
                className={`absolute ${i === 0 ? "text-left" : latest ? "text-right" : "-translate-x-1/2 text-center"}`}
                style={{
                  ...FONT,
                  width: i === 0 || latest ? labelW * 0.72 : labelW,
                  ...(i === 0 ? { left: -8 } : latest ? { right: -8 } : {}),
                  ...(above ? { bottom: "calc(50% + 52px)" } : { top: "calc(50% + 52px)" }),
                }}
              >
                {above ? null : (
                  <p data-el={ROLE.eventDates} className="text-[20px] leading-none tabular-nums" style={{ color: D.ink }}>
                    {eventStamp(e, d.scale)}
                  </p>
                )}
                <p data-el={ROLE.eventLabels} className={`line-clamp-3 text-[15.5px] leading-snug ${above ? "mb-2" : "mt-2"}`} style={{ color: latest ? D.ink : D.muted }}>
                  {e.label}
                </p>
                {above ? (
                  <p data-el={ROLE.eventDates} className="text-[20px] leading-none tabular-nums" style={{ color: D.ink }}>
                    {eventStamp(e, d.scale)}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mechanism ──────────────────────────────────────────────────────────────

/** Steps as raised discs joined by a faint line; the last disc is lime — where the chain lands. */
export function MechanismBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  if (payload.type !== "mechanism") return <CurrentBody ctx={ctx} />;
  const { steps, edges } = payload.data;
  const byId = new Map(steps.map((s) => [s.id, s]));
  const nextOf = new Map(edges.map((e) => [e.from, e.to]));
  const targets = new Set(edges.map((e) => e.to));
  const ordered = [] as typeof steps;
  let cur = steps.find((s) => !targets.has(s.id))?.id;
  const seen = new Set<string>();
  while (cur && !seen.has(cur) && byId.has(cur)) {
    seen.add(cur);
    ordered.push(byId.get(cur)!);
    cur = nextOf.get(cur);
  }
  const chain = ordered.length === steps.length ? ordered : steps;
  const title = ctx.item.artifact.title;
  const n = chain.length;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden" style={{ padding: `${PAD - 4}px ${PAD}px` }}>
      <div className="flex w-[24%] min-w-[200px] max-w-[300px] shrink-0 flex-col pr-8">
        <Title el={ROLE.title} size={sizeFor(title, [[22, 32], [34, 28]], 25)} lines={4}>
          {title}
        </Title>
      </div>
      <ol className="relative grid min-w-0 flex-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        <span aria-hidden className="absolute left-[20px] right-[10%] top-[21px] h-[1.5px]" style={{ background: "rgba(28,28,30,0.12)" }} />
        {chain.map((s, i) => {
          const last = i === n - 1;
          return (
            <li key={s.id} className="relative flex min-w-0 flex-col pr-5" style={FONT}>
              <span
                data-el={ROLE.stepNumbers}
                className="relative inline-flex h-[42px] w-[42px] items-center justify-center rounded-full text-[15px] tabular-nums"
                style={last ? { background: D.accent, color: D.accentInk, boxShadow: `0 6px 14px -4px ${D.accentShadow}` } : { ...RAISED, color: D.ink }}
              >
                {i + 1}
              </span>
              <p data-el={ROLE.stepLabels} className="mt-4 text-[16px] leading-snug" style={{ color: D.ink }}>
                {s.label}
              </p>
              {s.note?.trim() ? (
                <p data-el={ROLE.stepNotes} className="mt-1.5 text-[13.5px] leading-snug" style={{ color: D.faint }}>
                  {s.note}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── Link group ─────────────────────────────────────────────────────────────

const domainOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export function LinkGroupBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  if (payload.type !== "linkgroup") return <CurrentBody ctx={ctx} />;
  const { sections } = payload.data;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${PAD}px ${PAD}px ${PAD - 14}px` }}>
      <PageHead title={ctx.item.artifact.title} sizes={[[20, 36], [34, 31]]} fallback={26} />
      <div className={`mt-6 flex min-h-0 flex-1 flex-col gap-5 ${scrollClass(ctx.interactive)}`} style={{ padding: 6, margin: -6 }}>
        {sections.map((section) => (
          <section key={section.label}>
            <p data-el={ROLE.sectionLabels} className="mb-2.5 text-[13px]" style={{ ...FONT, color: D.faint }}>
              {section.label}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {section.links.map((link) => (
                <a
                  key={link.url + link.label}
                  href={ctx.interactive ? link.url : undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-full items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-[15px]"
                  style={{ ...FONT, ...RAISED, color: D.ink }}
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ background: "#F1F1EF" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={link.iconUrl ?? `https://www.google.com/s2/favicons?domain=${domainOf(link.url)}&sz=64`} alt="" className="h-4 w-4" />
                  </span>
                  <span data-el={ROLE.linkLabels} className="truncate">
                    {link.label}
                  </span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// ─── Episode ────────────────────────────────────────────────────────────────

/** The recording's own title set large and light; the thumbnail raised in a concentric well; chapters numbered in dots. */
export function EpisodeBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  if (payload.type !== "episode") return <CurrentBody ctx={ctx} />;
  const d = payload.data;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${PAD + 4}px ${PAD + 4}px ${PAD - 10}px` }}>
      <Sub el={ROLE.title} size={15} color={D.faint} lines={1}>
        {ctx.item.artifact.title}
      </Sub>
      <div className="mt-2.5 shrink-0">
        <Title el={ROLE.episodeTitle} size={sizeFor(d.videoTitle, [[24, 52], [40, 42]], 34)} lines={3} weight={300}>
          {d.videoTitle}
        </Title>
      </div>
      {d.description?.trim() ? (
        <div className="mt-3 shrink-0">
          <Sub el={ROLE.description} size={17} lines={3}>
            {d.description}
          </Sub>
        </div>
      ) : null}
      {d.thumb ? (
        <div className="mt-5 min-h-[120px] flex-1 overflow-hidden" style={{ ...RAISED, borderRadius: NEST_RADIUS, padding: 6 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.thumb} alt="" className="h-full w-full object-cover" style={{ borderRadius: NEST_RADIUS - 6 }} />
        </div>
      ) : null}
      <ol className={`${d.thumb ? "shrink-0" : "mt-auto min-h-0 shrink"} pt-4 ${scrollClass(ctx.interactive)}`}>
        {(d.thumb && !ctx.interactive ? d.chapters.slice(0, 4) : d.chapters).map((ch, i) => (
          <li key={ch.label + i} className={`flex items-center gap-4 ${d.thumb ? "py-2" : "py-3"}`} style={{ ...FONT, borderTop: i === 0 ? undefined : `1px solid ${D.hair}` }}>
            <span className="flex w-10 shrink-0">
              <DotNumber el={ROLE.chapterNumbers} text={String(i + 1).padStart(2, "0")} height={16} color={i === 0 ? D.ink : "rgba(28,28,30,0.3)"} glow={false} />
            </span>
            <span data-el={ROLE.chapterLabels} className="min-w-0 flex-1 text-[17px] leading-snug" style={{ color: D.ink }}>
              {ch.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Code ───────────────────────────────────────────────────────────────────

export function CodeBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  const [active, setActive] = useState(0);
  if (payload.type !== "code" || payload.data.files.length === 0) return <CurrentBody ctx={ctx} />;
  const files = payload.data.files;
  const file = files[Math.min(active, files.length - 1)]!;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0" style={{ padding: `${PAD - 6}px ${PAD - 4}px 0` }}>
        <PageHead title={ctx.item.artifact.title} sizes={[[22, 28], [36, 25]]} fallback={22} />
        <div data-el={ROLE.fileNames} className="mt-4 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <button
              key={f.path}
              type="button"
              disabled={!ctx.interactive || files.length < 2}
              onClick={() => setActive(i)}
              className="rounded-full px-3.5 py-1.5 text-[12.5px]"
              style={{ ...FONT, ...(i === active ? { ...RAISED, color: D.ink } : { color: D.faint }) }}
            >
              {f.path}
            </button>
          ))}
        </div>
      </div>
      <pre
        data-el={ROLE.code}
        className={`min-h-0 flex-1 whitespace-pre-wrap px-6 py-5 text-[12.5px] leading-[1.65] ${scrollClass(ctx.interactive)}`}
        style={{ ...FONT, ...RAISED, color: "rgba(28,28,30,0.82)", margin: `${NEST_INSET + 4}px ${NEST_INSET}px ${NEST_INSET}px`, borderRadius: NEST_RADIUS }}
      >
        {file.content}
      </pre>
    </div>
  );
}
