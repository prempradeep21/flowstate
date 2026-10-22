import type { ArtifactPayload, TableRow } from "@/lib/artifactTypes";
import { getStudioPool, type StudioArtifact, type StudioArtifactItem } from "@/lib/artifactStudio/pool";
import { seededRandom } from "@/lib/artifactStudio/selection";

/**
 * Content density for the Artifact Studio focus view — the same artifact with
 * far less or far more in it, so a style can be judged at its extremes (a
 * two-event timeline, a sixty-row table, a one-line quote).
 *
 * `amount` runs 0 → 1: 0 is the least the kind can meaningfully hold, 0.5 is
 * the authored content untouched, 1 is packed. Extra content is borrowed from
 * sibling artifacts of the same variant in the pool where possible, so it
 * reads like real data rather than lorem ipsum. Pure: same inputs, same output.
 */

export const ORIGINAL_AMOUNT = 0.5;

/** Whether the kind has any content that can grow or shrink. */
export function canVaryContent(item: StudioArtifact): boolean {
  // Cards are prose under a heading — nothing to count.
  if (item.card) return false;
  return countOf(item.payload) != null;
}

/** How many "things" the payload holds — what the slider label reports. */
export function countOf(payload: ArtifactPayload): { n: number; unit: string } | null {
  switch (payload.type) {
    case "table":
      return { n: payload.data.rows.length, unit: "rows" };
    case "chart":
      if (payload.data.chartType === "gauge") return null;
      if (payload.data.chartType === "pie")
        return { n: payload.data.slices?.length ?? payload.data.categories?.length ?? 0, unit: "slices" };
      return { n: payload.data.categories?.length ?? 0, unit: "points" };
    case "timeline":
    case "calendar":
      return { n: payload.data.events.length, unit: "events" };
    case "todo":
      return { n: payload.data.items.length, unit: "items" };
    case "mechanism":
      return { n: payload.data.steps.length, unit: "steps" };
    case "episode":
      return { n: payload.data.chapters.length, unit: "chapters" };
    case "linkgroup":
      return { n: payload.data.sections.reduce((n, s) => n + s.links.length, 0), unit: "links" };
    case "images":
    case "video":
      return { n: payload.data.items.length, unit: "items" };
    case "map":
      return { n: payload.data.savedPlaces?.length ?? 0, unit: "pins" };
    case "code":
      return { n: payload.data.files.reduce((n, f) => n + f.content.split("\n").length, 0), unit: "lines" };
    case "quote":
      return { n: words(payload.data.text).length, unit: "words" };
    case "stickynote":
      return { n: words(payload.data.text).length, unit: "words" };
    case "definition":
      return { n: words(payload.data.gloss).length, unit: "words" };
    case "claim":
      return { n: words(payload.data.proposition.text).length + words(payload.data.counter.text).length, unit: "words" };
    case "stat":
      return { n: words(payload.data.label).length, unit: "words" };
    default:
      return null;
  }
}

/** Maps the slider onto a count: min at 0, the original at 0.5, max at 1. */
function target(amount: number, original: number, min: number, max: number): number {
  const hi = Math.max(original, max);
  const lo = Math.min(original, min);
  if (amount <= ORIGINAL_AMOUNT) return Math.round(lo + (original - lo) * (amount / ORIGINAL_AMOUNT));
  return Math.round(original + (hi - original) * ((amount - ORIGINAL_AMOUNT) / (1 - ORIGINAL_AMOUNT)));
}

/** A generous ceiling — several times the original, never absurd. */
const packed = (original: number, cap: number) => Math.min(cap, Math.max(original * 4, original + 12));

const words = (s: string | undefined) => (s ?? "").trim().split(/\s+/).filter(Boolean);

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Keep `n` of `items`, chosen by the seed, in their original order. */
function sample<T>(items: T[], n: number, rand: () => number): T[] {
  if (n >= items.length) return items.slice();
  const keep = new Set(shuffle(items.map((_, i) => i), rand).slice(0, n));
  return items.filter((_, i) => keep.has(i));
}

