"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import { useReducedMotion } from "@/components/canvasBackgrounds/useReducedMotion";

const STATUS_LINES = [
  "Untangling thought threads…",
  "Convincing nodes to remember where they live…",
  "Bribing the layout engine with coffee…",
  "Teaching connectors which way is up…",
  "Summoning shader artefacts from the void…",
  "Polishing the infinite grid…",
  "Herding chat nodes into formation…",
];

const GHOST_NODES = [
  { x: 18, y: 28, delay: 0 },
  { x: 42, y: 22, delay: 120 },
  { x: 68, y: 35, delay: 240 },
  { x: 32, y: 58, delay: 360 },
  { x: 58, y: 62, delay: 480 },
  { x: 78, y: 52, delay: 600 },
];

const CONNECTIONS: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 3],
  [3, 4],
  [2, 5],
  [4, 5],
];

const MIN_DISPLAY_MS = 300;

interface CanvasSwitchOverlayProps {
  visible: boolean;
  canvasTitle?: string | null;
}

export function CanvasSwitchOverlay({
  visible,
  canvasTitle,
}: CanvasSwitchOverlayProps) {
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const shownAtRef = useRef(0);

  useEffect(() => {
    if (visible) {
      setShown(true);
      shownAtRef.current = Date.now();
      setStatusIndex(Math.floor(Math.random() * STATUS_LINES.length));
      return;
    }
    if (!shown) return;

    const elapsed = Date.now() - shownAtRef.current;
    const delay = Math.max(0, MIN_DISPLAY_MS - elapsed);
    const timer = setTimeout(() => setShown(false), delay);
    return () => clearTimeout(timer);
  }, [visible, shown]);

  useEffect(() => {
    if (!shown || reducedMotion) return;
    const interval = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_LINES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [shown, reducedMotion]);

  const statusLine = useMemo(
    () => STATUS_LINES[statusIndex] ?? STATUS_LINES[0],
    [statusIndex],
  );

  if (!shown) return null;

  const heading = canvasTitle
    ? `Opening ${canvasTitle}…`
    : "Opening canvas…";

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
        {!reducedMotion && (
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            {CONNECTIONS.map(([from, to], i) => {
              const a = GHOST_NODES[from];
              const b = GHOST_NODES[to];
              if (!a || !b) return null;
              return (
                <line
                  key={`${from}-${to}`}
                  x1={a.x}
                  y1={a.y + 4}
                  x2={b.x}
                  y2={b.y + 4}
                  stroke="currentColor"
                  strokeWidth="0.4"
                  className="switch-connect text-canvas-ink/25"
                  strokeDasharray="3 2"
                  style={{
                    animationDuration: `${1.2 + i * 0.15}s`,
                    animationDelay: `${Math.max(a.delay, b.delay)}ms`,
                  }}
                />
              );
            })}
          </svg>
        )}

        {!reducedMotion &&
          GHOST_NODES.map((node, i) => (
            <div
              key={i}
              className="switch-node-in absolute rounded-lg border border-canvas-border/80 bg-canvas-card/90 shadow-card"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                width: "72px",
                height: "44px",
                transform: "translate(-50%, -50%)",
                animationDelay: `${node.delay}ms`,
              }}
              aria-hidden
            >
              <div className="mx-2 mt-2 h-1.5 w-8 rounded-full bg-canvas-ink/15" />
              <div className="mx-2 mt-1.5 h-1 w-10 rounded-full bg-canvas-ink/10" />
              <div className="mx-2 mt-1 h-1 w-6 rounded-full bg-canvas-ink/10" />
            </div>
          ))}

        {!reducedMotion && (
          <div
            className="switch-artifact absolute left-1/2 top-[72%] h-10 w-14 rounded-md border border-canvas-accent/40 bg-gradient-to-br from-canvas-accent/20 to-transparent shadow-sm"
            aria-hidden
          />
        )}

        <div className="absolute inset-x-0 bottom-[18%] flex flex-col items-center gap-3 text-center">
          <p className="text-lg font-medium text-canvas-ink">{heading}</p>
          <p className="max-w-sm text-sm text-canvas-muted">{statusLine}</p>
          {!reducedMotion && (
            <div className="mt-1 flex gap-1" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="switch-dot h-1.5 w-1.5 rounded-full bg-canvas-accent/70"
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
