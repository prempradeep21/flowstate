"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { useSearchParams } from "next/navigation";
import { StudioFontScope } from "@/app/dev/artifact-studio/studioFonts";
import { StyledArtifact, backdropOf, getStyleFamily, type ArtifactRenderContext } from "@/components/artifactStyles";
import type { StudioArtifact } from "@/lib/artifactStudio/pool";
import { FRAME, SPECS, getStudioLayout, type StudioLayout, type StudioSceneId } from "./fixtures";
import {
  B,
  DEFAULT_MEASURED,
  POP_GAP,
  STUDIO_DURATION_MS,
  studioSceneStateAt,
  type Measured,
  type StudioSceneState,
} from "./timeline";

declare global {
  interface Window {
    __demoSettled?: () => boolean;
  }
}

/** Tilt of the opening shot: the bento lies back like a table top. */
const TILT_X_DEG = 50;
const TILT_Z_DEG = -11;
const PERSPECTIVE_PX = 2100;

const DEMO_ANIMATION_CSS = `
html[data-demo-video] *, html[data-demo-video] *::before, html[data-demo-video] *::after {
  animation-play-state: paused !important;
  animation-delay: calc(var(--demo-t, 0) * -1ms) !important;
}
/* The thinking dots breathe in turn: keep their stagger under the phase drive. */
html[data-demo-video] [aria-busy="true"] > span > span:nth-child(2) { --demo-t: calc(var(--demo-t-root) - 180); }
html[data-demo-video] [aria-busy="true"] > span > span:nth-child(3) { --demo-t: calc(var(--demo-t-root) - 360); }
html[data-demo-capture] *, html[data-demo-capture] *::before, html[data-demo-capture] *::after {
  transition: none !important;
}
`;

function screenViewport(camera: StudioSceneState["camera"]) {
  return {
    x: FRAME.w / 2 - camera.cx * camera.scale,
    y: FRAME.h / 2 - camera.cy * camera.scale,
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
 * Tilt-shift depth of field. With the plane rotated about screen-X, depth maps
 * to screen-y, so stacked backdrop-blur bands masked toward the far (top) and
 * near (bottom) edges read as a shallow focal plane. The flat set is symmetric:
 * the miniature look of a tilt-shift lens over a flat board.
 */
const TILT_BANDS: { blur: number; mask: string }[] = [
  { blur: 1.6, mask: "linear-gradient(to bottom, #000 0%, #000 22%, transparent 40%, transparent 68%, #000 86%, #000 100%)" },
  { blur: 3.2, mask: "linear-gradient(to bottom, #000 0%, #000 12%, transparent 30%, transparent 78%, #000 95%, #000 100%)" },
  { blur: 6, mask: "linear-gradient(to bottom, #000 0%, #000 4%, transparent 20%, transparent 88%, #000 100%)" },
  { blur: 10, mask: "linear-gradient(to bottom, #000 0%, transparent 11%, transparent 100%)" },
];
const FLAT_BANDS: { blur: number; mask: string }[] = [
  { blur: 1.4, mask: "linear-gradient(to bottom, #000 0%, #000 24%, transparent 42%, transparent 58%, #000 76%, #000 100%)" },
  { blur: 3, mask: "linear-gradient(to bottom, #000 0%, #000 12%, transparent 32%, transparent 68%, #000 88%, #000 100%)" },
  { blur: 6, mask: "linear-gradient(to bottom, #000 0%, #000 3%, transparent 20%, transparent 80%, #000 97%, #000 100%)" },
];

function DepthOfField({ bands, strength, z }: { bands: typeof TILT_BANDS; strength: number; z: number }) {
  if (strength <= 0.001) return null;
  return (
    <>
      {bands.map((band, i) => {
        const blur = `blur(${(band.blur * strength).toFixed(3)}px)`;
        return (
          <div
            key={i}
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ zIndex: z, backdropFilter: blur, WebkitBackdropFilter: blur, maskImage: band.mask, WebkitMaskImage: band.mask }}
          />
        );
      })}
    </>
  );
}

/** One artifact at a world rect, in the family's language. */
function Tile({
  item,
  familyId,
  themeId,
  rect,
  style,
  ctxExtra,
}: {
  item: StudioArtifact;
  familyId: StudioSceneId extends never ? never : ReturnType<typeof getStyleFamily>["id"];
  themeId: string | null;
  rect: { x: number; y: number; w: number; h?: number };
  style?: CSSProperties;
  ctxExtra?: Partial<ArtifactRenderContext>;
}) {
  const family = getStyleFamily(familyId);
  return (
    <div
      className="absolute left-0 top-0"
      style={{ width: rect.w, height: rect.h, transform: `translate(${rect.x}px, ${rect.y}px)`, ...style }}
    >
      <StyledArtifact family={family} ctx={{ item, interactive: false, surface: "tile", chromeState: "rest", themeId, mode: "light", ...ctxExtra }} />
    </div>
  );
}

