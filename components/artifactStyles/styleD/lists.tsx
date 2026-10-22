"use client";

import { useState } from "react";
import type { TableCell } from "@/lib/artifactTypes";
import { buildMonthWeeks } from "@/lib/calendarArtifact";
import { normalizeTableArtifactData } from "@/lib/tableArtifact";
import { CurrentBody } from "../current";
import type { ArtifactRenderContext } from "../types";
import { ROLE } from "../textSpec";
import { useHugs } from "../hug";
import {
  D,
  inkA,
  DISPLAY,
  FONT,
  Figure,
  NEST_INSET,
  NEST_RADIUS,
  PAD,
  RAISED,
  Sub,
  Tag,
  Title,
  TitleBlock,
  Track,
  sentenceCase,
  sizeFor,
  splitTitle,
  useClamps,
  useListBox,
  usePalette,
} from "./tokens";

/**
 * Working data on frost. The title leads top-left in light display type with
 * its second idea as a line under it; rows are separated by the faintest
 * hairline, and anything you'd press or tag sits raised above the card. A
 * card holds every row it has — lists only scroll or fade in a fixed box.
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

/** The header row's band: a lime pill the column headers sit in. */
const HEAD_RADIUS = 14;
const HEAD_PAD_X = 12;

/**
 * The column headers sit in one lime band — the table's lime element — and
 * the rows below are plain ink on frost, parted by hairlines.
 */
