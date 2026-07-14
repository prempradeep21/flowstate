"use client";

import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { focusCanvasArtifact } from "@/lib/canvasArtifacts";
import { loadYoutubeIframeApi, youtubeThumbUrl } from "@/lib/youtube";
import { useVideoPipStore } from "@/lib/videoPipStore";

/* Minimal typings for the YouTube IFrame Player API (no @types dependency). */
interface YtPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}
interface YtPlayerEvent {
  target: YtPlayer;
  data: number;
}
interface YtNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (e: YtPlayerEvent) => void;
        onStateChange?: (e: YtPlayerEvent) => void;
      };
    },
  ) => YtPlayer;
}

/* YT.PlayerState numeric constants (stable across the API). */
const YT_PLAYING = 1;
const YT_BUFFERING = 3;

function getYT(): YtNamespace | null {
  return (window as unknown as { YT?: YtNamespace }).YT ?? null;
}

/** Handoff threshold: dock while ≥ this share of the node is on-screen. */
const DOCK_VISIBLE_RATIO = 0.5;
const PIP_WIDTH = 320;
const PIP_HEIGHT = 180;
const PIP_MARGIN = 16;
/** Top inset — clears the top chrome (CTA row / right panel) so the PiP sits
 *  in the space below the UI rather than tucking under it. */
const PIP_TOP = 76;

type Mode = "docked" | "pip" | "hidden";

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function defaultPipRect(): Rect {
  const left =
    typeof window === "undefined"
      ? PIP_MARGIN
      : window.innerWidth - PIP_WIDTH - PIP_MARGIN;
  return { left, top: PIP_TOP, width: PIP_WIDTH, height: PIP_HEIGHT };
}

function clampPip(left: number, top: number): Rect {
  const maxLeft =
    (typeof window === "undefined" ? 1280 : window.innerWidth) -
    PIP_WIDTH -
    PIP_MARGIN;
  const maxTop =
    (typeof window === "undefined" ? 800 : window.innerHeight) -
    PIP_HEIGHT -
    PIP_MARGIN;
  return {
    left: Math.max(PIP_MARGIN, Math.min(maxLeft, left)),
    // Keep a gap under the top chrome — never let the PiP tuck beneath it.
    top: Math.max(PIP_TOP, Math.min(maxTop, top)),
    width: PIP_WIDTH,
    height: PIP_HEIGHT,
  };
}

function setRect(el: HTMLElement, r: Rect) {
  el.style.left = `${r.left}px`;
  el.style.top = `${r.top}px`;
  el.style.width = `${r.width}px`;
  el.style.height = `${r.height}px`;
}

function PlayGlyph({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M8 5v14l11-7L8 5Z" fill="currentColor" />
    </svg>
  );
}
function PauseGlyph({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" />
    </svg>
  );
}

/** Fixed-size seek bar (screen space) — click or drag to scrub. */
function SeekBar({
  fraction,
  onScrub,
}: {
  fraction: number;
  onScrub: (f: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const compute = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width <= 0) return;
    onScrub(Math.max(0, Math.min(1, (clientX - r.left) / r.width)));
  };
  return (
    <div
      ref={trackRef}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        compute(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging.current) compute(e.clientX);
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      }}
      className="relative flex h-3 flex-1 cursor-pointer items-center"
    >
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
        <div
          className="h-full rounded-full bg-red-600"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <div
        className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 rounded-full bg-red-600 shadow"
        style={{ left: `${fraction * 100}%` }}
      />
    </div>
  );
}

/**
 * Owns the single YouTube player for the active canvas playback session (see
 * lib/videoPipStore). The player iframe is created once per session and never
 * reparented — this layer only moves/resizes its fixed host, so playback stays
 * seamless as the node scrolls between "docked" (overlaid on the node) and a
 * floating corner PiP.
 *
 * YouTube's native chrome is disabled (`controls=0`) and replaced with our own
 * fixed-size controls (play/pause + seek only) rendered in screen space, so
 * they never scale with canvas zoom and stay minimal. Rendered only on canvas.
 */
