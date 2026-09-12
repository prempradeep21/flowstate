"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@/components/Canvas";
import { CanvasBottomToolbar } from "@/components/CanvasBottomToolbar";
import { ArtifactStyleScope } from "@/components/ArtifactStyleScope";
import { ThemeApplier } from "@/components/ThemeApplier";
import {
  ARTIFACT_CATALOG_ENTRIES,
  CATALOG_SECTIONS,
  type ArtifactCatalogCategory,
} from "@/lib/artifactCatalogSamples";
import {
  ARTIFACT_STYLE_PACKS,
  DEFAULT_ARTIFACT_STYLE_ID,
  getArtifactStylePack,
} from "@/lib/design/style/stylePacks";
import type { ArtifactStyleId } from "@/lib/design/style/types";
import { useArtifactCatalogCanvas } from "./useArtifactCatalogCanvas";

/** Viewer-local persistence — read nowhere else, so packs can't leak. */
const STYLE_STORAGE_KEY = "flowstate.artifactStyle.viewer";

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

function StyleTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center rounded-full border px-4 py-2 text-left transition-colors ${
        active
          ? "border-canvas-accent/40 bg-canvas-accent text-white shadow-card"
          : "border-canvas-border/80 bg-canvas-card/90 text-canvas-ink hover:border-canvas-accent/30 hover:bg-canvas-card"
      }`}
    >
      <span className="font-display text-sm font-medium">{label}</span>
    </button>
  );
}

function ArtifactCatalogLoadGate({ onLoad }: { onLoad: () => void }) {
  return (
    <main className="flex h-full w-full items-center justify-center bg-canvas-bg px-6">
      <div className="max-w-md text-center">
        <p className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
          Artifact Viewer
        </p>
        <h2 className="mt-2 font-display text-2xl font-medium text-canvas-ink">
          Load artifact previews
        </h2>
        <p className="mt-3 text-canvas-body-sm leading-relaxed text-canvas-muted">
          This page renders every artifact type on a live canvas and can use
          significant CPU and memory. Load it only when you need to inspect demos.
        </p>
        <button
          type="button"
          onClick={onLoad}
          className="mt-6 rounded-canvas border border-canvas-ink/20 bg-canvas-ink px-5 py-2.5 text-canvas-body-sm font-medium text-canvas-card transition-opacity hover:opacity-90"
        >
          Load artifacts
        </button>
      </div>
    </main>
  );
}

export function ArtifactCatalogApp({
  deferredLoad = false,
  embedded = false,
}: {
  /** When true, show a load gate before mounting the canvas and artifact demos. */
  deferredLoad?: boolean;
  embedded?: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(!deferredLoad);
  const [activeCategory, setActiveCategory] = useState<ArtifactCatalogCategory>(
    CATALOG_SECTIONS[0]?.id ?? "flowstate",
  );
  const [styleId, setStyleId] = useState<ArtifactStyleId>(
    DEFAULT_ARTIFACT_STYLE_ID,
  );
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STYLE_STORAGE_KEY);
    if (stored) setStyleId(getArtifactStylePack(stored).id);
  }, []);

  const selectStyle = (id: ArtifactStyleId) => {
    setStyleId(id);
    window.localStorage.setItem(STYLE_STORAGE_KEY, id);
  };

  useArtifactCatalogCanvas(activeCategory, canvasContainerRef, isLoaded);

  const sectionCounts = CATALOG_SECTIONS.map((section) => ({
    ...section,
    count: ARTIFACT_CATALOG_ENTRIES.filter((entry) => entry.category === section.id)
      .length,
  }));

  if (deferredLoad && !isLoaded) {
    return <ArtifactCatalogLoadGate onLoad={() => setIsLoaded(true)} />;
  }

  return (
    <main className="relative h-full w-full overflow-hidden">
      <ThemeApplier />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
        <div className="pointer-events-auto w-full max-w-[min(1200px,calc(100vw-2rem))] rounded-canvas border border-canvas-border/80 bg-canvas-card/95 px-4 py-3 shadow-card backdrop-blur-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {!embedded ? (
              <div className="min-w-0">
                <p className="m-0 text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
                  Flowstate
                </p>
                <h1 className="font-display text-xl font-medium sm:text-2xl">
                  Artifact Catalog
                </h1>
              </div>
            ) : null}
            <nav
              aria-label="Artifact categories"
              className={`flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5 ${embedded ? "w-full" : ""}`}
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
            <nav
              aria-label="Artifact style"
              className="flex shrink-0 items-center gap-2 border-canvas-border/60 pl-0 sm:border-l sm:pl-3"
            >
              <span className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
                Style
              </span>
              {ARTIFACT_STYLE_PACKS.map((pack) => (
                <StyleTab
                  key={pack.id}
                  active={styleId === pack.id}
                  label={pack.name}
                  onClick={() => selectStyle(pack.id)}
                />
              ))}
            </nav>
          </div>
        </div>
      </div>

      <ArtifactStyleScope styleId={styleId}>
        <div className="relative h-full w-full">
          <Canvas containerRef={canvasContainerRef} />
        </div>
      </ArtifactStyleScope>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center">
        <CanvasBottomToolbar />
      </div>
    </main>
  );
}
