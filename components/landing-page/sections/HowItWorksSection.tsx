"use client";

import { LandingCanvasFrame } from "@/components/landing-page/shared/LandingCanvasFrame";
import { LandingSectionShell } from "@/components/landing-page/LandingSectionShell";
import { LANDING_COPY } from "@/components/landing-page/landingSections";
import { buildLandingBranchingSnapshot } from "@/lib/buildLandingBranchingSnapshot";

const STEPS = [
  {
    title: "Drop a question",
    body: "Press Q anywhere on the canvas — your cursor is the placement.",
  },
  {
    title: "Branch when you need to",
    body: "Pull a side plug on any card to explore a parallel line without starting over.",
  },
  {
    title: "Navigate your terrain",
    body: "Pan and zoom. Every card keeps the full context of its ancestors.",
  },
] as const;

export function HowItWorksSection() {
  const copy = LANDING_COPY.howItWorks;

  return (
    <LandingSectionShell
      id="how-it-works"
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.body}
      tone="soft"
    >
      <LandingCanvasFrame
        buildSnapshot={buildLandingBranchingSnapshot}
        height={560}
        label="Interactive Flowstate canvas demo"
      />

      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title}>
            <p className="text-canvas-micro font-medium uppercase tracking-[0.14em] text-canvas-accent">
              Step {i + 1}
            </p>
            <h3 className="mt-2 font-display text-canvas-heading text-canvas-ink">
              {step.title}
            </h3>
            <p className="mt-2 text-canvas-body leading-[1.6] text-canvas-muted">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </LandingSectionShell>
  );
}
