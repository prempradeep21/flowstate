"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, m } from "framer-motion";
import { getStudioPool, type StudioArtifact, type StudioArtifactItem, type StudioCardItem } from "@/lib/artifactStudio/pool";
import { AccentPicker } from "./AccentPicker";
import { StyleFontPickers } from "./FontPicker";
import { HugContext } from "./ScaledStage";
import { ModeToggle, Segmented } from "./StudioControls";
import { StreamedContext } from "@/components/artifactStyles/cards";
import {
  STYLE_FAMILIES,
  StyledArtifact,
  backdropOf,
  getStyleTheme,
  hugFloorOf,
  type ArtifactStyleFamily,
  type QaState,
  type StudioMode,
  type StyleFamilyId,
} from "@/components/artifactStyles";

/**
 * Sample canvas — a blank board for playing a Q&A turn end to end in any
 * style family: type into the empty card, send, watch it think, stream its
 * answer and settle, then see the artifacts it brings pop in beside it.
 *
 * Nothing here talks to a model. Answers are real sample answers from the
 * pool, picked by the words they share with the question; artifacts likewise.
 * Pace slows the turn down, or holds each state until you step it on, so the
 * loading states can be judged as long as you like. Style, theme and mode are
 * the studio's own and switch live under the cards.
 *
 * Positions are world px at true canvas size; the board pans (drag, wheel)
 * and zooms (ctrl/⌘ + wheel, pinch) around them.
 */

type Pace = "live" | "slow" | "step";

/** How much longer every timed step takes at each pace. */
const PACE_FACTOR: Record<Exclude<Pace, "step">, number> = { live: 1, slow: 3 };

const THINK_MS = 1500;
/** Answers stream at about this many characters a second, within the bounds below. */
const STREAM_CPS = 240;
const STREAM_MIN_MS = 1600;
const STREAM_MAX_MS = 4500;
const TYPE_MS_PER_CHAR = 26;
/** Gap between a card and the artifacts it brings, and between those artifacts. */
const BRANCH_GAP_X = 120;
const BRANCH_GAP_Y = 56;

const ZOOM_MIN = 0.15;
const ZOOM_MAX = 2;
const ZOOM_START = 0.7;
const DOT_PITCH = 24;

interface CanvasNode {
  id: string;
  item: StudioArtifact;
  x: number;
  y: number;
  /** Q&A cards only. */
  qa?: QaState;
  draft: string;
  /** 0–1 of the answer that has arrived (answering). */
  streamed: number;
  /** When the current timed phase began (performance.now()). */
  phaseAt: number;
  /** The card that brought this artifact in. */
  parent?: string;
  /** Pop-in stagger, seconds. */
  delay: number;
  /** Place among its parent's artifacts while it still sits in their column; dragging it out clears it. */
  stack?: number;
}

interface View {
  x: number;
  y: number;
  z: number;
}

let nodeSeq = 0;
const nextId = () => `n${++nodeSeq}`;

const STOP_WORDS = new Set(["what", "when", "where", "which", "with", "that", "this", "does", "have", "from", "about", "would", "could", "should", "their", "there", "they", "your", "into", "than", "then", "were", "will", "make", "made", "much", "many", "most", "more", "some", "like", "just", "over"]);

function wordsOf(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w)),
  );
}

function overlap(a: Set<string>, text: string): number {
  let n = 0;
  for (const w of wordsOf(text)) if (a.has(w)) n++;
  return n;
}

/** A Q&A card carrying the asked question and a sample answer, shaped like the template it borrows. */
function qaItem(id: string, template: StudioCardItem, question: string, answer: string): StudioCardItem {
  return {
    ...template,
    uid: `canvas/${id}`,
    card: { ...template.card, id, question, answer, status: "done" },
    artifact: { id, title: question, latestVersionId: id },
    payload: { type: "qa", title: question, data: { heading: question, body: answer } },
  };
}

function streamMs(answer: string): number {
  return Math.min(STREAM_MAX_MS, Math.max(STREAM_MIN_MS, (answer.length / STREAM_CPS) * 1000));
}

