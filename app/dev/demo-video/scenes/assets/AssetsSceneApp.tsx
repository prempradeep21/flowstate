"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useSearchParams } from "next/navigation";
import { CanvasArtifactNode } from "@/components/CanvasArtifactNode";
import { CanvasAssetNode } from "@/components/CanvasAssetNode";
import { CanvasBottomToolbar } from "@/components/CanvasBottomToolbar";
import { CanvasMinimap } from "@/components/CanvasMinimap";
import { CanvasViewport } from "@/components/CanvasViewport";
import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import type {
  Card as CardType,
  CanvasArtifactNode as ArtifactNodeType,
  CanvasAssetNode as AssetNodeType,
} from "@/lib/store";
import { useCanvasStore } from "@/lib/store";
import type { ArtifactKind } from "@/lib/artifactTypes";
import { DemoCard } from "../../DemoCard";
import { DemoConnector } from "../../DemoConnector";
import { ClickRipple, DemoCursor } from "../../DemoCursor";
import type { DemoCardScene } from "../../timeline";
import { DemoArtifactEdges } from "./DemoArtifactEdges";
import { DemoSpawn } from "./DemoSpawn";
import {
  ARTIFACT_VERSION_ID,
  ASSETS_CANVAS_ASSETS,
  ASSETS_THREADS,
  buildSessionArtifacts,
  GENERATING_PAYLOADS,
  CARD_STREET_Q,
  CARD_TABLE_Q,
  CURSOR_DEV,
  CURSOR_MAYA,
  THREAD_VIDEO,
  THREAD_WIKI,
} from "./fixtures";
import {
  ASSETS_DURATION_MS,
  assetsSceneStateAt,
  type AssetsSceneState,
} from "./timeline";

declare global {
  interface Window {
    __demoSettled?: () => boolean;
  }
}

const DEMO_ANIMATION_CSS = `
html[data-demo-video] *, html[data-demo-video] *::before, html[data-demo-video] *::after {
  animation-play-state: paused !important;
  animation-delay: calc(var(--demo-t, 0) * -1ms) !important;
}
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
/* Leaflet fade-ins are wall-clock — show tiles/markers at full opacity. */
html[data-demo-video] .leaflet-fade-anim .leaflet-tile,
html[data-demo-video] .leaflet-tile {
  opacity: 1 !important;
}
html[data-demo-capture] *, html[data-demo-capture] *::before, html[data-demo-capture] *::after {
  transition: none !important;
}
`;

function screenViewport(
  camera: AssetsSceneState["camera"],
  win: { w: number; h: number },
) {
  return {
    x: win.w / 2 - camera.cx * camera.scale,
    y: win.h / 2 - camera.cy * camera.scale,
    scale: camera.scale,
  };
}

