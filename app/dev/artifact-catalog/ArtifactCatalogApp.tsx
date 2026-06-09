"use client";

import { useMemo, useState } from "react";
import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import {
  ARTIFACT_CATALOG_ENTRIES,
  CATALOG_SECTIONS,
  type ArtifactCatalogCategory,
  type ArtifactCatalogEntry,
} from "@/lib/artifactCatalogSamples";
import { CatalogArtifactPreview } from "./CatalogArtifactPreview";

function CatalogMeta({ entry }: { entry: ArtifactCatalogEntry }) {
  return (
    <div className="min-w-0 pt-2 lg:sticky lg:top-48 lg:pt-6">
      <p className="m-0 text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
        {entry.name}
      </p>
      <h3 className="mt-2 font-display text-2xl font-medium leading-snug text-canvas-ink">
        {entry.title}
      </h3>
      <p className="mt-3 text-canvas-body leading-relaxed text-canvas-muted">
        {entry.description}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {entry.chips.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-canvas-accent/20 bg-canvas-accent/10 px-3 py-1 text-canvas-micro font-medium text-canvas-accent"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function CatalogRow({ entry }: { entry: ArtifactCatalogEntry }) {
  return (
    <article className="grid grid-cols-1 items-start gap-10 border-b border-canvas-border/40 pb-16 last:border-b-0 last:pb-0 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)] lg:gap-16">
      <CatalogArtifactPreview entry={entry} />
      <CatalogMeta entry={entry} />
    </article>
  );
}

function CategoryTab({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-2.5 rounded-full border px-5 py-3 text-left transition-colors ${
        active
          ? "border-canvas-accent/40 bg-canvas-accent text-white shadow-card"
          : "border-canvas-border/80 bg-canvas-card/90 text-canvas-ink hover:border-canvas-accent/30 hover:bg-canvas-card"
      }`}
    >
      <span className="font-display text-base font-medium">{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-canvas-micro font-semibold tabular-nums ${
          active ? "bg-white/20 text-white" : "bg-canvas-bg text-canvas-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

export function ArtifactCatalogApp() {
  const [activeCategory, setActiveCategory] = useState<ArtifactCatalogCategory>(
    CATALOG_SECTIONS[0]?.id ?? "flowstate",
  );

  const entriesByCategory = useMemo(() => {
    const map = new Map<ArtifactCatalogCategory, ArtifactCatalogEntry[]>();
    for (const section of CATALOG_SECTIONS) {
      map.set(
        section.id,
        ARTIFACT_CATALOG_ENTRIES.filter((entry) => entry.category === section.id),
      );
    }
    return map;
  }, []);

  const activeSection = CATALOG_SECTIONS.find((section) => section.id === activeCategory);
  const activeEntries = entriesByCategory.get(activeCategory) ?? [];

  return (
    <div className="relative min-h-full bg-canvas-bg font-sans text-canvas-ink">
      <GridBackground viewport={{ x: 0, y: 0, scale: 1 }} />

      <div className="relative z-10">
        <div className="sticky top-0 z-30 border-b border-canvas-border/70 bg-canvas-card/95 backdrop-blur-md">
          <header>
            <div className="mx-auto flex max-w-7xl items-end justify-between gap-6 px-8 py-6">
              <div>
                <p className="m-0 text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
                  Flowstate
                </p>
                <h1 className="mt-1 font-display text-3xl font-medium">Artifact Catalog</h1>
              </div>
              <p className="hidden max-w-xs text-right text-canvas-body-sm leading-relaxed text-canvas-muted sm:block">
                Pick a category, then explore live previews below.
              </p>
            </div>
          </header>

          <nav aria-label="Artifact categories" className="border-t border-canvas-border/50 px-8 pb-5 pt-4">
            <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto pb-1">
              {CATALOG_SECTIONS.map((section) => {
                const count = entriesByCategory.get(section.id)?.length ?? 0;
                if (count === 0) return null;
                return (
                  <CategoryTab
                    key={section.id}
                    active={activeCategory === section.id}
                    label={section.title}
                    count={count}
                    onClick={() => setActiveCategory(section.id)}
                  />
                );
              })}
            </div>
          </nav>
        </div>

        <main className="mx-auto max-w-7xl px-8 pb-20 pt-12">
          <section className="mb-14 max-w-3xl">
            <p className="m-0 text-canvas-micro font-semibold uppercase tracking-wider text-canvas-accent">
              Reference guide
            </p>
            <h2 className="mt-3 font-display text-4xl font-medium leading-tight sm:text-5xl">
              Every artifact on the canvas
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-canvas-muted">
              Live previews with sample data — drag, resize, and version on the real canvas.
              AI-emitted types appear from chat; input types spawn from pasted URLs and prompts.
            </p>
          </section>

          {activeSection && activeEntries.length > 0 ? (
            <section aria-labelledby={`section-${activeSection.id}`}>
              <div className="mb-12 rounded-canvas border border-canvas-border/50 bg-canvas-card/50 px-8 py-8">
                <h3
                  id={`section-${activeSection.id}`}
                  className="font-display text-3xl font-medium"
                >
                  {activeSection.title}
                </h3>
                <p className="mt-3 max-w-2xl text-canvas-body leading-relaxed text-canvas-muted">
                  {activeSection.description}
                </p>
              </div>

              <div className="flex flex-col gap-16">
                {activeEntries.map((entry) => (
                  <CatalogRow key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          ) : null}

          <footer className="mt-20 border-t border-canvas-border/60 pt-8 text-canvas-body-sm text-canvas-muted">
            Personal reference — not part of the main app
          </footer>
        </main>
      </div>
    </div>
  );
}
