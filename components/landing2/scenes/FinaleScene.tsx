"use client";

import Link from "next/link";
import { LANDING2_COPY } from "@/components/landing2/landing2Copy";
import { Landing2CanvasFrame } from "@/components/landing2/shared/Landing2CanvasFrame";
import { Landing2SceneTitle } from "@/components/landing2/shared/Landing2PinnedSection";
import { Landing2SceneShell } from "@/components/landing2/shared/Landing2SceneShell";
import { buildLanding2CanvasSnapshot } from "@/lib/landing2/buildLanding2CanvasSnapshot";
import { LANDING2_ACCENTS, LANDING2_SCENE_WASH } from "@/lib/landing2/landing2Theme";
import { playSound } from "@/lib/sounds/engine";

export function FinaleScene() {
  const copy = LANDING2_COPY.finale;
  const accent = LANDING2_SCENE_WASH.finale.accent;

  return (
    <section
      id="finale"
      data-landing2-scene="finale"
      className="relative min-h-[100dvh] overflow-hidden"
    >
      <Landing2SceneShell sceneId="finale" showGrid={false}>
        <div className="absolute inset-0 opacity-[0.35]">
          <Landing2CanvasFrame
            buildSnapshot={buildLanding2CanvasSnapshot}
            fullBleed
            label="Flowstate canvas"
          />
        </div>

        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background: `linear-gradient(180deg, rgb(var(--canvas-bg) / 0.92) 0%, ${LANDING2_ACCENTS[0]}18 40%, ${LANDING2_ACCENTS[1]}12 70%, rgb(var(--canvas-bg) / 0.95) 100%)`,
          }}
        />

        <div className="relative z-10 flex min-h-[100dvh] flex-col items-start justify-center px-6 py-20 sm:px-12 lg:px-16">
          <Landing2SceneTitle
            variant="hero"
            title={copy.headline}
            body={copy.body}
            accentColour={accent}
            className="max-w-3xl"
          />

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/"
              onClick={() => void playSound("branch-create")}
              className="inline-flex items-center rounded-full px-9 py-4 text-canvas-body font-semibold text-white shadow-card transition-transform hover:scale-[1.02]"
              style={{ background: accent }}
            >
              {copy.cta}
            </Link>
            <Link
              href="/landing"
              onClick={() => void playSound("plug-connect")}
              className="text-canvas-body font-medium transition-colors hover:text-canvas-ink"
              style={{ color: LANDING2_ACCENTS[3] }}
            >
              {copy.secondary}
            </Link>
          </div>

          <footer className="mt-16 flex flex-wrap items-center gap-x-5 gap-y-2 text-canvas-caption text-canvas-muted">
            <span>© {new Date().getFullYear()} Flowstate</span>
            <Link href="/terms" className="hover:text-canvas-ink">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-canvas-ink">
              Privacy
            </Link>
            <a href="https://flowstatetool.com" className="hover:text-canvas-ink">
              flowstatetool.com
            </a>
          </footer>
        </div>
      </Landing2SceneShell>
    </section>
  );
}
