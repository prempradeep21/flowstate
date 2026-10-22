"use client";

import { useState } from "react";
import type { TableCell, TimelineEvent } from "@/lib/artifactTypes";
import { buildMonthWeeks } from "@/lib/calendarArtifact";
import { normalizeTableArtifactData } from "@/lib/tableArtifact";
import { CurrentBody } from "../current";
import { scrollClass } from "../styleC/tokens";
import type { ArtifactRenderContext } from "../types";
import { ROLE } from "../textSpec";
import { V, chipStyle, labelStyle, padTop, ruleStyle, useLook } from "./look";

/**
 * Kit lists: things read row by row. The Look's rule (hairline, dashed,
 * thick) separates rows; its chip shape tags them; its label case heads
 * columns. Nothing here prints the title, and nothing prints a count of its
 * own ("15 moments", "7 events") — every text is a tagged part (textSpec.ts).
 */

type Ctx = { ctx: ArtifactRenderContext };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function shortDate(iso?: string): string | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}`;
}

/**
 * A list that shows only whole rows: when it isn't scrollable, rows that don't
 * fit wrap into a second column outside the box instead of showing half a line.
 */
const wholeRows = (interactive: boolean) => (interactive ? scrollClass(true) : "flex flex-col flex-wrap content-start overflow-hidden [&>li]:w-full");

// ─── Table ──────────────────────────────────────────────────────────────────

const cellValue = (c: string | TableCell | undefined) => (typeof c === "string" ? c : c?.value ?? "");
const NUMERIC = /^[\s~≈+\-−$€£₹]*[\d.,]+\s*(?:%|[kKmMbB]n?|x|×|hrs?|h|s|yrs?)?\s*$|^[—–-]$/;

export function TableBody({ ctx }: Ctx) {
  const look = useLook();
  const payload = ctx.item.payload;
  if (payload.type !== "table") return <CurrentBody ctx={ctx} />;
  const { columns, rows } = normalizeTableArtifactData(payload.data);
  const numericCol = columns.map((col) => {
    const vals = rows.map((r) => cellValue(r[col.key])).filter((v) => v.trim());
    return vals.length > 0 && vals.filter((v) => NUMERIC.test(v)).length / vals.length >= 0.7;
  });
  const isTotal = (r: (typeof rows)[number]) => /^(total|all|sum)\b/i.test(cellValue(r[columns[0]!.key]));
  const headRule = look.rule === "thick" ? `2px solid ${V.ink}` : look.rule === "dashed" ? `1.5px dashed ${V.ink}` : `1px solid ${V.ink}`;

  return (
    <div className={`min-h-0 flex-1 ${scrollClass(ctx.interactive)}`} style={{ padding: `${padTop(look, look.pad - 8)}px ${look.pad}px ${look.pad - 8}px` }}>
      <table className="w-full border-collapse text-left" style={{ color: V.ink, fontFamily: look.font.body }}>
        <thead data-el={ROLE.columnHeaders}>
          <tr>
            {columns.map((col, i) => (
              <th key={col.key} className={`pb-2 pr-3 align-bottom last:pr-0 ${numericCol[i] ? "text-right" : ""}`} style={{ ...labelStyle(look), borderBottom: headRule }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody data-el={ROLE.cells}>
          {rows.map((row, ri) => {
            const total = isTotal(row);
            return (
              <tr key={ri} style={ri === 0 ? undefined : total ? { borderTop: `2px solid ${V.ink}` } : ruleStyle(look)}>
                {columns.map((col, ci) => {
                  const cell = row[col.key];
                  const value = cellValue(cell);
                  return (
                    <td
                      key={col.key}
                      className={`py-[9px] pr-3 align-top text-[17px] font-medium leading-snug last:pr-0 ${numericCol[ci] ? "text-right tabular-nums" : ""}`}
                      style={{ color: V.ink }}
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
  );
}

// ─── Todo ───────────────────────────────────────────────────────────────────

function Check({ state }: { state: "done" | "next" | "open" }) {
  const look = useLook();
  const radius = look.chip === "block" ? 3 : look.chip === "outline" ? 4 : 999;
  if (state === "done") {
    return (
      <span className="inline-flex h-[20px] w-[20px] shrink-0 items-center justify-center" style={{ background: V.ink, borderRadius: radius }}>
        <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
          <path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke={V.card} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="h-[20px] w-[20px] shrink-0"
      style={{ borderRadius: radius, boxShadow: `inset 0 0 0 ${Math.max(2, look.stroke)}px ${state === "next" ? V.accent : V.faint}`, background: state === "next" ? V.accent : "transparent", opacity: state === "next" ? 1 : 1 }}
    />
  );
}

export function TodoBody({ ctx }: Ctx) {
  const look = useLook();
  const payload = ctx.item.payload;
  const initial = payload.type === "todo" ? payload.data.items : [];
  const [items, setItems] = useState(initial);
  if (payload.type !== "todo") return <CurrentBody ctx={ctx} />;

  const done = items.filter((i) => i.checked).length;
  const next = items.findIndex((i) => !i.checked);
  const share = items.length ? done / items.length : 0;
  const barRadius = look.bar === "pill" || look.bar === "cap" ? 999 : 2;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${padTop(look, look.pad - 6)}px ${look.pad}px ${look.pad - 8}px` }}>
      <div className="shrink-0">
        <div data-el={ROLE.progress} className="mb-2 flex justify-between tabular-nums" style={labelStyle(look, 14, V.ink)}>
          <span>
            {done} of {items.length} done
          </span>
          <span>{Math.round(share * 100)}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden" style={{ background: V.well, borderRadius: barRadius, boxShadow: look.chip === "block" ? `inset 0 0 0 ${look.stroke}px ${V.ink}` : undefined }}>
          <div className="h-full" style={{ width: `${share * 100}%`, background: V.accent, borderRadius: barRadius, borderRight: look.chip === "block" && share > 0 && share < 1 ? `${look.stroke}px solid ${V.ink}` : undefined }} />
        </div>
      </div>
      <ul className={`mt-4 min-h-0 flex-1 ${wholeRows(ctx.interactive)}`}>
        {items.map((item, i) => {
          const state = item.checked ? "done" : i === next ? "next" : "open";
          return (
            <li key={item.id} style={i === 0 ? undefined : ruleStyle(look)}>
              <button
                type="button"
                disabled={!ctx.interactive}
                onClick={() => setItems((all) => all.map((x) => (x.id === item.id ? { ...x, checked: !x.checked } : x)))}
                className="flex w-full items-center gap-3 py-[7px] text-left"
              >
                <Check state={state} />
                <span data-el={ROLE.itemLabels} className="min-w-0 flex-1 truncate text-[17px] font-medium leading-snug" style={{ color: item.checked && look.rule === "thick" ? V.muted : V.ink, textDecoration: item.checked && look.rule === "thick" ? "line-through" : undefined, fontFamily: look.font.body }}>
                  {item.label}
                </span>
                {item.dueDate ? (
                  <span data-el={ROLE.dueDates} className="shrink-0 text-[14px] font-medium tabular-nums" style={{ color: V.ink }}>
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

export function CalendarBody({ ctx }: Ctx) {
  const look = useLook();
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
  const events = [...d.events].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const firstHighlight = [...highlighted].sort()[0];
  const dayRadius = look.chip === "pill" ? 999 : look.chip === "block" ? 4 : 6;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${padTop(look, look.pad - 6)}px ${look.pad}px ${look.pad - 8}px` }}>
      <p data-el={ROLE.month} className="shrink-0" style={{ fontFamily: look.font.display, fontWeight: look.font.displayWeight, fontSize: 26, letterSpacing: look.font.displayTracking, color: V.ink, lineHeight: 1 }}>
        {MONTHS_LONG[d.viewMonth - 1]} <span>{d.viewYear}</span>
      </p>
      <div data-el={ROLE.weekdays} className="mt-3 grid shrink-0 grid-cols-7 pb-1 text-center" style={{ ...labelStyle(look, 13, V.ink), ...(look.rule === "none" ? {} : { borderBottom: `1px solid ${V.hair}` }) }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="mt-1 flex shrink-0 flex-col">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.days.map((cell, ci) => {
              if (!cell.iso) return <span key={ci} />;
              const hi = highlighted.has(cell.iso);
              const n = eventDays.get(cell.iso) ?? 0;
              const accent = cell.iso === firstHighlight;
              return (
                <span key={ci} className="flex h-[36px] flex-col items-center justify-center">
                  <span
                    data-el={ROLE.dayNumbers}
                    className="inline-flex h-[30px] w-[30px] items-center justify-center text-[16px] font-medium tabular-nums"
                    style={{
                      borderRadius: dayRadius,
                      background: accent ? V.accent : hi ? V.well : "transparent",
                      color: accent ? V.accentInk : V.ink,
                      boxShadow: hi && look.chip === "block" ? `inset 0 0 0 ${look.stroke}px ${V.ink}` : hi && look.chip === "outline" ? `inset 0 0 0 1.5px ${V.ink}` : undefined,
                    }}
                  >
                    {cell.day}
                  </span>
                  <span className="mt-[1px] h-[4px] w-[4px]" style={{ background: n && !hi ? V.accent : "transparent", borderRadius: dayRadius }} />
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <ul className={`mt-2 min-h-0 flex-1 ${wholeRows(ctx.interactive)}`} style={ruleStyle(look)}>
        {events.map((e) => (
          <li key={e.id} className="flex items-baseline gap-3 pt-2 text-[16px] font-medium leading-snug" style={{ color: V.ink, fontFamily: look.font.body }}>
            <span data-el={ROLE.eventDates} className="w-[60px] shrink-0 tabular-nums" style={{ color: V.ink }}>
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

/** A horizontal line of moments; labels alternate above and below; the latest is the accent. */
export function TimelineBody({ ctx }: Ctx) {
  const look = useLook();
  const payload = ctx.item.payload;
  if (payload.type !== "timeline") return <CurrentBody ctx={ctx} />;
  const d = payload.data;
  const events = [...d.events].sort((a, b) => a.at.localeCompare(b.at));
  const n = events.length;
  const markRadius = look.legend === "square" ? 2 : 999;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${padTop(look, look.pad - 4)}px ${look.pad + 10}px ${look.pad - 4}px` }}>
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2" style={{ height: look.stroke >= 2 ? 3 : 2, background: V.ink, ...(look.rule === "dashed" ? { background: "none", borderTop: `2px dashed ${V.ink}` } : {}) }} />
        {events.map((e, i) => {
          const x = n === 1 ? 50 : 2 + (i * 96) / (n - 1);
          const above = i % 2 === 0;
          const latest = i === n - 1;
          const r = latest ? 10 : e.highlight ? 8 : 6;
          const labelW = Math.min(220, Math.max(110, ((2 * 96) / Math.max(1, n - 1)) * 9));
          return (
            <div key={e.id} className="absolute inset-y-0" style={{ left: `${x}%` }}>
              <span
                className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ width: r * 2, height: r * 2, borderRadius: markRadius, background: latest ? V.accent : e.highlight ? V.ink : V.card, boxShadow: `0 0 0 ${Math.max(2, look.stroke)}px ${V.ink}` }}
              />
              <span className="absolute left-0 w-[1.5px] -translate-x-1/2" style={{ background: V.ink, opacity: 0.35, ...(above ? { bottom: "50%", height: 22, marginBottom: r + 3 } : { top: "50%", height: 22, marginTop: r + 3 }) }} />
              <div
                className={`absolute ${i === 0 ? "text-left" : latest ? "text-right" : "-translate-x-1/2 text-center"}`}
                style={{ width: i === 0 || latest ? labelW * 0.75 : labelW, ...(i === 0 ? { left: -r } : latest ? { right: -r } : {}), ...(above ? { bottom: `calc(50% + ${r + 30}px)` } : { top: `calc(50% + ${r + 30}px)` }) }}
              >
                <p data-el={ROLE.eventDates} className="tabular-nums" style={{ fontFamily: look.font.display, fontWeight: look.font.numberWeight, fontSize: 20, lineHeight: 1, color: V.ink, letterSpacing: look.font.displayTracking }}>
                  {eventStamp(e, d.scale)}
                </p>
                <p data-el={ROLE.eventLabels} className="mt-1.5 line-clamp-3 text-[15px] font-medium leading-snug" style={{ color: V.ink, fontFamily: look.font.body }}>
                  {e.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mechanism ──────────────────────────────────────────────────────────────

/** A chain of cause: numbered steps joined by arrows, laid out in a snake of rows. */
export function MechanismBody({ ctx }: Ctx) {
  const look = useLook();
  const payload = ctx.item.payload;
  if (payload.type !== "mechanism") return <CurrentBody ctx={ctx} />;
  const steps = payload.data.steps;
  const perRow = steps.length <= 4 ? steps.length : steps.length <= 6 ? 3 : 4;

  return (
    <div className={`min-h-0 flex-1 ${scrollClass(ctx.interactive)}`} style={{ padding: `${padTop(look, look.pad - 4)}px ${look.pad}px ${look.pad - 4}px` }}>
      <div className="grid gap-x-3 gap-y-3" style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => (
          <div key={s.id} className="relative flex min-w-0 flex-col" style={{ padding: 12, borderRadius: look.nest, background: i === steps.length - 1 ? V.accent : V.well, color: i === steps.length - 1 ? V.accentInk : V.ink, border: look.chip === "block" ? `${look.stroke}px solid ${V.ink}` : look.chip === "outline" ? `${look.stroke}px solid ${i === steps.length - 1 ? V.accent : V.hair}` : undefined, ...(look.chip === "outline" && i !== steps.length - 1 ? { background: "transparent" } : {}) }}>
            <span data-el={ROLE.stepNumbers} className="tabular-nums" style={{ fontFamily: look.font.display, fontWeight: look.font.numberWeight, fontSize: 24, lineHeight: 1, letterSpacing: look.font.displayTracking }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span data-el={ROLE.stepLabels} className="mt-2 text-[16px] font-medium leading-snug" style={{ fontFamily: look.font.body }}>
              {s.label}
            </span>
            {s.note?.trim() ? (
              <span data-el={ROLE.stepNotes} className="mt-1 text-[14px] font-medium leading-snug">
                {s.note}
              </span>
            ) : null}
            {i < steps.length - 1 && (i + 1) % perRow !== 0 ? (
              <span aria-hidden className="absolute -right-[11px] top-1/2 z-10 -translate-y-1/2 text-[13px] font-bold" style={{ color: V.ink }}>
                →
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Episode ────────────────────────────────────────────────────────────────

export function EpisodeBody({ ctx }: Ctx) {
  const look = useLook();
  const payload = ctx.item.payload;
  if (payload.type !== "episode") return <CurrentBody ctx={ctx} />;
  const d = payload.data;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${padTop(look, look.pad)}px ${look.pad}px ${look.pad}px` }}>
      <div className="flex shrink-0 gap-5">
        {d.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.thumb} alt="" className="h-[120px] w-[200px] shrink-0 object-cover" style={{ borderRadius: look.nest, border: look.chip === "block" ? `${look.stroke}px solid ${V.ink}` : undefined }} />
        ) : null}
        <div className="min-w-0 flex-1">
          <p data-el={ROLE.episodeTitle} className="line-clamp-3" style={{ fontFamily: look.font.display, fontWeight: look.font.displayWeight, fontSize: 29, lineHeight: 1.12, letterSpacing: look.font.displayTracking, color: V.ink }}>
            {d.videoTitle}
          </p>
          {d.description?.trim() ? (
            <p data-el={ROLE.description} className="mt-2 line-clamp-2 text-[16px] font-medium leading-snug" style={{ color: V.ink, fontFamily: look.font.body }}>
              {d.description}
            </p>
          ) : null}
        </div>
      </div>
      <ol className={`mt-4 min-h-0 flex-1 ${wholeRows(ctx.interactive)}`}>
        {d.chapters.map((ch, i) => (
          <li key={ch.label + i} className="flex items-baseline gap-3 py-[7px]" style={ruleStyle(look)}>
            <span data-el={ROLE.chapterNumbers} className="w-8 shrink-0 tabular-nums" style={{ fontFamily: look.font.display, fontWeight: look.font.numberWeight, fontSize: 18, color: V.ink, letterSpacing: look.font.displayTracking }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span data-el={ROLE.chapterLabels} className="min-w-0 flex-1 truncate text-[17px] font-medium" style={{ color: V.ink, fontFamily: look.font.body }}>
              {ch.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Link group ─────────────────────────────────────────────────────────────

const domainOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

export function LinkGroupBody({ ctx }: Ctx) {
  const look = useLook();
  const payload = ctx.item.payload;
  if (payload.type !== "linkgroup") return <CurrentBody ctx={ctx} />;
  return (
    <div className={`flex min-h-0 flex-1 flex-col gap-4 ${scrollClass(ctx.interactive)}`} style={{ padding: `${padTop(look, look.pad)}px ${look.pad}px ${look.pad}px` }}>
      {payload.data.sections.map((section) => (
        <section key={section.label}>
          <p data-el={ROLE.sectionLabels} className="mb-2.5" style={labelStyle(look, 13)}>
            {section.label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {section.links.map((link) => (
              <a
                key={link.url + link.label}
                href={ctx.interactive ? link.url : undefined}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-center gap-2 py-1 pl-1.5 pr-3 text-[16px] font-medium"
                style={chipStyle(look, V.well, V.ink)}
              >
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden bg-white" style={{ borderRadius: look.chip === "pill" ? 999 : 3 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={link.iconUrl ?? `https://www.google.com/s2/favicons?domain=${domainOf(link.url)}&sz=64`} alt="" className="h-3.5 w-3.5" />
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
  );
}

// ─── Code ───────────────────────────────────────────────────────────────────

export function CodeBody({ ctx }: Ctx) {
  const look = useLook();
  const payload = ctx.item.payload;
  const [active, setActive] = useState(0);
  if (payload.type !== "code" || payload.data.files.length === 0) return <CurrentBody ctx={ctx} />;
  const files = payload.data.files;
  const file = files[Math.min(active, files.length - 1)]!;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: `${padTop(look, look.pad - 8)}px ${look.pad - 8}px ${look.pad - 10}px` }}>
      {/* The file tabs, even for one file: the file name is a part of every code card. */}
      <div data-el={ROLE.fileNames} className="mb-2 flex shrink-0 flex-wrap gap-1.5">
        {files.map((f, i) => (
          <button key={f.path} type="button" disabled={!ctx.interactive} onClick={() => setActive(i)} className="px-2.5 py-1 text-[14px] font-medium" style={{ ...chipStyle(look, i === active ? V.ink : V.well, i === active ? V.card : V.ink), fontFamily: look.font.mono }}>
            {f.path}
          </button>
        ))}
      </div>
      <pre data-el={ROLE.code} className={`min-h-0 flex-1 whitespace-pre-wrap px-4 py-3 text-[14px] font-medium leading-[1.6] ${scrollClass(ctx.interactive)}`} style={{ fontFamily: look.font.mono, background: V.well, color: V.ink, borderRadius: look.nest, border: look.chip === "block" ? `${look.stroke}px solid ${V.ink}` : look.chip === "outline" ? `1px solid ${V.hair}` : undefined }}>
        {file.content}
      </pre>
    </div>
  );
}