export function TableBody({ ctx }: Ctx) {
  const list = useListBox(ctx.interactive);
  // A hugging card given more height than its rows need (a user drag) shares
  // the room out across the rows instead of leaving a blank well below them.
  const fills = useHugs();
  const payload = ctx.item.payload;
  if (payload.type !== "table") return <CurrentBody ctx={ctx} />;
  const { columns, rows } = normalizeTableArtifactData(payload.data);
  const numericCol = columns.map((col) => {
    const vals = rows.map((r) => cellValue(r[col.key])).filter((v) => v.trim());
    return vals.length > 0 && vals.filter((v) => NUMERIC.test(v)).length / vals.length >= 0.7;
  });
  const isTotal = (r: (typeof rows)[number]) => /^(total|all|sum)\b/i.test(cellValue(r[columns[0]!.key]));
  const last = columns.length - 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${PAD}px ${PAD - HEAD_PAD_X}px ${PAD - 12}px` }}>
      <div style={{ paddingInline: HEAD_PAD_X }}>
        <PageHead title={ctx.item.artifact.title} sizes={[[24, 32], [40, 28]]} fallback={25} />
      </div>
      <div className={`mt-6 min-h-0 flex-1 ${fills ? "flex flex-col" : ""} ${list.className}`} style={list.style}>
        <table className={`w-full text-left ${fills ? "flex-1" : ""}`} style={{ ...FONT, color: D.ink, borderCollapse: "separate", borderSpacing: 0 }}>
          <thead data-el={ROLE.columnHeaders}>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={col.key}
                  className={`text-[16px] font-medium leading-snug ${numericCol[i] ? "text-right" : ""}`}
                  style={{
                    background: D.accent,
                    color: D.accentInk,
                    padding: `10px ${i === last ? HEAD_PAD_X : 16}px 10px ${i === 0 ? HEAD_PAD_X : 0}px`,
                    borderRadius: i === 0 ? `${HEAD_RADIUS}px 0 0 ${HEAD_RADIUS}px` : i === last ? `0 ${HEAD_RADIUS}px ${HEAD_RADIUS}px 0` : 0,
                    overflowWrap: "break-word",
                  }}
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
                <tr key={ri}>
                  {columns.map((col, ci) => {
                    const cell = row[col.key];
                    const value = cellValue(cell);
                    return (
                      <td
                        key={col.key}
                        className={`py-[12px] align-top text-[19px] leading-snug ${numericCol[ci] ? "text-right tabular-nums" : ""}`}
                        style={{
                          fontWeight: 500,
                          color: D.ink,
                          padding: `12px ${ci === last ? HEAD_PAD_X : 16}px 12px ${ci === 0 ? HEAD_PAD_X : 0}px`,
                          borderTop: ri === 0 ? undefined : `1px solid ${total ? inkA(20) : D.hair}`,
                          overflowWrap: "break-word",
                        }}
                      >
                        {/* A blank cell keeps its line: an empty table reads as ruled rows. */}
                        {value || "\u00a0"}
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
      style={state === "next" ? { ...RAISED, boxShadow: `${RAISED.boxShadow}, inset 0 0 0 1.5px ${inkA(55)}` } : { boxShadow: `inset 0 0 0 1.5px ${inkA(22)}` }}
    />
  );
}

/** Headline, the reference's track showing how far along, then the list — the next item raised. */
export function TodoBody({ ctx }: Ctx) {
  const list = useListBox(ctx.interactive);
  const clamps = useClamps();
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
          // One part, the wrapper: the corner circle's clearance pads the
          // whole "n / total", not the figure alone (which left "/ 3" under ⋯).
          <div data-el={ROLE.progress} className="flex shrink-0 items-baseline gap-1.5 pt-1">
            <Figure text={String(done)} size={34} color={D.ink} />
            <span style={{ ...FONT, fontSize: 18, color: D.ink }}>/ {items.length}</span>
          </div>
        }
      />
      <div className="mt-5 shrink-0">
        <Track share={share} />
      </div>
      <ul className={`mt-4 min-h-0 flex-1 ${list.className}`} style={{ marginInline: -12, paddingInline: 4, ...list.style }}>
        {items.map((item, i) => {
          const state = item.checked ? "done" : i === next ? "next" : "open";
          return (
            <li key={item.id} className="py-[3px]">
              <button
                type="button"
                disabled={!ctx.interactive}
                onClick={() => {
                  const next = items.map((x) => (x.id === item.id ? { ...x, checked: !x.checked } : x));
                  setItems(next);
                  if (payload.type === "todo") ctx.onPayloadChange?.({ ...payload, data: { ...payload.data, items: next } });
                }}
                className="flex w-full items-center gap-3.5 rounded-[18px] px-3 py-[9px] text-left"
                style={state === "next" ? RAISED : undefined}
              >
                <Check state={state} />
                <span
                  data-el={ROLE.itemLabels}
                  className={`min-w-0 flex-1 text-[19px] leading-snug ${clamps ? "truncate" : ""}`}
                  style={{ ...FONT, color: item.checked ? D.faint : D.ink, textDecoration: item.checked ? "line-through" : undefined, textDecorationColor: inkA(25), overflowWrap: "break-word" }}
                >
                  {item.label}
                </span>
                {item.dueDate ? (
                  <span data-el={ROLE.dueDates} className="shrink-0 text-[16px] tabular-nums" style={{ ...FONT, color: D.ink }}>
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
  const list = useListBox(ctx.interactive);
  const clamps = useClamps();
  const payload = ctx.item.payload;
  if (payload.type !== "calendar") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
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
      <div data-el={ROLE.weekdays} className="mt-5 grid shrink-0 grid-cols-7 text-center text-[14px]" style={{ ...FONT, color: D.ink }}>
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
                    className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full text-[18px] tabular-nums"
                    style={{
                      ...FONT,
                      ...(accent ? { background: D.accent, color: D.accentInk, boxShadow: `0 4px 12px -3px ${D.accentShadow}` } : hi ? RAISED : {}),
                      color: accent ? D.accentInk : D.ink,
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
      <ul className={`mt-3 min-h-0 flex-1 ${list.className}`} style={{ borderTop: `1px solid ${D.hair}`, ...list.style }}>
        {events.map((e) => (
          <li key={e.id} className="flex items-baseline gap-3 pt-2.5 text-[17px] leading-snug" style={{ ...FONT, color: D.ink }}>
            <span data-el={ROLE.eventDates} className="w-[64px] shrink-0 tabular-nums" style={{ color: D.ink }}>
              {shortDate(e.startDate)}
            </span>
            <span data-el={ROLE.eventLabels} className={`min-w-0 ${clamps ? "truncate" : ""}`} style={{ overflowWrap: "break-word" }}>
              {e.title}
            </span>
          </li>
        ))}
      </ul>
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
        <span aria-hidden className="absolute left-[20px] right-[10%] top-[21px] h-[1.5px]" style={{ background: inkA(12) }} />
        {chain.map((s, i) => {
          const last = i === n - 1;
          return (
            <li key={s.id} className="relative flex min-w-0 flex-col pr-5" style={FONT}>
              <span
                data-el={ROLE.stepNumbers}
                className="relative inline-flex h-[42px] w-[42px] items-center justify-center rounded-full text-[18px] tabular-nums"
                style={last ? { background: D.accent, color: D.accentInk, boxShadow: `0 6px 14px -4px ${D.accentShadow}` } : { ...RAISED, color: D.ink }}
              >
                {i + 1}
              </span>
              <p data-el={ROLE.stepLabels} className="mt-4 text-[19px] leading-snug" style={{ color: D.ink, overflowWrap: "break-word" }}>
                {s.label}
              </p>
              {s.note?.trim() ? (
                <p data-el={ROLE.stepNotes} className="mt-2 text-[16px] leading-snug" style={{ color: D.ink, overflowWrap: "break-word" }}>
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

/**
 * Grouped outbound links, laid out like the vanilla card: each section a
 * label over a row of link tiles (a raised disc holding the site's icon, its
 * name under it), sections parted by a hairline.
 */
export function LinkGroupBody({ ctx }: Ctx) {
  const list = useListBox(ctx.interactive);
  const payload = ctx.item.payload;
  if (payload.type !== "linkgroup") return <CurrentBody ctx={ctx} />;
  const { sections } = payload.data;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${PAD}px ${PAD}px ${PAD - 8}px` }}>
      <PageHead title={ctx.item.artifact.title} sizes={[[20, 36], [34, 31]]} fallback={26} />
      <div className={`mt-6 flex min-h-0 flex-1 flex-col ${list.className}`} style={{ padding: 6, margin: -6 }}>
        {sections.map((section, si) => (
          <section
            key={`${section.label}-${si}`}
            className={si > 0 ? "mt-5 pt-5" : undefined}
            style={si > 0 ? { borderTop: `1px solid ${D.hair}` } : undefined}
          >
            {section.label ? (
              <p data-el={ROLE.sectionLabels} className="mb-4 text-[16px]" style={{ ...FONT, color: D.ink }}>
                {section.label}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-x-3 gap-y-4">
              {section.links.map((link) => (
                <LinkTile key={link.url + link.label} link={link} interactive={ctx.interactive} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function LinkTile({ link, interactive }: { link: { url: string; label: string; iconUrl?: string }; interactive: boolean }) {
  const [broken, setBroken] = useState(false);
  const icon = link.iconUrl ?? `https://www.google.com/s2/favicons?domain=${domainOf(link.url)}&sz=64`;
  return (
    <a
      href={interactive ? link.url : undefined}
      target="_blank"
      rel="noreferrer noopener"
      title={link.url}
      onClick={(e) => e.stopPropagation()}
      className="flex w-[104px] shrink-0 flex-col items-center gap-2.5 text-center"
      style={FONT}
    >
      <span className="inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-full" style={RAISED}>
        {!broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="h-7 w-7 object-contain" onError={() => setBroken(true)} />
        ) : (
          <span className="text-[22px]" style={{ color: D.ink }}>{link.label.slice(0, 1).toUpperCase()}</span>
        )}
      </span>
      <span data-el={ROLE.linkLabels} className="text-[16px] leading-snug" style={{ color: D.ink, overflowWrap: "break-word" }}>
        {link.label}
      </span>
    </a>
  );
}

// ─── Episode ────────────────────────────────────────────────────────────────

const youtubeIdOf = (url?: string): string | null => {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1]! : null;
};

/** The episode's one lime element: the play disc on its thumbnail. */
function LimePlay({ size = 76 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full"
      style={{ width: size, height: size, background: D.accent, boxShadow: "0 10px 26px -10px rgba(20,22,16,0.45), inset 0 1px 0 rgba(255,255,255,0.55)" }}
    >
      <svg width={size * 0.34} height={size * 0.34} viewBox="0 0 24 24" aria-hidden style={{ marginLeft: size * 0.04 }}>
        <path d="M7 4.5v15l12.5-7.5L7 4.5Z" fill={D.accentInk} stroke={D.accentInk} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/**
 * The masthead for an imported video, in the vanilla card's structure: the
 * recording's title, show line and summary beside its thumbnail, then the
 * chapter index — each row its start time and title, and on the canvas a
 * row frames that chapter's group when pressed.
 */
export function EpisodeBody({ ctx }: Ctx) {
  const payload = ctx.item.payload;
  const [playing, setPlaying] = useState(false);
  if (payload.type !== "episode") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const meta = [d.channel, d.duration].filter(Boolean).join(" · ");
  const videoId = youtubeIdOf(d.url);
  const focusChapter = ctx.focusGroup;

  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ padding: `${PAD}px ${PAD}px ${PAD - 12}px` }}>
      <Sub el={ROLE.title} size={18} color={D.ink} lines={1}>
        {ctx.item.artifact.title}
      </Sub>
      <div className="mt-5 flex shrink-0 items-start gap-8">
        <div className="min-w-0 flex-1">
          <Title el={ROLE.episodeTitle} size={sizeFor(d.videoTitle, [[40, 40], [70, 34]], 30)} lines={4}>
            {d.videoTitle}
          </Title>
          {meta ? (
            <p className="mt-3 text-[18px] leading-snug" style={{ ...FONT, color: D.ink, fontVariantNumeric: "tabular-nums" }}>
              {meta}
            </p>
          ) : null}
          {d.description?.trim() ? (
            <div className="mt-4">
              <Sub el={ROLE.description} size={18} lines={5}>
                {d.description}
              </Sub>
            </div>
          ) : null}
        </div>
        {d.thumb ? (
          <div className="w-[50%] shrink-0" style={{ ...RAISED, borderRadius: NEST_RADIUS, padding: 6 }} onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-video w-full overflow-hidden" style={{ borderRadius: NEST_RADIUS - 6 }}>
              {playing && videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                  title={d.videoTitle}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              ) : (
                <button
                  type="button"
                  disabled={!ctx.interactive || !videoId}
                  onClick={() => setPlaying(true)}
                  className="absolute inset-0 h-full w-full"
                  aria-label="Play episode"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.thumb} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <LimePlay />
                  </span>
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
      <ol className="mt-7 shrink-0">
        {d.chapters.map((ch, i) => {
          const clickable = Boolean(ctx.interactive && ch.groupId && focusChapter);
          return (
            <li key={ch.label + i} style={{ borderTop: `1px solid ${D.hair}` }}>
              <button
                type="button"
                disabled={!clickable}
                onClick={(e) => {
                  e.stopPropagation();
                  if (ch.groupId) focusChapter?.(ch.groupId);
                }}
                className={`flex w-full items-baseline gap-5 py-3.5 text-left ${clickable ? "cursor-pointer" : "cursor-default"}`}
                style={FONT}
              >
                <span className="flex w-16 shrink-0">
                  <Figure el={ROLE.chapterNumbers} text={ch.start ?? String(i + 1).padStart(2, "0")} size={18} color={D.ink} style={{ fontVariantNumeric: "tabular-nums" }} />
                </span>
                <span data-el={ROLE.chapterLabels} className="min-w-0 flex-1 text-[22px] leading-snug" style={{ color: D.ink, overflowWrap: "break-word" }}>
                  {ch.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── Code ───────────────────────────────────────────────────────────────────

export function CodeBody({ ctx }: Ctx) {
  const list = useListBox(ctx.interactive);
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
              className="rounded-full px-3.5 py-1.5 text-[15px]"
              style={{ ...FONT, ...(i === active ? { ...RAISED, color: D.ink } : { color: D.ink }) }}
            >
              {f.path}
            </button>
          ))}
        </div>
      </div>
      <pre
        data-el={ROLE.code}
        className={`min-h-0 flex-1 whitespace-pre-wrap px-6 py-5 text-[15px] leading-[1.6] ${list.className}`}
        style={{ ...FONT, ...RAISED, color: D.ink, margin: `${NEST_INSET + 4}px ${NEST_INSET}px ${NEST_INSET}px`, borderRadius: NEST_RADIUS, overflowWrap: "break-word" }}
      >
        {file.content}
      </pre>
    </div>
  );
}
