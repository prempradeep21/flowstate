"use client";

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { LandingCanvasFrame } from "@/components/landing-page/shared/LandingCanvasFrame";
import { LandingSectionShell } from "@/components/landing-page/LandingSectionShell";
import { LANDING_COPY } from "@/components/landing-page/landingSections";
import { buildLandingBranchingSnapshot } from "@/lib/buildLandingBranchingSnapshot";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { playSound } from "@/lib/sounds/engine";

const LINEAR_LINES = [
  "Where should I spend my long weekend?",
  "Compare Lisbon neighborhoods",
  "Wait — what about Porto?",
  "Back to the Lisbon thread…",
  "Summarize everything so far",
] as const;

export function ProblemSection() {
  const [mode, setMode] = useState<"linear" | "spatial">("linear");
  const [lineIndex, setLineIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const copy = LANDING_COPY.problem;

  useEffect(() => {
    if (mode !== "linear" || reducedMotion) return;
    const timer = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % LINEAR_LINES.length);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [mode, reducedMotion]);

  const switchMode = (next: "linear" | "spatial") => {
    setMode(next);
    void playSound("plug-connect");
  };

  return (
    <LandingSectionShell
      id="problem"
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.body}
      tone="soft"
    >
      <div className="overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-canvas-border px-4 py-3 sm:px-5">
          <p className="text-canvas-compact text-canvas-muted">
            Toggle to feel the difference in your own session
          </p>
          <div className="inline-flex rounded-full border border-canvas-border bg-canvas-bg p-0.5">
            {(["linear", "spatial"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => switchMode(key)}
                className={`rounded-full px-4 py-1.5 text-canvas-compact transition-colors ${
                  mode === key
                    ? "bg-canvas-ink font-medium text-canvas-card"
                    : "text-canvas-muted hover:text-canvas-ink"
                }`}
              >
                {key === "linear" ? "Chat scroll" : "Your canvas"}
              </button>
            ))}
          </div>
        </div>

        <div className="relative min-h-[480px]">
          <AnimatePresence mode="wait">
            {mode === "linear" ? (
              <m.div
                key="linear"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex min-h-[480px] flex-col"
              >
                <div className="border-b border-canvas-border px-5 py-2 text-canvas-caption text-canvas-muted">
                  One thread — earlier branches disappear as you scroll
                </div>
                <div className="relative flex-1 overflow-hidden px-5 py-4">
                  <div
                    className="flex flex-col gap-2.5 transition-transform duration-700 ease-out"
                    style={{ transform: `translateY(-${lineIndex * 56}px)` }}
                  >
                    {LINEAR_LINES.map((line, i) => (
                      <div
                        key={line}
                        className={`rounded-canvas border px-4 py-3 text-canvas-compact transition-colors ${
                          i === lineIndex
                            ? "border-canvas-accent/35 bg-canvas-bg text-canvas-ink"
                            : "border-canvas-border/70 bg-canvas-card/50 text-canvas-muted"
                        }`}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-canvas-card to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-canvas-card to-transparent" />
                </div>
              </m.div>
            ) : (
              <m.div
                key="spatial"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-[480px]"
              >
                <LandingCanvasFrame
                  buildSnapshot={buildLandingBranchingSnapshot}
                  height={480}
                  label="Flowstate branching preview"
                  className="rounded-none border-0 shadow-none"
                />
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LandingSectionShell>
  );
}
