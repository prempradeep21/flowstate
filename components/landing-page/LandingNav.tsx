"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { playSound } from "@/lib/sounds/engine";
import { LANDING_COPY, LANDING_SECTIONS } from "@/components/landing-page/landingSections";

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

export function LandingNav() {
  const [activeId, setActiveId] = useState<string>("canvas-hero");
  const [scrolled, setScrolled] = useState(false);
  const tagline = LANDING_COPY.canvasHero.tagline;

  useEffect(() => {
    const root = document.getElementById("landing-scroll-root");
    if (!root) return;

    const onScroll = () => setScrolled(root.scrollTop > 12);
    onScroll();
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const root = document.getElementById("landing-scroll-root");
    const sections = LANDING_SECTIONS.map((s) =>
      document.getElementById(s.id),
    ).filter(Boolean) as HTMLElement[];

    if (!root || sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { root, rootMargin: "-35% 0px -50% 0px", threshold: [0, 0.2, 0.45] },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled
          ? "border-canvas-border/80 bg-canvas-bg/85 backdrop-blur-lg"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link
          href="/landing"
          className="flex min-w-0 items-center gap-2.5"
          onClick={() => void playSound("artifact-focus")}
        >
          <FlowstateMark />
          <span className="font-display text-canvas-brand font-semibold text-canvas-ink">
            Flowstate
          </span>
          <span className="hidden truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-canvas-muted sm:inline">
            {tagline}
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Sections">
          {LANDING_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={() => void playSound("plug-connect")}
              className={`rounded-full px-3 py-1.5 text-canvas-compact transition-colors ${
                activeId === section.id
                  ? "bg-canvas-accent/12 font-medium text-canvas-accent"
                  : "text-canvas-muted hover:text-canvas-ink"
              }`}
            >
              {section.label}
            </a>
          ))}
        </nav>

        <Link
          href="/"
          onClick={() => void playSound("branch-create")}
          className="inline-flex shrink-0 items-center rounded-full bg-canvas-ink px-4 py-2 text-canvas-compact font-medium text-canvas-card transition-opacity hover:opacity-90"
        >
          Start creating
        </Link>
      </div>
    </header>
  );
}
