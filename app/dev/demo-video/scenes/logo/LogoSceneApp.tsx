"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Alkatra } from "next/font/google";
import { lerp } from "../../timeline";
import {
  BRAND_BLUE,
  DOT_STARTS,
  LOGO_DURATION_MS,
  MARK_CIRCLE,
  MARK_NODE_R,
  MARK_NODES,
  MARK_PATHS,
  MARK_VIEWBOX,
  WORD,
  logoSceneStateAt,
  type ConvergePose,
  type LetterPose,
  type LogoSceneState,
  type LogoVariant,
  type MarkPose,
} from "./timeline";

/** Figma spec: the wordmark is Alkatra Regular. */
const alkatra = Alkatra({ subsets: ["latin"], weight: "400" });

/** Everything is driven by inline styles from t — kill anything wall-clock. */
const LOGO_SCENE_CSS = `
html[data-demo-capture] *, html[data-demo-capture] *::before, html[data-demo-capture] *::after {
  transition: none !important;
  animation: none !important;
}
`;

/* ------------------------------------------------------------------ */
/* The animatable mark (geometry from public/flowstate-logo.svg)        */
/* ------------------------------------------------------------------ */

/** Fraction of each branch path that lies outside the circle clip —
 *  pre-filled at draw=0 so visible drawing starts right at the rim. */
const PATH_PREDRAW = [0.26, 0.24, 0.29];

function MarkSvg({ size, pose }: { size: number; pose: MarkPose }) {
  const clipId = useId();
  return (
    <svg
      viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`}
      width={size}
      height={size}
      style={{
        display: "block",
        overflow: "visible",
        opacity: pose.opacity,
        transform: `scale(${pose.scale}) rotate(${pose.rotate}deg)`,
        transformOrigin: "50% 50%",
      }}
      aria-hidden
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={MARK_CIRCLE.cx} cy={MARK_CIRCLE.cy} r={MARK_CIRCLE.r} />
        </clipPath>
      </defs>
      <circle
        cx={MARK_CIRCLE.cx}
        cy={MARK_CIRCLE.cy}
        r={MARK_CIRCLE.r}
        fill={BRAND_BLUE}
      />
      <g clipPath={`url(#${clipId})`}>
        {MARK_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="#fff"
            strokeWidth={5}
            fill="none"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={(1 - PATH_PREDRAW[i]) * (1 - pose.draw[i])}
          />
        ))}
        {MARK_NODES.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={MARK_NODE_R}
            fill="#fff"
            transform={`translate(${n.x} ${n.y}) scale(${pose.nodes[i]}) translate(${-n.x} ${-n.y})`}
          />
        ))}
      </g>
    </svg>
  );
}

/** logo-nodes: blue threads/dots converge; the expanding blue circle
 *  inverts everything inside it to white; the loose ends fade away. */
function ConvergeSvg({ size, pose }: { size: number; pose: ConvergePose }) {
  const clipId = useId();
  const r = MARK_CIRCLE.r * pose.circleR;
  const dots = MARK_NODES.map((n, i) => ({
    x: lerp(DOT_STARTS[i].x, n.x, pose.dotTravel),
    y: lerp(DOT_STARTS[i].y, n.y, pose.dotTravel),
  }));
  const strokes = (color: string) => (
    <>
      {MARK_PATHS.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={color}
          strokeWidth={5}
          fill="none"
          pathLength={1}
          strokeDasharray="1"
          // Reveal from the node end backward — tails grow out of the dots.
          strokeDashoffset={pose.draw[i] - 1}
        />
      ))}
      {dots.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={MARK_NODE_R}
          fill={color}
          opacity={pose.dotOpacity}
        />
      ))}
    </>
  );
  return (
    <svg
      viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`}
      width={size}
      height={size}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={MARK_CIRCLE.cx} cy={MARK_CIRCLE.cy} r={r} />
        </clipPath>
      </defs>
      {/* Blue-on-white layer (outside the reveal) — fades at the end. */}
      <g opacity={pose.exterior}>{strokes(BRAND_BLUE)}</g>
      {/* The expanding blue circle + white-on-blue interior. */}
      {r > 0 && (
        <>
          <circle
            cx={MARK_CIRCLE.cx}
            cy={MARK_CIRCLE.cy}
            r={r}
            fill={BRAND_BLUE}
          />
          <g clipPath={`url(#${clipId})`}>{strokes("#fff")}</g>
        </>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Wordmark pieces                                                      */
/* ------------------------------------------------------------------ */

/** Per-letter span. Tracking is applied as an explicit per-span margin so
 *  it behaves identically around inline-block letters and the mark slot. */
function Letter({
  ch,
  pose,
  tracking,
  last,
}: {
  ch: string;
  pose: LetterPose;
  tracking: number;
  last: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        marginRight: last ? 0 : `${tracking}em`,
        opacity: pose.opacity,
        transform: `translate(${pose.shift}em, ${pose.rise}em)`,
      }}
    >
      {ch}
    </span>
  );
}