function buildStore(scene: AssetsSceneState) {
  const generatingByCard: Record<string, string> = {};
  for (const n of scene.artifactNodes) {
    if (n.generating && n.sourceCardId && n.spawn > 0) {
      generatingByCard[n.sourceCardId] = n.artifactId;
    }
  }
  const cards: Record<string, CardType> = {};
  const cardOrder: string[] = [];
  for (const c of scene.cards) {
    if (!c.visible) continue;
    cards[c.id] = {
      artifactPayload: generatingByCard[c.id]
        ? GENERATING_PAYLOADS[generatingByCard[c.id]]
        : undefined,
      id: c.id,
      threadId: c.threadId,
      question: c.question,
      answer: c.answer,
      status: c.status,
      position: c.pos,
      // No store parent link: the Q2→Q3 chain connector is scene-drawn, and a
      // parent with an output artifact would misnumber Q3's generating pill.
      parentCardId: null,
      parentConversationId: null,
      responseType: "text",
      askStartedAt:
        c.status === "thinking" || c.status === "streaming"
          ? Date.now() - c.askElapsedMs
          : undefined,
      turnUsage:
        c.status === "streaming"
          ? { inputTokens: 2210, outputTokens: Math.round(c.answer.length / 4) }
          : undefined,
      outputArtifactId: c.outputArtifactId,
      outputArtifactVersionId: c.outputArtifactId
        ? ARTIFACT_VERSION_ID(c.outputArtifactId)
        : undefined,
    };
    cardOrder.push(c.id);
  }

  const canvasAssetNodes: Record<string, AssetNodeType> = {};
  const canvasAssetOrder: string[] = [];
  for (const n of scene.assetNodes) {
    canvasAssetNodes[n.nodeId] = {
      id: n.nodeId,
      assetId: n.assetId,
      position: n.pos,
      size: n.size,
    };
    canvasAssetOrder.push(n.nodeId);
  }

  const canvasArtifactNodes: Record<string, ArtifactNodeType> = {};
  const canvasArtifactOrder: string[] = [];
  for (const n of scene.artifactNodes) {
    canvasArtifactNodes[n.nodeId] = {
      id: n.nodeId,
      artifactId: n.artifactId,
      versionId: ARTIFACT_VERSION_ID(n.artifactId),
      // While generating, the card's streaming artifactPayload provides the
      // pill; a sourceCardId link would add a duplicate "gen:" pill.
      sourceCardId: n.generating ? "" : n.sourceCardId,
      position: n.pos,
      size: n.size,
      ...(n.generating
        ? {
            generatingPreview: {
              kind: (n.generatingKind ?? "table") as ArtifactKind,
              title: n.generatingTitle ?? "",
            },
          }
        : {}),
    };
    canvasArtifactOrder.push(n.nodeId);
  }

  const plugComposerAttachments: Record<
    string,
    { artifactId: string; versionId: string }
  > = {};
  const plugComposerAssetAttachments: Record<string, { assetId: string }> = {};
  for (const c of scene.cards) {
    if (c.attachedArtifactId) {
      plugComposerAttachments[c.id] = {
        artifactId: c.attachedArtifactId,
        versionId: ARTIFACT_VERSION_ID(c.attachedArtifactId),
      };
    }
    if (c.attachedAssetId) {
      plugComposerAssetAttachments[c.id] = { assetId: c.attachedAssetId };
    }
  }

  return {
    cards,
    cardOrder,
    canvasAssetNodes,
    canvasAssetOrder,
    canvasArtifactNodes,
    canvasArtifactOrder,
    plugComposerAttachments,
    plugComposerAssetAttachments,
  };
}

/** True when every tile/image/iframe currently in the DOM has finished loading. */
function computeSettled(): boolean {
  const tiles = document.querySelectorAll<HTMLImageElement>("img.leaflet-tile");
  for (const tile of tiles) {
    if (!tile.classList.contains("leaflet-tile-loaded") && !tile.complete) {
      return false;
    }
  }
  for (const img of Array.from(document.images)) {
    if (!img.complete) return false;
  }
  return true;
}

