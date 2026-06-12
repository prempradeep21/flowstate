"use client";

import Link from "next/link";
import { useState } from "react";
import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import { ChatComposer } from "@/components/ChatComposer";
import { RotatingLandingTitle } from "@/components/landing/RotatingLandingTitle";
import { LANDING_ARTIFACT_SUGGESTIONS } from "@/lib/landingSuggestions";
import { playSound } from "@/lib/sounds/engine";
import { LANDING_COPY } from "@/components/landing-page/landingSections";

const HERO_DELAYS = [0, 100, 220, 340, 460] as const;

export function HeroSection() {
  const [draft, setDraft] = useState("");
  const copy = LANDING_COPY.hero;

  return (
    <section
      id="hero"
      className="relative scroll-mt-[72px] overflow-hidden border-b border-canvas-border/60 px-6 pb-28 pt-16 sm:pb-36 sm:pt-20"
    >
      <GridBackground viewport={{ x: 0, y: 0, scale: 1 }} />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <p
          className="motion-landing-rise text-canvas-micro font-medium uppercase tracking-[0.16em] text-canvas-accent"
          style={{ animationDelay: `${HERO_DELAYS[0]}ms` }}
        >
          {copy.eyebrow}
        </p>

        <h1
          className="motion-landing-rise mt-6 font-display text-[clamp(2.25rem,6vw,3.75rem)] font-normal leading-[1.04] tracking-[-0.03em] text-canvas-ink"
          style={{ animationDelay: `${HERO_DELAYS[1]}ms` }}
        >
          {copy.title}
        </h1>

        <p
          className="motion-landing-rise mt-6 max-w-xl text-canvas-body-lg leading-[1.65] text-canvas-muted"
          style={{ animationDelay: `${HERO_DELAYS[2]}ms` }}
        >
          {copy.body}
        </p>

        <div
          className="motion-landing-rise mt-8 flex w-full max-w-lg flex-col gap-3"
          style={{ animationDelay: `${HERO_DELAYS[3]}ms` }}
        >
          <ChatComposer
            variant="landing"
            placeholder="What's on your mind?"
            draftValue={draft}
            onDraftChange={setDraft}
            onSubmit={() => {
              void playSound("agent-thinking-start");
              window.location.href = "/";
            }}
          />
          <p className="text-canvas-caption text-canvas-muted">
            Press Enter to open the canvas with your question
          </p>
        </div>

        <div
          className="motion-landing-rise mt-10 flex flex-wrap justify-center gap-2"
          style={{ animationDelay: `${HERO_DELAYS[4]}ms` }}
        >
          {LANDING_ARTIFACT_SUGGESTIONS.map((s) => (
            <button
              key={s.kind}
              type="button"
              onClick={() => {
                setDraft(s.prompt);
                void playSound("plug-connect");
              }}
              className="inline-flex items-center rounded-full border border-canvas-border bg-canvas-card/90 px-3 py-1.5 text-canvas-compact text-canvas-muted backdrop-blur-sm transition-colors hover:border-canvas-accent/30 hover:text-canvas-ink"
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="motion-landing-rise mt-12" style={{ animationDelay: "560ms" }}>
          <Link
            href="#problem"
            onClick={() => void playSound("artifact-focus")}
            className="text-canvas-compact text-canvas-muted underline-offset-4 hover:text-canvas-ink hover:underline"
          >
            See why spatial thinking helps you
          </Link>
        </div>
      </div>
    </section>
  );
}