/** Grow `items` to `n` by drawing from `donors`, then cycling the originals. */
function grow<T>(items: T[], n: number, donors: T[], rand: () => number, remix: (t: T, i: number) => T): T[] {
  const out = items.slice();
  const extra = shuffle(donors, rand);
  let i = 0;
  while (out.length < n) {
    const cycle = items.length ? items : extra;
    const from = i < extra.length ? extra[i] : cycle[(i - extra.length) % Math.max(1, cycle.length)];
    if (from === undefined) break;
    out.push(remix(from, out.length));
    i++;
  }
  return out;
}

function resize<T>(
  items: T[],
  n: number,
  donors: T[],
  rand: () => number,
  remix: (t: T, i: number) => T,
): T[] {
  return n <= items.length ? sample(items, n, rand) : grow(items, n, donors, rand, remix);
}

/** Same-variant siblings in the pool, other than the artifact itself. */
function donorsOf(item: StudioArtifact): ArtifactPayload[] {
  return getStudioPool()
    .flatMap((a) => (a.variant === item.variant && a.uid !== item.uid && !a.card ? [a.payload] : []));
}

function fitText(text: string, n: number, donorTexts: string[], rand: () => number): string {
  const own = words(text);
  if (n <= own.length) {
    const cut = own.slice(0, Math.max(1, n)).join(" ").replace(/[,;:—-]+$/, "");
    return n < own.length ? `${cut}${/[.!?]$/.test(cut) ? "" : "…"}` : cut;
  }
  const pool = shuffle(donorTexts.flatMap((t) => words(t)), rand);
  const extra = pool.length ? pool : own;
  const out = own.slice();
  for (let i = 0; out.length < n; i++) out.push(extra[i % extra.length]!);
  return out.join(" ");
}

const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

