"use client";

import { LANDING_COPY } from "@/components/landing-page/landingSections";

const USE_CASE_ICONS = {
  interview: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none">
      <rect x="3" y="7" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  tool: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none">
      <path
        d="m14.7 6.3 3 3-8.4 8.4a2 2 0 0 1-1.4.6l-3.2.4.4-3.2a2 2 0 0 1 .6-1.4l8.4-8.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="m17.7 9.3 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  trip: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none">
      <path
        d="M3 12h18M12 3l4 9-4 9-4-9 4-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
  meals: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none">
      <path d="M6 11V4M8 11V4M7 11v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M14 4v5.5a4 4 0 0 0 4 4V20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  finance: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none">
      <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  learn: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none">
      <path d="M12 4 3 8.5 12 13l9-4.5L12 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 10.5V16c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-5.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
} as const;

export function UseCasesSection() {
  const copy = LANDING_COPY.useCases;

  return (
    <section
      id="use-cases"
      className="scroll-mt-[72px] border-t border-canvas-border/50 bg-canvas-bg px-6 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-normal leading-tight tracking-[-0.02em] text-canvas-ink">
          {copy.title}
        </h2>
        <p className="mt-4 max-w-2xl text-canvas-body-lg leading-[1.65] text-canvas-muted">
          {copy.body}
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {copy.cards.map((card) => (
            <article
              key={card.id}
              className="rounded-canvas border border-canvas-border bg-canvas-card p-6 shadow-artifact transition-shadow hover:shadow-md"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-canvas-sm bg-canvas-accent/10 text-canvas-accent">
                {USE_CASE_ICONS[card.icon]}
              </div>
              <h3 className="mt-4 font-display text-canvas-heading text-canvas-ink">
                {card.title}
              </h3>
              <p className="mt-2 text-canvas-body leading-[1.55] text-canvas-muted">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
