"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CanvasGridCard } from "@/components/home/CanvasGridCard";
import { HomeHeader } from "@/components/home/HomeHeader";
import { NewCanvasCard } from "@/components/home/NewCanvasCard";
import { PaginatedGrid, type GridSlot } from "@/components/home/PaginatedGrid";
import { SampleCanvasesSection } from "@/components/home/SampleCanvasesSection";
import { SectionHeading } from "@/components/home/SectionHeading";
import { useHomeCanvasCollaborators } from "@/components/home/useHomeCanvasCollaborators";
import { useHomeTheme } from "@/components/home/useHomeTheme";
import { WhatYouCanDoSection } from "@/components/home/WhatYouCanDoSection";

const GRID_CLASS = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4";

export function HomeView({ onOpenCanvas }: { onOpenCanvas: () => void }) {
  const {
    user,
    supabaseConfigured,
    persistenceStatus,
    canvases,
    sharedCanvases,
    ownedCanvasShareFlags,
    isSwitchingCanvas,
    switchingCanvasId,
    switchCanvas,
    createNewCanvas,
  } = useAuth();

  const { theme, toggleTheme } = useHomeTheme();
  const [creating, setCreating] = useState(false);

  const sharedCanvasIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of canvases) {
      if (ownedCanvasShareFlags[c.id]) ids.add(c.id);
    }
    for (const c of sharedCanvases) ids.add(c.id);
    return [...ids];
  }, [canvases, ownedCanvasShareFlags, sharedCanvases]);

  const membersByCanvas = useHomeCanvasCollaborators(
    sharedCanvasIds,
    Boolean(user && supabaseConfigured),
  );

  const handleOpen = useCallback(
    async (canvasId: string) => {
      if (isSwitchingCanvas) return;
      await switchCanvas(canvasId);
      onOpenCanvas();
    },
    [isSwitchingCanvas, onOpenCanvas, switchCanvas],
  );

  const handleCreate = useCallback(async () => {
    if (isSwitchingCanvas || creating) return;
    setCreating(true);
    try {
      const id = await createNewCanvas();
      if (id) onOpenCanvas();
    } finally {
      setCreating(false);
    }
  }, [createNewCanvas, creating, isSwitchingCanvas, onOpenCanvas]);

  const loading = supabaseConfigured && persistenceStatus !== "ready";

  const yourCanvasSlots: GridSlot[] = [
    {
      key: "new-canvas",
      node: (
        <NewCanvasCard
          disabled={!supabaseConfigured || isSwitchingCanvas}
          busy={creating}
          onCreate={() => void handleCreate()}
        />
      ),
    },
    ...canvases.map((canvas) => ({
      key: canvas.id,
      node: (
        <CanvasGridCard
          canvasId={canvas.id}
          title={canvas.title}
          updatedAt={canvas.contentEditedAt ?? canvas.updatedAt}
          thumbnailUrl={canvas.thumbnailUrl}
          members={membersByCanvas[canvas.id]}
          isSwitching={isSwitchingCanvas}
          isPendingSwitch={switchingCanvasId === canvas.id}
          onOpen={() => void handleOpen(canvas.id)}
        />
      ),
    })),
  ];

  const sharedCanvasSlots: GridSlot[] = sharedCanvases.map((canvas) => ({
    key: canvas.id,
    node: (
      <CanvasGridCard
        canvasId={canvas.id}
        title={canvas.title}
        updatedAt={canvas.updatedAt}
        members={membersByCanvas[canvas.id]}
        isSwitching={isSwitchingCanvas}
        isPendingSwitch={switchingCanvasId === canvas.id}
        onOpen={() => void handleOpen(canvas.id)}
      />
    ),
  }));

  return (
    <div
      className={`${
        theme === "dark" ? "theme-scope-dark" : "theme-scope-light"
      } relative h-full w-full overflow-y-auto bg-canvas-bg text-canvas-ink transition-colors duration-motion-standard`}
      style={{ colorScheme: theme }}
    >
      {/* Dot-grid backdrop — echoes the canvas, fading out below the header. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(var(--canvas-dot) / 0.3) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          maskImage: "linear-gradient(to bottom, black, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
        }}
      />

      <HomeHeader theme={theme} onToggleTheme={toggleTheme} />

      <div className="relative mx-auto w-full max-w-[86rem] px-6 py-8 sm:px-8">
        <section>
          <SectionHeading title="Your canvases" count={canvases.length} />

          {loading ? (
            <div className={GRID_CLASS}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[16/10] animate-pulse rounded-canvas-lg border border-canvas-border bg-canvas-card"
                />
              ))}
            </div>
          ) : (
            <PaginatedGrid slots={yourCanvasSlots} gridClassName={GRID_CLASS} />
          )}
        </section>

        {sharedCanvases.length > 0 && (
          <section className="mt-12">
            <SectionHeading title="Shared with me" count={sharedCanvases.length} />
            <PaginatedGrid slots={sharedCanvasSlots} gridClassName={GRID_CLASS} />
          </section>
        )}

        <WhatYouCanDoSection />

        <SampleCanvasesSection />
      </div>
    </div>
  );
}
