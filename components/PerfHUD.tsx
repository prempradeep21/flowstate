"use client";

import { useEffect, useRef, useState } from "react";
import {
  createHudSampler,
  installPerfBridge,
  type HudFrameSnapshot,
} from "@/lib/perf/frameStats";

/**
 * Floating frame-time HUD for canvas performance work.
 *
 * Enable with `?perfHud=1` or `localStorage.flowstatePerfHud = "1"`.
 * Rendered OUTSIDE the canvas viewport subtree so its own updates never
 * touch canvas rendering. Shows FPS, rolling avg/worst frame, and a React
 * commit counter (commits observed since mount via useSyncExternalStore-free
 * subscription — incremented by the store-commit probe below).
 */
export function usePerfHudEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      setEnabled(
        qs.get("perfHud") === "1" ||
          window.localStorage.getItem("flowstatePerfHud") === "1",
      );
    } catch {
      setEnabled(false);
    }
  }, []);
  return enabled;
}

const BAR_COUNT = 60;

export function PerfHUD() {
  const enabled = usePerfHudEnabled();
  const [snap, setSnap] = useState<HudFrameSnapshot | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    installPerfBridge();
    const sampler = createHudSampler(BAR_COUNT);
    sampler.start(setSnap);
    return () => sampler.stop();
  }, [enabled]);

  // Sparkline drawing — canvas so HUD updates don't grow the React tree.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !snap) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const w = el.width;
    const h = el.height;
    ctx.clearRect(0, 0, w, h);
    const barW = w / BAR_COUNT;
    const samples = snap.samples.slice(-BAR_COUNT);
    // Cadence = lower-quartile delta; color frames RELATIVE to the display's
    // refresh (a 16.7ms frame is perfect on 60Hz, dropped on ProMotion).
    const sorted = [...samples].sort((a, b) => a - b);
    const cadence = Math.min(
      33.4,
      Math.max(4, sorted[Math.floor(sorted.length * 0.25)] ?? 16.7),
    );
    const maxScale = cadence * 3;
    for (let i = 0; i < samples.length; i++) {
      const ms = samples[i];
      const frac = Math.min(ms / maxScale, 1);
      ctx.fillStyle =
        ms > cadence * 1.5
          ? "#e5484d"
          : ms > cadence * 1.15
            ? "#f5a623"
            : "#30a46c";
      const barH = Math.max(2, frac * h);
      ctx.fillRect(i * barW, h - barH, barW - 1, barH);
    }
    // dropped-frame threshold line (1.5× cadence)
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(0, h - ((cadence * 1.5) / maxScale) * h, w, 1);
  }, [snap]);

  if (!enabled) return null;

  return (
    <div
      data-perf-hud
      className="pointer-events-none fixed right-3 top-16 z-[90] select-none rounded-lg bg-black/80 px-3 py-2 font-mono text-[11px] leading-tight text-white shadow-lg"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold tabular-nums">
          {snap?.fps ?? "—"}
        </span>
        <span className="opacity-70">fps</span>
        <span className="ml-2 tabular-nums opacity-90">
          avg {snap?.avgMs ?? "—"}ms
        </span>
        <span
          className={`tabular-nums ${
            snap && snap.worstMs > snap.avgMs * 1.5
              ? "text-red-400"
              : "opacity-70"
          }`}
        >
          worst {snap?.worstMs ?? "—"}ms
        </span>
      </div>
      <canvas ref={canvasRef} width={220} height={36} className="mt-1 block" />
    </div>
  );
}
