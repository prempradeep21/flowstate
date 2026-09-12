"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Alkatra } from "next/font/google";
import { ArtifactStyleScope } from "@/components/ArtifactStyleScope";
import { CanvasArtifactNode } from "@/components/CanvasArtifactNode";
import { CanvasAssetNode } from "@/components/CanvasAssetNode";
import { CanvasBottomToolbar } from "@/components/CanvasBottomToolbar";
import { CanvasMinimap } from "@/components/CanvasMinimap";
import { CanvasTextLabelNode } from "@/components/CanvasTextLabelNode";
import { CanvasViewport } from "@/components/CanvasViewport";
import { AmbientGradientBackground } from "@/components/canvasBackgrounds/AmbientGradientBackground";
import type {
  Card as CardType,
  CanvasArtifactNode as ArtifactNodeType,
  CanvasAssetNode as AssetNodeType,
  CanvasTextLabel,
} from "@/lib/store";
import { useCanvasStore } from "@/lib/store";
import type { ArtifactKind } from "@/lib/artifactTypes";
import { DemoCard } from "../../DemoCard";
import { ClickRipple, DemoCursor } from "../../DemoCursor";
import type { DemoCardScene } from "../../timeline";
import { DemoArtifactEdges } from "../assets/DemoArtifactEdges";
import { DemoSpawn } from "../assets/DemoSpawn";
import {
  BRAND_BLUE,
  MARK_CIRCLE,
  MARK_NODE_R,
  MARK_NODES,
  MARK_PATHS,
  MARK_VIEWBOX,
  WORD,
} from "../logo/timeline";
import {
  ARTIFACT_VERSION_ID,
  buildSessionArtifacts,
  CURSOR_ANANYA,
  CURSOR_PREM,
  FL_CANVAS_ASSETS,
  FL_LABELS,
  FL_THREADS,
  GENERATING_PAYLOADS,
  THREAD_TL,
  TITLE_LEAD,
} from "./fixtures";
import {
  FL_DURATION_MS,
  flSceneStateAt,
  type FlSceneState,
} from "./timeline";

declare global {
  interface Window {
    __demoSettled?: () => boolean;
  }
}

/** Figma spec: the wordmark is Alkatra Regular. */
const alkatra = Alkatra({ subsets: ["latin"], weight: "400" });

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
html[data-demo-capture] *, html[data-demo-capture] *::before, html[data-demo-capture] *::after {
  transition: none !important;
}
`;

function screenViewport(
  camera: FlSceneState["camera"],
  win: { w: number; h: number },
) {
  return {
    x: win.w / 2 - camera.cx * camera.scale,
    y: win.h / 2 - camera.cy * camera.scale,
    scale: camera.scale,
  };
}

function buildStore(scene: FlSceneState) {
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
      parentCardId: null,
      parentConversationId: null,
      responseType: "text",
      askStartedAt:
        c.status === "thinking" || c.status === "streaming"
          ? Date.now() - c.askElapsedMs
          : undefined,
      turnUsage:
        c.status === "streaming"
          ? { inputTokens: 1520, outputTokens: Math.round(c.answer.length / 4) }
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

  const canvasTextLabels: Record<string, CanvasTextLabel> = {};
  const canvasTextLabelOrder: string[] = [];
  for (const l of FL_LABELS) {
    canvasTextLabels[l.id] = {
      id: l.id,
      text: l.text,
      position: l.position,
      fontSize: l.fontSize,
    };
    canvasTextLabelOrder.push(l.id);
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
    canvasTextLabels,
    canvasTextLabelOrder,
    plugComposerAttachments,
    plugComposerAssetAttachments,
  };
}

/** True when every image currently in the DOM has finished loading. */
function computeSettled(): boolean {
  for (const img of Array.from(document.images)) {
    if (!img.complete) return false;
  }
  return true;
}

/** Inverted brand mark for the end card: white disc, blue strands. */
function EndCardMark({ size }: { size: number }) {
  return (
    <svg
      viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`}
      width={size}
      height={size}
      style={{ display: "block" }}
      aria-hidden
    >
      <defs>
        <clipPath id="freelancer-endcard-clip">
          <circle cx={MARK_CIRCLE.cx} cy={MARK_CIRCLE.cy} r={MARK_CIRCLE.r} />
        </clipPath>
      </defs>
      <circle
        cx={MARK_CIRCLE.cx}
        cy={MARK_CIRCLE.cy}
        r={MARK_CIRCLE.r}
        fill="#fff"
      />
      <g clipPath="url(#freelancer-endcard-clip)">
        {MARK_PATHS.map((d, i) => (
          <path key={i} d={d} stroke={BRAND_BLUE} strokeWidth={5} fill="none" />
        ))}
        {MARK_NODES.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={MARK_NODE_R} fill={BRAND_BLUE} />
        ))}
      </g>
    </svg>
  );
}

