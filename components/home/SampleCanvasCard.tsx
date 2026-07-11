"use client";

import { CanvasThumbnail } from "@/components/home/CanvasThumbnail";
import type { SampleCanvas } from "@/lib/home/sampleCanvases";

/**
 * Static sample-canvas entry point. Non-interactive for now ("coming soon") —
 * real canvases + artifacts get wired in later via the sample config.
 */
export function SampleCanvasCard({ sample }: { sample: SampleCanvas }) {
  return (
    <div
      title={`${sample.title} — coming soon`}
      className="group flex h-full w-full cursor-default flex-col overflow-hidden rounded-canvas-lg border border-canvas-border bg-canvas-card text-left shadow-artifact transition-all duration-motion-standard ease-motion-medium hover:-translate-y-1 hover:border-canvas-ink/15 hover:shadow-artifactHover motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-[16/10]">
        <CanvasThumbnail seed={sample.slug} accent={sample.accent} />
        <span className="absolute right-2.5 top-2.5 rounded-canvas border border-canvas-border bg-canvas-card/90 px-2 py-0.5 text-canvas-micro font-medium uppercase tracking-wide text-canvas-muted shadow-card">
          Coming soon
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1 border-t border-canvas-border px-3.5 py-3">
        <p className="truncate text-canvas-body font-medium text-canvas-ink">
          {sample.title}
        </p>
        <span className="truncate text-canvas-compact text-canvas-muted">
          {sample.tagline}
        </span>
      </div>
    </div>
  );
}
