"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Falls back to the static card if the frame hasn't signalled load by this
 * point — covers sites that pass the server header check but still refuse to
 * render (or are pathologically slow).
 */
const FRAME_LOAD_TIMEOUT_MS = 8000;

/**
 * A live, interactive <iframe> for an arbitrary embeddable website. Mirrors the
 * embed artifact's "click to interact" gating so that, on the canvas surface,
 * pointer events reach the page only after the user opts in (otherwise the frame
 * would swallow pan/drag gestures). In drawer/panel layouts it is always live.
 */
export function InteractiveWebFrame({
  src,
  title,
  layout = "panel",
  forceInteractive = false,
  onFailed,
}: {
  src: string;
  title: string;
  layout?: "canvas" | "panel" | "sidebar";
  forceInteractive?: boolean;
  onFailed?: () => void;
}) {
  const isCanvas = layout === "canvas";
  const [active, setActive] = useState(forceInteractive);
  const [loaded, setLoaded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const onFailedRef = useRef(onFailed);
  useEffect(() => {
    onFailedRef.current = onFailed;
  }, [onFailed]);

  useEffect(() => {
    setActive(forceInteractive);
  }, [forceInteractive]);

  // Off-canvas (drawer/panel), the frame isn't competing with pan/zoom gestures,
  // so it is interactive without an opt-in click.
  const interactive = isCanvas ? active : true;

  // Deactivate on Escape / outside pointer-down while interacting on the canvas.
  useEffect(() => {
    if (!isCanvas || !active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setActive(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [isCanvas, active]);

  // Watchdog — only reset when the load state flips, so a re-rendered onFailed
  // callback doesn't keep restarting the timer.
  useEffect(() => {
    if (loaded) return;
    const timer = window.setTimeout(() => {
      onFailedRef.current?.();
    }, FRAME_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [loaded]);

  return (
    <div
      ref={rootRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-canvas-bg"
    >
      <iframe
        src={src}
        title={title}
        className={`h-full w-full border-0 bg-white ${
          interactive ? "pointer-events-auto" : "pointer-events-none"
        }`}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="autoplay; encrypted-media; fullscreen; clipboard-write"
        allowFullScreen
        onLoad={() => setLoaded(true)}
      />
      {!loaded ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-canvas-bg text-canvas-caption text-canvas-muted">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-canvas-border border-t-canvas-accent" />
          <span>Loading site…</span>
        </div>
      ) : null}
      {isCanvas && !active ? (
        <button
          type="button"
          aria-label="Click to interact with website"
          onClick={() => setActive(true)}
          className="absolute inset-0 z-10 flex cursor-pointer items-end justify-center bg-transparent pb-3 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
        >
          <span className="rounded-full border border-canvas-border/60 bg-canvas-card/95 px-2.5 py-1 text-canvas-micro text-canvas-muted shadow-sm">
            Click to interact
          </span>
        </button>
      ) : null}
    </div>
  );
}