/** Title bookend + caption chips + end card, all driven from t. */
function BrandLayer({ brand }: { brand: FlSceneState["brand"] }) {
  return (
    <>
      {brand.titleOpacity > 0 && (
        <div
          className="pointer-events-none absolute inset-x-0 flex justify-center"
          style={{ top: "38%", opacity: brand.titleOpacity, zIndex: 60000 }}
        >
          <div
            className="whitespace-nowrap font-sans"
            style={{ fontSize: 60, color: "#2C2A26" }}
          >
            {TITLE_LEAD}
            <span
              className={alkatra.className}
              style={{ color: BRAND_BLUE, letterSpacing: "-0.05em" }}
            >
              {WORD}
            </span>
          </div>
        </div>
      )}
      {brand.chip && brand.chip.opacity > 0 && (
        <div
          className="pointer-events-none absolute inset-x-0 flex justify-center"
          style={{
            top: "78%",
            opacity: brand.chip.opacity,
            zIndex: 60000,
            transform: `translateY(${(1 - brand.chip.opacity) * 10}px)`,
          }}
        >
          <div
            className="whitespace-nowrap font-sans font-bold text-white"
            style={{
              background: BRAND_BLUE,
              borderRadius: 999,
              fontSize: 58,
              lineHeight: 1,
              padding: "26px 52px",
            }}
          >
            {brand.chip.text}
          </div>
        </div>
      )}
      {brand.canvasFade > 0 && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{
            background: BRAND_BLUE,
            opacity: brand.canvasFade,
            zIndex: 65000,
          }}
        >
          {brand.lockup > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 36,
                opacity: brand.lockup,
                transform: `scale(${0.96 + 0.04 * brand.lockup})`,
              }}
            >
              <EndCardMark size={168} />
              <div
                className={alkatra.className}
                style={{
                  fontSize: 160,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  color: "#fff",
                  letterSpacing: "-0.05em",
                }}
              >
                {WORD}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function FreelancerSceneApp() {
  const params = useSearchParams();
  const capture = params.get("capture") === "1";
  const autoPlay = params.get("play") === "1";

  const containerRef = useRef<HTMLDivElement>(null);
  const winRef = useRef({ w: 1920, h: 1080 });
  const [mounted, setMounted] = useState(false);
  const [scene, setScene] = useState<FlSceneState>(() => flSceneStateAt(0));
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
    const s = flSceneStateAt(tMs);
    const built = buildStore(s);
    useCanvasStore.setState({
      ...built,
      threads: FL_THREADS,
      threadOrder: Object.keys(FL_THREADS),
      activeThreadId: THREAD_TL,
      canvasAssets: FL_CANVAS_ASSETS,
      sessionArtifacts: buildSessionArtifacts(
        new Set(
          s.artifactNodes.filter((n) => n.generating).map((n) => n.artifactId),
        ),
      ),
      viewport: screenViewport(s.camera, winRef.current),
      viewportSettledScale: s.settledScale,
      connectorStyle: "orthogonal",
      viewMode: "canvas",
      canvasTheme: "light",
      canvasArtifactStyle: "liquid-glass",
      canvasBackgroundStyle: "ambient-gradient",
      selectedCanvasArtifactId: null,
      selectedCanvasAssetId: null,
      selectedCanvasTextLabelId: null,
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
      applyFrame((now - startWall) % FL_DURATION_MS);
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
  const labelOpacity = Object.fromEntries(
    scene.labels.map((l) => [l.id, l.opacity]),
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-canvas-bg font-sans text-canvas-ink select-none"
    >
      <style dangerouslySetInnerHTML={{ __html: DEMO_ANIMATION_CSS }} />
      <AmbientGradientBackground animate={false} />
      <ArtifactStyleScope styleId="liquid-glass">
        <CanvasViewport>
          <DemoArtifactEdges
            edges={scene.artifactEdges}
            viewportScale={scene.camera.scale}
          />
          {/* District labels (real product component, t-driven reveal). */}
          {FL_LABELS.map((l) => {
            const label = store.canvasTextLabels[l.id];
            const opacity = labelOpacity[l.id] ?? 0;
            if (!label || opacity <= 0) return null;
            return (
              <div key={l.id} style={{ opacity }}>
                <CanvasTextLabelNode label={label} />
              </div>
            );
          })}
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
          {/* Question cards (DemoCard twin). */}
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
                  accent={FL_THREADS[c.threadId]?.accentColour ?? "#6B4EFF"}
                  viewportScale={scene.camera.scale}
                />
              );
            })}
        </CanvasViewport>
      </ArtifactStyleScope>

      <CanvasBottomToolbar />
      <CanvasMinimap
        containerRef={containerRef}
        canvasKey="demo-video-freelancer"
      />

      {/* Click ripples + cursors (world → screen). */}
      {scene.ripples.map((r, i) => (
        <ClickRipple
          key={i}
          x={vp.x + r.x * vp.scale}
          y={vp.y + r.y * vp.scale}
          p={r.p}
        />
      ))}
      <DemoCursor
        x={vp.x + scene.cursorPrem.x * vp.scale}
        y={vp.y + scene.cursorPrem.y * vp.scale}
        opacity={scene.cursorPrem.opacity}
        pressed={scene.cursorPrem.pressed}
        color={CURSOR_PREM.color}
        name={CURSOR_PREM.name}
      />
      <DemoCursor
        x={vp.x + scene.cursorAnanya.x * vp.scale}
        y={vp.y + scene.cursorAnanya.y * vp.scale}
        opacity={scene.cursorAnanya.opacity}
        pressed={scene.cursorAnanya.pressed}
        color={CURSOR_ANANYA.color}
        name={CURSOR_ANANYA.name}
      />

      <BrandLayer brand={scene.brand} />

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
            max={FL_DURATION_MS}
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
