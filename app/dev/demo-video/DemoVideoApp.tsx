"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useSearchParams } from "next/navigation";
import { AnswerSelectionMenu } from "@/components/AnswerSelectionMenu";
import { CanvasBottomToolbar } from "@/components/CanvasBottomToolbar";
import { CanvasMinimap } from "@/components/CanvasMinimap";
import { CanvasViewport } from "@/components/CanvasViewport";
import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import type { AnswerExplain, Card as CardType } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";
import { DemoCard } from "./DemoCard";
import { DemoConnector, DemoGhostConnector } from "./DemoConnector";
import { ClickRipple, DemoCursor } from "./DemoCursor";
import {
  ACCENT_MAIN,
  CARD_B,
  DEMO_THREADS,
  DEMO_THREAD_MAIN,
  POS_B,
  SELECTION_PHRASE,
  type DemoCardId,
} from "./fixtures";
import {
  BEATS,
  DEFAULT_LAYOUT,
  DEMO_DURATION_MS,
  sceneStateAt,
  type DemoLayout,
  type SceneState,
  type WorldRect,
} from "./timeline";

declare global {
  interface Window {
    __seek?: (tMs: number) => Promise<void>;
    __demoReady?: Promise<void>;
  }
}

/** Deterministic phase for CSS animations: paused everywhere, with the phase
 *  injected via a negative delay from --demo-t. One-shot entrance animations
 *  (fill: both) snap to their final state, which is what frame-stepping wants.
 *  Transitions are killed only in capture mode (t drives every value). */
const DEMO_ANIMATION_CSS = `
html[data-demo-video] *, html[data-demo-video] *::before, html[data-demo-video] *::after {
  animation-play-state: paused !important;
  animation-delay: calc(var(--demo-t, 0) * -1ms) !important;
}
/* One-shot entrance animations must show their finished state (the global
   pause freezes them at phase 0 = hidden). Mirrors the app's own
   prefers-reduced-motion block in globals.css. */
html[data-demo-video] .thinking-accent-bar,
html[data-demo-video] .answer-reveal-in,
html[data-demo-video] .motion-popover-in,
html[data-demo-video] .motion-fade-in,
html[data-demo-video] .motion-landing-rise,
html[data-demo-video] .motion-canvas-load-in,
html[data-demo-video] .motion-canvas-load-fade {
  animation: none !important;
}
html[data-demo-video] .motion-canvas-load-in,
html[data-demo-video] .motion-canvas-load-fade {
  opacity: 1;
}
html[data-demo-capture] *, html[data-demo-capture] *::before, html[data-demo-capture] *::after {
  transition: none !important;
}
`;

function screenViewport(
  camera: SceneState["camera"],
  win: { w: number; h: number },
) {
  return {
    x: win.w / 2 - camera.cx * camera.scale,
    y: win.h / 2 - camera.cy * camera.scale,
    scale: camera.scale,
  };
}

function buildStoreCards(scene: SceneState): {
  cards: Record<string, CardType>;
  cardOrder: string[];
} {
  const cards: Record<string, CardType> = {};
  const cardOrder: string[] = [];
  const parentByCard: Partial<Record<DemoCardId, DemoCardId>> = {
    demo_b: "demo_r",
    demo_c: "demo_r",
    demo_d: "demo_b",
  };
  for (const c of scene.cards) {
    if (!c.visible) continue;
    cards[c.id] = {
      id: c.id,
      threadId: c.threadId,
      question: c.question,
      answer: c.answer,
      status: c.status,
      position: c.pos,
      parentCardId: parentByCard[c.id] ?? null,
      parentConversationId: null,
      responseType: "text",
      quotedSelection: c.quotedSelection,
      askStartedAt:
        c.status === "thinking" || c.status === "streaming"
          ? Date.now() - c.askElapsedMs
          : undefined,
      turnUsage:
        c.status === "streaming"
          ? { inputTokens: 1840, outputTokens: Math.round(c.answer.length / 4) }
          : undefined,
    };
    cardOrder.push(c.id);
  }
  return { cards, cardOrder };
}

