"use client";

import { LandingSectionShell } from "@/components/landing-page/LandingSectionShell";
import { LANDING_COPY } from "@/components/landing-page/landingSections";

const MOMENTS = [
  {
    title: "You branch without guilt",
    body: "Follow a tangent — compare Porto, check train times, read about food — without losing the thread you started from.",
  },
  {
    title: "You see where you've been",
    body: "Your session has a shape. Zoom out and notice which paths went cold, which ones are still alive.",
  },
  {
    title: "You pick up where you left off",
    body: "Come back tomorrow. Your cards are still in the same place. Your spatial memory does the rest.",
  },
] as const;

export function VisionSection() {
  const copy = LANDING_COPY.vision;

  return (
    <LandingSectionShell
      id="vision"
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.body}
    >
      <div className="grid gap-px overflow-hidden rounded-canvas border border-canvas-border bg-canvas-border sm:grid-cols-3">
        {MOMENTS.map((moment, index) => (
          <article
            key={moment.title}
            className="flex flex-col bg-canvas-card p-8 sm:p-10"
          >
            <span className="font-display text-canvas-body-lg text-canvas-accent/80">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-4 font-display text-canvas-heading leading-snug text-canvas-ink">
              {moment.title}
            </h3>
            <p className="mt-3 flex-1 text-canvas-body leading-[1.65] text-canvas-muted">
              {moment.body}
            </p>
          </article>
        ))}
      </div>

      <p className="mt-12 max-w-2xl text-canvas-body-lg leading-[1.65] text-canvas-muted">
        Flowstate is not about getting answers faster. It is about giving you
        room for the full shape of a question — including the dead ends, the
        detours, and the moment two threads unexpectedly meet.
      </p>
    </LandingSectionShell>
  );
}
