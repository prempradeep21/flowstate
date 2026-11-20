import { getSelectionUnits } from "@/lib/canvasSelection";
import { currentWriteSource } from "@/lib/canvasWriteSource";
import { computeGroupBounds } from "@/lib/groupBounds";
import { useCanvasStore } from "@/lib/store";

/**
 * Canvas trace for live canvases ("why did this chapter move?").
 *
 * Off by default and free when off. Turn on with `?trace=1`, with
 * `localStorage.flowstateTrace = "1"`, or `window.__flowstateTrace.start()`.
 * While on it records, in a ring buffer:
 * - every store write that moved or resized something, with its cause
 *   (drag, layout, remote-snapshot, conflict-merge, load, undo) or, when no
 *   cause was labelled, a short stack of the code that made it;
 * - sync decisions (remote snapshot applied / queued / stale / equal);
 * - frames longer than LONG_FRAME_MS;
 * - once a second: item counts, how many are mounted, selection sizes,
 *   store and viewport write rates, zoom.
 * A small overlay shows the totals; "Save" downloads the trace as JSON.
 *
 * `__flowstateTrace.selection()` works with the trace off: it lists what is
 * selected right now and how far each piece reaches ("why is the whole
 * board selected?").
 */

const MAX_EVENTS = 6000;
const MAX_ITEMS_PER_WRITE = 40;
const LONG_FRAME_MS = 50;
const STORAGE_KEY = "flowstateTrace";

type Pt = [number, number];

interface ItemChange {
  kind: string;
  id: string;
  from?: Pt;
  to?: Pt;
  fromSize?: Pt;
  toSize?: Pt;
}

type TraceEvent =
  | {
      t: number;
      type: "write";
      source: string;
      keys: string[];
      moved: number;
      resized: number;
      items: ItemChange[];
      stack?: string[];
    }
  | { t: number; type: "sync"; what: string; detail?: Record<string, unknown> }
  | { t: number; type: "long-frame"; ms: number }
  | { t: number; type: "sample"; [k: string]: unknown };

/** Records whose entities carry a world position (and maybe a size). */
const POSITIONED: Record<string, string> = {
  cards: "card",
  canvasArtifactNodes: "artifact",
  canvasAssetNodes: "asset",
  canvasGifNodes: "gif",
  canvas3DNodes: "3d",
  canvasSkillNodes: "skill",
  canvasTextLabels: "label",
};

interface Positioned {
  position?: { x: number; y: number };
  size?: { w: number; h: number };
  frostSize?: { w: number; h: number };
}

let events: TraceEvent[] = [];
let active = false;
let startedAt = 0;
let unsubscribe: (() => void) | null = null;
let rafId = 0;
let sampleTimer: ReturnType<typeof setInterval> | null = null;
let overlay: HTMLDivElement | null = null;
let totals = { writes: 0, moves: 0, longFrames: 0, syncs: 0 };
let windowCounts = { writes: 0, viewportWrites: 0 };

function now(): number {
  return Math.round(performance.now() - startedAt);
}

function push(e: TraceEvent): void {
  events.push(e);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
}

function size(e: Positioned | undefined): Pt | undefined {
  const s = e?.frostSize ?? e?.size;
  return s ? [Math.round(s.w), Math.round(s.h)] : undefined;
}

function shortStack(): string[] {
  const lines = (new Error().stack ?? "").split("\n").slice(1);
  return lines
    .map((l) => l.trim())
    .filter(
      (l) =>
        !l.includes("canvasFlightRecorder") &&
        !l.includes("node_modules") &&
        !l.includes("zustand"),
    )
    .slice(0, 6);
}

