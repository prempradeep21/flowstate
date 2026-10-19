"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useSearchParams } from "next/navigation";
import { ArtifactStyleScope } from "@/components/ArtifactStyleScope";
import { CanvasArtifactNode } from "@/components/CanvasArtifactNode";
import { CanvasBottomToolbar } from "@/components/CanvasBottomToolbar";
import { CanvasMinimap } from "@/components/CanvasMinimap";
import { CanvasViewport } from "@/components/CanvasViewport";
import { Card } from "@/components/Card";
import { Connections } from "@/components/Connections";
import { GroupBounds } from "@/components/GroupBounds";
import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import { ArtifactPlugConnections } from "@/components/plugs/ArtifactPlugConnections";
import { PlugConnectorLayer } from "@/components/plugs/PlugConnectorLayer";
import type { Card as CardType } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";
import { ClickRipple, DemoCursor } from "../../DemoCursor";
import { BranchCard } from "./BranchCard";
import {
  BRANCH_CARD_ID,
  BRANCH_POS,
  BRANCH_THREAD_ID,
  getJagBase,
  SOURCE_NODE_ID,
} from "./fixtures";
import {
  JAG_DURATION_MS,
  jagSceneStateAt,
  type JagSceneState,
} from "./timeline";

declare global {
  interface Window {
    __demoSettled?: () => boolean;
  }
}

/** Tilt of the opening shot: the canvas lies back like a table top. */
const TILT_X_DEG = 52;
const TILT_Z_DEG = -13;
const PERSPECTIVE_PX = 1900;

const DEMO_ANIMATION_CSS = `
html[data-demo-video] *, html[data-demo-video] *::before, html[data-demo-video] *::after {
  animation-play-state: paused !important;
  animation-delay: calc(var(--demo-t, 0) * -1ms) !important;
}
html[data-demo-video] .thinking-accent-bar,
html[data-demo-video] .answer-reveal-in,
html[data-demo-video] .motion-popover-in,
html[data-demo-video] .motion-fade-in,
html[data-demo-video] .motion-landing-rise {
  animation: none !important;
}
/* Dev-only Bento colour lab pill (ArtifactStyleScope mounts it outside prod). */
html[data-demo-video] [data-artifact-style] > .fixed.bottom-4.right-4 {
  display: none !important;
}
/* Hover chrome on the source artifact (plugs, grips) is CSS :hover in the
   product — drive the same elements from the timeline instead. */
html[data-demo-video] [data-canvas-node-id="${SOURCE_NODE_ID}"] .opacity-0.duration-500 {
  opacity: var(--demo-plug-o, 0) !important;
}
html[data-demo-capture] *, html[data-demo-capture] *::before, html[data-demo-capture] *::after {
  transition: none !important;
}
`;

function screenViewport(
  camera: JagSceneState["camera"],
  win: { w: number; h: number },
) {
  return {
    x: win.w / 2 - camera.cx * camera.scale,
    y: win.h / 2 - camera.cy * camera.scale,
    scale: camera.scale,
  };
}

/** True when every image currently in the DOM has finished loading. */
function computeSettled(): boolean {
  for (const img of Array.from(document.images)) {
    if (!img.complete) return false;
  }
  return true;
}

/**
 * Tilt-shift depth of field for the tilted shot. With the plane rotated about
 * the screen's horizontal axis, depth maps to screen-y — so stacked
 * backdrop-blur bands that grow toward the top (far) and bottom (near) edges
 * read as a shallow focal plane across the middle of the frame.
 */
const DOF_BANDS: { blur: number; mask: string }[] = [
  {
    blur: 1.6,
    mask: "linear-gradient(to bottom, #000 0%, #000 22%, transparent 40%, transparent 70%, #000 86%, #000 100%)",
  },
  {
    blur: 3.2,
    mask: "linear-gradient(to bottom, #000 0%, #000 12%, transparent 30%, transparent 80%, #000 95%, #000 100%)",
  },
  {
    blur: 6,
    mask: "linear-gradient(to bottom, #000 0%, #000 4%, transparent 20%, transparent 89%, #000 100%)",
  },
  {
    blur: 10,
    mask: "linear-gradient(to bottom, #000 0%, transparent 11%, transparent 100%)",
  },
];

function DepthOfField({
  strength,
  introBlur,
}: {
  strength: number;
  introBlur: number;
}) {
  return (
    <>
      {strength > 0.001 &&
        DOF_BANDS.map((band, i) => {
          const blur = `blur(${(band.blur * strength).toFixed(3)}px)`;
          return (
            <div
              key={i}
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                zIndex: 40,
                backdropFilter: blur,
                WebkitBackdropFilter: blur,
                maskImage: band.mask,
                WebkitMaskImage: band.mask,
              }}
            />
          );
        })}
      {/* Atmospheric falloff: the far edge dissolves into the canvas colour. */}
      {strength > 0.001 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            zIndex: 41,
            opacity: strength,
            background:
              "linear-gradient(to bottom, rgb(var(--canvas-bg) / 0.9) 0%, rgb(var(--canvas-bg) / 0.45) 12%, rgb(var(--canvas-bg) / 0) 32%)",
          }}
        />
      )}
      {introBlur > 0.05 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            zIndex: 42,
            backdropFilter: `blur(${introBlur.toFixed(3)}px)`,
            WebkitBackdropFilter: `blur(${introBlur.toFixed(3)}px)`,
          }}
        />
      )}
    </>
  );
}

