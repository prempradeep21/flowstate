"use client";

import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";
import { LandingTipCard } from "@/components/landing/LandingTipCard";
import { LandingQIcon, LandingZoomIcon } from "@/components/landing/LandingTipIcons";
import { BranchForkIcon } from "@/components/MenuIcons";
import { LandingSectionShell } from "@/components/landing-page/LandingSectionShell";
import { LANDING_COPY } from "@/components/landing-page/landingSections";
import { playSound } from "@/lib/sounds/engine";

export function CtaSection() {
  const copy = LANDING_COPY.start;

  return (
    <LandingSectionShell
      id="start"
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.body}
    >
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <Link
          href="/"
          onClick={() => void playSound("branch-create")}
          className="inline-flex items-center rounded-full bg-canvas-accent px-7 py-3.5 text-canvas-body font-medium text-white transition-opacity hover:opacity-90"
        >
          Open canvas
        </Link>
        <AuthButton />
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        <LandingTipCard icon={<BranchForkIcon />}>
          Pull a thread from the side plugs when a tangent is worth its own line
          — you do not have to restart the conversation.
        </LandingTipCard>
        <LandingTipCard icon={<LandingQIcon className="h-4 w-4" />}>
          Press Q anywhere on the canvas to place a question exactly where your
          cursor is.
        </LandingTipCard>
        <LandingTipCard icon={<LandingZoomIcon />}>
          Scroll to zoom. Hold Space and drag to pan. Your map stays intact as
          you move through it.
        </LandingTipCard>
      </div>
    </LandingSectionShell>
  );
}