function onStoreWrite(
  next: Record<string, unknown>,
  prev: Record<string, unknown>,
): void {
  totals.writes += 1;
  windowCounts.writes += 1;
  const keys: string[] = [];
  for (const k of Object.keys(next)) {
    if (typeof next[k] === "function") continue;
    if (next[k] !== prev[k]) keys.push(k);
  }
  if (keys.length === 1 && (keys[0] === "viewport" || keys[0] === "viewportSettledScale")) {
    windowCounts.viewportWrites += 1;
    return;
  }

  const items: ItemChange[] = [];
  let moved = 0;
  let resized = 0;
  for (const k of keys) {
    const kind = POSITIONED[k];
    if (!kind) continue;
    const a = (prev[k] ?? {}) as Record<string, Positioned>;
    const b = (next[k] ?? {}) as Record<string, Positioned>;
    for (const id of Object.keys(b)) {
      const before = a[id];
      const after = b[id];
      if (before === after || !before || !after) continue;
      const p0 = before.position;
      const p1 = after.position;
      const didMove =
        !!p0 && !!p1 && (Math.abs(p0.x - p1.x) > 0.5 || Math.abs(p0.y - p1.y) > 0.5);
      const s0 = size(before);
      const s1 = size(after);
      const didResize =
        !!s0 && !!s1 && (Math.abs(s0[0] - s1[0]) > 0.5 || Math.abs(s0[1] - s1[1]) > 0.5);
      if (!didMove && !didResize) continue;
      if (didMove) moved += 1;
      if (didResize) resized += 1;
      if (items.length < MAX_ITEMS_PER_WRITE) {
        items.push({
          kind,
          id,
          ...(didMove
            ? {
                from: [Math.round(p0!.x), Math.round(p0!.y)] as Pt,
                to: [Math.round(p1!.x), Math.round(p1!.y)] as Pt,
              }
            : {}),
          ...(didResize ? { fromSize: s0, toSize: s1 } : {}),
        });
      }
    }
  }
  // Group-level changes (placement flag, divider) are worth seeing too.
  const groupsChanged = keys.includes("groups");
  if (moved === 0 && resized === 0 && !groupsChanged) return;
  totals.moves += moved;
  const source = currentWriteSource();
  push({
    t: now(),
    type: "write",
    source: source ?? "unlabelled",
    keys,
    moved,
    resized,
    items,
    ...(source ? {} : { stack: shortStack() }),
  });
}

function sample(): void {
  const s = useCanvasStore.getState();
  const count = (sel: string) => document.querySelectorAll(sel).length;
  push({
    t: now(),
    type: "sample",
    cards: Object.keys(s.cards).length,
    artifacts: Object.keys(s.canvasArtifactNodes).length,
    chapters: Object.keys(s.groups).length,
    mountedCards: count("[data-canvas-card]"),
    mountedArtifacts: count("[data-canvas-artifact]"),
    selectedChapters: s.selectedGroupIds.length,
    selectedItems: s.canvasSelection.length,
    selectedFamilies: s.selectedFamilyRootIds.length,
    storeWritesPerSec: windowCounts.writes,
    viewportWritesPerSec: windowCounts.viewportWrites,
    zoom: Math.round(s.viewport.scale * 1000) / 1000,
  });
  windowCounts = { writes: 0, viewportWrites: 0 };
  renderOverlay();
}

