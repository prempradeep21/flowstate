"use client";

import Link from "next/link";
import { LANDING_SECTIONS } from "@/components/landing-page/landingSections";
import { playSound } from "@/lib/sounds/engine";

function FlowstateMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden fill="none">
      <rect width="32" height="32" rx="8" className="fill-canvas-ink" />
      <path
        d="M8 22c4-8 8-12 16-14M8 10c3 4 8 8 16 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-canvas-card"
      />
      <circle cx="24" cy="8" r="2" className="fill-canvas-accent" />
    </svg>
  );
}

export function LandingFooter() {
  const navSections = LANDING_SECTIONS.slice(1);

  return (
    <footer className="border-t border-canvas-border/60 bg-canvas-bg">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <Link
              href="/landing"
              className="inline-flex items-center gap-2.5"
              onClick={() => void playSound("artifact-focus")}
            >
              <FlowstateMark />
              <span className="font-display text-canvas-brand font-semibold text-canvas-ink">
                Flowstate
              </span>
            </Link>
            <p className="mt-4 text-canvas-body leading-relaxed text-canvas-muted">
              A spatial thinking canvas for AI-assisted inquiry. Branch parallel
              threads, keep context, and think in space — not in a list.
            </p>
          </div>

          <nav
            className="flex flex-wrap gap-x-8 gap-y-3"
            aria-label="Footer sections"
          >
            {navSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => void playSound("plug-connect")}
                className="text-canvas-compact text-canvas-muted transition-colors hover:text-canvas-ink"
              >
                {section.label}
              </a>
            ))}
          </nav>

          <Link
            href="/"
            onClick={() => void playSound("branch-create")}
            className="inline-flex shrink-0 items-center self-start rounded-full bg-canvas-ink px-5 py-2.5 text-canvas-compact font-medium text-canvas-card transition-opacity hover:opacity-90"
          >
            Start creating
          </Link>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-canvas-border/50 pt-6 text-canvas-caption text-canvas-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Flowstate</p>
          <nav
            className="flex flex-wrap items-center gap-x-4 gap-y-1"
            aria-label="Legal"
          >
            <Link
              href="/terms"
              onClick={() => void playSound("plug-connect")}
              className="transition-colors hover:text-canvas-ink"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              onClick={() => void playSound("plug-connect")}
              className="transition-colors hover:text-canvas-ink"
            >
              Privacy
            </Link>
            <a
              href="https://flowstatetool.com"
              className="transition-colors hover:text-canvas-ink"
            >
              flowstatetool.com
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
