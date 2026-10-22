"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { useSearchParams } from "next/navigation";
import { StudioFontScope } from "@/app/dev/artifact-studio/studioFonts";
import {
  StyledArtifact,
  backdropOf,
  getStyleFamily,
  previewFamilyFonts,
  type ArtifactRenderContext,
  type ArtifactStyleFamily,
  type FontId,
  type FontPair,
} from "@/components/artifactStyles";
import { fontPairStyle, FONT_OPTIONS } from "@/components/artifactStyles/fonts";
import { HugContext } from "@/components/artifactStyles/hug";
import { FrostSkeletonBody } from "@/components/frost/FrostGenerating";
import { getStudioPool, type StudioArtifact } from "@/lib/artifactStudio/pool";
import { payloadToArtifactKind, type ArtifactKind } from "@/lib/artifactTypes";
import {
  FAMILY_ID,
  FIELD_COLOR,
  FONTS,
  FRAME,
  POP_GAP,
  QA_W,
  filledItem,
  getQaBase,
  getShowcaseCast,
  layoutShowcase,
  popHeightFor,
  type SceneTile,
  type ShowcaseLayout,
} from "./fixtures";
import {
  B,
  DEFAULT_MEASURED,
  SHOWCASE_DURATION_MS,
  showcaseSceneStateAt,
  type FillState,
  type Measured,
  type ShowcaseSceneState,
} from "./timeline";

declare global {
  interface Window {
    __demoSettled?: () => boolean;
  }
}

const PERSPECTIVE_PX = 2100;

const DEMO_ANIMATION_CSS = `
html[data-demo-video] *, html[data-demo-video] *::before, html[data-demo-video] *::after {
  animation-play-state: paused !important;
  animation-delay: calc(var(--demo-t, 0) * -1ms) !important;
}
/* The thinking dots breathe in turn: keep their stagger under the phase drive. */
html[data-demo-video] [aria-busy="true"] > span > span:nth-child(2) { --demo-t: calc(var(--demo-t-root) - 180); }
html[data-demo-video] [aria-busy="true"] > span > span:nth-child(3) { --demo-t: calc(var(--demo-t-root) - 360); }
/* The Frost skeleton's light sweep and breathing dot are turned off under
   reduced motion (which capture runs with) — keep them, phase-driven. */
html[data-demo-video] [data-artifact-style="frost"] .frost-sheen-sweep {
  animation-name: frost-sweep !important;
  animation-duration: 1.8s !important;
  animation-timing-function: ease-in-out !important;
  animation-iteration-count: infinite !important;
}
html[data-demo-video] [data-artifact-style="frost"] .frost-gen-dot {
  animation-name: frost-breathe !important;
  animation-duration: 1.4s !important;
  animation-timing-function: ease-in-out !important;
  animation-iteration-count: infinite !important;
}
/* The skeleton's own lime dot stands where the ⋯ will be. */
html[data-demo-video] [data-demo-skeleton] [data-sd-frame] > div.z-20 { display: none !important; }
html[data-demo-capture] *, html[data-demo-capture] *::before, html[data-demo-capture] *::after {
  transition: none !important;
}
`;