function frameLoop(): void {
  let last = performance.now();
  const tick = (ts: number) => {
    const dt = ts - last;
    last = ts;
    // Hidden tabs throttle rAF; those gaps are not jank.
    if (dt > LONG_FRAME_MS && document.visibilityState === "visible") {
      totals.longFrames += 1;
      push({ t: now(), type: "long-frame", ms: Math.round(dt) });
    }
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

function renderOverlay(): void {
  if (!active) return;
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.setAttribute("data-flowstate-trace", "");
    Object.assign(overlay.style, {
      position: "fixed",
      left: "12px",
      bottom: "64px",
      zIndex: "2147483000",
      display: "flex",
      gap: "8px",
      alignItems: "center",
      padding: "6px 10px",
      borderRadius: "8px",
      background: "rgba(20,20,24,0.88)",
      color: "#fff",
      font: "12px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace",
      pointerEvents: "auto",
    } satisfies Partial<CSSStyleDeclaration>);
    overlay.addEventListener("pointerdown", (e) => e.stopPropagation());
    document.body.appendChild(overlay);
  }
  const s = useCanvasStore.getState();
  overlay.textContent = "";
  const label = document.createElement("span");
  label.textContent =
    `● trace  writes ${totals.writes} · moves ${totals.moves} · ` +
    `long frames ${totals.longFrames} · sync ${totals.syncs} · ` +
    `sel ${s.selectedGroupIds.length}ch/${s.canvasSelection.length}`;
  overlay.appendChild(label);
  for (const [text, fn] of [
    ["Save", saveTrace],
    ["Stop", stopTrace],
  ] as const) {
    const b = document.createElement("button");
    b.textContent = text;
    Object.assign(b.style, {
      font: "inherit",
      color: "#fff",
      background: "rgba(255,255,255,0.14)",
      border: "0",
      borderRadius: "5px",
      padding: "2px 8px",
      cursor: "pointer",
    } satisfies Partial<CSSStyleDeclaration>);
    b.addEventListener("click", fn);
    overlay.appendChild(b);
  }
}

/** Record a sync decision. No-op unless tracing. */
export function traceSync(what: string, detail?: Record<string, unknown>): void {
  if (!active) return;
  totals.syncs += 1;
  push({ t: now(), type: "sync", what, ...(detail ? { detail } : {}) });
}

export function startTrace(): void {
  if (active || typeof window === "undefined") return;
  active = true;
  startedAt = performance.now();
  events = [];
  totals = { writes: 0, moves: 0, longFrames: 0, syncs: 0 };
  windowCounts = { writes: 0, viewportWrites: 0 };
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
  unsubscribe = useCanvasStore.subscribe((next, prev) =>
    onStoreWrite(
      next as unknown as Record<string, unknown>,
      prev as unknown as Record<string, unknown>,
    ),
  );
  frameLoop();
  sampleTimer = setInterval(sample, 1000);
  sample();
}

export function stopTrace(): void {
  if (!active) return;
  active = false;
  unsubscribe?.();
  unsubscribe = null;
  cancelAnimationFrame(rafId);
  if (sampleTimer) clearInterval(sampleTimer);
  sampleTimer = null;
  overlay?.remove();
  overlay = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function dumpTrace(): {
  meta: Record<string, unknown>;
  events: TraceEvent[];
} {
  return {
    meta: {
      startedAt: new Date(Date.now() - (performance.now() - startedAt)).toISOString(),
      durationMs: now(),
      userAgent: navigator.userAgent,
      viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
      totals,
    },
    events: [...events],
  };
}

/** Download the trace as a JSON file to this machine. */
export function saveTrace(): void {
  const blob = new Blob([JSON.stringify(dumpTrace(), null, 1)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `flowstate-trace-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type Box = { x: number; y: number; w: number; h: number };
const roundBox = (b: Box | null) =>
  b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.w), h: Math.round(b.h) } : null;

/** What is selected now, piece by piece, with each piece's world bounds. */
export function explainSelection() {
  const s = useCanvasStore.getState();
  const chapter = (id: string) => {
    const g = s.groups[id];
    if (!g) return { id, missing: true };
    return {
      id,
      label: g.label,
      cards: g.cardIds?.length ?? 0,
      familyRoots: g.familyRootThreadIds.length,
      items: g.items?.length ?? 0,
      bounds: roundBox(computeGroupBounds(s, g)),
    };
  };
  return {
    activeChapter: s.activeGroupId ? chapter(s.activeGroupId) : null,
    selectedChapters: s.selectedGroupIds.map(chapter),
    units: getSelectionUnits(s, {
      familyRootIds: s.selectedFamilyRootIds,
      items: s.canvasSelection,
    }).map((u) => ({ kind: u.kind, id: u.id, bounds: roundBox(u.bounds) })),
    viewport: s.viewport,
  };
}

/**
 * Expose `window.__flowstateTrace` and start if asked to by `?trace=1` or the
 * localStorage flag. Safe to call more than once.
 */
export function installCanvasFlightRecorder(): void {
  if (typeof window === "undefined") return;
  (window as unknown as Record<string, unknown>).__flowstateTrace = {
    start: startTrace,
    stop: stopTrace,
    dump: dumpTrace,
    save: saveTrace,
    selection: explainSelection,
  };
  let wanted = false;
  try {
    wanted =
      new URLSearchParams(window.location.search).get("trace") === "1" ||
      window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    wanted = false;
  }
  if (wanted) startTrace();
}
