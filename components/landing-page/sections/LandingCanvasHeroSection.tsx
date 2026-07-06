"use client";

import Link from "next/link";
import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import { LandingFloatingNode } from "@/components/landing-page/shared/LandingFloatingNode";
import { LANDING_COPY } from "@/components/landing-page/landingSections";
import { LANDING_HERO_FLOATS } from "@/lib/landingCanvasHero";
import { playSound } from "@/lib/sounds/engine";

export function LandingCanvasHeroSection() {
  const copy = LANDING_COPY.canvasHero;

  return (
    <section
      id="canvas-hero"
      className="relative scroll-mt-[72px] overflow-hidden px-6 pb-20 pt-10 sm:min-h-[calc(100vh-4rem)] sm:pb-28 sm:pt-14"
    >
      <GridBackground viewport={{ x: 0, y: 0, scale: 1 }} />

      {/* Center vignette — keeps headline readable over floats */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 55% 48% at 50% 42%, rgb(var(--canvas-bg)) 0%, transparent 72%)",
        }}
      />

      {LANDING_HERO_FLOATS.map((float, i) => (
        <div
          key={float.id}
          style={{ animationDelay: `${120 + i * 70}ms` }}
        >
          <LandingFloatingNode float={float} />
        </div>
      ))}

      <div className="relative z-20 mx-auto flex min-h-[min(72vh,640px)] max-w-3xl flex-col items-center justify-center text-center sm:min-h-[min(78vh,720px)]">
        <h1 className="motion-landing-rise font-display text-[clamp(2.1rem,5.5vw,3.65rem)] font-normal leading-[1.06] tracking-[-0.03em] text-canvas-ink">
          {copy.title}
        </h1>

        <p
          className="motion-landing-rise mt-6 max-w-2xl text-canvas-body-lg leading-[1.65] text-canvas-muted"
          style={{ animationDelay: "100ms" }}
        >
          {copy.body}
        </p>

        <div
          className="motion-landing-rise mt-10 flex flex-wrap items-center justify-center gap-4"
          style={{ animationDelay: "200ms" }}
        >
          <Link
            href="/"
            onClick={() => void playSound("branch-create")}
            className="inline-flex items-center rounded-full bg-canvas-ink px-7 py-3 text-canvas-body font-medium text-canvas-card transition-opacity hover:opacity-90"
          >
            Start creating
          </Link>
          <Link
            href="#artifacts"
            onClick={() => void playSound("plug-connect")}
            className="text-canvas-body text-canvas-muted transition-colors hover:text-canvas-ink"
          >
            See how it works →
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
        <div className="h-1 w-10 rounded-full bg-canvas-border/80" aria-hidden />
      </div>
    </section>
  );
}