function timestamp(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function varyPayload(item: StudioArtifactItem, amount: number, seed: string): ArtifactPayload {
  const rand = seededRandom(`${item.uid}:${seed}`);
  const payload = item.payload;
  const donors = donorsOf(item);

  switch (payload.type) {
    case "table": {
      const { columns, rows } = payload.data;
      const n = target(amount, rows.length, 1, packed(rows.length, 80));
      // Below the original, columns thin out too — a two-column table is a real state.
      const colCount = amount < ORIGINAL_AMOUNT ? target(amount, columns.length, 2, columns.length) : columns.length;
      const cols = [columns[0]!, ...sample(columns.slice(1), colCount - 1, rand)];
      // New rows mix existing values column by column, so every cell is plausible.
      const remix = (): TableRow =>
        Object.fromEntries(columns.map((c) => [c.key, rows[Math.floor(rand() * rows.length)]?.[c.key] ?? ""]));
      return { ...payload, data: { ...payload.data, columns: cols, rows: resize(rows, n, [], rand, remix) } };
    }
    case "chart": {
      const d = payload.data;
      if (d.chartType === "gauge") return payload;
      if (d.chartType === "pie") {
        const slices = d.slices ?? [];
        const n = target(amount, slices.length, 1, packed(slices.length, 24));
        const donorSlices = donors.flatMap((p) => (p.type === "chart" ? (p.data.slices ?? []) : []));
        const next = resize(slices, n, donorSlices, rand, (s) => ({
          name: s.name,
          value: Math.max(1, Math.round(s.value * (0.4 + rand()))),
        }));
        return { ...payload, data: { ...d, slices: next } };
      }
      const cats = d.categories ?? [];
      const n = target(amount, cats.length, 2, packed(cats.length, 60));
      const numeric = cats.length > 0 && cats.every((c) => /^\d{2,4}$/.test(c.trim()));
      let categories: string[];
      let pick: number[];
      if (n <= cats.length) {
        // Charts read left to right, so shrink by keeping a contiguous run.
        const start = Math.floor(rand() * (cats.length - n + 1));
        pick = Array.from({ length: n }, (_, i) => start + i);
        categories = pick.map((i) => cats[i]!);
      } else {
        pick = cats.map((_, i) => i);
        categories = cats.slice();
        const donorCats = shuffle(
          donors.flatMap((p) => (p.type === "chart" ? (p.data.categories ?? []) : [])).filter((c) => !cats.includes(c)),
          rand,
        );
        for (let i = 0; categories.length < n; i++) {
          if (numeric) categories.push(String(Number(categories[categories.length - 1]) + 1));
          else categories.push(donorCats[i] ?? `${cats[i % cats.length]} ${Math.floor(i / cats.length) + 2}`);
        }
      }
      const series = (d.series ?? []).map((s) => {
        const data = pick.map((i) => s.data[i] ?? 0);
        // Extend each series as a random walk from its last value.
        const span = Math.max(1, Math.max(...s.data) - Math.min(...s.data));
        let last = data[data.length - 1] ?? s.data[s.data.length - 1] ?? 0;
        while (data.length < categories.length) {
          last = Math.max(0, last + (rand() - 0.45) * span * 0.25);
          data.push(Math.round(last * 100) / 100);
        }
        return { ...s, data };
      });
      const seriesCount = amount < 0.15 ? 1 : series.length;
      return { ...payload, data: { ...d, categories, series: series.slice(0, Math.max(1, seriesCount)) } };
    }
    case "timeline": {
      const events = payload.data.events;
      const n = target(amount, events.length, 1, packed(events.length, 60));
      const times = events.map((e) => Date.parse(e.at)).filter((t) => !Number.isNaN(t));
      const lo = Date.parse(payload.data.rangeStart ?? "") || Math.min(...times);
      const hi = Date.parse(payload.data.rangeEnd ?? "") || Math.max(...times);
      const donorEvents = donors.flatMap((p) => (p.type === "timeline" ? p.data.events : []));
      const next = resize(events, n, donorEvents, rand, (e, i) => ({
        ...e,
        id: `vary_${i}`,
        highlight: false,
        side: undefined,
        // Borrowed events are re-dated into this timeline's own range.
        at: new Date(lo + rand() * Math.max(1, hi - lo)).toISOString(),
      })).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
      return { ...payload, data: { ...payload.data, events: next } };
    }
    case "calendar": {
      const { events, viewYear, viewMonth } = payload.data;
      const n = target(amount, events.length, 0, packed(events.length, 40));
      const days = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
      const donorEvents = donors.flatMap((p) => (p.type === "calendar" ? p.data.events : []));
      const next = resize(events, n, donorEvents, rand, (e, i) => {
        const start = 1 + Math.floor(rand() * days);
        const end = Math.min(days, start + (rand() < 0.2 ? Math.floor(rand() * 4) : 0));
        return {
          ...e,
          id: `vary_${i}`,
          startDate: isoDay(new Date(Date.UTC(viewYear, viewMonth, start))),
          endDate: isoDay(new Date(Date.UTC(viewYear, viewMonth, end))),
        };
      });
      return { ...payload, data: { ...payload.data, events: next } };
    }
    case "todo": {
      const items = payload.data.items;
      const n = target(amount, items.length, 1, packed(items.length, 50));
      const donorItems = donors.flatMap((p) => (p.type === "todo" ? p.data.items : []));
      const next = resize(items, n, donorItems, rand, (t, i) => ({ ...t, id: `vary_${i}`, checked: rand() < 0.3 }));
      return { ...payload, data: { items: next } };
    }
    case "mechanism": {
      const { steps, edges } = payload.data;
      const n = target(amount, steps.length, 2, packed(steps.length, 16));
      const donorSteps = donors.flatMap((p) => (p.type === "mechanism" ? p.data.steps : []));
      const next = resize(steps, n, donorSteps, rand, (s, i) => ({ ...s, id: `vary_${i}` }));
      const ids = new Set(next.map((s) => s.id));
      const kept = edges.filter((e) => ids.has(e.from) && ids.has(e.to));
      // Re-link so the chain never breaks: every step leads to the next.
      const linked = new Set(kept.map((e) => e.from));
      const chain = next.slice(0, -1).flatMap((s, i) => (linked.has(s.id) ? [] : [{ from: s.id, to: next[i + 1]!.id }]));
      return { ...payload, data: { steps: next, edges: [...kept, ...chain] } };
    }
    case "episode": {
      const chapters = payload.data.chapters;
      const n = target(amount, chapters.length, 1, packed(chapters.length, 40));
      const donorChapters = donors.flatMap((p) => (p.type === "episode" ? p.data.chapters : []));
      const next = resize(chapters, n, donorChapters, rand, (c) => ({ label: c.label }));
      let t = 0;
      const timed = next.map((c) => {
        const out = { ...c, start: timestamp(t) };
        t += 120 + Math.floor(rand() * 600);
        return out;
      });
      return { ...payload, data: { ...payload.data, chapters: n > chapters.length ? timed : next } };
    }
    case "linkgroup": {
      const sections = payload.data.sections;
      const total = sections.reduce((n, s) => n + s.links.length, 0);
      const n = target(amount, total, 1, packed(total, 48));
      const donorLinks = donors.flatMap((p) => (p.type === "linkgroup" ? p.data.sections.flatMap((s) => s.links) : []));
      if (n <= total) {
        // Drop links evenly, then any section left empty.
        const flat = sections.flatMap((s, si) => s.links.map((l) => ({ si, l })));
        const keep = sample(flat, n, rand);
        const next = sections
          .map((s, si) => ({ ...s, links: keep.filter((k) => k.si === si).map((k) => k.l) }))
          .filter((s) => s.links.length > 0);
        return { ...payload, data: { sections: next } };
      }
      const ownLinks = sections.flatMap((s) => s.links);
      const extra = grow(ownLinks, n, donorLinks, rand, (l) => l).slice(total);
      const next = sections.map((s) => ({ ...s, links: s.links.slice() }));
      extra.forEach((l, i) => next[i % next.length]!.links.push(l));
      return { ...payload, data: { sections: next } };
    }
    case "images": {
      const items = payload.data.items;
      const n = target(amount, items.length, 1, packed(items.length, 24));
      const donorItems = donors.flatMap((p) => (p.type === "images" ? p.data.items : []));
      return { ...payload, data: { items: resize(items, n, donorItems, rand, (x) => x) } };
    }
    case "video": {
      const items = payload.data.items;
      const n = target(amount, items.length, 1, packed(items.length, 16));
      const donorItems = donors.flatMap((p) => (p.type === "video" ? p.data.items : []));
      return { ...payload, data: { ...payload.data, items: resize(items, n, donorItems, rand, (x) => x) } };
    }
    case "map": {
      const places = payload.data.savedPlaces ?? [];
      const n = target(amount, places.length, 0, places.length ? packed(places.length, 40) : 24);
      const center = { lat: payload.data.place.lat ?? places[0]?.lat ?? 0, lng: payload.data.place.lng ?? places[0]?.lng ?? 0 };
      const spread = places.length > 1
        ? Math.max(0.01, Math.max(...places.map((p) => Math.abs(p.lat - center.lat))), Math.max(...places.map((p) => Math.abs(p.lng - center.lng))))
        : 0.05;
      // A map with no pins grows from one at its centre.
      const seedPin = { id: "vary_seed", label: payload.data.place.label ?? payload.data.place.name, ...center };
      const next = resize(places, n, places.length ? [] : [seedPin], rand, (p, i) => ({
        ...p,
        id: `vary_${i}`,
        lat: center.lat + (rand() - 0.5) * 2 * spread,
        lng: center.lng + (rand() - 0.5) * 2 * spread,
      }));
      return { ...payload, data: { ...payload.data, savedPlaces: next } };
    }
    case "code": {
      const files = payload.data.files;
      const lines = files.map((f) => f.content.split("\n"));
      const total = lines.reduce((n, l) => n + l.length, 0);
      const ratio = target(amount, total, 3, packed(total, 600)) / Math.max(1, total);
      const next = files.map((f, i) => {
        const own = lines[i]!;
        const n = Math.max(1, Math.round(own.length * ratio));
        const out: string[] = [];
        for (let j = 0; out.length < n; j++) out.push(own[j % own.length]!);
        return { ...f, content: out.join("\n") };
      });
      return { ...payload, data: { files: amount < 0.15 ? next.slice(0, 1) : next } };
    }
    case "quote": {
      const n = target(amount, words(payload.data.text).length, 4, packed(words(payload.data.text).length, 160));
      const texts = donors.flatMap((p) => (p.type === "quote" ? [p.data.text] : []));
      return {
        ...payload,
        data: { ...payload.data, text: fitText(payload.data.text, n, texts, rand), context: amount < 0.2 ? undefined : payload.data.context },
      };
    }
    case "stickynote": {
      const n = target(amount, words(payload.data.text).length, 3, packed(words(payload.data.text).length, 220));
      const texts = donors.flatMap((p) => (p.type === "stickynote" ? [p.data.text] : []));
      return { ...payload, data: { ...payload.data, text: fitText(payload.data.text, n, texts, rand) } };
    }
    case "definition": {
      const n = target(amount, words(payload.data.gloss).length, 4, packed(words(payload.data.gloss).length, 140));
      const texts = donors.flatMap((p) => (p.type === "definition" ? [p.data.gloss] : []));
      return {
        ...payload,
        data: { ...payload.data, gloss: fitText(payload.data.gloss, n, texts, rand), example: amount < 0.2 ? undefined : payload.data.example },
      };
    }
    case "claim": {
      const { proposition, counter } = payload.data;
      const texts = donors.flatMap((p) => (p.type === "claim" ? [p.data.proposition.text, p.data.counter.text] : []));
      const side = (s: typeof proposition) => {
        const n = target(amount, words(s.text).length, 4, packed(words(s.text).length, 120));
        return { ...s, text: fitText(s.text, n, texts, rand) };
      };
      return { ...payload, data: { ...payload.data, proposition: side(proposition), counter: side(counter) } };
    }
    case "stat": {
      const n = target(amount, words(payload.data.label).length, 2, packed(words(payload.data.label).length, 40));
      const texts = donors.flatMap((p) => (p.type === "stat" ? [p.data.label] : []));
      const sparse = amount < 0.2;
      return {
        ...payload,
        data: {
          ...payload.data,
          label: fitText(payload.data.label, n, texts, rand),
          delta: sparse ? undefined : payload.data.delta,
          source: sparse ? undefined : payload.data.source,
        },
      };
    }
    default:
      return payload;
  }
}

/**
 * The artifact with its content resized. The original is returned untouched
 * at {@link ORIGINAL_AMOUNT}; otherwise payload and the artifact's latest
 * version are both replaced, since renderers read either.
 */
export function varyContent(item: StudioArtifact, amount: number, seed: string): StudioArtifact {
  if (item.card || Math.abs(amount - ORIGINAL_AMOUNT) < 0.001 || !canVaryContent(item)) return item;
  const payload = varyPayload(item, amount, seed);
  const latestId = item.artifact.latestVersionId;
  return {
    ...item,
    payload,
    artifact: {
      ...item.artifact,
      versions: item.artifact.versions.map((v) => (v.id === latestId ? { ...v, payload } : v)),
    },
  };
}