function measureSelectionWorldRects(): WorldRect[] | null {
  const root = document.querySelector(
    `[data-canvas-card="${CARD_B}"] [data-answer-text-root]`,
  );
  if (!root) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const idx = node.data.indexOf(SELECTION_PHRASE);
    if (idx < 0) continue;
    const range = document.createRange();
    range.setStart(node, idx);
    range.setEnd(node, idx + SELECTION_PHRASE.length);
    const vp = useCanvasStore.getState().viewport;
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 1);
    if (!rects.length) return null;
    return rects.map((r) => ({
      x: (r.left - vp.x) / vp.scale,
      y: (r.top - vp.y) / vp.scale,
      w: r.width / vp.scale,
      h: r.height / vp.scale,
    }));
  }
  return null;
}

function measureCardHeight(id: string): number | null {
  const el = document.querySelector(
    `[data-canvas-card="${id}"]`,
  ) as HTMLElement | null;
  return el && el.offsetHeight > 0 ? el.offsetHeight : null;
}

export function DemoVideoApp() {
  const params = useSearchParams();
  const capture = params.get("capture") === "1";
  const autoPlay = params.get("play") === "1";

  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<DemoLayout>(DEFAULT_LAYOUT);
  const winRef = useRef({ w: 1920, h: 1080 });
  const [mounted, setMounted] = useState(false);
  const [scene, setScene] = useState<SceneState>(() =>
    sceneStateAt(0, DEFAULT_LAYOUT),
  );
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);

  const applyFrame = useCallback((tMs: number) => {
    if (typeof window !== "undefined") {
      // ?w=&h= pin the design viewport (capture); otherwise track the window.
      const qs = new URLSearchParams(window.location.search);
      const qw = Number(qs.get("w"));
      const qh = Number(qs.get("h"));
      winRef.current =
        qw > 0 && qh > 0
          ? { w: qw, h: qh }
          : { w: window.innerWidth, h: window.innerHeight };
    }
    const s = sceneStateAt(tMs, layoutRef.current);
    const { cards, cardOrder } = buildStoreCards(s);
    useCanvasStore.setState({
      cards,
      cardOrder,
      threads: DEMO_THREADS,
      threadOrder: Object.keys(DEMO_THREADS),
      activeThreadId: DEMO_THREAD_MAIN,
      viewport: screenViewport(s.camera, winRef.current),
      viewportSettledScale: s.camera.scale,
      connectorStyle: "orthogonal",
      viewMode: "canvas",
    });
    document.documentElement.style.setProperty("--demo-t", String(tMs));
    setScene(s);
    setT(tMs);
  }, []);

  // Init: mount, fonts, measurement passes, __seek/__demoReady.
  useEffect(() => {
    winRef.current = { w: window.innerWidth, h: window.innerHeight };
    document.documentElement.setAttribute("data-demo-video", "");
    if (capture) document.documentElement.setAttribute("data-demo-capture", "");

    let cancelled = false;
    // rAF doesn't fire while the window is hidden (browser-pane iteration) —
    // race a timeout so seeks still settle; visible capture always wins via rAF.
    const nextFrame = () =>
      new Promise<void>((resolve) => {
        let done = false;
        const finish = () => {
          if (!done) {
            done = true;
            resolve();
          }
        };
        requestAnimationFrame(() => requestAnimationFrame(finish));
        setTimeout(finish, document.hidden ? 40 : 250);
      });

    const ready = (async () => {
      // Leave the mount commit before any flushSync (React disallows
      // flushing from inside a lifecycle) and let the scene mount.
      setMounted(true);
      await new Promise((r) => setTimeout(r, 0));
      await nextFrame();
      if (cancelled) return;

      // Pass 1: R in its initial state (follow-up footer present). Render
      // FIRST so the card text actually requests its fonts, then wait for
      // them — measuring on fallback metrics shifts line wraps.
      flushSync(() => applyFrame(600));
      await nextFrame();
      await document.fonts.ready;
      while (document.fonts.status === "loading") {
        await new Promise((r) => setTimeout(r, 50));
      }
      await nextFrame();
      if (cancelled) return;
      const rWithFooter = measureCardHeight("demo_r");

      // Pass 2: everything answered, before the selection menu appears.
      flushSync(() => applyFrame(9200));
      await nextFrame();
      const layout: DemoLayout = {
        heights: {
          demo_r: measureCardHeight("demo_r") ?? DEFAULT_LAYOUT.heights.demo_r,
          demo_b: measureCardHeight("demo_b") ?? DEFAULT_LAYOUT.heights.demo_b,
          demo_c: measureCardHeight("demo_c") ?? DEFAULT_LAYOUT.heights.demo_c,
          demo_d: DEFAULT_LAYOUT.heights.demo_d,
        },
        rHeightWithFooter: rWithFooter ?? DEFAULT_LAYOUT.rHeightWithFooter,
        selectionRects:
          measureSelectionWorldRects() ?? DEFAULT_LAYOUT.selectionRects,
      };
      layoutRef.current = layout;

      flushSync(() => applyFrame(0));
      await nextFrame();
    })();

    window.__demoReady = ready;
    window.__seek = async (tMs: number) => {
      await ready;
      // Two passes: connector anchors measure card DOM, which only reflects
      // this frame's card state after the first commit.
      flushSync(() => applyFrame(tMs));
      flushSync(() => applyFrame(tMs));
      await nextFrame();
    };

    if (autoPlay) {
      ready.then(() => {
        if (!cancelled) startPlayback();
      });
    }

    return () => {
      cancelled = true;
      document.documentElement.removeAttribute("data-demo-video");
      document.documentElement.removeAttribute("data-demo-capture");
      delete window.__seek;
      delete window.__demoReady;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPlayback = useCallback(() => {
    if (playingRef.current) return;
    playingRef.current = true;
    setPlaying(true);
    const startWall = performance.now();
    const startT = 0;
    const tick = (now: number) => {
      if (!playingRef.current) return;
      const tMs = (startT + (now - startWall)) % DEMO_DURATION_MS;
      applyFrame(tMs);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [applyFrame]);

  const stopPlayback = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
  }, []);

  if (!mounted) {
    return <div className="fixed inset-0 bg-canvas-bg" />;
  }

  const win = winRef.current;
  const vp = screenViewport(scene.camera, win);
  const layout = layoutRef.current;

  const storeCards = useCanvasStore.getState().cards;

  // Selection geometry (world → screen) for the menu + card-local overlays.
  const selRects = layout.selectionRects;
  const selBounds = {
    x: Math.min(...selRects.map((r) => r.x)),
    y: Math.min(...selRects.map((r) => r.y)),
    right: Math.max(...selRects.map((r) => r.x + r.w)),
    bottom: Math.max(...selRects.map((r) => r.y + r.h)),
  };
  const menuRect = new DOMRect(
    vp.x + selBounds.x * vp.scale,
    vp.y + selBounds.y * vp.scale,
    (selBounds.right - selBounds.x) * vp.scale,
    (selBounds.bottom - selBounds.y) * vp.scale,
  );

  const explainObj: AnswerExplain | null = scene.explain
    ? {
        id: "demo_explain",
        selectedText: scene.explain.selectedText,
        occurrenceIndex: 0,
        explanation: scene.explain.explanation,
        status: scene.explain.status === "done" ? "done" : "loading",
      }
    : null;
  const explainAnchorY =
    selBounds.y + (selBounds.bottom - selBounds.y) / 2 - POS_B.y;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-canvas-bg font-sans text-canvas-ink select-none"
    >
      <style dangerouslySetInnerHTML={{ __html: DEMO_ANIMATION_CSS }} />
      <GridBackground viewport={vp} />
      <CanvasViewport>
        <svg
          className="pointer-events-none absolute left-0 top-0 z-[15]"
          style={{ overflow: "visible" }}
          width={1}
          height={1}
          aria-hidden
        >
          {scene.connections.map((conn) => {
            const from = storeCards[conn.from];
            const to = storeCards[conn.to];
            if (!from || !to) return null;
            return (
              <DemoConnector
                key={conn.id}
                fromCard={from}
                toCard={to}
                fromSide={conn.fromSide}
                toSide={conn.toSide}
                stroke={DEMO_THREADS[from.threadId]?.accentColour ?? ACCENT_MAIN}
                style="orthogonal"
                viewportScale={scene.camera.scale}
                progress={conn.progress}
              />
            );
          })}
          {scene.ghost && storeCards[scene.ghost.from] && (
            <DemoGhostConnector
              fromCard={storeCards[scene.ghost.from]}
              fromSide={scene.ghost.fromSide}
              to={scene.ghost.to}
              stroke={ACCENT_MAIN}
              style="orthogonal"
              viewportScale={scene.camera.scale}
            />
          )}
        </svg>
        {scene.cards
          .filter((c) => c.visible)
          .map((c) => {
            const card = storeCards[c.id];
            if (!card) return null;
            const isSelectionCard = c.id === CARD_B;
            return (
              <DemoCard
                key={c.id}
                scene={c}
                card={card}
                accent={DEMO_THREADS[c.threadId]?.accentColour ?? ACCENT_MAIN}
                viewportScale={scene.camera.scale}
                selectionRects={
                  isSelectionCard && scene.selection
                    ? selRects.map((r) => ({
                        x: r.x - POS_B.x,
                        y: r.y - POS_B.y,
                        w: r.w,
                        h: r.h,
                      }))
                    : undefined
                }
                selectionProgress={
                  isSelectionCard ? scene.selection?.progress : undefined
                }
                explain={isSelectionCard ? explainObj : undefined}
                explainAnchorY={isSelectionCard ? explainAnchorY : undefined}
              />
            );
          })}
      </CanvasViewport>

      {/* Floating chrome — the real store-driven components. */}
      <CanvasBottomToolbar />
      <CanvasMinimap containerRef={containerRef} canvasKey="demo-video" />

      {/* Caption */}
      {scene.caption && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-24 z-[500] flex justify-center"
          style={{ opacity: scene.caption.opacity }}
        >
          <span className="rounded-full border border-canvas-border bg-canvas-card/90 px-4 py-2 text-canvas-body font-medium text-canvas-ink shadow-card backdrop-blur-sm">
            {scene.caption.text}
          </span>
        </div>
      )}

      {/* Selection menu (real component, screen-space rect from timeline). */}
      {scene.menu?.visible && (
        <AnswerSelectionMenu
          rect={menuRect}
          onQuickExplain={() => {}}
          onAskQuestion={() => {}}
          onAddToCanvas={() => {}}
          quickExplainLoading={scene.menu.explaining}
        />
      )}

      {/* Cursor + click ripples (world → screen). */}
      {scene.ripples.map((r, i) => (
        <ClickRipple
          key={i}
          x={vp.x + r.x * vp.scale}
          y={vp.y + r.y * vp.scale}
          p={r.p}
        />
      ))}
      <DemoCursor
        x={vp.x + scene.cursor.x * vp.scale}
        y={vp.y + scene.cursor.y * vp.scale}
        opacity={scene.cursor.opacity}
        pressed={scene.cursor.pressed}
      />

      {/* Scrubber (dev only, hidden in capture) */}
      {!capture && (
        <div className="absolute bottom-2 left-1/2 z-[70000] flex w-[560px] -translate-x-1/2 items-center gap-3 rounded-canvas border border-canvas-border bg-canvas-card px-3 py-2 shadow-card">
          <button
            type="button"
            className="rounded-canvas bg-canvas-ink px-3 py-1 text-canvas-compact font-medium text-canvas-card"
            onClick={() => (playing ? stopPlayback() : startPlayback())}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <input
            type="range"
            min={0}
            max={DEMO_DURATION_MS}
            step={1000 / 60}
            value={t}
            className="flex-1"
            onChange={(e) => {
              stopPlayback();
              applyFrame(Number(e.target.value));
            }}
          />
          <span className="w-16 text-right text-canvas-compact tabular-nums text-canvas-muted">
            {(t / 1000).toFixed(2)}s
          </span>
        </div>
      )}
    </div>
  );
}