function screenViewport(camera: ShowcaseSceneState["camera"]) {
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

const tileCtx = (item: StudioArtifact, extra?: Partial<ArtifactRenderContext>): ArtifactRenderContext => ({
  item,
  interactive: false,
  surface: "tile",
  chromeState: "rest",
  themeId: null,
  mode: "light",
  ...extra,
});

/** The Frost generating skeleton, standing at the card's final size with its title set. */
function Skeleton({ item, family, fonts }: { item: StudioArtifact; family: ArtifactStyleFamily; fonts: FontPair }) {
  const Frame = family.slots.Frame;
  const kind: ArtifactKind = item.card ? "custom" : payloadToArtifactKind(item.payload);
  const ctx = tileCtx({ ...item, variant: "custom" });
  return (
    <div data-studio-fonts className="contents" style={fontPairStyle(fonts)}>
      <Frame ctx={ctx} header={null} body={<FrostSkeletonBody kind={kind} title={item.artifact.title} />} />
    </div>
  );
}

/** One cast card at its world rect: the body (part-way through arriving) over its skeleton. */
function Tile({ tile, fill, family, fonts }: { tile: SceneTile; fill: FillState | undefined; family: ArtifactStyleFamily; fonts: FontPair }) {
  const filling = !!tile.fill && !!fill;
  const fade = filling ? fill!.fade : 1;
  const item = filling ? filledItem(tile.item, tile.fill!, fill!.p) : tile.item;
  return (
    <div className="absolute left-0 top-0" style={{ width: tile.w, height: tile.h, transform: `translate(${tile.x}px, ${tile.y}px)` }}>
      {fade > 0 && (
        <div className="absolute inset-0 flex flex-col" style={{ opacity: fade }}>
          <HugContext.Provider value={true}>
            <StyledArtifact family={family} ctx={tileCtx(item)} />
          </HugContext.Provider>
        </div>
      )}
      {fade < 1 && (
        <div data-demo-skeleton data-artifact-style="frost" className="absolute inset-0 flex flex-col" style={{ opacity: 1 - fade }}>
          <Skeleton item={tile.item} family={family} fonts={fonts} />
        </div>
      )}
    </div>
  );
}

const isFontId = (id: string | null): id is FontId => !!id && FONT_OPTIONS.some((f) => f.id === id);

export function ShowcaseSceneApp() {
  const params = useSearchParams();
  const capture = params.get("capture") === "1";
  const autoPlay = params.get("play") === "1";
  const primary = params.get("primary");
  const secondary = params.get("secondary");
  const fonts: FontPair = {
    primary: isFontId(primary) ? primary : FONTS.primary,
    secondary: isFontId(secondary) ? secondary : FONTS.secondary,
  };

  const family = getStyleFamily(FAMILY_ID);
  const backdrop = backdropOf(family, null, "light");

  const layoutRef = useRef<ShowcaseLayout | null>(null);
  const measuredRef = useRef<Measured>(DEFAULT_MEASURED);
  const measureTileRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const measureThinkRef = useRef<HTMLDivElement>(null);
  const measureDoneRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [layout, setLayout] = useState<ShowcaseLayout | null>(null);
  const [scene, setScene] = useState<ShowcaseSceneState | null>(null);
  const [t, setT] = useState(0);
  const [fit, setFit] = useState(1);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);

  const applyFrame = useCallback((tMs: number) => {
    const lay = layoutRef.current;
    if (!lay) return;
    const s = showcaseSceneStateAt(tMs, lay, measuredRef.current);
    const root = document.documentElement;
    root.style.setProperty("--demo-t", String(tMs));
    root.style.setProperty("--demo-t-root", String(tMs));
    setScene(s);
    setT(tMs);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-demo-video", "");
    if (capture) document.documentElement.setAttribute("data-demo-capture", "");
    // Every Style D card in this scene draws in the scene's pair (not saved).
    previewFamilyFonts(FAMILY_ID, fonts);

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
      const heights: Record<string, number> = {};
      for (const tile of getShowcaseCast()) {
        const el = measureTileRefs.current[tile.key];
        const h = el?.offsetHeight ?? 0;
        heights[tile.key] = Math.ceil(h);
      }
      const thinkH = measureThinkRef.current?.offsetHeight ?? 0;
      const doneH = measureDoneRef.current?.offsetHeight ?? 0;
      if (thinkH > 0 && doneH > 0) measuredRef.current = { thinkH: Math.ceil(thinkH), doneH: Math.ceil(doneH) };
      const lay = layoutShowcase(heights, measuredRef.current.doneH, popHeightFor());
      layoutRef.current = lay;
      // Dev inspection from the browser pane (scrubber only).
      if (!capture) (window as unknown as { __showcaseLayout?: ShowcaseLayout; __studioPool?: unknown }).__showcaseLayout = lay;
      if (!capture) (window as unknown as { __studioPool?: unknown }).__studioPool = getStudioPool();
      setLayout(lay);
    };

    const ready = (async () => {
      setMounted(true);
      await new Promise((r) => setTimeout(r, 0));
      await nextFrame();
      await document.fonts.ready;
      while (document.fonts.status === "loading") {
        await new Promise((r) => setTimeout(r, 50));
      }
      await nextFrame();
      await nextFrame();
      if (cancelled) return;
      flushSync(() => measure());
      await nextFrame();
      // Measure once more now that every font the cards asked for is in.
      await document.fonts.ready;
      flushSync(() => measure());
      flushSync(() => applyFrame(0));
      await nextFrame();
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
      previewFamilyFonts(FAMILY_ID, null);
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
      applyFrame((now - startWall) % SHOWCASE_DURATION_MS);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [applyFrame]);

  const stopPlayback = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
  }, []);

  if (!mounted) {
    return <div className="fixed inset-0" style={{ background: backdrop?.background }} />;
  }

  // In the browser pane the frame is scaled to fit; capture pins the window
  // to the frame so `fit` is 1 there.
  const frameStyle: CSSProperties = capture
    ? { width: FRAME.w, height: FRAME.h }
    : { width: FRAME.w, height: FRAME.h, left: "50%", top: "50%", transform: `translate(-50%, -50%) scale(${fit})` };

  const qaBase = getQaBase();
  const measureBlock = (
    <div aria-hidden className="absolute left-0 top-0" style={{ transform: "translate(-30000px, 0)", visibility: "hidden" }}>
      <HugContext.Provider value={true}>
        {getShowcaseCast().map((tile) => (
          <div
            key={tile.key}
            ref={(el) => {
              measureTileRefs.current[tile.key] = el;
            }}
            className="flex flex-col"
            style={{ width: tile.w, minHeight: family.hug?.(tile.item) ?? 0 }}
          >
            <StyledArtifact family={family} ctx={tileCtx(tile.item)} />
          </div>
        ))}
      </HugContext.Provider>
      <div style={{ width: QA_W }}>
        <div ref={measureThinkRef}>
          <StyledArtifact family={family} ctx={{ ...tileCtx(qaBase), surface: "focus", qaState: "thinking" }} />
        </div>
        <div ref={measureDoneRef}>
          <StyledArtifact family={family} ctx={{ ...tileCtx(qaBase), surface: "focus", qaState: "done" }} />
        </div>
      </div>
    </div>
  );

  if (!layout || !scene) {
    return (
      <StudioFontScope>
        <div className="fixed inset-0 overflow-hidden" style={{ background: backdrop?.background }}>
          <style dangerouslySetInnerHTML={{ __html: DEMO_ANIMATION_CSS }} />
          {measureBlock}
        </div>
      </StudioFontScope>
    );
  }

  const vp = screenViewport(scene.camera);
  const tilted = Math.abs(scene.tiltX) > 0.0005 || Math.abs(scene.tiltZ) > 0.0005;
  const { composer, popSize } = layout;
  const qaItem = scene.qa.qaState === "done" ? withAnswer(layout.qa, scene.qa.answer) : layout.qa;
  const popY = composer.y + scene.qa.cardH + POP_GAP;
  const popItem = filledItem(layout.pop, "slices", scene.pop.fill);

  return (
    <StudioFontScope>
      <div className="fixed inset-0 overflow-hidden select-none" style={{ background: capture ? backdrop?.background : "#111" }}>
        <style dangerouslySetInnerHTML={{ __html: DEMO_ANIMATION_CSS }} />
        <div className="absolute overflow-hidden" style={{ ...frameStyle, background: backdrop?.background, color: backdrop?.ink }}>
          {/* Stage: perspective + the tilting plane the whole wall lies on. */}
          <div className="absolute inset-0" style={tilted ? { perspective: `${PERSPECTIVE_PX}px`, perspectiveOrigin: "50% 44%" } : undefined}>
            <div
              className="absolute inset-0"
              style={
                tilted
                  ? { transform: `rotateX(${scene.tiltX.toFixed(4)}deg) rotateZ(${scene.tiltZ.toFixed(4)}deg)`, transformOrigin: "50% 50%" }
                  : undefined
              }
            >
              {/* World → screen. */}
              <div
                className="absolute left-0 top-0"
                style={{ transform: `translate(${vp.x.toFixed(3)}px, ${vp.y.toFixed(3)}px) scale(${vp.scale.toFixed(5)})`, transformOrigin: "0 0" }}
              >
                {layout.tiles.map((tile) => (
                  <Tile key={tile.key} tile={tile} fill={scene.fills[tile.key]} family={family} fonts={fonts} />
                ))}

                {/* The Q&A turn: the composer pill, then the card held at its animated height. */}
                {scene.qa.composerOpacity > 0 && (
                  <div
                    className="absolute left-0 top-0"
                    style={{
                      width: composer.w,
                      transform: `translate(${composer.x}px, ${composer.y}px) scale(${scene.qa.composerScale.toFixed(4)})`,
                      transformOrigin: "50% 50%",
                      opacity: scene.qa.composerOpacity,
                      zIndex: 3,
                    }}
                  >
                    <StyledArtifact family={family} ctx={{ ...tileCtx(layout.qa), surface: "focus", qaState: "typing", composerDraft: scene.qa.draft }} />
                  </div>
                )}
                {scene.qa.cardOpacity > 0 && scene.qa.qaState !== "typing" && (
                  <div
                    className="absolute left-0 top-0"
                    style={{ width: composer.w, height: scene.qa.cardH, transform: `translate(${composer.x}px, ${composer.y}px)`, opacity: scene.qa.cardOpacity, zIndex: 2 }}
                  >
                    <StyledArtifact family={family} ctx={{ ...tileCtx(qaItem), surface: "focus", qaState: scene.qa.qaState }} />
                  </div>
                )}

                {/* The answer pops out beneath the card, its slices arriving. */}
                {scene.pop.visible && (
                  <div
                    className="absolute left-0 top-0"
                    style={{
                      width: popSize.w,
                      height: popSize.h,
                      transform: `translate(${composer.x}px, ${(popY + scene.pop.liftY).toFixed(3)}px) scale(${scene.pop.scale.toFixed(4)})`,
                      transformOrigin: "50% 0%",
                      opacity: scene.pop.opacity,
                    }}
                  >
                    <StyledArtifact family={family} ctx={tileCtx(popItem)} />
                  </div>
                )}
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
                background: `linear-gradient(to bottom, ${FIELD_COLOR} 0%, ${hexAlpha(FIELD_COLOR, 0.5)} 11%, ${hexAlpha(FIELD_COLOR, 0)} 30%)`,
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
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ opacity: scene.introVeil, zIndex: 43, background: FIELD_COLOR }} />
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
              max={SHOWCASE_DURATION_MS}
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
function withAnswer(qa: ShowcaseLayout["qa"], answer: string): ShowcaseLayout["qa"] {
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

export { B as SHOWCASE_BEATS };
