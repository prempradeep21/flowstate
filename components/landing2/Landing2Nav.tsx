"use client";

import Link from "next/link";
import { playSound } from "@/lib/sounds/engine";

function FlowstateMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" aria-hidden fill="none">
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

export function Landing2Nav() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="pointer-events-auto flex w-full items-center justify-between rounded-canvas border border-canvas-border/50 bg-canvas-card/75 px-4 py-2.5 shadow-artifact backdrop-blur-lg sm:px-6">
        <Link
          href="/landing2"
          className="inline-flex items-center gap-2"
          onClick={() => void playSound("artifact-focus")}
        >
          <FlowstateMark />
          <span className="font-display text-canvas-compact font-semibold text-canvas-ink">
            Flowstate
          </span>
        </Link>
        <Link
          href="/"
          onClick={() => void playSound("branch-create")}
          className="rounded-full bg-canvas-ink px-5 py-2 text-canvas-caption font-semibold text-canvas-card transition-opacity hover:opacity-90"
        >
          Start creating
        </Link>
      </div>
    </header>
  );
}
