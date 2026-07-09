"use client";

import { Profiler, useEffect, useRef, useState } from "react";
import { Canvas } from "@/components/Canvas";
import { PerfHUD } from "@/components/PerfHUD";
import { ThemeApplier } from "@/components/ThemeApplier";
import { usePersistenceReady } from "@/components/AuthProvider";
import { notePerfReactCommit } from "@/lib/perf/frameStats";
import { buildCanvasSnapshot } from "@/lib/canvasSnapshot";
import {
  buildPerfFixtureSnapshot,
  perfFixtureContentCenter,
  PERF_FIXTURE_SIZES,
  type PerfFixtureSize,
} from "@/lib/perf/perfFixture";
import {
  beginPerfFixtureSession,
  endPerfFixtureSession,
} from "@/lib/perf/perfFixtureSession";
import { installPerfBridge } from "@/lib/perf/frameStats";
import {
  markViewportRestoredFromSnapshot,
  resetViewportBootstrap,
} from "@/lib/canvasViewportBootstrap";
import { viewportCenteredOnWorldPoint } from "@/lib/viewport";
import { useCanvasStore } from "@/lib/store";

function parseSize(value: string | null): PerfFixtureSize {
  const n = Number(value);
  return (PERF_FIXTURE_SIZES as readonly number[]).includes(n)
    ? (n as PerfFixtureSize)
    : 100;
}

/**
 * Isolated benchmark canvas: deterministic fixture, no cloud persistence.
 * Node count via `?nodes=30|100|300` (default 100). The Playwright benchmark
 * driver waits for `[data-perf-ready="true"]` before starting scenarios.
 */
export function PerfFixtureApp() {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [nodes, setNodes] = useState<PerfFixtureSize>(100);
  const sessionStartedRef = useRef(false);
  // Hydrate only after auth/local-session restore has settled, otherwise the
  // app's own canvas restore overwrites the fixture (same gating the
  // mobile-SDLC sandbox uses).
  const persistenceReady = usePersistenceReady();

  useEffect(() => {
    if (!persistenceReady) return;
    installPerfBridge();

    const size = parseSize(
      new URLSearchParams(window.location.search).get("nodes"),
    );
    setNodes(size);

    if (!sessionStartedRef.current) {
      beginPerfFixtureSession(
        useCanvasStore.getState().getCanvasSnapshotSource(),
      );
      sessionStartedRef.current = true;
    }

    const snapshot = buildPerfFixtureSnapshot(size);
    resetViewportBootstrap();
    useCanvasStore.getState().hydrateFromSnapshot(snapshot, {
      applyViewport: false,
      canvasReveal: false,
    });

    // Center the viewport on the fixture at a scale where a good chunk of
    // nodes is visible — the interesting regime for pan/zoom cost.
    requestAnimationFrame(() => {
      const el = canvasContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const center = perfFixtureContentCenter(snapshot);
      useCanvasStore
        .getState()
        .setViewport(
          viewportCenteredOnWorldPoint(
            center.x,
            center.y,
            rect.width,
            rect.height,
            0.5,
          ),
        );
      markViewportRestoredFromSnapshot();
      setReady(true);
    });

    return () => {
      if (!sessionStartedRef.current) return;
      const restore = endPerfFixtureSession();
      sessionStartedRef.current = false;
      if (restore) {
        resetViewportBootstrap();
        useCanvasStore
          .getState()
          .hydrateFromSnapshot(buildCanvasSnapshot(restore), {
            applyViewport: true,
            canvasReveal: false,
          });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistenceReady]);

  return (
    <main
      className="relative h-full w-full overflow-hidden"
      data-perf-ready={ready ? "true" : "false"}
      data-perf-nodes={nodes}
    >
      <ThemeApplier />
      <div className="pointer-events-none absolute left-3 top-3 z-[60] rounded-md bg-black/70 px-2 py-1 font-mono text-[11px] text-white">
        perf fixture · {nodes} nodes
      </div>
      <div ref={canvasContainerRef} className="relative h-full w-full">
        {/* Profiler counts REAL React commits in the canvas subtree during
            perf sessions — the zero-commit budget check reads this. */}
        <Profiler id="perf-canvas" onRender={notePerfReactCommit}>
          <Canvas containerRef={canvasContainerRef} />
        </Profiler>
      </div>
      <PerfHUD />
    </main>
  );
}
