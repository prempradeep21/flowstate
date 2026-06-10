"use client";

import { useRef, useState } from "react";
import { Canvas } from "@/components/Canvas";
import { CanvasBottomToolbar } from "@/components/CanvasBottomToolbar";
import { ThemeApplier } from "@/components/ThemeApplier";
import {
  ARTIFACT_CATALOG_ENTRIES,
  CATALOG_SECTIONS,
  type ArtifactCatalogCategory,
} from "@/lib/artifactCatalogSamples";
import { useArtifactCatalogCanvas } from "./useArtifactCatalogCanvas";

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
      className={`inline-flex shrink-0 items-center gap-2.5 rounded-full border px-5 py-2.5 text-left transition-colors ${
        active
          ? "border-canvas-accent/40 bg-canvas-accent text-white shadow-card"
          : "border-canvas-border/80 bg-canvas-card/90 text-canvas-ink hover:border-canvas-accent/30 hover:bg-canvas-card"
      }`}
    >
      <span className="font-display text-sm font-medium sm:text-base">{label}</span>
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
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  useArtifactCatalogCanvas(activeCategory, canvasContainerRef);

  const sectionCounts = CATALOG_SECTIONS.map((section) => ({
    ...section,
    count: ARTIFACT_CATALOG_ENTRIES.filter((entry) => entry.category === section.id)
      .length,
  }));

  return (
    <main className="relative h-full w-full overflow-hidden">
      <ThemeApplier />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
        <div className="pointer-events-auto w-full max-w-[min(1200px,calc(100vw-2rem))] rounded-canvas border border-canvas-border/80 bg-canvas-card/95 px-4 py-3 shadow-card backdrop-blur-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="m-0 text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
                Flowstate
              </p>
              <h1 className="font-display text-xl font-medium sm:text-2xl">
                Artifact Catalog
              </h1>
            </div>
            <nav
              aria-label="Artifact categories"
              className="flex gap-2 overflow-x-auto pb-0.5"
            >
              {sectionCounts.map((section) => (
                <CategoryTab
                  key={section.id}
                  active={activeCategory === section.id}
                  label={section.title}
                  count={section.count}
                  onClick={() => setActiveCategory(section.id)}
                />
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="relative h-full w-full">
        <Canvas containerRef={canvasContainerRef} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center">
        <CanvasBottomToolbar />
      </div>
    </main>
  );
}