function Wordmark({
  scene,
  fontSize,
}: {
  scene: LogoSceneState;
  fontSize: number;
}) {
  return (
    <div
      className={alkatra.className}
      style={{
        fontSize,
        lineHeight: 1,
        whiteSpace: "nowrap",
        color: BRAND_BLUE,
      }}
    >
      {WORD.split("").map((ch, i) => (
        <Letter
          key={i}
          ch={ch}
          pose={scene.letters[i]}
          tracking={scene.tracking}
          last={i === WORD.length - 1}
        />
      ))}
    </div>
  );
}

/** "fl" + mark-as-o + "wstate". Slot metrics tuned against Alkatra's "o". */
const O_SLOT_W = 0.56; // em — the o's advance width the mark occupies
const O_MARK_SIZE = 0.6; // em — mark diameter (slight optical overshoot)
const O_MARK_DROP = -0.02; // em — nudge below baseline for optical centering

function WordmarkWithMarkO({
  scene,
  fontSize,
}: {
  scene: LogoSceneState;
  fontSize: number;
}) {
  const halves = ["fl", "wstate"];
  let letterIdx = 0;
  return (
    <div
      className={alkatra.className}
      style={{
        fontSize,
        lineHeight: 1,
        whiteSpace: "nowrap",
        color: BRAND_BLUE,
      }}
    >
      {halves[0].split("").map((ch) => (
        <Letter
          key={`a${ch}${letterIdx}`}
          ch={ch}
          pose={scene.letters[letterIdx++]}
          tracking={scene.tracking}
          last={false}
        />
      ))}
      <span
        style={{
          display: "inline-block",
          position: "relative",
          width: `${O_SLOT_W}em`,
          height: `${O_SLOT_W}em`,
          marginRight: `${scene.tracking}em`,
        }}
      >
        <span
          style={{
            position: "absolute",
            left: "50%",
            bottom: `${O_MARK_DROP}em`,
            width: `${O_MARK_SIZE}em`,
            height: `${O_MARK_SIZE}em`,
            marginLeft: `${-O_MARK_SIZE / 2}em`,
          }}
        >
          <MarkSvg size={O_MARK_SIZE * fontSize} pose={scene.mark} />
        </span>
      </span>
      {halves[1].split("").map((ch, i) => (
        <Letter
          key={`b${ch}${i}`}
          ch={ch}
          pose={scene.letters[letterIdx++]}
          tracking={scene.tracking}
          last={i === halves[1].length - 1}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Variant views (all centered on plain white)                          */
/* ------------------------------------------------------------------ */

function VariantView({
  variant,
  scene,
}: {
  variant: LogoVariant;
  scene: LogoSceneState;
}) {
  switch (variant) {
    case "logo-draw":
      return <MarkSvg size={420} pose={scene.mark} />;
    case "logo-type":
      return <Wordmark scene={scene} fontSize={176} />;
    case "logo-o":
      return <WordmarkWithMarkO scene={scene} fontSize={176} />;
    case "logo-lockup":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <MarkSvg size={168} pose={scene.mark} />
          <Wordmark scene={scene} fontSize={160} />
        </div>
      );
    case "logo-nodes":
      return <ConvergeSvg size={440} pose={scene.converge!} />;
  }
}

/* ------------------------------------------------------------------ */
/* Scene shell — same capture contract as the other demo scenes         */
/* ------------------------------------------------------------------ */

export function LogoSceneApp({ variant }: { variant: LogoVariant }) {
  const params = useSearchParams();
  const capture = params.get("capture") === "1";
  const autoPlay = params.get("play") === "1";

  const [mounted, setMounted] = useState(false);
  const [scene, setScene] = useState<LogoSceneState>(() =>
    logoSceneStateAt(variant, 0),
  );
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);

  const applyFrame = useCallback(
    (tMs: number) => {
      document.documentElement.style.setProperty("--demo-t", String(tMs));
      setScene(logoSceneStateAt(variant, tMs));
      setT(tMs);
    },
    [variant],
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-demo-video", "");
    if (capture) document.documentElement.setAttribute("data-demo-capture", "");

    let cancelled = false;
    // rAF doesn't fire while the window is hidden — race a timeout so seeks
    // still settle; visible capture always wins via rAF.
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
    window.__seek = async (tMs: number) => {
      await ready;
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
    const tick = (now: number) => {
      if (!playingRef.current) return;
      applyFrame((now - startWall) % LOGO_DURATION_MS);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [applyFrame]);

  const stopPlayback = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
  }, []);

  if (!mounted) {
    return <div className="fixed inset-0 bg-white" />;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-white select-none">
      <style dangerouslySetInnerHTML={{ __html: LOGO_SCENE_CSS }} />
      <VariantView variant={variant} scene={scene} />

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
            max={LOGO_DURATION_MS}
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