/** Store-shaped branch card for a scene state (stable while nothing changes). */
function buildBranchCard(
  branch: JagSceneState["branch"],
  ref: { artifactId: string; versionId: string },
): CardType {
  const asked = branch.status !== "empty";
  return {
    id: BRANCH_CARD_ID,
    threadId: BRANCH_THREAD_ID,
    question: branch.question,
    answer: branch.answer,
    status: branch.status,
    position: BRANCH_POS,
    parentCardId: null,
    parentConversationId: null,
    responseType: "text",
    attachedArtifacts: asked ? [ref] : undefined,
    thinkingLabel: branch.status === "thinking" ? "Thinking" : undefined,
    askStartedAt:
      branch.status === "thinking"
        ? Date.now() - branch.askElapsedMs
        : undefined,
    turnUsage:
      branch.status === "thinking"
        ? {
            inputTokens: 1840,
            outputTokens: Math.round(branch.askElapsedMs * 0.09),
          }
        : undefined,
  };
}

export function JagadambaSceneApp() {
  const params = useSearchParams();
  const capture = params.get("capture") === "1";
  const autoPlay = params.get("play") === "1";

  const containerRef = useRef<HTMLDivElement>(null);
  const winRef = useRef({ w: 1920, h: 1080 });
  const branchCacheRef = useRef<{
    key: string;
    cards: Record<string, CardType>;
    cardOrder: string[];
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [scene, setScene] = useState<JagSceneState>(() => jagSceneStateAt(0));
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);

  const applyFrame = useCallback((tMs: number) => {
    if (typeof window !== "undefined") {
      const qs = new URLSearchParams(window.location.search);
      const qw = Number(qs.get("w"));
      const qh = Number(qs.get("h"));
      winRef.current =
        qw > 0 && qh > 0
          ? { w: qw, h: qh }
          : { w: window.innerWidth, h: window.innerHeight };
    }
    const base = getJagBase();
    const s = jagSceneStateAt(tMs);

    // The 46 imported cards never change — only the branch card does. Keep
    // the `cards` reference stable between frames where it is unchanged so
    // the 88 real nodes subscribed to it don't re-render every frame.
    let cards = base.cards;
    let cardOrder = base.cardOrder;
    if (s.branch.visible) {
      const key =
        s.branch.status === "thinking"
          ? `thinking:${tMs}`
          : `${s.branch.status}:${s.branch.question}`;
      if (branchCacheRef.current?.key !== key) {
        branchCacheRef.current = {
          key,
          cards: {
            ...base.cards,
            [BRANCH_CARD_ID]: buildBranchCard(s.branch, base.sourceRef),
          },
          cardOrder: [...base.cardOrder, BRANCH_CARD_ID],
        };
      }
      cards = branchCacheRef.current.cards;
      cardOrder = branchCacheRef.current.cardOrder;
    }

    useCanvasStore.setState({
      cards,
      cardOrder,
      connections: base.connections,
      threads: base.threads,
      threadOrder: base.threadOrder,
      activeThreadId: null,
      groups: base.groups,
      activeGroupId: null,
      sessionArtifacts: base.sessionArtifacts,
      canvasArtifactNodes: base.canvasArtifactNodes,
      canvasArtifactOrder: base.canvasArtifactOrder,
      canvasAssets: base.canvasAssets,
      canvasAssetNodes: {},
      canvasAssetOrder: [],
      canvasTextLabels: {},
      canvasTextLabelOrder: [],
      // The branch: real ghost connector while dragging, real plug
      // connection after the drop (no `recent` id → no wall-clock draw-in).
      plugDrag: s.drag
        ? {
            kind: "artifact",
            artifactNodeId: SOURCE_NODE_ID,
            artifactId: base.sourceRef.artifactId,
            versionId: base.sourceRef.versionId,
            fromSide: "right",
            pointerWorld: s.drag,
            didDrag: true,
            receiveTargetCardId: null,
            hoveredReceiveSide: null,
          }
        : null,
      artifactPlugConnections: s.branch.connected
        ? [
            {
              id: `artplug_${SOURCE_NODE_ID}_${BRANCH_CARD_ID}`,
              artifactNodeId: SOURCE_NODE_ID,
              cardId: BRANCH_CARD_ID,
              fromSide: "right",
              toSide: "left",
            },
          ]
        : [],
      recentArtifactPlugId: null,
      recentConnectionId: null,
      plugComposerAttachments:
        s.branch.visible && s.branch.status === "empty"
          ? { [BRANCH_CARD_ID]: base.sourceRef }
          : {},
      viewport: screenViewport(s.camera, winRef.current),
      viewportSettledScale: s.settledScale,
      connectorStyle: "orthogonal",
      viewMode: "canvas",
      canvasTheme: "light",
      canvasArtifactStyle: "bento",
      canvasBackgroundStyle: "grid",
      selectedCanvasArtifactId: null,
      selectedCanvasAssetId: null,
      selectedCanvasTextLabelId: null,
    });
    const root = document.documentElement;
    root.style.setProperty("--demo-t", String(tMs));
    root.style.setProperty("--demo-plug-o", String(s.plugOpacity));
    setScene(s);
    setT(tMs);
  }, []);

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
      setMounted(true);
      await new Promise((r) => setTimeout(r, 0));
      await nextFrame();
      if (cancelled) return;
      flushSync(() => applyFrame(0));
      await nextFrame();
      await document.fonts.ready;
      while (document.fonts.status === "loading") {
        await new Promise((r) => setTimeout(r, 50));
      }
      await nextFrame();
    })();

    window.__demoReady = ready;
    window.__demoSettled = computeSettled;
    (window as unknown as { __store?: unknown }).__store = useCanvasStore;
    window.__seek = async (tMs: number) => {
      await ready;
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
      delete window.__demoSettled;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPlayback = useCallback(() => {
    if (playingRef.current) return;
    playingRef.current = true;
    setPlaying(true);
    const startWall = performance.now();
    const tick = (now: number) => {
      if (!playingRef.current) return;
      applyFrame((now - startWall) % JAG_DURATION_MS);
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
  const store = useCanvasStore.getState();
  const base = getJagBase();
  const branchCard = store.cards[BRANCH_CARD_ID];
  const tilted = scene.tilt > 0.0005;

  return (
    <ArtifactStyleScope styleId="bento">
      <div
        ref={containerRef}
        data-canvas-container
        className="fixed inset-0 overflow-hidden bg-canvas-bg font-sans text-canvas-ink select-none"
      >
        <style dangerouslySetInnerHTML={{ __html: DEMO_ANIMATION_CSS }} />

        {/* Grid dots are screen-space in the product; they join once the
            plane is flat (a screen-space grid can't lie on a tilted plane). */}
        {scene.gridOpacity > 0 && (
          <div
            className="absolute inset-0"
            style={{ opacity: scene.gridOpacity }}
          >
            <GridBackground viewport={vp} />
          </div>
        )}

        {/* Stage: perspective + the tilting plane the whole canvas lies on. */}
        <div
          className="absolute inset-0"
          style={
            tilted
              ? {
                  perspective: `${PERSPECTIVE_PX}px`,
                  perspectiveOrigin: "50% 42%",
                }
              : undefined
          }
        >
          <div
            className="absolute inset-0"
            style={
              tilted
                ? {
                    transform: `rotateX(${(TILT_X_DEG * scene.tilt).toFixed(4)}deg) rotateZ(${(TILT_Z_DEG * scene.tilt).toFixed(4)}deg)`,
                    transformOrigin: "50% 50%",
                  }
                : undefined
            }
          >
            <CanvasViewport>
              <PlugConnectorLayer />
              <ArtifactPlugConnections />
              {base.groupList.map((group) => (
                <GroupBounds key={group.id} group={group} />
              ))}
              <Connections />
              {base.cardOrder.map((id) => {
                const card = store.cards[id];
                if (!card) return null;
                return <Card key={id} card={card} />;
              })}
              {base.canvasArtifactOrder.map((id) => {
                const node = store.canvasArtifactNodes[id];
                if (!node) return null;
                return <CanvasArtifactNode key={id} node={node} />;
              })}
              {scene.branch.visible && branchCard && (
                <BranchCard
                  scene={scene.branch}
                  card={branchCard}
                  accent={
                    base.threads[BRANCH_THREAD_ID]?.accentColour ?? "#6FCF97"
                  }
                />
              )}
            </CanvasViewport>
          </div>
        </div>

        <DepthOfField strength={scene.dof} introBlur={scene.introBlur} />

        {scene.introVeil > 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-canvas-bg"
            style={{ opacity: scene.introVeil, zIndex: 43 }}
          />
        )}

        {/* Product chrome arrives as the canvas levels out. */}
        {scene.chromeOpacity > 0 && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{ opacity: scene.chromeOpacity, zIndex: 50 }}
          >
            <CanvasBottomToolbar />
            <CanvasMinimap
              containerRef={containerRef}
              canvasKey="demo-video-jagadamba"
            />
          </div>
        )}

        {/* Click ripple + cursor (world → screen; only ever on the flat plane). */}
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

        {/* Scrubber (dev only). */}
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
              max={JAG_DURATION_MS}
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
    </ArtifactStyleScope>
  );
}
