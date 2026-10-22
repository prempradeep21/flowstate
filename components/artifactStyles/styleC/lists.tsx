"use client";

import { PRIMARY } from "../fonts";
import { useState } from "react";
import type { TableCell, TimelineEvent } from "@/lib/artifactTypes";
import { buildMonthWeeks } from "@/lib/calendarArtifact";
import { normalizeTableArtifactData } from "@/lib/tableArtifact";
import { CurrentBody } from "../current";
import type { ArtifactRenderContext } from "../types";
import { ROLE } from "../textSpec";
import { C, Display, INSET, Kicker, PAD, PAD_Y, ROW, SECTION, scrollClass, sentenceCase, sizeFor, splitTitle, tint, useWholeRows } from "./tokens";

/**
 * Working-data artifacts: things you read row by row. They sit on white, the
 * title leads at the top-left like a page heading (its weight set by how much
 * the content needs the room), and any second idea in the title moves to a
 * kicker underneath it.
 */

type Ctx = { ctx: ArtifactRenderContext };

/** Head + kicker, sized by length; used by every list-like body. */
function PageHead({ title, sizes, fallback }: { title: string; sizes: [number, number][]; fallback: number }) {
  const t = splitTitle(title);
  const head = t.lead ? `${t.lead}: ${t.head}` : t.head;
  const kicker = [t.sub ? sentenceCase(t.sub) : null, t.range].filter(Boolean).join(" · ");
  return (
    <div data-el={ROLE.title} className="flex shrink-0 flex-col gap-2">
      <Display size={sizeFor(head, sizes, fallback)}>{head}</Display>
      {kicker ? <Kicker>{kicker}</Kicker> : null}
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
  const rowsRef = useWholeRows<HTMLDivElement>(!ctx.interactive, "tbody > tr");
  if (payload.type !== "table") return <CurrentBody ctx={ctx} />;
  const { columns, rows } = normalizeTableArtifactData(payload.data);
  const numericCol = columns.map((col) => {
    const vals = rows.map((r) => cellValue(r[col.key])).filter((v) => v.trim());
    return vals.length > 0 && vals.filter((v) => NUMERIC.test(v)).length / vals.length >= 0.7;
  });
  const isTotal = (r: (typeof rows)[number]) => /^(total|all|sum)\b/i.test(cellValue(r[columns[0]!.key]));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: INSET }}>
      <PageHead title={ctx.item.artifact.title} sizes={[[24, 32], [40, 28]]} fallback={25} />
      <div ref={rowsRef} className={`min-h-0 flex-1 ${scrollClass(ctx.interactive)}`} style={{ marginTop: SECTION }}>
        <table className="w-full border-collapse text-left" style={{ color: C.ink }}>
          <thead data-el={ROLE.columnHeaders}>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={col.key}
                  className={`pr-5 align-bottom text-[16px] font-medium leading-tight last:pr-0 ${numericCol[i] ? "text-right" : ""}`}
                  style={{ color: C.ink, paddingBottom: ROW }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody data-el={ROLE.cells}>
            {rows.map((row, ri) => {
              const total = isTotal(row);
              return (
                <tr
                  key={ri}
                  style={{ borderTop: total ? `2px solid ${C.ink}` : `1px solid ${C.hair}` }}
                >
                  {columns.map((col, ci) => {
                    const cell = row[col.key];
                    const value = cellValue(cell);
                    return (
                      <td
                        key={col.key}
                        className={`pr-5 align-top text-[18px] font-medium leading-snug last:pr-0 ${numericCol[ci] ? "text-right tabular-nums" : ""}`}
                        style={{ paddingTop: ROW, paddingBottom: ROW }}
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
      <span className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full" style={{ background: C.inkSurface }}>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke={C.lime} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="h-[22px] w-[22px] shrink-0 rounded-full"
      style={{ boxShadow: `inset 0 0 0 2.5px ${state === "next" ? C.orange : C.ink}` }}
    />
  );
}

/** Headline, a progress bar that says how far along you are, then the list — the next item in orange. */
export function TodoBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  const initial = payload.type === "todo" ? payload.data.items : [];
  const [items, setItems] = useState(initial);
  const rowsRef = useWholeRows<HTMLUListElement>(!ctx.interactive);
  if (payload.type !== "todo") return <CurrentBody ctx={ctx} />;

  const done = items.filter((i) => i.checked).length;
  const next = items.findIndex((i) => !i.checked);
  const share = items.length ? done / items.length : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: INSET }}>
      <PageHead title={ctx.item.artifact.title} sizes={[[16, 38], [30, 32], [46, 27]]} fallback={24} />
      <div className="shrink-0" style={{ marginTop: SECTION }}>
        <div data-el={ROLE.progress} className="mb-2.5 flex justify-between text-[16px] font-medium tabular-nums" style={{ color: C.ink }}>
          <span>
            {done} of {items.length} done
          </span>
          <span>{Math.round(share * 100)}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full" style={{ background: C.well }}>
          <div className="h-full rounded-full" style={{ width: `${share * 100}%`, background: C.ink }} />
        </div>
      </div>
      <ul ref={rowsRef} className={`mt-3 min-h-0 flex-1 ${scrollClass(ctx.interactive)}`}>
        {items.map((item, i) => {
          const state = item.checked ? "done" : i === next ? "next" : "open";
          return (
            <li key={item.id} style={{ borderTop: i === 0 ? undefined : `1px solid ${C.hair}` }}>
              <button
                type="button"
                disabled={!ctx.interactive}
                onClick={() => setItems((all) => all.map((x) => (x.id === item.id ? { ...x, checked: !x.checked } : x)))}
                className="flex w-full items-center gap-3.5 text-left"
                style={{ paddingTop: ROW, paddingBottom: ROW }}
              >
                <Check state={state} />
                <span
                  data-el={ROLE.itemLabels}
                  className="min-w-0 flex-1 text-[18px] font-medium leading-snug"
                  // Finished items step back (struck, muted); everything still to do is full ink.
                  style={{ color: item.checked ? C.muted : C.ink, textDecoration: item.checked ? "line-through" : undefined }}
                >
                  {item.label}
                </span>
                {state === "next" ? <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: C.orange }} /> : null}
                {item.dueDate ? (
                  <span data-el={ROLE.dueDates} className="shrink-0 text-[16px] font-medium tabular-nums" style={{ color: C.ink }}>
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

/** The title's subject in large type, the month as its kicker, the grid, then the first events. */
export function CalendarBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  const rowsRef = useWholeRows<HTMLUListElement>(!ctx.interactive);
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
  const titleRest = [t.sub ? sentenceCase(t.sub) : null, t.range].filter(Boolean).join(" · ");
  const events = [...d.events].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const firstHighlight = [...highlighted].sort()[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: INSET }}>
      <div className="flex shrink-0 items-end justify-between gap-4">
        <div data-el={ROLE.title} className="min-w-0">
          <Display size={sizeFor(t.head, [[14, 38], [26, 32]], 27)}>
            {t.lead ? `${t.lead}: ${t.head}` : t.head}
          </Display>
          {titleRest ? (
            <div className="mt-2">
              <Kicker>{titleRest}</Kicker>
            </div>
          ) : null}
        </div>
        <p data-el={ROLE.month} className="shrink-0 text-right text-[16px] font-medium leading-tight tabular-nums" style={{ color: C.ink }}>
          <span className="block text-[30px] font-medium leading-none tracking-[-0.03em]" style={{ fontFamily: PRIMARY, color: C.ink }}>
            {MONTHS_LONG[d.viewMonth - 1]}
          </span>
          {d.viewYear}
        </p>
      </div>
      <div data-el={ROLE.weekdays} className="mt-6 grid shrink-0 grid-cols-7 text-center text-[14px] font-medium" style={{ color: C.ink }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div data-el={ROLE.dayNumbers} className="mt-1 flex shrink-0 flex-col">
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
                    className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full text-[18px] font-medium tabular-nums"
                    // A filled day takes the dark ink its bright fill needs, in both modes.
                    style={{ background: accent ? C.orange : hi ? C.lime : "transparent", color: accent || hi ? C.onBright : C.ink }}
                  >
                    {cell.day}
                  </span>
                  <span className="mt-[1px] h-[4px] w-[4px] rounded-full" style={{ background: n && !hi ? C.ink : "transparent" }} />
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <ul ref={rowsRef} className={`mt-4 min-h-0 flex-1 pt-1.5 ${scrollClass(ctx.interactive)}`} style={{ borderTop: `1px solid ${C.hair}` }}>
        {events.map((e) => (
          <li key={e.id} className="flex items-baseline gap-3 text-[17px] font-medium leading-snug" style={{ color: C.ink, paddingTop: ROW - 4, paddingBottom: ROW - 4 }}>
            <span data-el={ROLE.eventDates} className="w-[64px] shrink-0 tabular-nums">
              {shortDate(e.startDate)}
            </span>
            <span data-el={ROLE.eventLabels} className="min-w-0">
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
 * A poster: the subject set huge on the left, then the life as a line of
 * moments, labels alternating above and below. The latest moment is orange.
 */
export function TimelineBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  if (payload.type !== "timeline") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const events = [...d.events].sort((a, b) => a.at.localeCompare(b.at));
  const t = splitTitle(ctx.item.artifact.title);
  const big = t.lead ?? t.head;
  // Everything after the subject, so no word of the title is lost.
  const second = t.lead ? [t.head, t.sub].filter(Boolean).join(" — ") : t.sub;
  const n = events.length;
  const labelW = Math.min(250, Math.max(130, ((2 * 94) / Math.max(1, n - 1)) * 10));
  /** Half the band the line runs through: the largest dot, its stem and the gap to the labels. */
  const BAND = 13 + 44;

  const placed = events.map((e, i) => {
    const latest = i === n - 1;
    return { e, i, x: n === 1 ? 50 : 3 + (i * 94) / (n - 1), above: i % 2 === 0, latest, r: latest ? 13 : e.highlight ? 10 : 8 };
  });

  /**
   * A moment's label, in normal flow so the card grows to hold all of it. Every
   * label on one side shares one grid cell; the margin slides it to its moment,
   * and the end labels hang inward so they never run off the card.
   */
  const label = ({ e, i, x, above, latest, r }: (typeof placed)[number]) => {
    const w = i === 0 || latest ? labelW * 0.72 : labelW;
    const marginLeft = i === 0 ? `calc(${x}% - ${r}px)` : latest ? `calc(${x}% + ${r}px - ${w}px)` : `calc(${x}% - ${w / 2}px)`;
    const stamp = (
      <p data-el={ROLE.eventDates} className="text-[26px] font-medium leading-none tabular-nums" style={{ fontFamily: PRIMARY, color: C.ink }}>
        {eventStamp(e, d.scale)}
      </p>
    );
    return (
      <div
        key={e.id}
        className={i === 0 ? "text-left" : latest ? "text-right" : "text-center"}
        style={{ gridArea: above ? "1 / 1" : "3 / 1", alignSelf: above ? "end" : "start", width: w, marginLeft }}
      >
        {above ? null : stamp}
        <p data-el={ROLE.eventLabels} className={`text-[19px] font-medium leading-snug ${above ? "mb-2.5" : "mt-2.5"}`} style={{ color: C.ink }}>
          {e.label}
        </p>
        {above ? stamp : null}
      </div>
    );
  };

  return (
    <div className="flex min-h-0 flex-1" style={{ padding: `${PAD_Y + 8}px ${PAD + 10}px` }}>
      <div data-el={ROLE.title} className="flex w-[25%] min-w-[300px] max-w-[440px] shrink-0 flex-col justify-between gap-6 pr-10">
        <div>
          <Display size={sizeFor(big, [[14, 76], [22, 64], [34, 52]], 44)}>{big}</Display>
          {second ? (
            <p className="mt-4 text-[24px] font-medium leading-tight tracking-[-0.01em]" style={{ fontFamily: PRIMARY, color: C.ink }}>
              {sentenceCase(second)}
            </p>
          ) : null}
        </div>
        {/* The title's own span of years, when it names one; otherwise the line itself is the poster's base. */}
        {t.range ? (
          <p className="text-[18px] font-medium tabular-nums" style={{ color: C.ink }}>
            {t.range}
          </p>
        ) : (
          <span aria-hidden className="block h-[3px] w-14 rounded-full" style={{ background: C.orange }} />
        )}
      </div>
      {/* Labels above, the line, labels below — the two label rows share the spare height evenly. */}
      <div className="grid min-w-0 flex-1" style={{ gridTemplateColumns: "minmax(0, 1fr)", gridTemplateRows: `1fr ${BAND * 2}px 1fr` }}>
        {placed.filter((p) => p.above).map(label)}
        <div className="relative" style={{ gridArea: "2 / 1" }}>
          <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full" style={{ background: C.ink }} />
          {placed.map(({ e, x, above, latest, r }) => (
            <div key={e.id} className="absolute inset-y-0" style={{ left: `${x}%` }}>
              <span
                className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: r * 2,
                  height: r * 2,
                  background: latest ? C.orange : e.highlight ? C.ink : C.lime,
                  boxShadow: `0 0 0 ${latest || e.highlight ? 4 : 3}px ${latest || e.highlight ? C.lime : C.ink}`,
                }}
              />
              <span
                className="absolute left-0 w-[1.5px] -translate-x-1/2"
                style={{
                  background: C.ink,
                  opacity: 0.3,
                  ...(above ? { bottom: "50%", top: 6, marginBottom: r + 4 } : { top: "50%", bottom: 6, marginTop: r + 4 }),
                }}
              />
            </div>
          ))}
        </div>
        {placed.filter((p) => !p.above).map(label)}
      </div>
    </div>
  );
}

// ─── Mechanism ──────────────────────────────────────────────────────────────

/** "How X happens" reads as a sentence: title on the left, the chain of steps running out of it. */
export function MechanismBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  if (payload.type !== "mechanism") return <CurrentBody ctx={ctx} />;
  const { steps, edges } = payload.data;
  // Follow the edges from the step nothing points to; fall back to authored order.
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
    <div className="flex min-h-0 flex-1 overflow-hidden" style={{ padding: INSET }}>
      <div className="flex w-[24%] min-w-[200px] max-w-[300px] shrink-0 flex-col justify-between pr-6">
        <div data-el={ROLE.title}>
          <Display size={sizeFor(title, [[22, 34], [34, 30]], 26)}>
            {title}
          </Display>
        </div>
        {/* The sentence runs on into the chain: an arrow out of the title toward step one. */}
        <svg width="40" height="20" viewBox="0 0 40 20" aria-hidden className="mt-5 shrink-0">
          <path d="M2 10h33M27 3l8 7-8 7" fill="none" stroke={C.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <ol className="relative grid min-w-0 flex-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        <span aria-hidden className="absolute left-0 right-[8%] top-[19px] h-[2px]" style={{ background: C.ink, opacity: 0.18 }} />
        {chain.map((s, i) => {
          const last = i === n - 1;
          return (
            <li key={s.id} className="relative flex min-w-0 flex-col pr-4">
              <span
                data-el={ROLE.stepNumbers}
                className="relative inline-flex h-[40px] w-[40px] items-center justify-center rounded-full text-[18px] font-medium tabular-nums"
                style={{ background: last ? C.orange : C.inkSurface, color: last ? C.onBright : C.pure }}
              >
                {i + 1}
              </span>
              <p data-el={ROLE.stepLabels} className="mt-3.5 text-[18px] font-medium leading-snug" style={{ color: C.ink }}>
                {s.label}
              </p>
              {s.note?.trim() ? (
                <p data-el={ROLE.stepNotes} className="mt-1.5 text-[16px] font-medium leading-snug" style={{ color: C.ink }}>
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
  const rowsRef = useWholeRows<HTMLDivElement>(!ctx.interactive, "section > p, section a");
  if (payload.type !== "linkgroup") return <CurrentBody ctx={ctx} />;
  const { sections } = payload.data;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: INSET }}>
      <PageHead title={ctx.item.artifact.title} sizes={[[20, 38], [34, 32]]} fallback={27} />
      <div ref={rowsRef} className={`flex min-h-0 flex-1 flex-col gap-6 ${scrollClass(ctx.interactive)}`} style={{ marginTop: SECTION }}>
        {sections.map((section) => (
          <section key={section.label}>
            <p data-el={ROLE.sectionLabels} className="mb-3 text-[16px] font-medium" style={{ color: C.ink }}>
              {section.label}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {section.links.map((link) => (
                <a
                  key={link.url + link.label}
                  href={ctx.interactive ? link.url : undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-full items-center gap-2.5 rounded-[20px] py-2 pl-2 pr-4 text-[17px] font-medium leading-snug"
                  style={{ background: C.well, color: C.ink }}
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={link.iconUrl ?? `https://www.google.com/s2/favicons?domain=${domainOf(link.url)}&sz=64`}
                      alt=""
                      className="h-4 w-4"
                    />
                  </span>
                  <span data-el={ROLE.linkLabels} className="min-w-0">
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

/** The masthead: the recording's own title is the headline; the artifact title is its kicker. */
export function EpisodeBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  const rowsRef = useWholeRows<HTMLOListElement>(!ctx.interactive);
  if (payload.type !== "episode") return <CurrentBody ctx={ctx} />;
  const d = payload.data;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: INSET }}>
      <div data-el={ROLE.title}>
        <Kicker>{ctx.item.artifact.title}</Kicker>
      </div>
      <div data-el={ROLE.episodeTitle} className="mt-2.5 shrink-0">
        <Display size={sizeFor(d.videoTitle, [[24, 56], [40, 44]], 34)}>
          {d.videoTitle}
        </Display>
      </div>
      {d.description?.trim() ? (
        <p data-el={ROLE.description} className="mt-4 shrink-0 text-[20px] font-medium leading-snug" style={{ color: C.ink }}>
          {d.description}
        </p>
      ) : null}
      {d.thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={d.thumb} alt="" className="min-h-[200px] w-full flex-1 rounded-[22px] object-cover" style={{ marginTop: SECTION }} />
      ) : null}
      <ol ref={rowsRef} className={`${d.thumb ? "shrink-0" : "mt-auto min-h-0 shrink"} ${scrollClass(ctx.interactive)}`} style={{ paddingTop: SECTION - 4 }}>
        {d.chapters.map((ch, i) => (
          <li key={ch.label + i} className="flex items-baseline gap-4" style={{ borderTop: `1px solid ${C.hair}`, paddingTop: ROW, paddingBottom: ROW }}>
            <span data-el={ROLE.chapterNumbers} className="w-11 shrink-0 text-[29px] font-medium leading-none tracking-[-0.02em] tabular-nums" style={{ fontFamily: PRIMARY, color: i === 0 ? C.orange : C.ink }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span data-el={ROLE.chapterLabels} className="min-w-0 flex-1 text-[22px] font-medium leading-snug" style={{ color: C.ink }}>
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: INSET }}>
      <PageHead title={ctx.item.artifact.title} sizes={[[22, 28], [36, 25]]} fallback={22} />
      {files.length > 0 ? (
        <div data-el={ROLE.fileNames} className="mt-5 flex shrink-0 flex-wrap gap-2">
          {files.map((f, i) => (
            <button
              key={f.path}
              type="button"
              disabled={!ctx.interactive}
              onClick={() => setActive(i)}
              className="rounded-full px-3 py-1 font-mono text-[14px] font-medium"
              style={{ background: i === active ? C.inkSurface : C.well, color: i === active ? C.pure : C.ink }}
            >
              {f.path}
            </button>
          ))}
        </div>
      ) : null}
      <pre
        data-el={ROLE.code}
        className={`min-h-0 flex-1 whitespace-pre-wrap rounded-[22px] px-6 py-5 font-mono text-[15px] font-medium leading-[1.6] ${scrollClass(ctx.interactive)}`}
        style={{ background: C.well, color: C.ink, margin: "20px -14px 0" }}
      >
        {file.content}
      </pre>
    </div>
  );
}
