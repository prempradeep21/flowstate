"use client";

import { useEffect, useRef, useState } from "react";
import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import { useReducedMotion } from "@/components/canvasBackgrounds/useReducedMotion";
import { SCENES, pickScene } from "@/components/canvas-loading/scenes";
import { LOADER_LINES } from "@/components/canvas-loading/tips";
import styles from "@/components/canvas-loading/scenes.module.css";

const MIN_DISPLAY_MS = 300;
const LINE_INTERVAL_MS = 2800;

interface CanvasSwitchOverlayProps {
  visible: boolean;
  canvasTitle?: string | null;
  /** Dev-only: pin a specific scene (see /dev/loading-scenes). */
  forceSceneIndex?: number;
}

export function CanvasSwitchOverlay({
  visible,
  canvasTitle,
  forceSceneIndex,
}: CanvasSwitchOverlayProps) {
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [sceneIndex, setSceneIndex] = useState(0);
  const shownAtRef = useRef(0);

  useEffect(() => {
    if (visible) {
      if (!shown) {
        setShown(true);
        shownAtRef.current = Date.now();
        setLineIndex(Math.floor(Math.random() * LOADER_LINES.length));
        setSceneIndex(forceSceneIndex ?? pickScene());
      }
      return;
    }
    if (!shown) return;

    const elapsed = Date.now() - shownAtRef.current;
    const delay = Math.max(0, MIN_DISPLAY_MS - elapsed);
    const timer = setTimeout(() => setShown(false), delay);
    return () => clearTimeout(timer);
  }, [visible, shown, forceSceneIndex]);

  useEffect(() => {
    if (forceSceneIndex != null) setSceneIndex(forceSceneIndex);
  }, [forceSceneIndex]);

  useEffect(() => {
    if (!shown || reducedMotion) return;
    const interval = setInterval(() => {
      setLineIndex((i) => (i + 1) % LOADER_LINES.length);
    }, LINE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [shown, reducedMotion]);

  if (!shown) return null;

  const heading = canvasTitle
    ? `Opening ${canvasTitle}…`
    : "Opening canvas…";
  const line = LOADER_LINES[lineIndex] ?? LOADER_LINES[0]!;
  const { Scene } = SCENES[sceneIndex] ?? SCENES[0]!;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center overflow-hidden bg-canvas-bg/90 backdrop-blur-sm transition-opacity duration-300"
      aria-live="polite"
      aria-busy={visible}
      role="status"
    >
      <div className="absolute inset-0">
        <GridBackground animate={false} viewport={{ x: 0, y: 0, scale: 1 }} />
      </div>

      <div className="relative h-full w-full max-w-2xl px-8">
        <Scene reducedMotion={reducedMotion} />

        <div className="absolute inset-x-0 bottom-[14%] flex flex-col items-center gap-2 text-center">
          <p className="text-canvas-heading font-medium text-canvas-ink">{heading}</p>
          <div
            key={lineIndex}
            className={`${reducedMotion ? "" : styles.lineIn} flex min-h-10 max-w-sm flex-col items-center gap-1`}
          >
            {line.kind === "tip" && (
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-canvas-accent/80">
                Tip
              </span>
            )}
            <p className="text-canvas-body text-canvas-muted">{line.text}</p>
          </div>
          {!reducedMotion && (
            <div className="mt-1 flex gap-1" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`${styles.dot} h-1.5 w-1.5 rounded-full bg-canvas-accent/70`}
                  style={{ animationDelay: `${i * 160}ms` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
