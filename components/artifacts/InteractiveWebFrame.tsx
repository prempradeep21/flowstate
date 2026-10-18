"use client";

import { useEffect, useRef, useState } from "react";
import { SkeletonBar } from "@/components/artifacts/ArtifactLoadingSkeleton";

/**
 * Falls back to the static card if the frame hasn't signalled load by this
 * point — covers sites that pass the server header check but still refuse to
 * render (or are pathologically slow).
 */
const FRAME_LOAD_TIMEOUT_MS = 8000;

/**
 * A cross-origin page paints well after its load event (it renders in its own
 * process), and there is no signal for when it does. So the skeleton sits
 * BEHIND a transparent frame: it shows through until the page paints its own
 * background over it. After this grace the skeleton goes and the frame gets a
 * white backing, for the odd page that never paints a background.
 */
const PAINT_GRACE_MS = 3000;

/** A generic page shape — header, headline, body copy — that shimmers. */
function PageSkeleton() {
  return (
    <div className="flex h-full w-full flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <SkeletonBar className="h-4 w-24" />
        <div className="flex-1" />
        <SkeletonBar className="h-4 w-4 rounded-full" />
        <SkeletonBar className="h-4 w-4 rounded-full" />
      </div>
      <SkeletonBar className="mt-2 h-6 w-1/2" />
      {[94, 88, 97, 72].map((w, i) => (
        <SkeletonBar key={i} className="h-2.5" style={{ width: `${w}%` }} />
      ))}
      <SkeletonBar className="mt-1 min-h-0 w-full flex-1" />
    </div>
  );
}

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
  const [settled, setSettled] = useState(false);
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

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => setSettled(true), PAINT_GRACE_MS);
    return () => window.clearTimeout(timer);
  }, [loaded]);

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
      {!settled ? (
        <div
          className="pointer-events-none absolute inset-0 bg-canvas-card"
          role="status"
          aria-label="Loading site"
        >
          <PageSkeleton />
        </div>
      ) : null}
      <iframe
        src={src}
        title={title}
        className={`relative h-full w-full border-0 ${settled ? "bg-white" : "bg-transparent"} ${
          interactive ? "pointer-events-auto" : "pointer-events-none"
        }`}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="autoplay; encrypted-media; fullscreen; clipboard-write"
        allowFullScreen
        onLoad={() => setLoaded(true)}
      />
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