export function StudioCanvas({
  family,
  themeId,
  mode,
  onFamilyChange,
  onThemeChange,
  onModeChange,
  onClose,
}: {
  family: ArtifactStyleFamily;
  themeId: string | null;
  mode: StudioMode;
  onFamilyChange: (id: StyleFamilyId) => void;
  onThemeChange: (id: string) => void;
  onModeChange: (mode: StudioMode) => void;
  onClose: () => void;
}) {
  const pool = useMemo(() => getStudioPool(), []);
  const qaTemplates = useMemo(() => pool.filter((i): i is StudioCardItem => !!i.card && i.kind === "qa"), [pool]);
  const artifacts = useMemo(() => pool.filter((i): i is StudioArtifactItem => !i.card), [pool]);
  const template = qaTemplates[0]!;
  const cardW = template.natural.w;

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, z: ZOOM_START });
  const viewRef = useRef(view);
  viewRef.current = view;
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const [heights, setHeights] = useState<Record<string, number>>({});
  const heightsRef = useRef(heights);
  heightsRef.current = heights;
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pace, setPace] = useState<Pace>("live");
  const paceRef = useRef(pace);
  paceRef.current = pace;
  const answerTurn = useRef(0);
  const typingTimer = useRef<number | null>(null);

  const theme = getStyleTheme(family, themeId);
  const backdrop = backdropOf(family, theme?.id, mode);
  const dark = mode === "dark";

  // ─── Placement ──────────────────────────────────────────────────────────

  const viewportCenter = useCallback(() => {
    const el = viewportRef.current;
    const { x, y, z } = viewRef.current;
    const w = el?.clientWidth ?? 1200;
    const h = el?.clientHeight ?? 800;
    return { x: (w / 2 - x) / z, y: (h / 2 - y) / z };
  }, []);

  const heightOf = (n: CanvasNode) => heightsRef.current[n.id] ?? (n.qa === "typing" ? 64 : n.item.natural.h);

  /** An empty card, ready for a question, centred on a world point. */
  const addComposer = useCallback(
    (at?: { x: number; y: number }) => {
      const id = nextId();
      const p = at ?? viewportCenter();
      const node: CanvasNode = {
        id,
        item: qaItem(id, template, "", template.card.answer),
        x: Math.round(p.x - cardW / 2),
        y: Math.round(p.y - 32),
        qa: "typing",
        draft: "",
        streamed: 0,
        phaseAt: 0,
        delay: 0,
      };
      setNodes((ns) => [...ns, node]);
      setSelected(id);
      return id;
    },
    [template, cardW, viewportCenter],
  );

  const reset = useCallback(() => {
    if (typingTimer.current) window.clearInterval(typingTimer.current);
    setNodes([]);
    setHeights({});
    setSelected(null);
    const el = viewportRef.current;
    const w = el?.clientWidth ?? 1200;
    const h = el?.clientHeight ?? 800;
    // The board's origin sits a little above the middle — where the first card goes.
    const next = { x: w / 2, y: h * 0.38, z: ZOOM_START };
    viewRef.current = next;
    setView(next);
    addComposer({ x: 0, y: 0 });
  }, [addComposer]);

  // A fresh board on open.
  useLayoutEffect(() => {
    reset();
    return () => {
      if (typingTimer.current) window.clearInterval(typingTimer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── The turn ───────────────────────────────────────────────────────────

  /** The sample answer closest to the question — or the next one in turn when none is close. */
  const answerFor = useCallback(
    (question: string) => {
      const words = wordsOf(question);
      let best: StudioCardItem | null = null;
      let bestScore = 0;
      for (const t of qaTemplates) {
        const score = overlap(words, t.source) * 3 + overlap(words, t.card.question) * 2 + overlap(words, t.card.answer.slice(0, 400));
        if (score > bestScore) {
          best = t;
          bestScore = score;
        }
      }
      if (!best || bestScore < 2) best = qaTemplates[answerTurn.current++ % qaTemplates.length]!;
      return best;
    },
    [qaTemplates],
  );

  const submit = useCallback(
    (id: string, raw: string) => {
      const question = raw.trim();
      if (!question) return;
      if (typingTimer.current) window.clearInterval(typingTimer.current);
      const t = answerFor(question);
      setNodes((ns) =>
        ns.map((n) =>
          n.id === id
            ? { ...n, item: qaItem(id, t, question, t.card.answer), qa: "thinking", draft: "", streamed: 0, phaseAt: performance.now() }
            : n,
        ),
      );
      setSelected(id);
    },
    [answerFor],
  );

  /** One or two artifacts the answer brings — the ones closest to the question, else a varied pair. */
  const branchesFor = useCallback(
    (card: CanvasNode, all: CanvasNode[]): CanvasNode[] => {
      const onBoard = new Set(all.map((n) => n.item.uid.replace(/^canvas\//, "")));
      const words = wordsOf(card.item.artifact.title);
      const candidates = artifacts.filter((a) => !onBoard.has(a.uid) && a.natural.w <= 1100 && a.natural.h <= 900);
      const scored = candidates
        .map((a) => ({ a, score: overlap(words, `${a.artifact.title} ${a.source}`) + Math.random() * 0.5 }))
        .sort((p, q) => q.score - p.score);
      const picks: StudioArtifactItem[] = [];
      const take = (a: StudioArtifactItem) => {
        if (picks.length < 2 && !picks.some((p) => p.variant === a.variant)) picks.push(a);
      };
      for (const { a, score } of scored) if (score >= 1) take(a);
      // Pad with a random, different kind so every answer brings something to look at.
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      for (const a of shuffled) if (picks.length < 2) take(a);

      const x = card.x + card.item.natural.w + BRANCH_GAP_X;
      let y = card.y;
      return picks.map((a, i) => {
        const node: CanvasNode = {
          id: nextId(),
          item: { ...a, uid: `canvas/${a.uid}` },
          x,
          y,
          draft: "",
          streamed: 1,
          phaseAt: 0,
          parent: card.id,
          delay: 0.12 + i * 0.16,
          stack: i,
        };
        y += a.natural.h + BRANCH_GAP_Y;
        return node;
      });
    },
    [artifacts],
  );

  /** Moves a card on to its next state; finishing brings its artifacts in. */
  const advance = useCallback(
    (id: string) => {
      setNodes((ns) => {
        const card = ns.find((n) => n.id === id);
        if (!card) return ns;
        const now = performance.now();
        if (card.qa === "thinking") {
          return ns.map((n) => (n.id === id ? { ...n, qa: "answering", streamed: paceRef.current === "step" ? 0.42 : 0, phaseAt: now } : n));
        }
        if (card.qa === "answering") {
          const done = { ...card, qa: "done" as const, streamed: 1 };
          const rest = ns.filter((n) => n.parent !== id).map((n) => (n.id === id ? done : n));
          return [...rest, ...branchesFor(done, rest)];
        }
        return ns;
      });
    },
    [branchesFor],
  );

  const replay = useCallback((id: string) => {
    setNodes((ns) =>
      ns.filter((n) => n.parent !== id).map((n) => (n.id === id ? { ...n, qa: "thinking", streamed: 0, phaseAt: performance.now() } : n)),
    );
  }, []);

  // Timed phases: one clock for every card mid-turn. Step pace leaves them where they are.
  const running = nodes.some((n) => n.qa === "thinking" || n.qa === "answering");
  useEffect(() => {
    if (!running || pace === "step") return;
    const k = PACE_FACTOR[pace];
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      // ~30 updates a second is smooth for text arriving and light on the cards.
      if (now - last < 33) return;
      last = now;
      // Read who finishes from the committed board — updaters may run later than this tick.
      const finished = nodesRef.current
        .filter((n) => n.qa === "answering" && now - n.phaseAt >= streamMs(n.item.card?.answer ?? "") * k)
        .map((n) => n.id);
      setNodes((ns) => {
        let changed = false;
        const next = ns.map((n) => {
          if (n.qa === "thinking" && now - n.phaseAt >= THINK_MS * k) {
            changed = true;
            return { ...n, qa: "answering" as const, streamed: 0, phaseAt: now };
          }
          if (n.qa === "answering") {
            const streamed = Math.min(1, (now - n.phaseAt) / (streamMs(n.item.card?.answer ?? "") * k));
            if (streamed < 1 && streamed !== n.streamed) {
              changed = true;
              return { ...n, streamed };
            }
          }
          return n;
        });
        return changed ? next : ns;
      });
      for (const id of finished) advance(id);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, pace, advance]);

  // Leaving step pace picks the clock back up from where each card stands.
  useEffect(() => {
    if (pace === "step") return;
    const now = performance.now();
    const k = PACE_FACTOR[pace];
    setNodes((ns) =>
      ns.map((n) =>
        n.qa === "answering" ? { ...n, phaseAt: now - n.streamed * streamMs(n.item.card?.answer ?? "") * k } : n.qa === "thinking" ? { ...n, phaseAt: now } : n,
      ),
    );
  }, [pace]);

  const setDraft = useCallback((id: string, draft: string) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, draft } : n)));
  }, []);

  /** Types a question into the open empty card (making one if needed), letter by letter, then sends it. */
  const autoAsk = useCallback(
    (question: string) => {
      if (typingTimer.current) window.clearInterval(typingTimer.current);
      const open = [...nodesRef.current].reverse().find((n) => n.qa === "typing");
      const id = open?.id ?? addComposer();
      let i = 0;
      const k = paceRef.current === "slow" ? 2 : 1;
      typingTimer.current = window.setInterval(() => {
        i++;
        setDraft(id, question.slice(0, i));
        if (i >= question.length) {
          window.clearInterval(typingTimer.current!);
          typingTimer.current = window.setTimeout(() => submit(id, question), 380 * k);
        }
      }, TYPE_MS_PER_CHAR * k);
    },
    [addComposer, setDraft, submit],
  );

  const suggestions = useMemo(() => {
    const short = qaTemplates.filter((t) => t.card.question.length <= 70);
    return [...short].sort(() => Math.random() - 0.5).slice(0, 3).map((t) => t.card.question);
  }, [qaTemplates]);

  // ─── Pan, zoom, drag ────────────────────────────────────────────────────

  const zoomAt = useCallback((factor: number, sx: number, sy: number) => {
    setView((v) => {
      const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v.z * factor));
      const wx = (sx - v.x) / v.z;
      const wy = (sy - v.y) / v.z;
      return { x: sx - wx * z, y: sy - wy * z, z };
    });
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
      else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const zoomBy = (factor: number) => {
    const el = viewportRef.current;
    zoomAt(factor, (el?.clientWidth ?? 0) / 2, (el?.clientHeight ?? 0) / 2);
  };

  const fit = useCallback(() => {
    const el = viewportRef.current;
    const ns = nodesRef.current;
    if (!el || !ns.length) return;
    const minX = Math.min(...ns.map((n) => n.x));
    const minY = Math.min(...ns.map((n) => n.y));
    const maxX = Math.max(...ns.map((n) => n.x + n.item.natural.w));
    const maxY = Math.max(...ns.map((n) => n.y + heightOf(n)));
    const pad = 80;
    const z = Math.min(1, Math.max(ZOOM_MIN, Math.min((el.clientWidth - pad * 2) / (maxX - minX), (el.clientHeight - pad * 2 - 80) / (maxY - minY))));
    setView({ x: (el.clientWidth - (maxX - minX) * z) / 2 - minX * z, y: (el.clientHeight - 80 - (maxY - minY) * z) / 2 - minY * z, z });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const gesture = useRef<{ kind: "pan" | "node"; id?: string; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  const onBoardPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false };
  };

  const onNodePointerDown = (e: ReactPointerEvent<HTMLDivElement>, n: CanvasNode) => {
    if (e.button !== 0) return;
    // The composer and anything clickable inside a card keep their own pointer.
    if ((e.target as HTMLElement).closest("input, textarea, button, a, [contenteditable], [data-canvas-input]")) return;
    e.stopPropagation();
    viewportRef.current?.setPointerCapture(e.pointerId);
    gesture.current = { kind: "node", id: n.id, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y, moved: false };
    setSelected(n.id);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.sx;
    const dy = e.clientY - g.sy;
    if (!g.moved && Math.hypot(dx, dy) < 4) return;
    g.moved = true;
    if (g.kind === "pan") setView((v) => ({ ...v, x: g.ox + dx, y: g.oy + dy }));
    else {
      const z = viewRef.current.z;
      // Drag the card and everything it brought along with it.
      const moving = new Set([g.id, ...nodesRef.current.filter((n) => n.parent === g.id).map((n) => n.id)]);
      const base = nodesRef.current.find((n) => n.id === g.id)!;
      const ddx = g.ox + dx / z - base.x;
      const ddy = g.oy + dy / z - base.y;
      setNodes((ns) =>
        ns.map((n) =>
          !moving.has(n.id) ? n : { ...n, x: n.x + ddx, y: n.y + ddy, stack: n.id === g.id ? undefined : n.stack },
        ),
      );
    }
  };

  const onPointerUp = () => {
    const g = gesture.current;
    gesture.current = null;
    if (g?.kind === "pan" && !g.moved) setSelected(null);
  };

  const onBoardDoubleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-canvas-node]")) return;
    const r = viewportRef.current!.getBoundingClientRect();
    addComposer({ x: (e.clientX - r.left - view.x) / view.z, y: (e.clientY - r.top - view.y) / view.z });
  };

  // Delete removes the selected card (and what it brought); Escape lets go of it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "Escape") setSelected(null);
      if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        setNodes((ns) => ns.filter((n) => n.id !== selected && n.parent !== selected));
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // Measured heights — cards hug their answer as it grows.
  const measure = useCallback((id: string, h: number) => {
    setHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
  }, []);

  // An answer's artifacts stay in a column under one another as their measured heights come in.
  useEffect(() => {
    setNodes((ns) => {
      const byId = new Map(ns.map((n) => [n.id, n]));
      const nextY = new Map<string, number>();
      let changed = false;
      const out = [...ns]
        .sort((a, b) => (a.stack ?? 0) - (b.stack ?? 0))
        .reduce<Map<string, CanvasNode>>((acc, n) => {
          const parent = n.parent ? byId.get(n.parent) : undefined;
          if (n.stack === undefined || !parent) return acc.set(n.id, n);
          const y = nextY.get(parent.id) ?? parent.y;
          nextY.set(parent.id, y + (heights[n.id] ?? n.item.natural.h) + BRANCH_GAP_Y);
          if (Math.abs(n.y - y) < 0.5) return acc.set(n.id, n);
          changed = true;
          return acc.set(n.id, { ...n, y });
        }, new Map());
      return changed ? ns.map((n) => out.get(n.id)!) : ns;
    });
  }, [heights, nodes.length]);

  // ─── Render ─────────────────────────────────────────────────────────────

  const selectedNode = nodes.find((n) => n.id === selected) ?? null;
  const midTurn = [...nodes].reverse().find((n) => n.qa === "thinking" || n.qa === "answering") ?? null;
  const dotColor = backdrop?.muted ?? "rgb(var(--canvas-grid-dot))";

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-canvas-bg text-canvas-ink">
      <div className="z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-canvas-border/70 bg-canvas-bg/90 px-4 py-2.5 backdrop-blur-md sm:px-6">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-full border border-canvas-border bg-canvas-card px-3 py-1.5 text-canvas-body-sm font-medium hover:border-canvas-accent/40"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <path d="M10 3.5 5.5 8l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Studio
        </button>
        <div className="min-w-0">
          <p className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">Artifact Studio</p>
          <h2 className="font-display text-lg font-medium leading-tight">Sample canvas</h2>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Segmented
            label="Style family"
            value={family.id}
            onChange={onFamilyChange}
            options={STYLE_FAMILIES.map((f) => ({ id: f.id, label: f.name, hint: f.summary }))}
          />
          {family.themes?.length ? (
            <Segmented
              label="Theme"
              value={theme?.id ?? family.themes[0]!.id}
              onChange={onThemeChange}
              options={family.themes.map((t) => ({ id: t.id, label: t.name, hint: t.hint }))}
            />
          ) : null}
          {family.id === "style-d" ? <AccentPicker /> : null}
          <StyleFontPickers family={family} />
          <ModeToggle mode={mode} onChange={onModeChange} />
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`relative min-h-0 flex-1 touch-none select-none overflow-hidden ${dark ? "theme-scope-dark" : ""} ${gesture.current?.kind === "pan" ? "cursor-grabbing" : "cursor-default"}`}
        style={boardBackground(backdrop?.background ?? "rgb(var(--canvas-bg))", dotColor, view)}
        onPointerDown={onBoardPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onBoardDoubleClick}
      >
        <div
          className="absolute left-0 top-0"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`, transformOrigin: "0 0" }}
        >
          <BranchLines nodes={nodes} heightOf={heightOf} color={backdrop?.ink ?? "rgb(var(--canvas-ink))"} />
          <AnimatePresence>
            {nodes.map((n) => (
              <CanvasNodeView
                key={n.id}
                node={n}
                family={family}
                themeId={theme?.id ?? null}
                mode={mode}
                chromeState={selected === n.id ? "selected" : hovered === n.id ? "hover" : "rest"}
                onHover={(on) => setHovered((h) => (on ? n.id : h === n.id ? null : h))}
                onPointerDown={(e) => onNodePointerDown(e, n)}
                onDraft={(d) => setDraft(n.id, d)}
                onSubmit={(q) => submit(n.id, q)}
                onMeasure={(h) => measure(n.id, h)}
              />
            ))}
          </AnimatePresence>
        </div>

        {nodes.length === 0 ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-canvas-body-sm" style={{ color: backdrop?.muted ?? "rgb(var(--canvas-muted))" }}>
              Double-click anywhere to ask a question
            </p>
          </div>
        ) : null}
      </div>

      {/* The dock: ask, pace, step / replay, zoom. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-20 flex justify-center px-4">
        <div
          className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-[28px] border border-canvas-border bg-canvas-card/95 p-2 shadow-[0_16px_40px_-12px_rgb(0_0_0/0.25)] backdrop-blur"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => addComposer()}
            title="A new empty card in the middle of the view (or double-click the board)"
            className="inline-flex items-center gap-1.5 rounded-full bg-canvas-ink px-4 py-2 text-canvas-body-sm font-medium text-canvas-card hover:opacity-90"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M8 3v10M3 8h10" strokeLinecap="round" />
            </svg>
            Ask
          </button>
          <div className="flex max-w-[640px] flex-wrap items-center gap-1.5">
            {suggestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => autoAsk(q)}
                title="Type this into the empty card and send it"
                className="max-w-[220px] truncate rounded-full border border-canvas-border px-3 py-1.5 text-canvas-body-sm text-canvas-muted hover:border-canvas-accent/40 hover:text-canvas-ink"
              >
                {q}
              </button>
            ))}
          </div>
          <span className="mx-1 h-6 w-px bg-canvas-border" aria-hidden />
          <Segmented
            label="Pace"
            value={pace}
            onChange={setPace}
            options={[
              { id: "live", label: "Live", hint: "The turn at its real speed" },
              { id: "slow", label: "Slow", hint: "Every step three times longer" },
              { id: "step", label: "Step", hint: "Hold each state until you step it on" },
            ]}
          />
          {pace === "step" && midTurn ? (
            <button
              type="button"
              onClick={() => advance(midTurn.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-canvas-accent px-4 py-2 text-canvas-body-sm font-medium text-white hover:opacity-90"
            >
              {midTurn.qa === "thinking" ? "Start answer" : "Finish answer"}
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="m6 3.5 4.5 4.5L6 12.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}
          {selectedNode?.qa === "done" ? (
            <button
              type="button"
              onClick={() => replay(selectedNode.id)}
              title="Run this card's turn again from thinking"
              className="rounded-full border border-canvas-border px-3 py-1.5 text-canvas-body-sm font-medium hover:border-canvas-accent/40"
            >
              Replay turn
            </button>
          ) : null}
          <span className="mx-1 h-6 w-px bg-canvas-border" aria-hidden />
          <div className="flex items-center gap-0.5 text-canvas-body-sm">
            <button type="button" onClick={() => zoomBy(1 / 1.25)} aria-label="Zoom out" className="h-8 w-8 rounded-full hover:bg-canvas-bg">
              −
            </button>
            <button type="button" onClick={fit} title="Fit everything" className="min-w-[52px] rounded-full px-2 py-1.5 tabular-nums hover:bg-canvas-bg">
              {Math.round(view.z * 100)}%
            </button>
            <button type="button" onClick={() => zoomBy(1.25)} aria-label="Zoom in" className="h-8 w-8 rounded-full hover:bg-canvas-bg">
              +
            </button>
          </div>
          <button
            type="button"
            onClick={reset}
            title="Clear the board and start again"
            className="rounded-full px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

/** The family's ground with the dot grid over it; the dots pan and zoom with the board, the ground stays put. */
function boardBackground(ground: string, dot: string, view: View): CSSProperties {
  const pitch = DOT_PITCH * view.z;
  const dots = `radial-gradient(circle, ${dot} ${Math.max(0.6, Math.min(1.1, view.z * 1.5))}px, transparent 0)`;
  const at = `${view.x}px ${view.y}px`;
  if (!/gradient\(/.test(ground)) {
    return { backgroundColor: ground, backgroundImage: dots, backgroundSize: `${pitch}px ${pitch}px`, backgroundPosition: at };
  }
  return {
    backgroundImage: `${dots}, ${ground}`,
    backgroundSize: `${pitch}px ${pitch}px, 100% 100%`,
    backgroundPosition: `${at}, 0 0`,
    backgroundRepeat: "repeat, no-repeat",
  };
}

/** One card or artifact on the board, popping in when it arrives. */
function CanvasNodeView({
  node,
  family,
  themeId,
  mode,
  chromeState,
  onHover,
  onPointerDown,
  onDraft,
  onSubmit,
  onMeasure,
}: {
  node: CanvasNode;
  family: ArtifactStyleFamily;
  themeId: string | null;
  mode: StudioMode;
  chromeState: "rest" | "hover" | "selected";
  onHover: (on: boolean) => void;
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onDraft: (draft: string) => void;
  onSubmit: (question: string) => void;
  onMeasure: (h: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const floor = node.qa ? 0 : hugFloorOf(family, node.item);
  const hugs = floor != null;
  const typing = node.qa === "typing";
  // Families that draw their own composer get a live field laid over it; Current's is real.
  const overlayInput = typing && !family.render;
  const onMeasureRef = useRef(onMeasure);
  onMeasureRef.current = onMeasure;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => onMeasureRef.current(Math.ceil(el.offsetHeight)));
    ro.observe(el);
    return () => ro.disconnect();
    // The empty card and the card are different elements — measure whichever is mounted.
  }, [typing]);

  const ctx = {
    item: node.item,
    interactive: !!node.qa,
    surface: "focus" as const,
    chromeState,
    themeId,
    mode,
    qaState: node.qa,
    composerDraft: node.draft,
    onComposerDraft: typing ? onDraft : undefined,
    onComposerSubmit: typing ? onSubmit : undefined,
  };

  return (
    <m.div
      data-canvas-node={node.id}
      className="absolute"
      style={{ left: node.x, top: node.y, width: node.item.natural.w, transformOrigin: "50% 40%" }}
      initial={{ opacity: 0, scale: 0.88, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.16 } }}
      transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.9, delay: node.delay }}
      onPointerDown={onPointerDown}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Re-keyed when the empty card becomes a card, so sending pops it. */}
      <m.div
        key={typing ? "composer" : "card"}
        ref={ref}
        className="relative"
        style={hugs ? { minHeight: floor, display: "flex", flexDirection: "column" } : { height: node.item.natural.h }}
        initial={typing ? false : { scale: 0.96, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <HugContext.Provider value={hugs}>
          <StreamedContext.Provider value={node.streamed}>
            <StyledArtifact family={family} ctx={ctx} />
          </StreamedContext.Provider>
        </HugContext.Provider>
        {overlayInput ? <ComposerInput draft={node.draft} onDraft={onDraft} onSubmit={onSubmit} /> : null}
      </m.div>
    </m.div>
  );
}

/**
 * The live field over a family's drawn composer: invisible, it takes the
 * keystrokes and the drawn field shows them. The send disc's corner sends.
 */
function ComposerInput({ draft, onDraft, onSubmit }: { draft: string; onDraft: (d: string) => void; onSubmit: (q: string) => void }) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div data-canvas-input className="absolute inset-0 flex">
      <input
        ref={ref}
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit(draft);
          }
        }}
        aria-label="Ask anything"
        className="min-w-0 flex-1 cursor-text bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent"
      />
      <button type="button" aria-label="Send" onClick={() => onSubmit(draft)} className="aspect-square h-full shrink-0 cursor-pointer rounded-full" />
    </div>
  );
}

/** A soft curve from each card to the artifacts it brought in. */
function BranchLines({ nodes, heightOf, color }: { nodes: CanvasNode[]; heightOf: (n: CanvasNode) => number; color: string }) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const paths = nodes.flatMap((n) => {
    const p = n.parent ? byId.get(n.parent) : undefined;
    if (!p) return [];
    const x1 = p.x + p.item.natural.w;
    const y1 = p.y + Math.min(heightOf(p) / 2, 140);
    const x2 = n.x;
    const y2 = n.y + Math.min(heightOf(n) / 2, 140);
    const mx = (x1 + x2) / 2;
    return [{ id: n.id, d: `M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`, delay: n.delay }];
  });
  return (
    <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1} aria-hidden>
      {paths.map((p) => (
        <m.path
          key={p.id}
          d={p.d}
          fill="none"
          // A style, not the attribute — presentation attributes don't resolve var().
          style={{ stroke: color, strokeOpacity: 0.28 }}
          strokeWidth={2}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: Math.max(0, p.delay - 0.1), ease: "easeOut" }}
        />
      ))}
    </svg>
  );
}