export function CanvasVideoPlayerLayer() {
  const active = useVideoPipStore((s) => s.active);
  const stop = useVideoPipStore((s) => s.stop);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const modeRef = useRef<Mode>("hidden");
  const playingRef = useRef(false);
  const pipPosRef = useRef<Rect | null>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);

  const [mode, setMode] = useState<Mode>("hidden");
  const [playing, setPlaying] = useState(false);
  const [showPoster, setShowPoster] = useState(true);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });

  // Leaving the canvas view unmounts this layer — end the session so playback
  // doesn't continue (or silently resume) outside the canvas.
  useEffect(() => {
    return () => {
      useVideoPipStore.getState().stop();
    };
  }, []);

  // Create the player once per session; move it (never reparent) thereafter.
  useEffect(() => {
    if (!active) return;
    const host = hostRef.current;
    if (!host) return;

    const mount = document.createElement("div");
    mount.style.width = "100%";
    mount.style.height = "100%";
    host.appendChild(mount);

    let player: YtPlayer | null = null;
    let destroyed = false;
    playingRef.current = false;
    setPlaying(false);
    setShowPoster(true);
    setProgress({ current: 0, duration: 0 });

    loadYoutubeIframeApi().then(() => {
      if (destroyed) return;
      const YT = getYT();
      if (!YT) return;
      player = new YT.Player(mount, {
        videoId: active.videoId,
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1,
        },
        events: {
          onReady: (e) => {
            try {
              e.target.playVideo();
            } catch {
              /* ignore */
            }
          },
          onStateChange: (e) => {
            const isPlaying = e.data === YT_PLAYING;
            playingRef.current = isPlaying;
            setPlaying(isPlaying);
            // Cover YouTube's paused / end-screen ("more videos") overlay with
            // the poster; keep the video visible while playing or buffering.
            setShowPoster(!(e.data === YT_PLAYING || e.data === YT_BUFFERING));
          },
        },
      });
      playerRef.current = player;
    });

    const poll = window.setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      try {
        setProgress({ current: p.getCurrentTime(), duration: p.getDuration() });
      } catch {
        /* not ready */
      }
    }, 250);

    return () => {
      destroyed = true;
      window.clearInterval(poll);
      try {
        player?.destroy();
      } catch {
        /* ignore */
      }
      player = null;
      playerRef.current = null;
      host.replaceChildren();
      modeRef.current = "hidden";
      pipPosRef.current = null;
    };
  }, [active?.sessionId, active?.videoId]);

  // Position loop: track the node's placeholder while docked, snap to a corner
  // PiP when it scrolls out (only while playing), hide when paused off-screen.
  useEffect(() => {
    if (!active) return;
    let raf = 0;

    const tick = () => {
      const host = hostRef.current;
      if (host) {
        const placeholder = document.querySelector<HTMLElement>(
          "[data-video-pip-active]",
        );
        const container = document.querySelector<HTMLElement>(
          "[data-canvas-container]",
        );
        const crect = container?.getBoundingClientRect();
        const prect = placeholder?.getBoundingClientRect();

        let docked: Rect | null = null;
        if (prect && crect && prect.width > 2 && prect.height > 2) {
          const ix = Math.max(
            0,
            Math.min(prect.right, crect.right) - Math.max(prect.left, crect.left),
          );
          const iy = Math.max(
            0,
            Math.min(prect.bottom, crect.bottom) -
              Math.max(prect.top, crect.top),
          );
          const ratio = (ix * iy) / (prect.width * prect.height);
          if (ratio >= DOCK_VISIBLE_RATIO) {
            docked = {
              left: prect.left,
              top: prect.top,
              width: prect.width,
              height: prect.height,
            };
            host.style.clipPath = `inset(${Math.max(0, crect.top - prect.top)}px ${Math.max(0, prect.right - crect.right)}px ${Math.max(0, prect.bottom - crect.bottom)}px ${Math.max(0, crect.left - prect.left)}px)`;
          }
        }

        let nextMode: Mode;
        let appliedRect: Rect | null = null;
        if (docked) {
          nextMode = "docked";
          appliedRect = docked;
          setRect(host, docked);
          host.style.zIndex = "34";
          host.style.borderRadius = "0px";
          host.style.boxShadow = "none";
        } else if (playingRef.current) {
          nextMode = "pip";
          appliedRect = pipPosRef.current ?? defaultPipRect();
          pipPosRef.current = appliedRect;
          setRect(host, appliedRect);
          host.style.clipPath = "none";
          host.style.zIndex = "38";
          host.style.borderRadius = "12px";
          host.style.boxShadow = "0 12px 34px rgba(0,0,0,0.4)";
        } else {
          nextMode = "hidden";
          host.style.left = "-99999px";
          host.style.clipPath = "none";
        }

        const controls = controlsRef.current;
        if (controls) {
          if (nextMode === "hidden" || !appliedRect) {
            controls.style.display = "none";
          } else {
            controls.style.display = "block";
            setRect(controls, appliedRect);
            controls.style.zIndex = nextMode === "pip" ? "39" : "35";
            controls.style.borderRadius = nextMode === "pip" ? "12px" : "0px";
          }
        }

        if (nextMode !== modeRef.current) {
          modeRef.current = nextMode;
          setMode(nextMode);
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active?.sessionId]);

  if (!active) return null;

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (playingRef.current) p.pauseVideo();
      else p.playVideo();
    } catch {
      /* ignore */
    }
  };
  const onScrub = (f: number) => {
    const p = playerRef.current;
    if (!p) return;
    try {
      const d = p.getDuration();
      if (d > 0) p.seekTo(f * d, true);
    } catch {
      /* ignore */
    }
  };

  const onDragPointerDown = (e: ReactPointerEvent) => {
    const r = pipPosRef.current ?? defaultPipRect();
    dragRef.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onDragPointerMove = (e: ReactPointerEvent) => {
    if (!dragRef.current) return;
    pipPosRef.current = clampPip(
      e.clientX - dragRef.current.dx,
      e.clientY - dragRef.current.dy,
    );
  };
  const onDragPointerUp = (e: ReactPointerEvent) => {
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const fraction =
    progress.duration > 0
      ? Math.max(0, Math.min(1, progress.current / progress.duration))
      : 0;

  return createPortal(
    <>
      {/* Player host — the YT iframe is appended here imperatively and never
          reparented. pointer-events none so all interaction goes through our
          own controls overlay (and YouTube's hover chrome never triggers). */}
      <div
        ref={hostRef}
        style={{
          position: "fixed",
          overflow: "hidden",
          left: "-99999px",
          top: 0,
          pointerEvents: "none",
        }}
        aria-label="Video player"
      />
      {/* Minimal controls (play/pause + seek) at fixed screen size. */}
      <div
        ref={controlsRef}
        style={{ position: "fixed", display: "none", overflow: "hidden" }}
      >
        {mode !== "hidden" ? (
          <div className="group relative h-full w-full">
            {showPoster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={youtubeThumbUrl(active.videoId)}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full bg-black object-cover"
              />
            ) : null}

            {/* Click surface — toggles play/pause; also blocks YouTube hover UI. */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
              className="absolute inset-0 h-full w-full"
            />

            {!playing ? (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white">
                  <PlayGlyph className="ml-0.5 h-6 w-6" />
                </span>
              </span>
            ) : null}

            {/* Bottom bar: play/pause + seek. Always shown in PiP; on hover when docked. */}
            <div
              className={`absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5 transition-opacity ${
                mode === "pip" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/15"
              >
                {playing ? (
                  <PauseGlyph className="h-5 w-5" />
                ) : (
                  <PlayGlyph className="ml-0.5 h-5 w-5" />
                )}
              </button>
              <SeekBar fraction={fraction} onScrub={onScrub} />
            </div>

            {/* Top bar (PiP only): drag + expand + close. */}
            {mode === "pip" ? (
              <div
                onPointerDown={onDragPointerDown}
                onPointerMove={onDragPointerMove}
                onPointerUp={onDragPointerUp}
                className="absolute inset-x-0 top-0 flex cursor-grab items-center gap-2 bg-gradient-to-b from-black/70 to-transparent px-2 py-1.5 text-white active:cursor-grabbing"
              >
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium">
                  {active.title}
                </span>
                {active.artifactId ? (
                  <button
                    type="button"
                    onClick={() =>
                      active.artifactId && focusCanvasArtifact(active.artifactId)
                    }
                    aria-label="Show on canvas"
                    className="rounded p-1 text-white/80 hover:bg-white/15 hover:text-white"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      className="h-3.5 w-3.5"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => stop()}
                  aria-label="Close video"
                  className="rounded p-1 text-white/80 hover:bg-white/15 hover:text-white"
                >
                  <svg
                    viewBox="0 0 16 16"
                    className="h-3.5 w-3.5"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M4 4l8 8M12 4l-8 8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </>,
    document.body,
  );
}