export function StudioSceneApp({ sceneId }: { sceneId: StudioSceneId }) {
  const params = useSearchParams();
  const capture = params.get("capture") === "1";
  const autoPlay = params.get("play") === "1";

  const spec = SPECS[sceneId];
  const family = getStyleFamily(spec.familyId);
  const backdrop = backdropOf(family, spec.themeId, "light");

  const layoutRef = useRef<StudioLayout | null>(null);
  const measuredRef = useRef<Measured>(DEFAULT_MEASURED);
  const measureThinkRef = useRef<HTMLDivElement>(null);
  const measureDoneRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [scene, setScene] = useState<StudioSceneState | null>(null);
  const [t, setT] = useState(0);
  const [fit, setFit] = useState(1);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);

  const applyFrame = useCallback(
    (tMs: number) => {
      const layout = (layoutRef.current ??= getStudioLayout(sceneId));
      const s = studioSceneStateAt(tMs, spec, layout, measuredRef.current);
      const root = document.documentElement;
      root.style.setProperty("--demo-t", String(tMs));
      root.style.setProperty("--demo-t-root", String(tMs));
      setScene(s);
      setT(tMs);
    },
    [sceneId, spec],
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-demo-video", "");
    if (capture) document.documentElement.setAttribute("data-demo-capture", "");

    const onResize = () => setFit(Math.min(window.innerWidth / FRAME.w, window.innerHeight / FRAME.h));
    onResize();
    window.addEventListener("resize", onResize);

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

    const measure = () => {
      const thinkH = measureThinkRef.current?.offsetHeight ?? 0;
      const doneH = measureDoneRef.current?.offsetHeight ?? 0;
      if (thinkH > 0 && doneH > 0) measuredRef.current = { thinkH: Math.ceil(thinkH), doneH: Math.ceil(doneH) };
    };

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
      // Line clamps inside the artifacts settle a frame after their boxes measure.
      await nextFrame();
      measure();
      flushSync(() => applyFrame(0));
      await nextFrame();
    })();

    window.__demoReady = ready;
    window.__demoSettled = computeSettled;
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
      window.removeEventListener("resize", onResize);
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
      applyFrame((now - startWall) % STUDIO_DURATION_MS);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [applyFrame]);

  const stopPlayback = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
  }, []);

  if (!mounted || !scene) {
    return <div className="fixed inset-0" style={{ background: backdrop?.background }} />;
  }

  const layout = layoutRef.current!;
  const vp = screenViewport(scene.camera);
  const tilted = scene.tilt > 0.0005;
  const { composer, popSize } = layout;
  const qaCtx: Partial<ArtifactRenderContext> = { surface: "focus", qaState: scene.qa.qaState, composerDraft: scene.qa.draft };
  const qaItem = scene.qa.qaState === "done" ? withAnswer(layout.qa, scene.qa.answer) : layout.qa;
  const popY = composer.y + scene.qa.cardH + POP_GAP;

  // In the browser pane the 9:16 frame is scaled to fit; capture pins the
  // window to the frame so `fit` is 1 there.
  const frameStyle: CSSProperties = capture
    ? { width: FRAME.w, height: FRAME.h }
    : {
        width: FRAME.w,
        height: FRAME.h,
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%) scale(${fit})`,
      };

  return (
    <StudioFontScope>
      <div className="fixed inset-0 overflow-hidden select-none" style={{ background: capture ? backdrop?.background : "#111" }}>
        <style dangerouslySetInnerHTML={{ __html: DEMO_ANIMATION_CSS }} />
        <div className="absolute overflow-hidden" style={{ ...frameStyle, background: backdrop?.background, color: backdrop?.ink }}>
          {/* Stage: perspective + the tilting plane the whole bento lies on. */}
          <div
            className="absolute inset-0"
            style={tilted ? { perspective: `${PERSPECTIVE_PX}px`, perspectiveOrigin: "50% 44%" } : undefined}
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
              {/* World → screen. */}
              <div
                className="absolute left-0 top-0"
                style={{ transform: `translate(${vp.x.toFixed(3)}px, ${vp.y.toFixed(3)}px) scale(${vp.scale.toFixed(5)})`, transformOrigin: "0 0" }}
              >
                {layout.tiles.map((tile, i) => {
                  const ts = scene.tiles[i]!;
                  return (
                    <Tile
                      key={tile.uid}
                      item={tile.item}
                      familyId={spec.familyId}
                      themeId={spec.themeId}
                      rect={{ x: 0, y: 0, w: tile.w, h: tile.h }}
                      style={{ transform: `translate(${ts.x.toFixed(3)}px, ${ts.y.toFixed(3)}px) rotate(${ts.rot.toFixed(4)}deg)`, transformOrigin: "50% 50%" }}
                    />
                  );
                })}

                {/* The Q&A turn: the composer pill, then the card held at its animated height. */}
                {scene.qa.composerOpacity > 0 && (
                  <Tile
                    item={layout.qa}
                    familyId={spec.familyId}
                    themeId={spec.themeId}
                    rect={{ x: 0, y: 0, w: composer.w }}
                    ctxExtra={{ ...qaCtx, qaState: "typing" }}
                    style={{
                      transform: `translate(${composer.x}px, ${composer.y}px) scale(${scene.qa.composerScale.toFixed(4)})`,
                      transformOrigin: "50% 50%",
                      opacity: scene.qa.composerOpacity,
                      zIndex: 3,
                    }}
                  />
                )}
                {scene.qa.cardOpacity > 0 && scene.qa.qaState !== "typing" && (
                  <div
                    className="absolute left-0 top-0"
                    style={{
                      width: composer.w,
                      height: scene.qa.cardH,
                      transform: `translate(${composer.x}px, ${composer.y}px)`,
                      opacity: scene.qa.cardOpacity,
                      zIndex: 2,
                    }}
                  >
                    <StyledArtifact
                      family={family}
                      ctx={{ item: qaItem, interactive: false, surface: "focus", chromeState: "rest", themeId: spec.themeId, mode: "light", qaState: scene.qa.qaState }}
                    />
                  </div>
                )}

                {/* The answer pops out beneath the card. */}
                {scene.pop.visible && (
                  <Tile
                    item={layout.pop}
                    familyId={spec.familyId}
                    themeId={spec.themeId}
                    rect={{ x: 0, y: 0, w: popSize.w, h: popSize.h }}
                    style={{
                      transform: `translate(${composer.x}px, ${(popY + scene.pop.liftY).toFixed(3)}px) scale(${scene.pop.scale.toFixed(4)})`,
                      transformOrigin: "50% 0%",
                      opacity: scene.pop.opacity,
                    }}
                  />
                )}

                {/* Offscreen measurement copies of the card in its two held states. */}
                <div aria-hidden className="absolute left-0 top-0" style={{ transform: "translate(-20000px, 0)", width: composer.w, visibility: "hidden" }}>
                  <div ref={measureThinkRef}>
                    <StyledArtifact family={family} ctx={{ item: layout.qa, interactive: false, surface: "focus", chromeState: "rest", themeId: spec.themeId, mode: "light", qaState: "thinking" }} />
                  </div>
                  <div ref={measureDoneRef}>
                    <StyledArtifact family={family} ctx={{ item: layout.qa, interactive: false, surface: "focus", chromeState: "rest", themeId: spec.themeId, mode: "light", qaState: "done" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DepthOfField bands={TILT_BANDS} strength={scene.dofTilt} z={40} />
          <DepthOfField bands={FLAT_BANDS} strength={scene.dofFlat} z={40} />

          {/* Atmospheric falloff while tilted: the far edge dissolves into the field. */}
          {scene.dofTilt > 0.001 && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                zIndex: 41,
                opacity: scene.dofTilt,
                background: `linear-gradient(to bottom, ${spec.fieldColor} 0%, ${hexAlpha(spec.fieldColor, 0.5)} 11%, ${hexAlpha(spec.fieldColor, 0)} 30%)`,
              }}
            />
          )}
          {scene.introBlur > 0.05 && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ zIndex: 42, backdropFilter: `blur(${scene.introBlur.toFixed(3)}px)`, WebkitBackdropFilter: `blur(${scene.introBlur.toFixed(3)}px)` }}
            />
          )}
          {scene.introVeil > 0 && (
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ opacity: scene.introVeil, zIndex: 43, background: spec.fieldColor }} />
          )}
        </div>

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
              max={STUDIO_DURATION_MS}
              step={1000 / 60}
              value={t}
              className="flex-1"
              onChange={(e) => {
                stopPlayback();
                applyFrame(Number(e.target.value));
              }}
            />
            <span className="w-16 text-right text-canvas-compact tabular-nums text-canvas-muted">{(t / 1000).toFixed(2)}s</span>
          </div>
        )}
      </div>
    </StudioFontScope>
  );
}

/** The card with the answer as it stands part-way through streaming. */
function withAnswer(qa: StudioLayout["qa"], answer: string): StudioLayout["qa"] {
  if (answer === qa.card.answer) return qa;
  return {
    ...qa,
    payload: { ...qa.payload, data: { ...qa.payload.data, body: answer } },
    card: { ...qa.card, answer },
  };
}

function hexAlpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export { B as STUDIO_BEATS };
