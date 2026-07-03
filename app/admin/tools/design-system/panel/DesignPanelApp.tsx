"use client";

import { useEffect, useState } from "react";
import { DesignSystemApp } from "@/app/dev/design-system/DesignSystemApp";
import type { DesignSystemDocContent } from "@/app/dev/design-system/sections/DocsSection";
import { LivePreview } from "@/app/admin/tools/design-system/panel/LivePreview";
import { PanelControls } from "@/app/admin/tools/design-system/panel/PanelControls";
import { useThemeStore } from "@/lib/design/theme/themeStore";
import { useCanvasStore } from "@/lib/store";

type PanelTab = "dashboard" | "reference";

/**
 * Design System control panel — the simple dashboard for viewing and
 * tweaking the live theme (presets, roles, category colors, radius, mode).
 * Edits write to the theme store, which re-injects CSS variables app-wide
 * and persists to localStorage. The old specimen viewer lives on under the
 * Reference tab.
 */
export function DesignPanelApp({ docs }: { docs: DesignSystemDocContent }) {
  const [tab, setTab] = useState<PanelTab>("dashboard");
  const mode = useThemeStore((s) => s.state.mode);
  const setCanvasTheme = useCanvasStore((s) => s.setCanvasTheme);

  // The panel owns html[data-theme] while open (ThemeApplier is not mounted
  // on admin routes) and mirrors mode into the canvas store so the product
  // follows when the user returns to the canvas.
  useEffect(() => {
    const root = document.documentElement;
    if (mode === "dark") root.dataset.theme = "dark";
    else delete root.dataset.theme;
    setCanvasTheme(mode);
  }, [mode, setCanvasTheme]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas-bg text-canvas-ink">
      <header className="flex shrink-0 items-center gap-2 border-b border-canvas-border bg-canvas-card px-4 py-3 sm:px-6">
        {(
          [
            ["dashboard", "Dashboard"],
            ["reference", "Reference"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-canvas-compact font-medium transition-colors ${
              tab === id
                ? "bg-canvas-ink text-canvas-card"
                : "text-canvas-muted hover:text-canvas-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </header>

      {tab === "dashboard" ? (
        <main className="min-h-0 flex-1 overflow-auto px-4 py-6 sm:px-6">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-8 lg:flex-row">
            <div className="w-full shrink-0 lg:w-[380px]">
              <PanelControls />
            </div>
            <div className="min-w-0 flex-1">
              <LivePreview />
            </div>
          </div>
        </main>
      ) : (
        <div className="min-h-0 flex-1">
          <DesignSystemApp docs={docs} embedded />
        </div>
      )}
    </div>
  );
}
