"use client";

import { AuthButton } from "@/components/AuthButton";
import { FlowstateBrand } from "@/components/FlowstateBrand";
import { PanelChevronIcon } from "@/components/PanelChrome";
import { SaveStatusBadge } from "@/components/SaveStatusBadge";
import { CanvasesSection } from "@/components/sidebar/CanvasesSection";
import { useCanvasStore } from "@/lib/store";

export function AppLeftPanel() {
  const collapsed = useCanvasStore((s) => s.leftPanelCollapsed);
  const toggleLeftPanel = useCanvasStore((s) => s.toggleLeftPanel);

  return (
    <aside
      className={[
        "floating-panel floating-panel-left pointer-events-auto flex flex-col overflow-hidden",
        collapsed ? "w-[58px]" : "w-[420px]",
      ].join(" ")}
      style={collapsed ? undefined : { height: "calc(100vh - 24px)" }}
    >
      {collapsed ? (
        <div className="flex flex-col items-center gap-3 px-2 py-3">
          <FlowstateBrand compact />
          <button
            type="button"
            onClick={toggleLeftPanel}
            aria-label="Open sidebar"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
          >
            <PanelChevronIcon direction="right" />
          </button>
        </div>
      ) : (
        <div className="panel-expand-in flex h-full min-w-0 flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-canvas-border px-3 py-3">
            <FlowstateBrand />
            <button
              type="button"
              onClick={toggleLeftPanel}
              aria-label="Collapse sidebar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
            >
              <PanelChevronIcon direction="left" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <CanvasesSection />
          </div>

          <div className="space-y-2 border-t border-canvas-border p-3">
            <SaveStatusBadge size="panel" />
            <AuthButton size="panel" />
          </div>
        </div>
      )}
    </aside>
  );
}