export function AssetsSceneApp() {
  const params = useSearchParams();
  const capture = params.get("capture") === "1";
  const autoPlay = params.get("play") === "1";

  const containerRef = useRef<HTMLDivElement>(null);
  const winRef = useRef({ w: 1920, h: 1080 });
  const [mounted, setMounted] = useState(false);
  const [scene, setScene] = useState<AssetsSceneState>(() =>
    assetsSceneStateAt(0),
  );
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
    const s = assetsSceneStateAt(tMs);
    const built = buildStore(s);
    useCanvasStore.setState({
      ...built,
      threads: ASSETS_THREADS,
      threadOrder: Object.keys(ASSETS_THREADS),
      activeThreadId: THREAD_VIDEO,
      canvasAssets: ASSETS_CANVAS_ASSETS,
      sessionArtifacts: buildSessionArtifacts(
        s.mapPinCount,
        new Set(
          s.artifactNodes.filter((n) => n.generating).map((n) => n.artifactId),
        ),
      ),
      viewport: screenViewport(s.camera, winRef.current),
      viewportSettledScale: s.settledScale,
      connectorStyle: "orthogonal",
      viewMode: "canvas",
      selectedCanvasArtifactId: null,
      selectedCanvasAssetId: null,
    });
    document.documentElement.style.setProperty("--demo-t", String(tMs));
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
    // Dev-only handles for scripted debugging.
    (window as unknown as { __store?: unknown }).__store = useCanvasStore;
    import("@/lib/cardArtifactPreviewItems").then((m) => {
      (window as unknown as { __collect?: unknown }).__collect =
        m.collectCardArtifactPreviewItems;
    });
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
      applyFrame((now - startWall) % ASSETS_DURATION_MS);
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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-canvas-bg font-sans text-canvas-ink select-none"
    >
      <style dangerouslySetInnerHTML={{ __html: DEMO_ANIMATION_CSS }} />
      <GridBackground viewport={vp} />
      <CanvasViewport>
        <DemoArtifactEdges
          edges={scene.artifactEdges}
          viewportScale={scene.camera.scale}
        />
        {/* Follow-up chain Q2 → Q3 (real connector primitives). */}
        <svg
          className="pointer-events-none absolute left-0 top-0 z-[15]"
          style={{ overflow: "visible" }}
          width={1}
          height={1}
          aria-hidden
        >
          {scene.chainProgress > 0 &&
            store.cards[CARD_TABLE_Q] &&
            store.cards[CARD_STREET_Q] && (
              <DemoConnector
                fromCard={store.cards[CARD_TABLE_Q]}
                toCard={store.cards[CARD_STREET_Q]}
                fromSide="bottom"
                toSide="top"
                stroke={ASSETS_THREADS[THREAD_WIKI]?.accentColour ?? "#FF8FA3"}
                style="orthogonal"
                viewportScale={scene.camera.scale}
                progress={scene.chainProgress}
              />
            )}
        </svg>
        {/* Asset nodes (real product components). */}
        {scene.assetNodes.map((n) => {
          const node = store.canvasAssetNodes[n.nodeId];
          if (!node) return null;
          const size = n.size ?? { w: 480, h: 360 };
          return (
            <DemoSpawn
              key={n.nodeId}
              spawn={n.spawn}
              center={{
                x: n.pos.x + size.w / 2,
                y: n.pos.y + size.h / 2,
              }}
            >
              <CanvasAssetNode node={node} />
            </DemoSpawn>
          );
        })}
        {/* Artifact nodes (real product components, generating → real). */}
        {scene.artifactNodes.map((n) => {
          const node = store.canvasArtifactNodes[n.nodeId];
          if (!node) return null;
          const size = n.size ?? { w: 520, h: 400 };
          return (
            <DemoSpawn
              key={n.nodeId}
              spawn={n.spawn}
              morphPulse={n.morphPulse}
              center={{
                x: n.pos.x + size.w / 2,
                y: n.pos.y + size.h / 2,
              }}
            >
              <CanvasArtifactNode node={node} />
            </DemoSpawn>
          );
        })}
        {/* Question cards (v1 DemoCard twin). */}
        {scene.cards
          .filter((c) => c.visible)
          .map((c) => {
            const card = store.cards[c.id];
            if (!card) return null;
            return (
              <DemoCard
                key={c.id}
                scene={c as unknown as DemoCardScene}
                card={card}
                accent={
                  ASSETS_THREADS[c.threadId]?.accentColour ?? "#6B4EFF"
                }
                viewportScale={scene.camera.scale}
              />
            );
          })}
      </CanvasViewport>

      <CanvasBottomToolbar />
      <CanvasMinimap containerRef={containerRef} canvasKey="demo-video-assets" />

      {/* Click ripples + the couple's cursors (world → screen). */}
      {scene.ripples.map((r, i) => (
        <ClickRipple
          key={i}
          x={vp.x + r.x * vp.scale}
          y={vp.y + r.y * vp.scale}
          p={r.p}
        />
      ))}
      <DemoCursor
        x={vp.x + scene.cursorMaya.x * vp.scale}
        y={vp.y + scene.cursorMaya.y * vp.scale}
        opacity={scene.cursorMaya.opacity}
        pressed={scene.cursorMaya.pressed}
        color={CURSOR_MAYA.color}
        name={CURSOR_MAYA.name}
      />
      <DemoCursor
        x={vp.x + scene.cursorDev.x * vp.scale}
        y={vp.y + scene.cursorDev.y * vp.scale}
        opacity={scene.cursorDev.opacity}
        pressed={scene.cursorDev.pressed}
        color={CURSOR_DEV.color}
        name={CURSOR_DEV.name}
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
            max={ASSETS_DURATION_MS}
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
